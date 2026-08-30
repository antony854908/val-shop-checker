const config = require('../config');

// Helper to format cookies into header string
function parseCookiesFromHeaders(resHeaders) {
  const setCookies = resHeaders.getSetCookie ? resHeaders.getSetCookie() : [];
  if (!setCookies.length && resHeaders.get('set-cookie')) {
    setCookies.push(resHeaders.get('set-cookie'));
  }
  const cookieMap = new Map();
  for (const str of setCookies) {
    const parts = str.split(';')[0].trim().split('=');
    if (parts.length >= 2) {
      const name = parts[0];
      const val = parts.slice(1).join('=');
      cookieMap.set(name, val);
    }
  }
  return cookieMap;
}

function cookieMapToString(cookieMap) {
  const list = [];
  for (const [k, v] of cookieMap.entries()) {
    list.push(`${k}=${v}`);
  }
  return list.join('; ');
}

function extractTokensFromUri(uri) {
  if (!uri) return null;
  const hash = uri.split('#')[1];
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get('access_token'),
    idToken: params.get('id_token'),
    expiresIn: params.get('expires_in'),
    tokenType: params.get('token_type')
  };
}

class RiotAuthService {
  async authenticate(username, password) {
    const cookieMap = new Map();
    const userAgent = 'RiotClient/99.0.0.1234567.9876543 rso-auth (Windows;10;;Professional, x64)';

    // Step 1: Initialize auth session with Riot
    const initRes = await fetch('https://auth.riotgames.com/api/v1/authorization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': userAgent
      },
      body: JSON.stringify({
        client_id: 'play-valorant-web-prod',
        nonce: '1',
        redirect_uri: 'https://playvalorant.com/opt_in',
        response_type: 'token id_token',
        scope: 'account openid'
      })
    });

    const initCookies = parseCookiesFromHeaders(initRes.headers);
    for (const [k, v] of initCookies) cookieMap.set(k, v);

    // Step 2: Submit credentials
    const authRes = await fetch('https://auth.riotgames.com/api/v1/authorization', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
        'Cookie': cookieMapToString(cookieMap)
      },
      body: JSON.stringify({
        type: 'auth',
        username: username,
        password: password,
        remember: false
      })
    });

    const authCookies = parseCookiesFromHeaders(authRes.headers);
    for (const [k, v] of authCookies) cookieMap.set(k, v);

    const body = await authRes.json().catch(() => null);
    if (!body) {
      throw new Error('ไม่สามารถเชื่อมต่อกับ Riot Games ได้ กรุณาลองใหม่อีกครั้ง');
    }

    if (body.type === 'error') {
      if (body.error === 'auth_failure') {
        throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (Invalid username or password)');
      } else if (body.error === 'rate_limited') {
        throw new Error('คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่ (Rate limited by Riot)');
      }
      throw new Error(body.error || 'การเข้าสู่ระบบล้มเหลว (Login failed)');
    }

    if (body.type === 'multifactor') {
      return {
        mfaRequired: true,
        email: body.multifactor?.email || 'Registered Email',
        cookieHeader: cookieMapToString(cookieMap)
      };
    }

    if (body.type === 'response' && body.response && body.response.parameters && body.response.parameters.uri) {
      const tokens = extractTokensFromUri(body.response.parameters.uri);
      if (!tokens || !tokens.accessToken) {
        throw new Error('ไม่พบ Access Token จาก Riot');
      }
      return {
        mfaRequired: false,
        tokens
      };
    }

    if (body.type === 'auth') {
      throw new Error('Riot Games บล็อกการล็อกอินด้วยรหัสผ่านผ่าน Cloud Server (Vercel) แนะนำให้ใช้แท็บ "Google / Social Login" หรือดับเบิ้ลคลิกไฟล์ start.bat บนคอมของคุณ (Localhost)');
    }

    throw new Error('รูปแบบการตอบกลับจาก Riot ไม่ถูกต้อง หรือถูกจำกัดการเข้าถึงจาก Cloud Server (กรุณาใช้แท็บ Google / Social หรือรันบนคอม)');
  }

  async verifyMfa(code, cookieHeader) {
    const userAgent = 'RiotClient/99.0.0.1234567.9876543 rso-auth (Windows;10;;Professional, x64)';
    const res = await fetch('https://auth.riotgames.com/api/v1/authorization', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
        'Cookie': cookieHeader
      },
      body: JSON.stringify({
        type: 'multifactor',
        code: code.trim(),
        rememberDevice: false
      })
    });

    const body = await res.json();
    if (body.type === 'error') {
      if (body.error === 'multifactor_attempt_failed') {
        throw new Error('รหัส 2FA ยืนยันตัวตนไม่ถูกต้อง (Invalid 2FA code)');
      }
      throw new Error(body.error || '2FA verification failed');
    }

    if (body.type === 'response' && body.response && body.response.parameters && body.response.parameters.uri) {
      const tokens = extractTokensFromUri(body.response.parameters.uri);
      if (!tokens || !tokens.accessToken) {
        throw new Error('ไม่สามารถรับ Access Token หลังจาก 2FA ได้');
      }
      return tokens;
    }

    throw new Error('การยืนยัน 2FA ล้มเหลว (MFA response invalid)');
  }

  async getEntitlementsToken(accessToken) {
    const res = await fetch('https://entitlements.auth.riotgames.com/api/token/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'RiotClient/99.0.0.1234567.9876543 rso-auth (Windows;10;;Professional, x64)'
      },
      body: JSON.stringify({})
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      if (res.status === 401 || errText.includes('CREDENTIALS_EXPIRED') || errText.includes('expired')) {
        throw new Error('Access Token หมดอายุแล้ว (โทเคนจาก Riot มีอายุ 1 ชั่วโมง) กรุณากดปุ่ม STEP 1 เพื่อเปิดหน้าล็อกอินใหม่อีกครั้ง');
      }
      throw new Error(`ไม่สามารถขอรับ Entitlements Token ได้ (สถานะ: ${res.status})`);
    }

    const data = await res.json();
    return data.entitlements_token;
  }

  async getUserInfo(accessToken) {
    const res = await fetch('https://auth.riotgames.com/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'RiotClient/99.0.0.1234567.9876543 rso-auth (Windows;10;;Professional, x64)'
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Access Token หมดอายุแล้ว กรุณากดปุ่ม STEP 1 เพื่อเข้าสู่ระบบใหม่อีกครั้ง');
      }
      throw new Error(`ไม่สามารถดึงข้อมูลบัญชีได้ (สถานะ: ${res.status})`);
    }

    const data = await res.json();
    return {
      puuid: data.sub,
      country: data.country,
      acct: data.acct
    };
  }

  async detectRegion(idToken, fallback = 'ap') {
    try {
      if (!idToken) return fallback;
      const res = await fetch('https://riot-geo.pas.riotgames.com/pas/v1/product/valorant', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ id_token: idToken })
      });

      if (res.ok) {
        const data = await res.json();
        const detected = data?.affinities?.live;
        if (detected && config.REGIONS[detected.toLowerCase()]) {
          return detected.toLowerCase();
        }
      }
    } catch (e) {
      // Fallback
    }
    return fallback;
  }
}

module.exports = new RiotAuthService();
