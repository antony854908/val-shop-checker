const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config');
const sessionStore = require('./services/sessionStore');
const skinCatalog = require('./services/skinCatalog');
const riotAuth = require('./services/riotAuth');
const valorantApi = require('./services/valorantApi');
const vpPricing = require('./services/vpPricing');
const {
  authRateLimitMiddleware,
  apiRateLimitMiddleware,
  isValidSessionId,
  validateLoginInput,
  validateTokenInput,
  validateMfaInput
} = require('./services/securityGuard');

const app = express();

const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

// Disable X-Powered-By fingerprinting
app.disable('x-powered-by');

// Security middleware - Helmet & Open Image/Media CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      mediaSrc: ["'self'", "blob:", "https:", "https://*.riotcdn.net", "https://valorant.dyn.riotcdn.net"],
      connectSrc: [
        "'self'",
        "https://auth.riotgames.com",
        "https://entitlements.auth.riotgames.com",
        "https://*.pvp.net",
        "https://riot-geo.pas.riotgames.com",
        "https://valorant-api.com",
        "https://media.valorant-api.com",
        "https://www.overtopup.com",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "https://*.riotcdn.net",
        "https://valorant.dyn.riotcdn.net"
      ],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: null
    }
  },
  hsts: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer-when-downgrade' }
}));

// Allowed Origins for CORS with Credentials (Strict Whitelist)
const allowedOriginPatterns = [
  'https://val-shop-checker.vercel.app',
  /^https:\/\/val-shop-checker.*\.vercel\.app$/,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOriginPatterns.some(pattern => {
      if (pattern instanceof RegExp) return pattern.test(origin);
      return pattern === origin;
    });
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  exposedHeaders: ['X-Val-Session', 'X-Val-Auth-Pack']
}));
app.use(cookieParser(config.SESSION_SECRET));
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ limit: '256kb', extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure skin catalog is initialized (supports both serverless & standalone)
app.use(async (req, res, next) => {
  if (!skinCatalog.initialized) {
    try {
      await skinCatalog.init();
    } catch (e) {
      console.error('[SkinCatalog Lazy Init Error]:', e.message);
    }
  }
  next();
});

// Global API rate limiting
app.use('/api', apiRateLimitMiddleware);

// Middleware: Get or initialize isolated session
function getSessionMiddleware(req, res, next) {
  let sessionId = req.headers['x-val-session'] || req.cookies?.val_sid || req.query?.sid;
  
  if (sessionId && !isValidSessionId(sessionId)) {
    sessionId = null;
  }

  let session = sessionStore.getSession(sessionId);

  if (!session) {
    session = sessionStore.createSession();
    res.cookie('val_sid', session.id, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: config.SESSION_TTL_MS
    });
  }

  // Auto-rehydrate auth from client auth pack header or cookie if server session memory was lost (Serverless persistence)
  const authPackRaw = req.headers['x-val-auth-pack'] || req.cookies?.val_auth_pack;
  if (authPackRaw && (!session.auth || !session.auth.accessToken)) {
    try {
      const decodedStr = Buffer.from(authPackRaw, 'base64').toString('utf8');
      const authObj = JSON.parse(decodedStr);
      if (authObj && authObj.accessToken && authObj.puuid) {
        session.auth = authObj;
        sessionStore.updateSession(session.id, { auth: authObj });
      }
    } catch (e) {}
  }

  req.valSession = session;
  res.setHeader('X-Val-Session', session.id);
  res.setHeader('Access-Control-Expose-Headers', 'X-Val-Session, X-Val-Auth-Pack');
  next();
}

app.use(getSessionMiddleware);

// Endpoint: Health & System Status
app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    sessionId: req.valSession.id,
    catalogReady: skinCatalog.initialized,
    clientVersion: skinCatalog.getClientVersion(),
    regions: Object.keys(config.REGIONS).map(k => ({ id: k, name: config.REGIONS[k].name }))
  });
});

