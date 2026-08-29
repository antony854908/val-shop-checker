# Security Best Practices & Hardening Report

**Project:** VALORANT Store & Skin Inspector (`val-shop-checker`)  
**Date:** 2026-08-29  
**Status:** Completed & Verified  

---

## Executive Summary

A comprehensive security audit and hardening process was performed on the `val-shop-checker` application across the Express backend, Session Management, Riot Authentication layer, and Vanilla JS frontend. All identified risks—including lack of rate limiting on authentication routes, unrestricted input payloads, session storage permissions, and error disclosure risks—have been fully mitigated with industry-standard secure-by-default mechanisms.

---

## Implemented Security Controls & Findings

### [SEC-001] Anti-Brute-Force & Rate Limiting on Auth & API Routes
- **Severity:** High
- **Location:** `services/securityGuard.js`, `server.js` (lines 53, 67, 107, 137)
- **Impact Statement:** Without throttling, attackers or automated scripts could attempt credential stuffing or brute-force RSO login and MFA endpoints.
- **Implemented Fix:**
  - Added in-memory sliding-window `RateLimiter`.
  - `authRateLimitMiddleware`: Enforces max 10 auth requests/min per IP on `/api/auth/login`, `/api/auth/token-login`, and `/api/auth/mfa`.
  - `apiRateLimitMiddleware`: Enforces max 180 requests/min per IP globally on `/api/*`.

---

### [SEC-002] Strict Input Validation & Type Checking
- **Severity:** High
- **Location:** `services/securityGuard.js` (lines 70-170), `server.js`
- **Impact Statement:** Unvalidated inputs could lead to prototype pollution, unexpected type coercion, or oversized payloads causing Denial of Service.
- **Implemented Fix:**
  - Implemented `validateLoginInput`, `validateTokenInput`, and `validateMfaInput`.
  - Enforced string type checks, max character lengths (username <= 128, password <= 256, tokens <= 4096), and region whitelisting (`['ap', 'na', 'eu', 'kr', 'latam', 'br', 'auto']`).
  - Reduced global request body parser limit from 1MB to `256kb` with `extended: false`.

---

### [SEC-003] Session Store Hardening & POSIX Permissions
- **Severity:** Medium
- **Location:** `services/sessionStore.js` (lines 48, 67), `services/securityGuard.js`
- **Impact Statement:** Unrestricted file permissions on session persistence files could allow unauthorized local processes to read tokens.
- **Implemented Fix:**
  - Session IDs strictly validated with regex `^[a-f0-9]{64}$` before querying memory.
  - `.session-store.json` written with strict mode `0o600` (read/write only by the process owner).
  - Explicit token sanitization and memory clearing on logout and expiration.

---

### [SEC-004] Fingerprinting Elimination & Safe Error Handling
- **Severity:** Medium
- **Location:** `server.js` (lines 18, 230-244)
- **Impact Statement:** Default error handlers and headers disclose framework versions and internal stack traces.
- **Implemented Fix:**
  - Added `app.disable('x-powered-by')`.
  - Implemented centralized error-handling middleware that logs details internally and returns sanitized generic error messages to clients (zero stack traces leaked).
  - Added custom 404 handler for API and web routes.

---

### [SEC-005] Content Security Policy (CSP) & Frame Ancestors Hardening
- **Severity:** Medium
- **Location:** `server.js` (lines 20-43)
- **Impact Statement:** Clickjacking and unauthorized frame embedding or script execution.
- **Implemented Fix:**
  - Configured Helmet with `frameAncestors: ["'none'"]`, `baseUri: ["'self'"]`, `formAction: ["'self'"]`, `xFrameOptions: { action: 'deny' }`, and `xContentTypeOptions: true`.
  - Restricted `connectSrc` to explicit Riot and OverTopup domains.

---

### [SEC-006] Frontend DOM XSS Sanitization
- **Severity:** Low (Defense-in-Depth)
- **Location:** `public/app.js` (lines 35-43)
- **Impact Statement:** Dynamic text injection from untrusted external APIs could cause Cross-Site Scripting (XSS).
- **Implemented Fix:**
  - Added `escapeHtml()` utility to sanitize all player names, tags, and dynamic texts before rendering.

---

### [SEC-007] AES-256-GCM Encryption at Rest for Persistent Sessions
- **Severity:** High
- **Location:** `services/sessionStore.js` (lines 8-54)
- **Impact Statement:** Persistent session tokens written to storage in plaintext could be intercepted if disk files are inspected.
- **Implemented Fix:**
  - Integrated cryptographic Authenticated Encryption (`AES-256-GCM`) with standard 96-bit random IVs and integrity authentication tags derived from `SESSION_SECRET`.
  - Automatically encrypts session data before disk flush and authenticates ciphertext on restore.

---

### [SEC-008] Reverse-Proxy Aware Secure Client IP Extraction
- **Severity:** Medium
- **Location:** `server.js` (line 19), `services/securityGuard.js` (lines 45-60)
- **Impact Statement:** Reverse proxies or CDNs (e.g. Cloudflare, Nginx) could cause rate limiters to group all incoming users under a single internal proxy IP.
- **Implemented Fix:**
  - Configured `app.set('trust proxy', 1)`.
  - Implemented `getClientIp()` extracting validated client IPs from headers (`CF-Connecting-IP`, `X-Real-IP`, `X-Forwarded-For`) with socket remote address fallback.

---

## Verification & Testing

- Syntax checks: **PASSED** (0 errors across `server.js`, `services/*.js`, `public/*.js`)
- Unit and endpoint tests: **PASSED**
- Rate limiting test: **PASSED**
- AES-256-GCM Encrypted persistence: **ACTIVE & VERIFIED**
- Zero-leak memory session persistence: **ACTIVE**
