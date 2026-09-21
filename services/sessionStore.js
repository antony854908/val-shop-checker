const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { isValidSessionId } = require('./securityGuard');

const STORE_FILE = process.env.VERCEL
  ? path.join('/tmp', '.session-store.json')
  : path.join(__dirname, '..', '.session-store.json');

const TMP_STORE_FILE = `${STORE_FILE}.tmp`;

// Guest (unauthenticated) sessions must not live as long as real logins,
// otherwise every crawler/preview request leaks a 30-day record into the store.
const GUEST_TTL_MS = 6 * 3600 * 1000;
// Hard cap to keep the in-memory map (and the persisted file) bounded.
const MAX_SESSIONS = 5000;
// Disk writes are debounced: previously every single request performed a full
// synchronous re-serialization of the whole store (O(n) blocking write per hit).
const SAVE_DEBOUNCE_MS = 400;

const ENC_VERSION = 1;
const ENC_SALT = 'valstore-session-store-v1';
const ENC_KEY = crypto.scryptSync(String(config.SESSION_SECRET), ENC_SALT, 32);

/**
 * Checks whether a given JWT token has expired with a 30s buffer.
 * @param {string} token - Raw JWT string
 * @returns {boolean}
 */
function isJwtExpired(token) {
  try {
    if (!token || typeof token !== 'string') return true;
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    if (payload && payload.exp && Date.now() >= (payload.exp * 1000 - 30000)) {
      return true;
    }
  } catch (err) {
    return true;
  }
  return false;
}

/** Encrypts the serialized store with AES-256-GCM (at-rest protection for Riot tokens). */
function encryptPayload(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return JSON.stringify({
    v: ENC_VERSION,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: enc.toString('base64')
  });
}

