module.exports = {
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  SESSION_SECRET: process.env.SESSION_SECRET || 'valstore-persistent-session-secret-v2',
  SESSION_TTL_MS: 30 * 24 * 3600 * 1000, // 30 days long-lived persistence
  REGIONS: {
    ap: { name: 'Asia Pacific (AP/TH)', pvp: 'pd.ap.a.pvp.net' },
    na: { name: 'North America (NA)', pvp: 'pd.na.a.pvp.net' },
    eu: { name: 'Europe (EU)', pvp: 'pd.eu.a.pvp.net' },
    kr: { name: 'Korea (KR)', pvp: 'pd.kr.a.pvp.net' },
    latam: { name: 'Latin America (LATAM)', pvp: 'pd.latam.a.pvp.net' },
    br: { name: 'Brazil (BR)', pvp: 'pd.br.a.pvp.net' }
  },
  CURRENCIES: {
    VP: '85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741', // Valorant Points
    RP: 'e59aa87c-4cbf-517a-5983-6e81511be9b7', // Radianite Points
    KC: '85ca954a-41f2-ce94-9b45-8ca3dd39a00d'  // Kingdom Credits
  },
  DEFAULT_CLIENT_VERSION: 'release-13.04-shipping-18-5304478',
  DEFAULT_CLIENT_PLATFORM: 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9'
};
