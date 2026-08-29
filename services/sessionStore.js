const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { isValidSessionId } = require('./securityGuard');

const STORE_FILE = process.env.VERCEL
  ? path.join('/tmp', '.session-store.json')
  : path.join(__dirname, '..', '.session-store.json');

function isJwtExpired(token) {
  try {
    if (!token) return true;
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    if (payload.exp && Date.now() >= (payload.exp * 1000 - 30000)) { // 30s buffer
      return true;
    }
  } catch (e) {
    return true;
  }
  return false;
}

class SessionStore {
  constructor() {
    this.sessions = new Map();
    this.loadFromDisk();

    // Auto cleanup expired sessions every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
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

  saveToDisk() {
    try {
      const data = Array.from(this.sessions.values());
      fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
    } catch (e) {
      console.error('[SessionStore] Error saving sessions to disk:', e.message);
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
  }
}

module.exports = new SessionStore();