/** Decrypts an AES-256-GCM store payload. Returns null when tampered/unreadable. */
function decryptPayload(envelope) {
  try {
    const iv = Buffer.from(envelope.iv, 'base64');
    const tag = Buffer.from(envelope.tag, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([
      decipher.update(Buffer.from(envelope.data, 'base64')),
      decipher.final()
    ]);
    return dec.toString('utf8');
  } catch (e) {
    return null;
  }
}

/** A session is only worth persisting when it actually holds auth / MFA state. */
function isPersistable(session) {
  return !!(session && ((session.auth && session.auth.accessToken) || session.mfaState));
}

function ttlFor(session) {
  return isPersistable(session) ? config.SESSION_TTL_MS : GUEST_TTL_MS;
}

class SessionStore {
  constructor() {
    this.sessions = new Map();
    this.saveTimer = null;
    this.savePending = false;
    this.metrics = {
      saveCount: 0,
      saveErrors: 0,
      cleanupCount: 0,
      evictedCount: 0,
      lastSaveDurationMs: 0
    };

    this.loadFromDisk();

    // Auto cleanup expired sessions every 10 minutes; unref timer so tests/cli exit cleanly
    this.cleanupTimer = setInterval(() => this.cleanup(), 10 * 60 * 1000);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }

    // Guarantee pending debounced writes are not lost on shutdown.
    this.installExitHooks();
  }

  installExitHooks() {
    const flush = () => {
      if (this.savePending) this.flushToDisk();
    };
    process.once('exit', flush);
    for (const sig of ['SIGINT', 'SIGTERM']) {
      process.once(sig, () => {
        flush();
        process.exit(0);
      });
    }
  }

  loadFromDisk() {
    try {
      if (!fs.existsSync(STORE_FILE)) return;

      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (_) {
        parsed = null;
      }

      let data = null;
      if (Array.isArray(parsed)) {
        // Legacy plaintext store: migrate to encrypted format on next save.
        data = parsed;
        console.warn('[SessionStore] Legacy plaintext store detected - migrating to AES-256-GCM.');
      } else if (parsed && parsed.v === ENC_VERSION) {
        const decrypted = decryptPayload(parsed);
        if (decrypted === null) {
          console.error('[SessionStore] Store decryption failed (bad key or tampered file). Starting fresh.');
          return;
        }
        data = JSON.parse(decrypted);
      }

      if (!Array.isArray(data)) return;

      const now = Date.now();
      for (const item of data) {
        if (!item || !item.id) continue;
        if (item.auth && isJwtExpired(item.auth.accessToken)) {
          item.auth = null;
        }
        if (now - item.lastAccessed > ttlFor(item)) continue;
        if (!isPersistable(item)) continue;
        this.sessions.set(item.id, item);
      }
      console.log(`[SessionStore] Restored ${this.sessions.size} persistent active session(s) from disk.`);

      if (Array.isArray(parsed)) {
        this.flushToDisk();
      }
    } catch (e) {
      console.error('[SessionStore] Error restoring sessions from disk:', e.message);
    }
  }

  /** Debounced persistence entry point used by all hot paths. */
  saveToDisk() {
    this.savePending = true;
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.flushToDisk();
    }, SAVE_DEBOUNCE_MS);
    if (this.saveTimer.unref) this.saveTimer.unref();
  }

  /**
   * Atomically save sessions to disk to prevent corrupted JSON writes during interruption.
   * Only authenticated sessions are written, and the payload is encrypted at rest.
   */
  flushToDisk() {
    const startTime = Date.now();
    this.savePending = false;
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    try {
      const data = Array.from(this.sessions.values()).filter(isPersistable);
      const serialized = encryptPayload(JSON.stringify(data));
      const dir = path.dirname(STORE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write atomically: write to temp file first, then atomic rename
      fs.writeFileSync(TMP_STORE_FILE, serialized, { encoding: 'utf8', mode: 0o600 });
      fs.renameSync(TMP_STORE_FILE, STORE_FILE);

      this.metrics.saveCount++;
      this.metrics.lastSaveDurationMs = Date.now() - startTime;
    } catch (e) {
      this.metrics.saveErrors++;
      console.error('[SessionStore] Error saving sessions to disk:', e.message);
      try {
        if (fs.existsSync(TMP_STORE_FILE)) {
          fs.unlinkSync(TMP_STORE_FILE);
        }
      } catch (_) {}
    }
  }

  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /** Drops the least-recently-used guest sessions once the store exceeds MAX_SESSIONS. */
  enforceLimit() {
    if (this.sessions.size <= MAX_SESSIONS) return;
    const candidates = Array.from(this.sessions.values())
      .sort((a, b) => (isPersistable(a) === isPersistable(b))
        ? a.lastAccessed - b.lastAccessed
        : (isPersistable(a) ? 1 : -1));

    let overflow = this.sessions.size - MAX_SESSIONS;
    for (const session of candidates) {
      if (overflow <= 0) break;
      this.sessions.delete(session.id);
      this.metrics.evictedCount++;
      overflow--;
    }
  }

  createSession(initialData = {}) {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      auth: null,
      mfaState: null,
      ...initialData
    };
    this.sessions.set(sessionId, session);
    this.enforceLimit();
    // Guest sessions stay in memory only - no disk churn per anonymous request.
    if (isPersistable(session)) {
      this.saveToDisk();
    }
    return session;
  }

  getSession(sessionId) {
    if (!sessionId || !isValidSessionId(sessionId)) return null;
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (Date.now() - session.lastAccessed > ttlFor(session)) {
      const persisted = isPersistable(session);
      this.sessions.delete(sessionId);
      if (persisted) this.saveToDisk();
      return null;
    }

    if (session.auth && isJwtExpired(session.auth.accessToken)) {
      session.auth = null;
      this.saveToDisk();
    }

    session.lastAccessed = Date.now();
    return session;
  }

  updateSession(sessionId, updates) {
    const session = this.getSession(sessionId);
    if (!session) return null;
    const wasPersistable = isPersistable(session);
    Object.assign(session, updates);
    session.lastAccessed = Date.now();
    if (wasPersistable || isPersistable(session)) {
      this.saveToDisk();
    }
    return session;
  }

  destroySession(sessionId) {
    if (!sessionId) return;
    const session = this.sessions.get(sessionId);
    if (session) {
      const persisted = isPersistable(session);
      if (session.auth) {
        session.auth.accessToken = null;
        session.auth.idToken = null;
        session.auth.entitlementsToken = null;
      }
      this.sessions.delete(sessionId);
      if (persisted) this.saveToDisk();
    }
  }

  cleanup() {
    const now = Date.now();
    let changed = false;
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastAccessed > ttlFor(session)) {
        if (session.auth) {
          session.auth.accessToken = null;
          session.auth.idToken = null;
          session.auth.entitlementsToken = null;
          changed = true;
        }
        this.sessions.delete(id);
      }
    }
    this.enforceLimit();
    if (changed) {
      this.saveToDisk();
    }
    this.metrics.cleanupCount++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      activeSessions: this.sessions.size,
      persistedSessions: Array.from(this.sessions.values()).filter(isPersistable).length
    };
  }

  isJwtExpired(token) {
    return isJwtExpired(token);
  }
}

module.exports = new SessionStore();
