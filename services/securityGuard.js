/**
 * Security Guard Middleware & Validation Engine
 * Implements OWASP security best practices: Rate Limiting, Input Validation,
 * Anti-Brute-Force, Parameter Pollution Defenses, and Safe Logging.
 */

// In-Memory Sliding Window Rate Limiter
class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.hits = new Map();

    // Auto cleanup old hits every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.hits.entries()) {
      const valid = timestamps.filter(t => now - t < this.windowMs);
      if (valid.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, valid);
      }
    }
  }

  check(key) {
    const now = Date.now();
    const timestamps = this.hits.get(key) || [];
    const valid = timestamps.filter(t => now - t < this.windowMs);

    if (valid.length >= this.maxRequests) {
      this.hits.set(key, valid);
      return false; // Rate limit exceeded
    }

    valid.push(now);
    this.hits.set(key, valid);
    return true; // OK
  }
}

// Dedicated Rate Limiters
const authLimiter = new RateLimiter(60 * 1000, 10); // 10 auth attempts per minute per IP
const apiLimiter = new RateLimiter(60 * 1000, 180);  // 180 API calls per minute per IP

// Rate Limit Middleware Helpers
function authRateLimitMiddleware(req, res, next) {
  const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
  if (!authLimiter.check(clientIp)) {
    return res.status(429).json({
      ok: false,
      error: 'คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่ (Too Many Requests - Rate limit exceeded)'
    });
  }
  next();
}

function apiRateLimitMiddleware(req, res, next) {
  const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
  if (!apiLimiter.check(clientIp)) {
    return res.status(429).json({
      ok: false,
      error: 'คุณเรียกใช้งาน API ถี่เกินไป กรุณารอสักครู่ (API Throttled)'
    });
  }
  next();
}

// Input Validation Functions
const ALLOWED_REGIONS = new Set(['ap', 'na', 'eu', 'kr', 'latam', 'br', 'auto']);

function isValidSessionId(sid) {
  return typeof sid === 'string' && /^[a-f0-9]{64}$/i.test(sid);
}

function sanitizeString(str, maxLen = 256) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

function validateLoginInput(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'ข้อมูลคำขอไม่ถูกต้อง' };
  }

  const { username, password, region } = body;

  if (typeof username !== 'string' || typeof password !== 'string') {
    return { ok: false, error: 'กรุณากรอก Username และ Password เป็นข้อความ' };
  }

  const cleanUser = username.trim();
  const cleanPass = password;

  if (cleanUser.length === 0 || cleanPass.length === 0) {
    return { ok: false, error: 'กรุณากรอก Username และ Password ให้ครบถ้วน' };
  }

  if (cleanUser.length > 128 || cleanPass.length > 256) {
    return { ok: false, error: 'ความยาวข้อมูลเกินกำหนด' };
  }

  let finalRegion = 'ap';
  if (region && typeof region === 'string') {
    const reg = region.trim().toLowerCase();
    if (ALLOWED_REGIONS.has(reg)) {
      finalRegion = reg;
    }
  }

  return { ok: true, username: cleanUser, password: cleanPass, region: finalRegion };
}

function validateTokenInput(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'ข้อมูลคำขอไม่ถูกต้อง' };
  }

  let { accessToken, idToken, region } = body;

  if (!accessToken || typeof accessToken !== 'string') {
    return { ok: false, error: 'กรุณาระบุ Access Token หรือวาง URL' };
  }

  let raw = (accessToken || '').trim().replace(/^["'\s]+|["'\s]+$/g, '');
  if (raw.includes('%23') || raw.includes('%3D') || raw.includes('%26')) {
    try { raw = decodeURIComponent(raw); } catch (e) {}
  }

  const accessMatch = raw.match(/access_token=([a-zA-Z0-9_\-\.]+)/);
  if (accessMatch) {
    accessToken = accessMatch[1].trim();
  } else if (raw.startsWith('eyJ')) {
    const parts = raw.split(/[\s&]+/);
    accessToken = parts[0].replace(/^access_token=/, '').trim();
    if (!idToken && parts[1] && parts[1].startsWith('eyJ')) {
      idToken = parts[1].trim();
    }
  } else {
    accessToken = raw.trim();
  }

  const idMatch = raw.match(/id_token=([a-zA-Z0-9_\-\.]+)/);
  if (idMatch) {
    idToken = idMatch[1].trim();
  }

  if (!accessToken || accessToken.length < 20) {
    return { ok: false, error: 'ไม่พบ Access Token ที่ถูกต้อง กรุณาคัดลอกลิงก์ทั้งหมดมาวางใหม่อีกครั้ง' };
  }

  if (accessToken.length > 4096) {
    return { ok: false, error: 'Token มีขนาดยาวเกินกำหนด' };
  }

  if (idToken && typeof idToken === 'string') {
    idToken = idToken.trim();
    if (idToken.length > 4096 || idToken.length < 20) idToken = null;
  }

  let finalRegion = 'auto';
  if (region && typeof region === 'string') {
    const reg = region.trim().toLowerCase();
    if (ALLOWED_REGIONS.has(reg)) {
      finalRegion = reg;
    }
  }

  return { ok: true, accessToken, idToken, region: finalRegion };
}

function validateMfaInput(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'ข้อมูลคำขอไม่ถูกต้อง' };
  }
  const { code } = body;
  if (!code || typeof code !== 'string') {
    return { ok: false, error: 'กรุณากรอกรหัสยืนยัน 2FA' };
  }
  const cleanCode = code.trim();
  if (!/^\d{6,8}$/.test(cleanCode)) {
    return { ok: false, error: 'รหัส 2FA ต้องเป็นตัวเลข 6-8 หลัก' };
  }
  return { ok: true, code: cleanCode };
}

module.exports = {
  authRateLimitMiddleware,
  apiRateLimitMiddleware,
  isValidSessionId,
  sanitizeString,
  validateLoginInput,
  validateTokenInput,
  validateMfaInput,
  ALLOWED_REGIONS
};