// Endpoint: Direct Riot Authentication (Rate-limited & Input-validated)
app.post('/api/auth/login', authRateLimitMiddleware, async (req, res) => {
  try {
    const validated = validateLoginInput(req.body);
    if (!validated.ok) {
      return res.status(400).json({ ok: false, error: validated.error });
    }

    const { username, password, region } = validated;
    const authResult = await riotAuth.authenticate(username, password);

    // If 2FA is required
    if (authResult.mfaRequired) {
      sessionStore.updateSession(req.valSession.id, {
        mfaState: {
          cookieHeader: authResult.cookieHeader,
          preferredRegion: region || 'ap',
          username: username
        }
      });

      return res.json({
        ok: true,
        sessionId: req.valSession.id,
        mfaRequired: true,
        email: authResult.email,
        message: `กรุณากรอกรหัสยืนยัน 2FA ที่ส่งไปยัง ${authResult.email}`
      });
    }

    // Auth succeeded -> complete session setup
    const tokens = authResult.tokens;
    const authData = await completeUserSession(req.valSession.id, tokens, region);
    const authPackBase64 = Buffer.from(JSON.stringify(authData)).toString('base64');

    res.cookie('val_auth_pack', authPackBase64, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    res.setHeader('X-Val-Auth-Pack', authPackBase64);

    res.json({
      ok: true,
      sessionId: req.valSession.id,
      auth: authData,
      authPack: authPackBase64,
      mfaRequired: false,
      message: 'เข้าสู่ระบบสำเร็จ'
    });
  } catch (err) {
    console.error('[Login Error]:', err.message);
    res.status(401).json({ ok: false, error: err.message || 'เข้าสู่ระบบไม่สำเร็จ' });
  }
});

// Endpoint: 2FA MFA Verification (Rate-limited & Input-validated)
app.post('/api/auth/mfa', authRateLimitMiddleware, async (req, res) => {
  try {
    const validated = validateMfaInput(req.body);
    if (!validated.ok) {
      return res.status(400).json({ ok: false, error: validated.error });
    }

    const { code } = validated;
    const mfaState = req.valSession.mfaState;

    if (!mfaState || !mfaState.cookieHeader) {
      return res.status(400).json({ ok: false, error: 'ไม่พบสถานะ 2FA กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง' });
    }

    const tokens = await riotAuth.verifyMfa(code, mfaState.cookieHeader);
    const authData = await completeUserSession(req.valSession.id, tokens, mfaState.preferredRegion);
    const authPackBase64 = Buffer.from(JSON.stringify(authData)).toString('base64');

    res.cookie('val_auth_pack', authPackBase64, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    res.setHeader('X-Val-Auth-Pack', authPackBase64);

    // Clean up MFA state
    sessionStore.updateSession(req.valSession.id, { mfaState: null });

    res.json({
      ok: true,
      sessionId: req.valSession.id,
      auth: authData,
      authPack: authPackBase64,
      message: 'ยืนยัน 2FA สำเร็จ เข้าสู่ระบบเรียบร้อย'
    });
  } catch (err) {
    console.error('[MFA Error]:', err.message);
    res.status(400).json({ ok: false, error: err.message || 'รหัส 2FA ไม่ถูกต้อง' });
  }
});

// Endpoint: Token / Social / RSO Paste Login (Rate-limited & Input-validated)
app.post('/api/auth/token-login', authRateLimitMiddleware, async (req, res) => {
  try {
    const validated = validateTokenInput(req.body);
    if (!validated.ok) {
      return res.status(400).json({ ok: false, error: validated.error });
    }

    const { accessToken, idToken, region } = validated;

    const tokens = {
      accessToken,
      idToken
    };

    const authData = await completeUserSession(req.valSession.id, tokens, region || 'auto');
    const authPackBase64 = Buffer.from(JSON.stringify(authData)).toString('base64');

    res.cookie('val_auth_pack', authPackBase64, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    res.setHeader('X-Val-Auth-Pack', authPackBase64);

    res.json({
      ok: true,
      sessionId: req.valSession.id,
      auth: authData,
      authPack: authPackBase64,
      message: 'เข้าสู่ระบบด้วย Token สำเร็จ'
    });
  } catch (err) {
    console.error('[Token Login Error]:', err.message);
    res.status(400).json({ ok: false, error: err.message || 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
});

// Helper to finish populating user session
async function completeUserSession(sessionId, tokens, userRegion) {
  const entitlementsToken = await riotAuth.getEntitlementsToken(tokens.accessToken);
  const userInfo = await riotAuth.getUserInfo(tokens.accessToken);

  let finalRegion = userRegion;
  if (!finalRegion || finalRegion === 'auto') {
    try {
      finalRegion = await riotAuth.detectRegion(tokens.idToken, 'ap');
    } catch (e) {
      finalRegion = 'ap';
    }
  }

  let nameData = { gameName: 'Agent', tagLine: 'VAL' };
  try {
    nameData = await valorantApi.getPlayerName(
      userInfo.puuid,
      finalRegion,
      tokens.accessToken,
      entitlementsToken
    );
  } catch (e) {
    if (userInfo.acct?.game_name) {
      nameData = { gameName: userInfo.acct.game_name, tagLine: userInfo.acct.tag_line || 'VAL' };
    }
  }

  const authData = {
    accessToken: tokens.accessToken,
    idToken: tokens.idToken,
    entitlementsToken,
    puuid: userInfo.puuid,
    region: finalRegion,
    country: userInfo.country,
    gameName: nameData.gameName || 'Agent',
    tagLine: nameData.tagLine || 'VAL'
  };

  sessionStore.updateSession(sessionId, {
    auth: authData,
    mfaState: null
  });

  return authData;
}

// Endpoint: Get Current User Info & Wallet
app.get('/api/auth/me', async (req, res) => {
  const auth = req.valSession.auth;
  if (!auth) {
    return res.json({ ok: true, loggedIn: false });
  }

  try {
    const [wallet, levelProgress] = await Promise.all([
      valorantApi.getWallet(auth.puuid, auth.region, auth.accessToken, auth.entitlementsToken),
      valorantApi.getAccountLevel(auth.puuid, auth.region, auth.accessToken, auth.entitlementsToken)
    ]);

    res.json({
      ok: true,
      loggedIn: true,
      user: {
        gameName: auth.gameName,
        tagLine: auth.tagLine,
        region: auth.region,
        level: levelProgress.level,
        wallet: {
          vp: wallet.vp,
          rp: wallet.rp,
          kc: wallet.kc
        }
      }
    });
  } catch (err) {
    if (err.code === 'TOKEN_EXPIRED') {
      sessionStore.updateSession(req.valSession.id, { auth: null });
      return res.status(401).json({ ok: false, loggedIn: false, error: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    }
    res.json({
      ok: true,
      loggedIn: true,
      user: {
        gameName: auth.gameName,
        tagLine: auth.tagLine,
        region: auth.region,
        level: 1,
        wallet: { vp: 0, rp: 0, kc: 0 }
      }
    });
  }
});

// Endpoint: Get Storefront (Daily shop, Night market, Featured bundle)
app.get('/api/shop', async (req, res) => {
  const auth = req.valSession.auth;
  if (!auth) {
    return res.status(401).json({ ok: false, error: 'กรุณาเข้าสู่ระบบก่อนดูร้านค้า' });
  }

  try {
    const storefront = await valorantApi.getStorefront(
      auth.puuid,
      auth.region,
      auth.accessToken,
      auth.entitlementsToken
    );

    if (storefront.activeShard && storefront.activeShard !== auth.region) {
      auth.region = storefront.activeShard;
      sessionStore.updateSession(req.valSession.id, { auth });
    }

    res.json({
      ok: true,
      store: storefront
    });
  } catch (err) {
    console.error('[Storefront Error]:', err.message);
    if (err.code === 'TOKEN_EXPIRED') {
      sessionStore.updateSession(req.valSession.id, { auth: null });
      return res.status(401).json({ ok: false, error: 'Access Token หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    }
    res.status(500).json({ ok: false, error: err.message || 'ไม่สามารถโหลดร้านค้าได้' });
  }
});

// Endpoint: Get Player MMR & Competitive Rank
app.get('/api/career/mmr', async (req, res) => {
  const auth = req.valSession.auth;
  if (!auth) {
    return res.status(401).json({ ok: false, error: 'กรุณาเข้าสู่ระบบก่อนดูข้อมูลแรงก์' });
  }

  try {
    const mmr = await valorantApi.getMmr(
      auth.puuid,
      auth.region,
      auth.accessToken,
      auth.entitlementsToken
    );

    res.json({
      ok: true,
      mmr
    });
  } catch (err) {
    console.error('[MMR Error]:', err.message);
    if (err.code === 'TOKEN_EXPIRED') {
      sessionStore.updateSession(req.valSession.id, { auth: null });
      return res.status(401).json({ ok: false, error: 'Access Token หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    }
    res.status(500).json({ ok: false, error: err.message || 'ไม่สามารถโหลดข้อมูลแรงก์ได้' });
  }
});

// Endpoint: Get Player Match History
app.get('/api/matches', async (req, res) => {
  const auth = req.valSession.auth;
  if (!auth) {
    return res.status(401).json({ ok: false, error: 'กรุณาเข้าสู่ระบบก่อนดูประวัติการเล่น' });
  }

  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const queue = req.query.queue || '';

    const history = await valorantApi.getMatchHistory(
      auth.puuid,
      auth.region,
      auth.accessToken,
      auth.entitlementsToken,
      limit,
      queue
    );

    res.json({
      ok: true,
      history
    });
  } catch (err) {
    console.error('[Match History Error]:', err.message);
    if (err.code === 'TOKEN_EXPIRED') {
      sessionStore.updateSession(req.valSession.id, { auth: null });
      return res.status(401).json({ ok: false, error: 'Access Token หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    }
    res.status(500).json({ ok: false, error: err.message || 'ไม่สามารถโหลดประวัติการเล่นได้' });
  }
});

// Endpoint: Get Specific Match Scoreboard
app.get('/api/match/:matchId', async (req, res) => {
  const auth = req.valSession.auth;
  if (!auth) {
    return res.status(401).json({ ok: false, error: 'กรุณาเข้าสู่ระบบก่อนดูรายละเอียดการแข่งขัน' });
  }

  try {
    const rawMatch = await valorantApi.getMatchDetails(
      req.params.matchId,
      auth.region,
      auth.accessToken,
      auth.entitlementsToken
    );

    const formatted = valorantApi.formatMatchData(auth.puuid, rawMatch);

    res.json({
      ok: true,
      match: formatted
    });
  } catch (err) {
    console.error('[Match Detail Error]:', err.message);
    res.status(500).json({ ok: false, error: err.message || 'ไม่สามารถโหลดรายละเอียดแมตช์ได้' });
  }
});
// Endpoint: Get All Playable Agents
app.get('/api/agents', (req, res) => {
  const agents = skinCatalog.getAllAgents();
  res.json({ ok: true, agents });
});

// Endpoint: Get All Weapons List (with icons and categories)
app.get('/api/weapons', (req, res) => {
  const weapons = skinCatalog.getWeaponsList();
  res.json({ ok: true, weapons });
});

// Endpoint: Get All Weapon Skins Catalog (Search & Filters)
app.get('/api/skins/all', (req, res) => {
  const { search, weapon, category, tier, limit, offset } = req.query;
  const data = skinCatalog.getAllSkins({
    search,
    weapon,
    category,
    tier,
    limit: limit ? parseInt(limit, 10) : 48,
    offset: offset ? parseInt(offset, 10) : 0
  });
  res.json({ ok: true, ...data });
});

// Endpoint: Skin / Item Details Lookup
app.get('/api/skin/:uuid', (req, res) => {
  const skin = skinCatalog.getSkinById(req.params.uuid) || skinCatalog.getItemById(req.params.uuid);
  if (!skin) {
    return res.status(404).json({ ok: false, error: 'ไม่พบข้อมูลสกินหรือไอเทม' });
  }
  res.json({ ok: true, skin });
});

// Endpoint: VP Pricing - Get All Stores & Packages
app.get('/api/vp-pricing/stores', (req, res) => {
  res.json({
    ok: true,
    stores: vpPricing.STORES
  });
});

// Endpoint: VP Pricing - Get Side-by-Side Matrix
app.get('/api/vp-pricing/matrix', (req, res) => {
  const matrix = vpPricing.getPriceMatrix();
  res.json({
    ok: true,
    matrix
  });
});

// Endpoint: VP Pricing - Compare All Stores (GET or POST)
app.all('/api/vp-pricing/compare', (req, res) => {
  const targetVp = parseInt(req.body?.targetVp || req.query.vp || 1775, 10);
  const currentWalletVp = parseInt(req.body?.currentWalletVp || req.query.wallet || 0, 10);
  const deductWallet = req.body?.deductWallet !== undefined ? Boolean(req.body.deductWallet) : (req.query.deduct !== 'false');

  if (isNaN(targetVp) || targetVp < 0) {
    return res.status(400).json({ ok: false, error: 'จำนวน VP ไม่ถูกต้อง' });
  }

  const comparison = vpPricing.compareAllStores(targetVp, isNaN(currentWalletVp) ? 0 : currentWalletVp, deductWallet);
  res.json({
    ok: true,
    comparison
  });
});

// Endpoint: Logout (Wipe session memory and clear cookie)
app.post('/api/auth/logout', (req, res) => {
  if (req.valSession) {
    sessionStore.destroySession(req.valSession.id);
  }
  res.clearCookie('val_sid', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/'
  });
  res.json({ ok: true, message: 'ออกจากระบบเรียบร้อย' });
});

// Custom 404 Handler
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: 'ไม่พบ API Endpoint ที่คุณเรียก (404 Not Found)' });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized Safe Error Handler (Zero Leaks in Production)
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err?.message || err);
  res.status(err.status || 500).json({
    ok: false,
    error: 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง'
  });
});

// Start Server
async function start() {
  await skinCatalog.init();

  app.listen(config.PORT, config.HOST, () => {
    console.log(`====================================================`);
    console.log(` VALORANT SHOP CHECKER is running securely!`);
    console.log(` Web Server: http://${config.HOST === '0.0.0.0' ? 'localhost' : config.HOST}:${config.PORT}`);
    console.log(` Environment: Android Termux / Node.js / Vercel`);
    console.log(` Zero-Leak Security & Account Isolation Active`);
    console.log(`====================================================`);
  });
}

module.exports = app;

if (require.main === module) {
  start();
}
