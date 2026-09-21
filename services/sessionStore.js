const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { isValidSessionId } = require('./securityGuard');

const STORE_FILE = process.env.VERCEL
  ? path.join('/tmp', '.session-store.json')
  : path.join(__dirname, '..', '.session-store.json');

const TMP_STORE_FILE = `${STORE_FILE}.tmp`;

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

class SessionStore {
  constructor() {
    this.sessions = new Map();
    this.metrics = {
      saveCount: 0,
      saveErrors: 0,
      cleanupCount: 0,
      lastSaveDurationMs: 0
    };

    this.loadFromDisk();

    // Auto cleanup expired sessions every 10 minutes; unref timer so tests/cli exit cleanly
    this.cleanupTimer = setInterval(() => this.cleanup(), 10 * 60 * 1000);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          const now = Date.now();
          for (const item of data) {
            if (item && item.id && (now - item.lastAccessed <= config.SESSION_TTL_MS)) {
              if (item.auth && isJwtExpired(item.auth.accessToken)) {
                item.auth = null;
              }
              this.sessions.set(item.id, item);
            }
          }
          console.log(`[SessionStore] Restored ${this.sessions.size} persistent active session(s) from disk.`);
        }
      }
    } catch (e) {
      console.error('[SessionStore] Error restoring sessions from disk:', e.message);
    }
  }

  /**
   * Atomically save sessions to disk to prevent corrupted JSON writes during interruption.
   */
  saveToDisk() {
    const startTime = Date.now();
    try {
      const data = Array.from(this.sessions.values());
      const serialized = JSON.stringify(data, null, 2);
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
    this.saveToDisk();
    return session;
  }

  getSession(sessionId) {
    if (!sessionId || !isValidSessionId(sessionId)) return null;
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (Date.now() - session.lastAccessed > config.SESSION_TTL_MS) {
      this.sessions.delete(sessionId);
      this.saveToDisk();
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
    Object.assign(session, updates);
    session.lastAccessed = Date.now();
    this.saveToDisk();
    return session;
  }

  destroySession(sessionId) {
    if (!sessionId) return;
    const session = this.sessions.get(sessionId);
    if (session) {
      if (session.auth) {
        session.auth.accessToken = null;
        session.auth.idToken = null;
        session.auth.entitlementsToken = null;
      }
      this.sessions.delete(sessionId);
      this.saveToDisk();
    }
  }

  cleanup() {
    const now = Date.now();
    let changed = false;
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastAccessed > config.SESSION_TTL_MS) {
        if (session.auth) {
          session.auth.accessToken = null;
          session.auth.idToken = null;
          session.auth.entitlementsToken = null;
        }
        this.sessions.delete(id);
        changed = true;
      }
    }
    if (changed) {
      this.saveToDisk();
    }
    this.metrics.cleanupCount++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      activeSessions: this.sessions.size
    };
  }

  isJwtExpired(token) {
    return isJwtExpired(token);
  }
}

module.exports = new SessionStore();
