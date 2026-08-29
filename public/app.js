// VALORANT Store & Skin Inspector App Script

let currentUser = null;
let currentStore = null;
let currentInspectedSkin = null;
let timerInterval = null;
let dailyRemaining = 0;
let bundleRemaining = 0;
let nmRemaining = 0;

let currentCategoryFilter = 'all';
let currentAppMode = 'store';
let catalogOffset = 0;
const catalogLimit = 48;
let catalogTotal = 0;
let catalogSearchDebounce = null;
let allWeaponsList = [];

// Session Storage Utilities (Cross-Platform Persistent 30-Day Auth)
function getStoredSid() {
  try {
    return localStorage.getItem('val_sid') || '';
  } catch (e) {
    return '';
  }
}

function setStoredSid(sid) {
  if (!sid) return;
  try {
    localStorage.setItem('val_sid', sid);
  } catch (e) {}
}

function getStoredAuthPack() {
  try {
    return localStorage.getItem('val_auth_pack') || '';
  } catch (e) {
    return '';
  }
}

function setStoredAuthPack(rawVal) {
  if (!rawVal) return;
  try {
    let str = typeof rawVal === 'string' ? rawVal : JSON.stringify(rawVal);
    if (!str.startsWith('ey') && typeof rawVal !== 'string') {
      str = btoa(unescape(encodeURIComponent(str)));
    }
    localStorage.setItem('val_auth_pack', str);
  } catch (e) {}
}

// XSS Sanitizer for dynamic client text rendering
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function apiFetch(url, options = {}) {
  const sid = getStoredSid();
  const authPack = getStoredAuthPack();
  const headers = {
    ...(options.headers || {}),
    ...(sid ? { 'X-Val-Session': sid } : {}),
    ...(authPack ? { 'X-Val-Auth-Pack': authPack } : {})
  };

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers
  });

  const returnedSid = res.headers.get('X-Val-Session');
  if (returnedSid) {
    setStoredSid(returnedSid);
  }

  const returnedAuthPack = res.headers.get('X-Val-Auth-Pack');
  if (returnedAuthPack) {
    setStoredAuthPack(returnedAuthPack);
  }

  return res;
}

// ==========================================================
// LINEAR RED SWITCH MECHANICAL KEYBOARD SOUND ENGINE (ASMR THOCK)
// ==========================================================
let audioCtx = null;
let soundEnabled = true;
let userHasInteracted = false;
try {
  const savedSound = localStorage.getItem('val_sound_enabled');
  if (savedSound !== null) soundEnabled = savedSound === 'true';
} catch (e) {}

let replayAudioMuted = false;

function initAudioContext() {
  if (!userHasInteracted) return;
  try {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch (e) {}
}

// Auto unlock audio on first user interaction
['pointerdown', 'click', 'touchstart', 'keydown'].forEach(evt => {
  window.addEventListener(evt, () => {
    userHasInteracted = true;
    initAudioContext();
  }, { once: true, passive: true });
});

// Global Image Error Handler (Clean CSP-compliant fallback)
document.addEventListener('error', (e) => {
  if (e.target && e.target.tagName === 'IMG') {
    const img = e.target;
    if (img.classList.contains('skin-tier-icon') || img.classList.contains('role-mini-icon') || img.classList.contains('chroma-swatch-img') || img.classList.contains('tier-tag-icon')) {
      img.style.display = 'none';
    } else if (img.classList.contains('main-preview-render') || img.closest('.skin-image-box') || img.classList.contains('bundle-mini-img-wrap')) {
      if (!img.dataset.hasFallback) {
        img.dataset.hasFallback = '1';
        img.src = 'https://media.valorant-api.com/weapons/skins/default/displayicon.png';
      }
    }
  }
}, true);

// Global Delegated Click for Compare Tags
document.addEventListener('click', (e) => {
  const quickTag = e.target.closest('.skin-thb-quick-tag');
  if (quickTag && quickTag.dataset.vp) {
    e.stopPropagation();
    const vp = parseInt(quickTag.dataset.vp, 10);
    if (vp) window.openVpCompareModal(vp);
    return;
  }

  const bundleBtn = e.target.closest('.btn-bundle-calc');
  if (bundleBtn && bundleBtn.dataset.vp) {
    e.stopPropagation();
    const vp = parseInt(bundleBtn.dataset.vp, 10);
    if (vp) window.openVpCompareModal(vp);
    return;
  }
});

// Synthesizer for Authentic Lubed Linear Red Switch Keypress
function playRedSwitchKey(now, pitch = 360, deepness = 1.0, volume = 0.35, isSpacebar = false) {
  if (!audioCtx) return;

  // 1. Noise Transient (Plastic Stem Bottom-out Impact)
  const bufferSize = Math.floor(audioCtx.sampleRate * (isSpacebar ? 0.022 : 0.014));
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
  }

  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = buffer;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(isSpacebar ? 380 : (pitch * 1.5), now);
  noiseFilter.Q.setValueAtTime(isSpacebar ? 2.2 : 3.0, now);

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(volume * (isSpacebar ? 0.55 : 0.45), now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (isSpacebar ? 0.022 : 0.014));

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noiseSource.start(now);

  // 2. Linear Red Switch Housing Bottom-Out (Thock Resonance)
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(isSpacebar ? 420 : (pitch * 1.8), now);
  filter.frequency.exponentialRampToValueAtTime(isSpacebar ? 120 : (pitch * 0.6), now + (isSpacebar ? 0.055 : 0.038));

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(pitch * deepness, now);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.35 * deepness, now + (isSpacebar ? 0.055 : 0.038));

  oscGain.gain.setValueAtTime(volume, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + (isSpacebar ? 0.055 : 0.038));

  osc.connect(filter);
  filter.connect(oscGain);
  oscGain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + (isSpacebar ? 0.055 : 0.038));

  // 3. Backplate Sub-Thump (Solid Desk & Case Acoustics)
  const sub = audioCtx.createOscillator();
  const subGain = audioCtx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(isSpacebar ? 95 : (pitch * 0.45 * deepness), now);
  sub.frequency.exponentialRampToValueAtTime(35, now + (isSpacebar ? 0.065 : 0.045));

  subGain.gain.setValueAtTime(volume * (isSpacebar ? 0.5 : 0.3), now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + (isSpacebar ? 0.065 : 0.045));

  sub.connect(subGain);
  subGain.connect(audioCtx.destination);

  sub.start(now);
  sub.stop(now + (isSpacebar ? 0.065 : 0.045));
}

function playTacticalAudio(type) {
  if (!soundEnabled || !userHasInteracted) return;
  if (replayAudioMuted && (type === 'headshot' || type === 'kill' || type === 'plant')) return;

  try {
    initAudioContext();
    if (!audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;

    if (type === 'click') {
      // Crisp Mechanical Thock + Soft Cyber Click
      playRedSwitchKey(now, 360, 1.0, 0.35, false);
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.035);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } else if (type === 'hover') {
      // Ultra-Light Key Touch + Soft High-Tech Glint
      playRedSwitchKey(now, 520, 1.1, 0.06, false);
    } else if (type === 'scroll_tick') {
      // Soft Detent Click for Scroll
      playRedSwitchKey(now, 680, 1.2, 0.04, false);
    } else if (type === 'tab') {
      // High-Tech Dual Frequency Blip + Solid Spacebar Thock
      playRedSwitchKey(now, 220, 0.85, 0.4, true);
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'inspect' || type === 'open') {
      // Resonant Sci-Fi Power-On Sweep + 3-Chord Cyber Chime
      [0.0, 0.04, 0.09].forEach((delay, i) => {
        const chord = [523.25, 659.25, 783.99]; // C5 - E5 - G5 Cyber Chime
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(chord[i], now + delay);
        osc.frequency.exponentialRampToValueAtTime(chord[i] * 1.5, now + delay + 0.25);
        gain.gain.setValueAtTime(0.14, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.25);
      });
      playRedSwitchKey(now, 260, 0.8, 0.38, true);
    } else if (type === 'close') {
      // Soft Low-Pass Swoosh + Mechanical Release
      playRedSwitchKey(now, 290, 0.9, 0.32, false);
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'star') {
      // Golden Bell Twinkle Shimmer (C6 - E6 - G6 sparkling chord)
      [0.0, 0.045, 0.09].forEach((delay, i) => {
        const chord = [1046.50, 1318.51, 1567.98];
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(chord[i], now + delay);
        gain.gain.setValueAtTime(0.18, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.35);
      });
      playRedSwitchKey(now, 195, 0.8, 0.42, true);
    } else if (type === 'chroma') {
      // High-Tech Frequency Modulation Chirp
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(740, now);
      osc.frequency.exponentialRampToValueAtTime(1180, now + 0.09);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
      playRedSwitchKey(now, 410, 1.05, 0.3, false);
    } else if (type === 'level') {
      // Rapid 2-Tone Sci-Fi Level Up Double Beep
      [0.0, 0.06].forEach((delay, i) => {
        const freqs = [660, 990];
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freqs[i], now + delay);
        gain.gain.setValueAtTime(0.15, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.12);
      });
      playRedSwitchKey(now, 380, 1.0, 0.3, false);
    } else if (type === 'login') {
      // Theatrical 5-Key Typing Burst + Ascending Fanfare
      [0.0, 0.04, 0.08, 0.12, 0.17].forEach((delay, i) => {
        const pitches = [370, 340, 390, 320, 190];
        playRedSwitchKey(now + delay, pitches[i], i === 4 ? 0.75 : 1.0, i === 4 ? 0.48 : 0.32, i === 4);
      });
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);
      gain.gain.setValueAtTime(0.18, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + 0.18);
      osc.stop(now + 0.35);
    } else if (type === 'refresh') {
      // Dual Cyber Harmonic Spin
      playRedSwitchKey(now, 350, 1.0, 0.32, false);
      playRedSwitchKey(now + 0.055, 330, 0.95, 0.34, false);
    } else if (type === 'error') {
      // Heavy Muffled Double Buzz
      playRedSwitchKey(now, 240, 0.85, 0.38, true);
      playRedSwitchKey(now + 0.06, 210, 0.8, 0.4, true);
    } else if (type === 'headshot') {
      // Metallic High Dink
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'kill') {
      playRedSwitchKey(now, 160, 0.75, 0.45, true);
    } else if (type === 'plant') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.setValueAtTime(1400, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch (e) {}
}

function updateSoundToggleUi() {
  const btn = document.getElementById('btnToggleSoundEffects');
  if (!btn) return;
  const onIcon = btn.querySelector('.icon-sound-on');
  const offIcon = btn.querySelector('.icon-sound-off');
  const label = btn.querySelector('.sound-toggle-label');

  if (soundEnabled) {
    btn.classList.remove('muted');
    onIcon?.classList.remove('hidden');
    offIcon?.classList.add('hidden');
    if (label) label.textContent = 'เสียง SFX: เปิด';
  } else {
    btn.classList.add('muted');
    onIcon?.classList.add('hidden');
    offIcon?.classList.remove('hidden');
    if (label) label.textContent = 'เสียง SFX: ปิด';
  }
}

document.getElementById('btnToggleSoundEffects')?.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  try {
    localStorage.setItem('val_sound_enabled', soundEnabled.toString());
  } catch (e) {}
  updateSoundToggleUi();
  if (soundEnabled) {
    playTacticalAudio('star');
  }
});

// Wishlist Storage Utilities
function getWishlist() {
  try {
    const raw = localStorage.getItem('val_wishlist');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
}

function isWishlisted(uuid) {
  if (!uuid) return false;
  const list = getWishlist();
  return list.has(uuid.toLowerCase());
}

function toggleWishlist(uuid, e) {
  if (e) e.stopPropagation();
  if (!uuid) return false;
  const lower = uuid.toLowerCase();
  const list = getWishlist();
  let added = false;
  if (list.has(lower)) {
    list.delete(lower);
  } else {
    list.add(lower);
    added = true;
  }
  try {
    localStorage.setItem('val_wishlist', JSON.stringify(Array.from(list)));
  } catch (err) {}

  if (added) {
    playTacticalAudio('star');
  } else {
    playTacticalAudio('click');
  }

  // Update UI stars with pop animation
  document.querySelectorAll(`.btn-wishlist-star[data-uuid="${lower}"]`).forEach(btn => {
    btn.classList.toggle('starred', added);
    btn.classList.remove('pop-active');
    void btn.offsetWidth;
    btn.classList.add('pop-active');
    btn.innerHTML = added ? 
      `<svg viewBox="0 0 24 24" width="15" height="15" fill="var(--val-gold)" stroke="var(--val-gold)" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` : 
      `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    btn.title = added ? 'อยู่ในรายการที่อยากได้ (Wishlisted)' : 'เพิ่มในรายการที่อยากได้ (Add to Wishlist)';
  });

  if (currentCategoryFilter === 'wishlist') {
    resetAndLoadCatalog();
  }

  return added;
}

// DOM Elements
const loginSection = document.getElementById('loginSection');
const storeSection = document.getElementById('storeSection');
const careerSection = document.getElementById('careerSection');
const agentsSection = document.getElementById('agentsSection');
const catalogSection = document.getElementById('catalogSection');
const userHeader = document.getElementById('userHeader');
const riotLoginForm = document.getElementById('riotLoginForm');
const tokenLoginForm = document.getElementById('tokenLoginForm');
const mfaBox = document.getElementById('mfaBox');
const mfaForm = document.getElementById('mfaForm');
const loginAlert = document.getElementById('loginAlert');
const tokenAlert = document.getElementById('tokenAlert');
const mfaAlert = document.getElementById('mfaAlert');
const skinModal = document.getElementById('skinModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const matchModal = document.getElementById('matchModal');
const btnCloseMatchModal = document.getElementById('btnCloseMatchModal');
const btnLogout = document.getElementById('btnLogout');
const btnRefreshShop = document.getElementById('btnRefreshShop');
const btnRefreshMatches = document.getElementById('btnRefreshMatches');
let currentCareerQueue = '';
let currentAgentRoleFilter = 'all';

// Tab Switching (Login Options)
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    btn.classList.add('active');
    let tabId = 'tabGoogleLogin';
    if (btn.dataset.tab === 'riot-login') tabId = 'tabRiotLogin';
    else if (btn.dataset.tab === 'token-login') tabId = 'tabTokenLogin';
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.remove('hidden');
  });
});

// ==========================================================
// 100% AUTOMATIC DEVICE DETECTION (PC VS MOBILE - ZERO MANUAL BUTTONS)
// ==========================================================
function autoDetectDeviceMode() {
  const isMobile = window.innerWidth <= 900 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
  document.body.classList.toggle('ui-mode-mobile', isMobile);
  document.body.classList.toggle('ui-mode-pc', !isMobile);

  const mobPanel = document.getElementById('deviceGuideMobile');
  const pcPanel = document.getElementById('deviceGuidePc');
  const tutMob = document.getElementById('tutModalMobileDetail');
  const tutPc = document.getElementById('tutModalPcDetail');

  if (isMobile) {
    mobPanel?.classList.remove('hidden');
    mobPanel?.classList.add('active');
    pcPanel?.classList.add('hidden');
    pcPanel?.classList.remove('active');

    tutMob?.classList.remove('hidden');
    tutPc?.classList.add('hidden');
  } else {
    pcPanel?.classList.remove('hidden');
    pcPanel?.classList.add('active');
    mobPanel?.classList.add('hidden');
    mobPanel?.classList.remove('active');

    tutPc?.classList.remove('hidden');
    tutMob?.classList.add('hidden');
  }
}

autoDetectDeviceMode();
window.addEventListener('resize', autoDetectDeviceMode, { passive: true });

// Google & Device Tutorial Navigation
document.querySelectorAll('.btn-device-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-device-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const device = btn.dataset.device;
    const mobilePanel = document.getElementById('deviceGuideMobile');
    const pcPanel = document.getElementById('deviceGuidePc');
    if (device === 'mobile') {
      mobilePanel?.classList.remove('hidden');
      mobilePanel?.classList.add('active');
      pcPanel?.classList.add('hidden');
      pcPanel?.classList.remove('active');
    } else {
      pcPanel?.classList.remove('hidden');
      pcPanel?.classList.add('active');
      mobilePanel?.classList.add('hidden');
      mobilePanel?.classList.remove('active');
    }
  });
});

// Google Tutorial Modal Controls
const googleTutorialModal = document.getElementById('googleTutorialModal');
const btnOpenGoogleTutorial = document.getElementById('btnOpenGoogleTutorial');
const btnCloseGoogleTutorialModal = document.getElementById('btnCloseGoogleTutorialModal');
const btnTutorialClose = document.getElementById('btnTutorialClose');
const btnTutorialOpenRiot = document.getElementById('btnTutorialOpenRiot');
const btnTutorialTabMobile = document.getElementById('btnTutorialTabMobile');
const btnTutorialTabPc = document.getElementById('btnTutorialTabPc');
const tutModalMobileDetail = document.getElementById('tutModalMobileDetail');
const tutModalPcDetail = document.getElementById('tutModalPcDetail');
const btnTestCopyExample = document.getElementById('btnTestCopyExample');
const testCopyFeedback = document.getElementById('testCopyFeedback');

window.openGoogleTutorialModal = function() {
  playTacticalAudio('open');
  if (googleTutorialModal) googleTutorialModal.classList.remove('hidden');
};

function closeGoogleTutorialModal() {
  playTacticalAudio('click');
  if (googleTutorialModal) googleTutorialModal.classList.add('hidden');
}

btnOpenGoogleTutorial?.addEventListener('click', window.openGoogleTutorialModal);
btnCloseGoogleTutorialModal?.addEventListener('click', closeGoogleTutorialModal);
btnTutorialClose?.addEventListener('click', closeGoogleTutorialModal);
googleTutorialModal?.addEventListener('click', (e) => {
  if (e.target === googleTutorialModal) closeGoogleTutorialModal();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && googleTutorialModal && !googleTutorialModal.classList.contains('hidden')) {
    closeGoogleTutorialModal();
  }
});

btnTutorialTabMobile?.addEventListener('click', () => {
  btnTutorialTabMobile.classList.add('active');
  btnTutorialTabPc?.classList.remove('active');
  tutModalMobileDetail?.classList.remove('hidden');
  tutModalPcDetail?.classList.add('hidden');
});

btnTutorialTabPc?.addEventListener('click', () => {
  btnTutorialTabPc.classList.add('active');
  btnTutorialTabMobile?.classList.remove('active');
  tutModalPcDetail?.classList.remove('hidden');
  tutModalMobileDetail?.classList.add('hidden');
});

btnTestCopyExample?.addEventListener('click', async () => {
  const exampleUrl = 'https://playvalorant.com/opt_in#access_token=eyJraWQiOiJyZXNldCIsImFsZyI6IlJTMjU2In0.SAMPLE_TOKEN_DEMO&scope=account%20openid&iss=https%3A%2F%2Fauth.riotgames.com';
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(exampleUrl);
    }
    if (testCopyFeedback) {
      testCopyFeedback.classList.remove('hidden');
      setTimeout(() => testCopyFeedback?.classList.add('hidden'), 4000);
    }
    if (quickPasteInput) quickPasteInput.value = exampleUrl;
    playTacticalAudio('click');
  } catch (e) {}
});

// Google Quick Paste & Login Handler
const quickPasteInput = document.getElementById('quickPasteInput');
const btnAutoPaste = document.getElementById('btnAutoPaste');
const googleAlert = document.getElementById('googleAlert');
const btnOpenRiotGoogle = document.getElementById('btnOpenRiotGoogle');
const googleWaitingBanner = document.getElementById('googleWaitingBanner');
const btnDismissWaiting = document.getElementById('btnDismissWaiting');

let isWaitingForGoogleLink = false;

function activateGoogleWaitingState() {
  isWaitingForGoogleLink = true;
  if (googleWaitingBanner) googleWaitingBanner.classList.remove('hidden');
  if (quickPasteInput) {
    quickPasteInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    quickPasteInput.focus();
  }
}

btnOpenRiotGoogle?.addEventListener('click', () => {
  activateGoogleWaitingState();
});

btnTutorialOpenRiot?.addEventListener('click', () => {
  closeGoogleTutorialModal();
  activateGoogleWaitingState();
});

btnDismissWaiting?.addEventListener('click', () => {
  if (googleWaitingBanner) googleWaitingBanner.classList.add('hidden');
  isWaitingForGoogleLink = false;
});

window.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && isWaitingForGoogleLink) {
    if (quickPasteInput && !quickPasteInput.value.trim()) {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const clipText = await navigator.clipboard.readText();
          if (clipText && (clipText.includes('access_token=') || clipText.startsWith('eyJ'))) {
            quickPasteInput.value = clipText.trim();
            processTokenString(clipText.trim(), googleAlert);
          }
        }
      } catch (e) {}
    }
  }
});

async function processTokenString(rawText, alertEl) {
  const alertTarget = alertEl || googleAlert || document.getElementById('loginAlert') || document.getElementById('tokenAlert');
  let cleanText = (rawText || '').trim();

  if (!cleanText) {
    showAlert(alertTarget, 'กรุณาวาง URL หรือ Access Token ที่คัดลอกมา');
    return;
  }

  if (cleanText.includes('error=')) {
    showAlert(alertTarget, 'พบข้อผิดพลาดจาก Riot (กรุณากดปุ่มเปิดหน้าล็อกอินใหม่อีกครั้ง)');
    return;
  }

  if (cleanText.includes('%23') || cleanText.includes('%3D') || cleanText.includes('%26')) {
    try { cleanText = decodeURIComponent(cleanText); } catch (e) {}
  }

  let accessToken = cleanText;
  let idToken = null;

  if (cleanText.includes('access_token=')) {
    let paramStr = cleanText;
    if (cleanText.includes('#')) {
      paramStr = cleanText.split('#')[1];
    } else if (cleanText.includes('?')) {
      paramStr = cleanText.split('?')[1];
    }
    const params = new URLSearchParams(paramStr);
    accessToken = params.get('access_token') || cleanText;
    idToken = params.get('id_token');
  } else if (cleanText.startsWith('eyJ') && cleanText.includes(' ')) {
    const parts = cleanText.split(/\s+/);
    accessToken = parts[0];
    if (parts[1] && parts[1].startsWith('eyJ')) idToken = parts[1];
  }

  accessToken = accessToken.trim();
  if (idToken) idToken = idToken.trim();

  if (!accessToken || accessToken.length < 20) {
    showAlert(alertTarget, 'ไม่พบ Access Token ที่ถูกต้องในข้อความที่วาง <br><a href="javascript:void(0)" onclick="window.openGoogleTutorialModal?.()" style="color:var(--val-cyan); text-decoration:underline; font-weight:700; display:inline-block; margin-top:4px;">[ดูวิธีคัดลอกลิงก์]</a>');
    return;
  }

  hideAlert(alertTarget);
  if (btnAutoPaste) {
    btnAutoPaste.disabled = true;
    btnAutoPaste.textContent = "กำลังเข้าสู่ระบบและดึงข้อมูลร้านค้า...";
  }

  try {
    const res = await apiFetch('/api/auth/token-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, idToken, region: 'auto' })
    });

    const data = await res.json();
    if (data.sessionId) {
      setStoredSid(data.sessionId);
    }
    if (data.authPack) {
      setStoredAuthPack(data.authPack);
    } else if (data.auth) {
      setStoredAuthPack(data.auth);
    }

    if (!data.ok) {
      throw new Error(data.error || 'Token ไม่ถูกต้องหรือหมดอายุ');
    }

    // Success! Immediately fetch profile and load store
    const meRes = await apiFetch('/api/auth/me');
    const meData = await meRes.json();
    if (meData.ok && meData.loggedIn) {
      currentUser = meData.user;
      renderUserHeader(meData.user);
      await loadStore();
    } else {
      await checkAuth();
    }
  } catch (err) {
    showAlert(alertTarget, (err.message || 'เข้าสู่ระบบไม่สำเร็จ') + ' <br><a href="javascript:void(0)" onclick="window.openGoogleTutorialModal?.()" style="color:var(--val-cyan); text-decoration:underline; font-weight:700; display:inline-block; margin-top:4px;">[ดูวิธีคัดลอกลิงก์]</a>');
  } finally {
    if (btnAutoPaste) {
      btnAutoPaste.disabled = false;
      btnAutoPaste.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> <span>วาง & เข้าสู่ระบบทันที</span>`;
    }
  }
}

btnAutoPaste?.addEventListener('click', async () => {
  let val = quickPasteInput ? quickPasteInput.value.trim() : '';
  if (!val && navigator.clipboard && navigator.clipboard.readText) {
    try {
      val = await navigator.clipboard.readText();
      if (quickPasteInput) quickPasteInput.value = val;
    } catch (e) {}
  }
  processTokenString(val, googleAlert);
});

quickPasteInput?.addEventListener('paste', () => {
  setTimeout(() => {
    if (quickPasteInput) {
      processTokenString(quickPasteInput.value.trim(), googleAlert);
    }
  }, 50);
});

quickPasteInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (quickPasteInput) {
      processTokenString(quickPasteInput.value.trim(), googleAlert);
    }
  }
});

// Toggle Password Visibility
document.getElementById('togglePassword')?.addEventListener('click', () => {
  const pwd = document.getElementById('loginPassword');
  if (pwd) {
    pwd.type = pwd.type === 'password' ? 'text' : 'password';
  }
});

// Show Alert Utility
function showAlert(el, msg, type = 'error') {
  if (!el) return;
  if (typeof msg === 'string' && msg.includes('<')) {
    el.innerHTML = msg;
  } else {
    el.textContent = msg;
  }
  el.className = 'alert-box ' + type;
  el.classList.remove('hidden');
  if (type === 'error') {
    playTacticalAudio('error');
  }
}

function hideAlert(el) {
  if (el) el.classList.add('hidden');
}

// Format Seconds to HH:MM:SS
function formatTime(seconds) {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

// Start Countdown Timers
function startTimers() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (dailyRemaining > 0) {
      dailyRemaining--;
      const el = document.getElementById('dailyTimer');
      if (el) el.textContent = formatTime(dailyRemaining);
    }
    if (bundleRemaining > 0) {
      bundleRemaining--;
      const el = document.getElementById('bundleTimer');
      if (el) el.textContent = formatTime(bundleRemaining);
    }
    if (nmRemaining > 0) {
      nmRemaining--;
      const nmEl = document.getElementById('nmTimer');
      if (nmEl) nmEl.textContent = formatTime(nmRemaining);
    }
  }, 1000);
}

// Check Existing Session & Auto-Restore (Permanent Persistent Auth)
async function checkAuth() {
  try {
    const res = await apiFetch('/api/auth/me');
    const data = await res.json();
    if (data.ok && data.loggedIn) {
      currentUser = data.user;
      renderUserHeader(data.user);
      await loadStore();
      return true;
    }
  } catch (err) {}

  // Silent Auto-Rehydrate for Long-Term Persistent Login (Log in once, stay logged in!)
  const storedPack = getStoredAuthPack();
  if (storedPack) {
    try {
      let decoded = null;
      try {
        decoded = JSON.parse(decodeURIComponent(escape(atob(storedPack))));
      } catch (e) {
        decoded = JSON.parse(storedPack);
      }

      if (decoded && decoded.accessToken) {
        const reLoginRes = await apiFetch('/api/auth/token-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: decoded.accessToken,
            idToken: decoded.idToken,
            region: decoded.region || 'auto'
          })
        });
        const reData = await reLoginRes.json();
        if (reData.ok) {
          if (reData.authPack) setStoredAuthPack(reData.authPack);
          else if (reData.auth) setStoredAuthPack(reData.auth);
          const meRes = await apiFetch('/api/auth/me');
          const meData = await meRes.json();
          if (meData.ok && meData.loggedIn) {
            currentUser = meData.user;
            renderUserHeader(meData.user);
            await loadStore();
            return true;
          }
        }
      }
    } catch (e) {}
  }

  showLoginView();
  return false;
}

// Update User Header
function renderUserHeader(user) {
  currentUserData = user;
  const nameEl = document.getElementById('userName');
  const tagEl = document.getElementById('userTag');
  const regionEl = document.getElementById('userRegion');
  const levelEl = document.getElementById('userLevel');
  const vpEl = document.getElementById('walletVp');
  const rpEl = document.getElementById('walletRp');
  const kcEl = document.getElementById('walletKc');

  if (nameEl) nameEl.textContent = user.gameName || 'Agent';
  if (tagEl) tagEl.textContent = user.tagLine ? '#' + user.tagLine : '';
  if (regionEl) regionEl.textContent = (user.region || 'AP').toUpperCase();
  if (levelEl) levelEl.textContent = 'LVL ' + (user.level || 1);
  if (vpEl) vpEl.textContent = (user.wallet?.vp || 0).toLocaleString();
  if (rpEl) rpEl.textContent = (user.wallet?.rp || 0).toLocaleString();
  if (kcEl) kcEl.textContent = (user.wallet?.kc || 0).toLocaleString();

  userHeader?.classList.remove('hidden');
  loginSection?.classList.add('hidden');
  if (currentAppMode === 'store') {
    storeSection?.classList.remove('hidden');
    careerSection?.classList.add('hidden');
    agentsSection?.classList.add('hidden');
    catalogSection?.classList.add('hidden');
  } else if (currentAppMode === 'career') {
    careerSection?.classList.remove('hidden');
    storeSection?.classList.add('hidden');
    agentsSection?.classList.add('hidden');
    catalogSection?.classList.add('hidden');
    loadCareer();
  } else if (currentAppMode === 'agents') {
    agentsSection?.classList.remove('hidden');
    storeSection?.classList.add('hidden');
    careerSection?.classList.add('hidden');
    catalogSection?.classList.add('hidden');
    loadAgentsEncyclopedia();
  }
}

function showLoginView() {
  currentUser = null;
  userHeader?.classList.add('hidden');
  storeSection?.classList.add('hidden');
  careerSection?.classList.add('hidden');
  if (currentAppMode === 'store' || currentAppMode === 'career') {
    loginSection?.classList.remove('hidden');
  }
  mfaBox?.classList.add('hidden');
  riotLoginForm?.classList.remove('hidden');
}

// Form 1: Riot Login
riotLoginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert(loginAlert);

  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  const regionInput = document.getElementById('loginRegion');

  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';
  const region = regionInput ? regionInput.value : 'ap';
  const submitBtn = document.getElementById('btnLoginSubmit');
  const spinner = submitBtn?.querySelector('.spinner');
  const btnText = submitBtn?.querySelector('.btn-text');

  if (submitBtn) submitBtn.disabled = true;
  spinner?.classList.remove('hidden');
  if (btnText) btnText.textContent = 'กำลังเชื่อมต่อ Riot...';

  try {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, region })
    });

    const data = await res.json();
    if (data.sessionId) {
      setStoredSid(data.sessionId);
    }
    if (data.authPack) {
      setStoredAuthPack(data.authPack);
    } else if (data.auth) {
      setStoredAuthPack(data.auth);
    }

    if (!data.ok) {
      throw new Error(data.error || 'เข้าสู่ระบบล้มเหลว');
    }

    if (data.mfaRequired) {
      riotLoginForm?.classList.add('hidden');
      mfaBox?.classList.remove('hidden');
      const mfaDesc = document.getElementById('mfaDesc');
      if (mfaDesc) mfaDesc.textContent = data.message || 'กรุณากรอกรหัส 2FA';
      document.getElementById('mfaCode')?.focus();
    } else {
      await checkAuth();
    }
  } catch (err) {
    showAlert(loginAlert, err.message || 'เข้าสู่ระบบไม่สำเร็จ');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    spinner?.classList.add('hidden');
    if (btnText) btnText.textContent = 'เข้าสู่ระบบ (LOGIN)';
  }
});

// 2FA MFA Verification Form
mfaForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert(mfaAlert);

  const codeInput = document.getElementById('mfaCode');
  const code = codeInput ? codeInput.value.trim() : '';
  const submitBtn = document.getElementById('btnMfaSubmit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'กำลังยืนยัน...';
  }

  try {
    const res = await apiFetch('/api/auth/mfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    const data = await res.json();
    if (data.sessionId) {
      setStoredSid(data.sessionId);
    }
    if (data.authPack) {
      setStoredAuthPack(data.authPack);
    } else if (data.auth) {
      setStoredAuthPack(data.auth);
    }

    if (!data.ok) {
      throw new Error(data.error || 'รหัส 2FA ไม่ถูกต้อง');
    }

    await checkAuth();
  } catch (err) {
    showAlert(mfaAlert, err.message || 'ยืนยันรหัส 2FA ไม่สำเร็จ');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'ยืนยันรหัส 2FA';
    }
  }
});

document.getElementById('btnMfaCancel')?.addEventListener('click', () => {
  mfaBox?.classList.add('hidden');
  riotLoginForm?.classList.remove('hidden');
  hideAlert(mfaAlert);
});

// Form 2: Token / Social Login
tokenLoginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert(tokenAlert);

  const rawInput = document.getElementById('inputAccessToken');
  const regionInput = document.getElementById('tokenRegion');

  let raw = rawInput ? rawInput.value.trim() : '';
  const region = regionInput ? regionInput.value : 'auto';

  if (!raw) {
    showAlert(tokenAlert, 'กรุณาวาง URL หรือ Access Token');
    return;
  }

  if (raw.includes('%23') || raw.includes('%3D') || raw.includes('%26')) {
    try { raw = decodeURIComponent(raw); } catch (e) {}
  }

  let accessToken = raw;
  let idToken = null;

  if (raw.includes('access_token=')) {
    let paramStr = raw;
    if (raw.includes('#')) {
      paramStr = raw.split('#')[1];
    } else if (raw.includes('?')) {
      paramStr = raw.split('?')[1];
    }
    const params = new URLSearchParams(paramStr);
    accessToken = params.get('access_token') || raw;
    idToken = params.get('id_token');
  } else if (raw.startsWith('eyJ') && raw.includes(' ')) {
    const parts = raw.split(/\s+/);
    accessToken = parts[0];
    if (parts[1] && parts[1].startsWith('eyJ')) idToken = parts[1];
  }

  const submitBtn = document.getElementById('btnTokenSubmit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'กำลังตรวจสอบ Token...';
  }

  try {
    const res = await apiFetch('/api/auth/token-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, idToken, region })
    });

    const data = await res.json();
    if (data.sessionId) {
      setStoredSid(data.sessionId);
    }
    if (data.authPack) {
      setStoredAuthPack(data.authPack);
    } else if (data.auth) {
      setStoredAuthPack(data.auth);
    }

    if (!data.ok) {
      throw new Error(data.error || 'Token ไม่ถูกต้องหรือหมดอายุ');
    }

    const meRes = await apiFetch('/api/auth/me');
    const meData = await meRes.json();
    if (meData.ok && meData.loggedIn) {
      currentUser = meData.user;
      renderUserHeader(meData.user);
      await loadStore();
    } else {
      await checkAuth();
    }
  } catch (err) {
    showAlert(tokenAlert, err.message || 'เข้าสู่ระบบไม่สำเร็จ');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'เข้าสู่ระบบด้วย Token';
    }
  }
});

// Load Storefront Data
async function loadStore() {
  try {
    const res = await apiFetch('/api/shop');
    const data = await res.json();

    if (!data.ok) {
      if (res.status === 401 || data.error?.includes('หมดอายุ') || data.error?.includes('เข้าสู่ระบบ')) {
        showLoginView();
        showAlert(loginAlert, 'เซสชันหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
        return;
      }
      throw new Error(data.error || 'ไม่สามารถโหลดร้านค้าได้');
    }

    currentStore = data.store;
    dailyRemaining = data.store.dailyRemainingSeconds || 0;

    renderDailyShop(data.store.dailyOffers || []);
    renderBundles(data.store.featuredBundles || []);
    renderNightMarket(data.store.nightMarket);
    startTimers();
  } catch (err) {
    console.error('Store load error:', err);
  }
}

// Live OverTopup Packages Matrix & Dynamic Programming Solver
const OVERTOPUP_PACKAGES = [
  { vp: 475, price: 123, tag: "475 VP" },
  { vp: 1000, price: 246, tag: "1,000 VP" },
  { vp: 1475, price: 368, tag: "1,475 VP" },
  { vp: 2050, price: 489, tag: "2,050 VP" },
  { vp: 2525, price: 616, tag: "2,525 VP" },
  { vp: 3050, price: 737, tag: "3,050 VP" },
  { vp: 3650, price: 866, tag: "3,650 VP" },
  { vp: 4100, price: 977, tag: "4,100 VP" },
  { vp: 4125, price: 991, tag: "4,125 VP" },
  { vp: 4650, price: 1112, tag: "4,650 VP" },
  { vp: 5350, price: 1241, tag: "5,350 VP" },
  { vp: 5825, price: 1361, tag: "5,825 VP" },
  { vp: 6350, price: 1487, tag: "6,350 VP" },
  { vp: 6825, price: 1607, tag: "6,825 VP" },
  { vp: 7150, price: 1709, tag: "7,150 VP" },
  { vp: 7400, price: 1732, tag: "7,400 VP" },
  { vp: 7875, price: 1852, tag: "7,875 VP" },
  { vp: 8200, price: 1959, tag: "8,200 VP" },
  { vp: 8400, price: 1978, tag: "8,400 VP" },
  { vp: 8750, price: 2089, tag: "8,750 VP" },
  { vp: 9000, price: 2107, tag: "9,000 VP" },
  { vp: 9800, price: 2334, tag: "9,800 VP" },
  { vp: 11000, price: 2482, tag: "11,000 VP" },
  { vp: 12000, price: 2733, tag: "12,000 VP" },
  { vp: 13050, price: 2978, tag: "13,050 VP" },
  { vp: 14650, price: 3353, tag: "14,650 VP" },
  { vp: 16350, price: 3733, tag: "16,350 VP" },
  { vp: 22000, price: 4964, tag: "22,000 VP" }
];

window.calculateOptimalOverTopup = function(targetVp) {
  if (!targetVp || targetVp <= 0) {
    return { totalPrice: 0, totalVp: 0, leftoverVp: 0, comboText: "", shortTag: "", comboList: [] };
  }
  const pkgs = [...OVERTOPUP_PACKAGES].sort((a, b) => a.price - b.price);
  const searchLimit = targetVp + 22000 + 100;
  const dp = new Array(searchLimit + 1);
  dp[0] = { cost: 0, prevV: -1, pkgIndex: -1 };

  for (let v = 0; v <= searchLimit; v++) {
    if (!dp[v]) continue;
    for (let i = 0; i < pkgs.length; i++) {
      const nextV = v + pkgs[i].vp;
      if (nextV > searchLimit) continue;
      const nextCost = dp[v].cost + pkgs[i].price;
      if (!dp[nextV] || nextCost < dp[nextV].cost) {
        dp[nextV] = { cost: nextCost, prevV: v, pkgIndex: i };
      }
    }
  }

  let bestV = -1;
  let minCost = Infinity;
  for (let v = targetVp; v <= searchLimit; v++) {
    if (dp[v] && dp[v].cost < minCost) {
      minCost = dp[v].cost;
      bestV = v;
    } else if (dp[v] && dp[v].cost === minCost && (bestV === -1 || v > bestV)) {
      bestV = v;
    }
  }

  if (bestV === -1 || minCost === Infinity) {
    const largest = pkgs[pkgs.length - 1];
    const count = Math.ceil(targetVp / largest.vp);
    return {
      totalPrice: count * largest.price,
      totalVp: count * largest.vp,
      leftoverVp: (count * largest.vp) - targetVp,
      comboText: `${count}x แพ็ก ${largest.tag} (${(count * largest.price).toLocaleString()}฿)`,
      shortTag: `${count}x ${largest.tag} (${(count * largest.price).toLocaleString()}฿)`,
      comboList: [{ count, pkg: largest }]
    };
  }

  const counts = {};
  let curr = bestV;
  while (curr > 0 && dp[curr] && dp[curr].pkgIndex !== -1) {
    const idx = dp[curr].pkgIndex;
    counts[idx] = (counts[idx] || 0) + 1;
    curr = dp[curr].prevV;
  }

  const comboList = [];
  for (const idx in counts) {
    comboList.push({
      pkg: pkgs[idx],
      count: counts[idx],
      subtotalPrice: counts[idx] * pkgs[idx].price,
      subtotalVp: counts[idx] * pkgs[idx].vp
    });
  }
  comboList.sort((a, b) => b.pkg.vp - a.pkg.vp);
  const comboText = comboList.map(c => `${c.count}x แพ็ก ${c.pkg.tag} (${c.subtotalPrice.toLocaleString()}฿)`).join(" + ");
  const shortTag = comboList.map(c => `${c.count}x ${c.pkg.tag}`).join("+") + ` (${minCost.toLocaleString()}฿)`;

  return {
    totalPrice: minCost,
    totalVp: bestV,
    leftoverVp: bestV - targetVp,
    comboText,
    shortTag,
    comboList
  };
};

// Render Daily 4 Skins
function renderDailyShop(skins) {
  const container = document.getElementById('dailySkinsGrid');
  if (!container) return;
  container.innerHTML = '';

  const validSkins = (skins || []).filter(s => {
    const name = (s.name || '').trim().toLowerCase();
    if (!name || name === 'valorant weapon skin' || name.includes('spray') || name.includes('aeris spray')) return false;
    return true;
  });

  if (validSkins.length === 0) {
    container.innerHTML = '<div class="empty-msg">ไม่พบสกินประจำวัน กรุณาลองรีเฟรชใหม่อีกครั้ง</div>';
    return;
  }

  validSkins.forEach((skin, idx) => {
    const skinPrice = skin.price || 0;
    const opt = window.calculateOptimalOverTopup(skinPrice);
    const tierColor = skin.tier?.highlightColor || '#ff4655';
    const card = document.createElement('div');
    card.className = 'skin-card';
    card.style.setProperty('--card-tier-color', tierColor);
    card.style.setProperty('--card-tier-glow', tierColor + '40');
    card.style.animationDelay = (idx * 0.08) + 's';

    const chromasCount = skin.chromas ? skin.chromas.length : 1;
    const hasVideo = skin.hasVideo || (skin.levels && skin.levels.some(l => l.streamedVideo));
    const safeIcon = skin.displayIcon || 'https://media.valorant-api.com/weapons/skins/default/displayicon.png';
    const starred = isWishlisted(skin.uuid);

    card.innerHTML = `
      <button class="btn-wishlist-star ${starred ? 'starred' : ''}" data-uuid="${skin.uuid.toLowerCase()}" title="${starred ? 'อยู่ในรายการที่อยากได้' : 'เพิ่มในรายการที่อยากได้'}">
        ${starred ? `<svg viewBox="0 0 24 24" width="15" height="15" fill="var(--val-gold)" stroke="var(--val-gold)" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` : `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`}
      </button>

      <div class="skin-card-header">
        <div class="skin-tier-info">
          ${skin.tier?.displayIcon ? `<img src="${skin.tier.displayIcon}" alt="" class="skin-tier-icon">` : ''}
          <span class="skin-tier-name">${skin.tier?.name || 'Edition'}</span>
        </div>
        <div class="skin-features-badge">
          ${chromasCount > 1 ? `<span class="badge-feat">${chromasCount} สี</span>` : ''}
          ${hasVideo ? '<span class="badge-feat"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:middle; margin-right:3px;"><polygon points="5 3 19 12 5 21 5 3"/></svg> วิดีโอ VFX</span>' : ''}
        </div>
      </div>

      <div class="skin-image-box">
        <img src="${safeIcon}" alt="${skin.name}" loading="lazy" onerror="this.onerror=null;this.src=window.generateItemFallbackSvg('${(skin.name || 'Weapon').replace(/'/g, "\\'")}', 'Weapon Skin')">
      </div>

      <div class="skin-card-footer">
        ${starred ? '<div class="wishlist-match-badge"><svg viewBox="0 0 24 24" width="12" height="12" fill="var(--val-gold)" style="vertical-align:middle; margin-right:4px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> สกินในรายการที่คุณอยากได้</div>' : ''}
        <div class="skin-name" title="${skin.name}">${skin.name}</div>
        <div class="skin-meta-row">
          <div class="skin-price-tag">
            <img src="https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/largeicon.png" alt="VP" class="currency-icon">
            <span>${(skin.price || 0).toLocaleString()}</span>
            <span class="skin-thb-quick-tag" title="แพ็กเกจ OverTopup แนะนำ: ${opt.comboText}" data-vp="${skinPrice}">${opt.shortTag || ("~" + Math.round(skinPrice * 0.238) + " ฿")}</span>
          </div>
          <button class="btn btn-primary btn-sm btn-inspect"><span>ดูเอฟเฟกต์ & สี</span><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>
      </div>
    `;

    card.addEventListener('mouseenter', () => playTacticalAudio('hover'));
    card.querySelector('.btn-wishlist-star')?.addEventListener('click', (e) => toggleWishlist(skin.uuid, e));
    card.addEventListener('click', () => openSkinModal(skin));
    container.appendChild(card);
  });
}

// Universal Item Fallback SVG Generator
window.generateItemFallbackSvg = function(itemName, itemType) {
  const safeName = (itemName || 'ITEM').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const typeStr = ((itemType || '') + ' ' + (itemName || '')).toLowerCase();
  
  if (typeStr.includes('spray')) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <defs>
        <linearGradient id="spBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#181424"/>
          <stop offset="100%" stop-color="#0E0C16"/>
        </linearGradient>
        <linearGradient id="spNeon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF4655"/>
          <stop offset="50%" stop-color="#D946EF"/>
          <stop offset="100%" stop-color="#00F5D4"/>
        </linearGradient>
        <radialGradient id="spGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#D946EF" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#D946EF" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="300" height="300" rx="16" fill="url(#spBg)" stroke="rgba(217,70,239,0.4)" stroke-width="2"/>
      <circle cx="150" cy="130" r="100" fill="url(#spGlow)"/>
      <circle cx="150" cy="120" r="68" fill="none" stroke="url(#spNeon)" stroke-width="2.5" stroke-dasharray="6 6"/>
      <g transform="translate(115, 68)" fill="none" stroke="url(#spNeon)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M25 5 L45 5 L45 15 L25 15 Z" fill="rgba(217,70,239,0.25)"/>
        <path d="M15 15 L55 15 L55 90 C55 98 15 98 15 90 Z" fill="rgba(255,70,85,0.15)"/>
        <line x1="35" y1="5" x2="35" y2="0"/>
        <path d="M35 0 C25 -5 15 -10 5 -5" stroke="#00F5D4" stroke-width="2" stroke-dasharray="2 3"/>
        <circle cx="35" cy="50" r="14" fill="url(#spNeon)"/>
      </g>
      <rect x="20" y="215" width="260" height="60" rx="8" fill="rgba(0,0,0,0.65)" stroke="rgba(255,255,255,0.12)"/>
      <text x="150" y="238" dominant-baseline="middle" text-anchor="middle" fill="#00F5D4" font-family="sans-serif" font-size="10.5" font-weight="bold" letter-spacing="2">VALORANT SPRAY</text>
      <text x="150" y="258" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="13.5" font-weight="bold">${safeName}</text>
    </svg>`);
  }
  
  if (typeStr.includes('buddy')) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <defs>
        <linearGradient id="bdBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1A202C"/>
          <stop offset="100%" stop-color="#0F131A"/>
        </linearGradient>
        <linearGradient id="bdGold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#F5D36C"/>
          <stop offset="100%" stop-color="#FF9F1C"/>
        </linearGradient>
      </defs>
      <rect width="300" height="300" rx="16" fill="url(#bdBg)" stroke="rgba(245,211,108,0.3)" stroke-width="2"/>
      <circle cx="150" cy="125" r="70" fill="none" stroke="url(#bdGold)" stroke-width="2" stroke-dasharray="4 4"/>
      <g transform="translate(125, 75)" fill="none" stroke="url(#bdGold)" stroke-width="2.5">
        <circle cx="25" cy="20" r="14"/>
        <path d="M25 34 L25 55"/>
        <path d="M10 55 L40 55 L35 90 L15 90 Z" fill="rgba(245,211,108,0.2)"/>
      </g>
      <rect x="20" y="215" width="260" height="60" rx="8" fill="rgba(0,0,0,0.65)" stroke="rgba(255,255,255,0.12)"/>
      <text x="150" y="238" dominant-baseline="middle" text-anchor="middle" fill="#F5D36C" font-family="sans-serif" font-size="10.5" font-weight="bold" letter-spacing="2">GUN BUDDY</text>
      <text x="150" y="258" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="13.5" font-weight="bold">${safeName}</text>
    </svg>`);
  }

  if (typeStr.includes('card')) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="340" viewBox="0 0 240 340">
      <defs>
        <linearGradient id="cdBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#141926"/>
          <stop offset="100%" stop-color="#0B0E17"/>
        </linearGradient>
      </defs>
      <rect width="240" height="340" rx="12" fill="url(#cdBg)" stroke="rgba(0,245,212,0.3)" stroke-width="2"/>
      <rect x="15" y="15" width="210" height="230" rx="8" fill="#182032" stroke="rgba(255,255,255,0.08)"/>
      <path d="M120 70 L170 150 L70 150 Z" fill="rgba(0,245,212,0.15)" stroke="#00F5D4" stroke-width="2"/>
      <circle cx="120" cy="120" r="18" fill="#00F5D4"/>
      <rect x="15" y="260" width="210" height="65" rx="6" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.1)"/>
      <text x="120" y="282" dominant-baseline="middle" text-anchor="middle" fill="#00F5D4" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1.5">PLAYER CARD</text>
      <text x="120" y="304" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="bold">${safeName}</text>
    </svg>`);
  }

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180">
    <defs>
      <linearGradient id="wpnBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1b202e"/>
        <stop offset="100%" stop-color="#0f131a"/>
      </linearGradient>
    </defs>
    <rect width="300" height="180" rx="12" fill="url(#wpnBg)" stroke="rgba(255,70,85,0.3)" stroke-width="2"/>
    <path d="M60 90 L240 90 M200 70 L240 90 L200 110" stroke="#FF4655" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.6"/>
    <text x="150" y="145" dominant-baseline="middle" text-anchor="middle" fill="#EAEAEA" font-family="sans-serif" font-size="13" font-weight="bold">${safeName}</text>
  </svg>`);
};

// Bundle Image Error Fallback Handler
window.handleBundleImgError = function(img, itemType, uuid, itemName) {
  if (!img) return;
  const currentStep = parseInt(img.dataset.errStep || '0', 10);
  img.dataset.errStep = (currentStep + 1).toString();

  const typeStr = ((itemType || '') + ' ' + (itemName || '')).toLowerCase();
  let fallbackUrls = [];

  if (typeStr.includes('spray')) {
    fallbackUrls = [
      'https://media.valorant-api.com/sprays/' + uuid + '/fulltransparenticon.png',
      'https://media.valorant-api.com/sprays/' + uuid + '/displayicon.png',
      'https://media.valorant-api.com/sprays/' + uuid + '/animationpng.png',
      'https://media.valorant-api.com/sprays/' + uuid + '/fullicon.png'
    ];
  } else if (typeStr.includes('buddy')) {
    fallbackUrls = [
      'https://media.valorant-api.com/buddylevels/' + uuid + '/displayicon.png',
      'https://media.valorant-api.com/buddies/' + uuid + '/displayicon.png'
    ];
  } else if (typeStr.includes('card')) {
    fallbackUrls = [
      'https://media.valorant-api.com/playercards/' + uuid + '/largeart.png',
      'https://media.valorant-api.com/playercards/' + uuid + '/displayicon.png',
      'https://media.valorant-api.com/playercards/' + uuid + '/smallart.png'
    ];
  } else {
    fallbackUrls = [
      'https://media.valorant-api.com/weaponskinlevels/' + uuid + '/displayicon.png',
      'https://media.valorant-api.com/weaponskinchromas/' + uuid + '/fullrender.png',
      'https://media.valorant-api.com/weaponskinchromas/' + uuid + '/displayicon.png',
      'https://media.valorant-api.com/weaponskins/' + uuid + '/displayicon.png'
    ];
  }

  if (currentStep < fallbackUrls.length) {
    img.src = fallbackUrls[currentStep];
  } else {
    img.onerror = null;
    img.src = window.generateItemFallbackSvg(itemName || 'Valorant Item', itemType || 'Accessory');
  }
};

// Render Bundles
function renderBundles(bundles) {
  const container = document.getElementById('bundleContent');
  const bundleContainerEl = document.getElementById('bundleContainer');
  if (!container || !bundleContainerEl) return;
  container.innerHTML = '';

  if (!bundles || bundles.length === 0) {
    bundleContainerEl.classList.add('hidden');
    return;
  }

  bundleContainerEl.classList.remove('hidden');
  const b = bundles[0];
  bundleRemaining = b.remainingDurationInSeconds || 0;

  const bundlePrice = b.totalDiscountedCost || b.totalBaseCost || b.price || 0;
  const overEst = Math.round(bundlePrice * 0.238);
  const officialEst = Math.round(bundlePrice * 0.292);
  const savings = Math.max(0, officialEst - overEst);

  const heroImage = b.displayIcon || b.verticalPromoImage || (b.items && b.items.find(i => i.displayIcon)?.displayIcon) || 'https://media.valorant-api.com/weapons/skins/default/displayicon.png';

  const heroDiv = document.createElement('div');
  heroDiv.className = 'bundle-hero';
  heroDiv.style.cursor = 'pointer';
  heroDiv.title = 'คลิกเพื่อเปิดร้านค้าชุดรวมสกินเด่น (Full Bundle Inspector)';
  heroDiv.addEventListener('click', (e) => {
    if (e.target.closest('.btn-bundle-calc')) return;
    window.openBundleModal(b);
  });
  heroDiv.innerHTML = `
    <img src="${heroImage}" alt="${b.name}">
    <div class="bundle-overlay">
      <div class="bundle-info">
        <h3>${b.name}</h3>
        <p>${b.subName || 'Featured Valorant Collection'}</p>
      </div>
      <div class="bundle-pricing-action-box">
        <div class="skin-price-tag" style="font-size: 20px;">
          <img src="https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/largeicon.png" alt="VP" class="currency-icon" style="width:22px;height:22px;">
          <span>${bundlePrice.toLocaleString()} VP</span>
        </div>
        ${bundlePrice > 0 ? `
          <div class="bundle-overtopup-badge" title="ราคาเติมเงินจริงบน OverTopup">
            <span>เติม OverTopup: <strong>~${overEst.toLocaleString()} ฿</strong></span>
            ${savings > 0 ? `<span class="bundle-savings-tag">ประหยัด ${savings.toLocaleString()} ฿</span>` : ''}
          </div>
          <button class="btn btn-bundle-calc" data-vp="${bundlePrice}" title="เปิดระบบคำนวณแพ็กเกจ OverTopup สำหรับบันเดิลนี้">
            <span>เทียบราคา OverTopup</span>
          </button>
        ` : ''}
      </div>
    </div>
  `;
  container.appendChild(heroDiv);

  if (b.items && b.items.length > 0) {
    const itemsRow = document.createElement('div');
    itemsRow.className = 'bundle-items-row';

    const validItems = b.items.filter(item => {
      const name = (item.name || '').trim().toLowerCase();
      const type = (item.itemType || '').toLowerCase();
      if (!name || name === 'valorant item' || name === 'bundle item') return false;
      if (name.includes('aeris spray') || (name.includes('aeris') && type.includes('spray'))) return false;
      return true;
    });

    validItems.forEach(item => {
      const s = item.skin;
      const isSkin = !!(item.isWeaponSkin || (s && (s.chromas || s.levels || s.weaponType)));
      const itemName = item.name || s?.name || 'Bundle Item';
      const itemIcon = item.displayIcon || s?.displayIcon || (s?.chromas && s.chromas[0]?.displayIcon) || ('https://media.valorant-api.com/weaponskinlevels/' + item.uuid + '/displayicon.png');
      const itemBadge = isSkin ? (item.itemType || 'สกินปืน') : (item.itemType || 'ไอเทม');
      const actionText = isSkin ? '<span class="bundle-inspect-hint">กดดูเอฟเฟกต์ & สี</span>' : '<span class="bundle-inspect-hint">แตะเพื่อดูรูปภาพ HD</span>';
      const itemPrice = item.discountedPrice || item.basePrice || 0;
      const opt = window.calculateOptimalOverTopup(itemPrice);

      const miniItem = document.createElement('div');
      miniItem.className = 'bundle-mini-item';
      miniItem.style.cursor = 'pointer';
      miniItem.innerHTML = `
        <div class="bundle-mini-img-wrap">
          <img src="${itemIcon}" alt="${itemName}" loading="lazy" data-err-step="0" onerror="window.handleBundleImgError(this, '${(item.itemType || 'Item').replace(/'/g, "\\'")}', '${item.uuid}', '${(itemName).replace(/'/g, "\\'")}')">
        </div>
        <div class="bundle-mini-name" title="${itemName}">${itemName}</div>
        <div class="bundle-mini-type">${itemBadge}</div>
        ${actionText}
        <div class="skin-price-tag" style="justify-content:center; font-size:12.5px; margin-top:6px; flex-wrap:wrap; gap:3px;">
          <img src="https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/largeicon.png" alt="VP" class="currency-icon">
          <span>${itemPrice.toLocaleString()}</span>
          ${itemPrice > 0 ? `
            <span class="skin-thb-quick-tag" title="แพ็กเกจ OverTopup แนะนำ: ${opt.comboText}" data-vp="${itemPrice}">${opt.shortTag || ("~" + Math.round(itemPrice * 0.238) + " ฿")}</span>
          ` : ''}
        </div>
      `;

      miniItem.addEventListener('click', () => {
        if (s && (s.chromas || s.levels)) {
          openSkinModal(s);
        } else if (item.isWeaponSkin || item.skin) {
          openSkinByUuid(item.uuid, item.skin || item);
        } else {
          openSkinByUuid(item.uuid, item);
        }
      });

      itemsRow.appendChild(miniItem);
    });

    container.appendChild(itemsRow);
  }
}

// ==========================================================
// FEATURED BUNDLE INSPECTOR MODAL MODULE
// ==========================================================
const bundleModal = document.getElementById("bundleModal");
const btnCloseBundleModal = document.getElementById("btnCloseBundleModal");

function closeBundleModalHandler() {
  playTacticalAudio("close");
  bundleModal?.classList.add("hidden");
}

btnCloseBundleModal?.addEventListener("click", closeBundleModalHandler);
bundleModal?.addEventListener("click", (e) => {
  if (e.target === bundleModal) closeBundleModalHandler();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && bundleModal && !bundleModal.classList.contains("hidden")) {
    closeBundleModalHandler();
  }
});

window.openBundleModal = function(b) {
  if (!b) return;
  playTacticalAudio("open");

  const modal = document.getElementById("bundleModal");
  if (!modal) return;

  const bundleName = b.name || "Featured Collection";
  const bundlePrice = b.totalDiscountedCost || b.totalBaseCost || b.price || 0;
  const heroImage = b.displayIcon || b.verticalPromoImage || (b.items && b.items.find(i => i.displayIcon)?.displayIcon) || "https://media.valorant-api.com/weapons/skins/default/displayicon.png";

  const nameEl = document.getElementById("modalBundleName");
  if (nameEl) nameEl.textContent = bundleName;

  const priceValEl = document.getElementById("modalBundlePriceVal");
  if (priceValEl) priceValEl.textContent = bundlePrice.toLocaleString();

  const heroImgEl = document.getElementById("modalBundleHeroImg");
  if (heroImgEl) heroImgEl.src = heroImage;

  const overlayTitleEl = document.getElementById("modalBundleOverlayTitle");
  if (overlayTitleEl) overlayTitleEl.textContent = bundleName;

  const overlaySubEl = document.getElementById("modalBundleOverlaySub");
  if (overlaySubEl) overlaySubEl.textContent = b.subName || "ชุดรวมสกินและไอเทมพิเศษประจำแพตช์ (คลิกปืนแต่ละกระบอกเพื่อดู Finisher และสี Chromas)";

  // Update timer in modal
  const timerDigitsEl = document.getElementById("modalBundleTimerDigits");
  if (timerDigitsEl) {
    timerDigitsEl.textContent = document.getElementById("bundleTimer")?.textContent || "--:--:--";
  }

  // OverTopup bundle calculation
  const opt = window.calculateOptimalOverTopup(bundlePrice);
  const officialEst = Math.round(bundlePrice * 0.292);
  const savings = Math.max(0, officialEst - opt.totalPrice);

  const comboEl = document.getElementById("modalBundleOverTopupCombo");
  if (comboEl) comboEl.textContent = opt.comboText || `${opt.totalPrice.toLocaleString()} ฿`;

  const vpGainEl = document.getElementById("modalBundleVpGain");
  if (vpGainEl) vpGainEl.textContent = `ได้รับ ${opt.totalVp.toLocaleString()} VP`;

  const vpLeftoverEl = document.getElementById("modalBundleVpLeftover");
  if (vpLeftoverEl) {
    if (opt.leftoverVp > 0) {
      vpLeftoverEl.textContent = `คงเหลือ +${opt.leftoverVp.toLocaleString()} VP ในไอดี`;
      vpLeftoverEl.style.display = "inline-flex";
    } else {
      vpLeftoverEl.style.display = "none";
    }
  }

  const savingsTagEl = document.getElementById("modalBundleSavingsTag");
  if (savingsTagEl) {
    savingsTagEl.textContent = savings > 0 ? `ประหยัดได้ ~${savings.toLocaleString()} ฿ จากเติมในเกม` : "เรทคุ้มกว่าเติมตรงในเกม";
  }

  const btnBundleCompare = document.getElementById("btnBundleInspectCompareStores");
  if (btnBundleCompare) {
    btnBundleCompare.onclick = (e) => {
      e.stopPropagation();
      window.openVpCompareModal(bundlePrice);
    };
  }

  // Populate bundle items in Daily-Shop Card style!
  const grid = document.getElementById("modalBundleItemsGrid");
  if (grid) {
    grid.innerHTML = "";
    const items = (b.items || []).filter(item => {
      const name = (item.name || "").trim().toLowerCase();
      const type = (item.itemType || "").toLowerCase();
      if (!name || name === "valorant item" || name === "bundle item") return false;
      if (name.includes("aeris spray") || (name.includes("aeris") && type.includes("spray"))) return false;
      return true;
    });

    items.forEach((item, idx) => {
      const s = item.skin;
      const isSkin = !!(item.isWeaponSkin || (s && (s.chromas || s.levels || s.weaponType)));
      const itemName = item.name || s?.name || "Bundle Item";
      const itemIcon = item.displayIcon || s?.displayIcon || (s?.chromas && s.chromas[0]?.displayIcon) || ("https://media.valorant-api.com/weaponskinlevels/" + item.uuid + "/displayicon.png");
      const tierColor = s?.tier?.highlightColor || "#00F5D4";
      const chromasCount = s?.chromas ? s.chromas.length : 1;
      const hasVideo = s?.hasVideo || (s?.levels && s.levels.some(l => l.streamedVideo));
      const itemPrice = item.discountedPrice || item.basePrice || 0;
      const itemOpt = window.calculateOptimalOverTopup(itemPrice);

      const card = document.createElement("div");
      card.className = "skin-card";
      card.style.setProperty("--card-tier-color", tierColor);
      card.style.setProperty("--card-tier-glow", tierColor + "40");
      card.style.animationDelay = (idx * 0.05) + "s";

      card.innerHTML = `
        <div class="skin-card-header">
          <div class="skin-tier-info">
            ${s?.tier?.displayIcon ? `<img src="${s.tier.displayIcon}" alt="" class="skin-tier-icon">` : ""}
            <span class="skin-tier-name">${s?.tier?.name || item.itemType || "Edition"}</span>
          </div>
          <div class="skin-features-badge">
            ${chromasCount > 1 ? `<span class="badge-feat">${chromasCount} สี</span>` : ""}
            ${hasVideo ? `<span class="badge-feat"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:middle; margin-right:3px;"><polygon points="5 3 19 12 5 21 5 3"/></svg> วิดีโอ VFX</span>` : ""}
          </div>
        </div>

        <div class="skin-image-box">
          <img src="${itemIcon}" alt="${itemName}" loading="lazy" data-err-step="0" onerror="window.handleBundleImgError(this, '${(item.itemType || "Item").replace(/'/g, "\\'")}', '${item.uuid}', '${(itemName).replace(/'/g, "\\'")}')">
        </div>

        <div class="skin-card-footer">
          <div class="skin-name" title="${itemName}">${itemName}</div>
          <div class="skin-meta-row">
            <div class="skin-price-tag">
              <img src="https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/largeicon.png" alt="VP" class="currency-icon">
              <span>${itemPrice.toLocaleString()}</span>
              ${itemPrice > 0 ? `
                <span class="skin-thb-quick-tag" title="แพ็กเกจ OverTopup แนะนำ: ${itemOpt.comboText}" data-vp="${itemPrice}">${itemOpt.shortTag}</span>
              ` : ""}
            </div>
            <button class="btn btn-primary btn-sm btn-inspect">
              <span>ดูเอฟเฟกต์ & สี</span>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      `;

      card.addEventListener("mouseenter", () => playTacticalAudio("hover"));
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        closeBundleModalHandler();
        setTimeout(() => {
          if (s && (s.chromas || s.levels)) {
            openSkinModal(s);
          } else if (item.isWeaponSkin || item.skin) {
            openSkinByUuid(item.uuid, item.skin || item);
          } else {
            openSkinByUuid(item.uuid, item);
          }
        }, 150);
      });

      grid.appendChild(card);
    });
  }

  modal.classList.remove("hidden");
};

// Render Night Market
function renderNightMarket(nm) {
  const container = document.getElementById('nightMarketContainer');
  const grid = document.getElementById('nightMarketGrid');
  if (!container || !grid) return;

  if (!nm || !nm.offers || nm.offers.length === 0) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  nmRemaining = nm.remainingDurationInSeconds || 0;
  grid.innerHTML = '';

  nm.offers.forEach((offer, idx) => {
    const card = document.createElement('div');
    card.className = 'skin-card nm-card';
    card.style.setProperty('--card-tier-color', offer.tier?.highlightColor || '#EBC971');
    card.style.animationDelay = (idx * 0.08) + 's';
    const safeIcon = offer.displayIcon || 'https://media.valorant-api.com/weapons/skins/default/displayicon.png';
    const starred = isWishlisted(offer.uuid);
    const skinPrice = offer.discountedPrice || 0;
    const opt = window.calculateOptimalOverTopup(skinPrice);

    card.innerHTML = `
      <button class="btn-wishlist-star ${starred ? 'starred' : ''}" data-uuid="${offer.uuid.toLowerCase()}" title="${starred ? 'อยู่ในรายการที่อยากได้' : 'เพิ่มในรายการที่อยากได้'}">
        ${starred ? `<svg viewBox="0 0 24 24" width="15" height="15" fill="var(--val-gold)" stroke="var(--val-gold)" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` : `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`}
      </button>

      <div class="skin-card-header">
        <div class="skin-tier-info">
          <span class="nm-discount-badge">-${offer.discountPercent}%</span>
        </div>
        <span class="skin-tier-name" style="color:var(--val-gold)">NIGHT MARKET</span>
      </div>

      <div class="skin-image-box">
        <img src="${safeIcon}" alt="${offer.name}" loading="lazy" onerror="this.onerror=null;this.src=window.generateItemFallbackSvg('${(offer.name || 'Weapon').replace(/'/g, "\\'")}', 'Weapon Skin')">
      </div>

      <div class="skin-card-footer">
        ${starred ? '<div class="wishlist-match-badge"><svg viewBox="0 0 24 24" width="12" height="12" fill="var(--val-gold)" style="vertical-align:middle; margin-right:4px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> สกินในรายการที่คุณอยากได้</div>' : ''}
        <div class="skin-name">${offer.name}</div>
        <div class="skin-meta-row">
          <div class="skin-price-tag">
            <span class="original-price">${offer.originalPrice.toLocaleString()}</span>
            <img src="https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/largeicon.png" alt="VP" class="currency-icon">
            <span style="color:var(--val-gold)">${offer.discountedPrice.toLocaleString()}</span>
            <span class="skin-thb-quick-tag" title="แพ็กเกจ OverTopup แนะนำ: ${opt.comboText}" data-vp="${skinPrice}">${opt.shortTag || ("~" + Math.round(skinPrice * 0.238) + " ฿")}</span>
          </div>
          <button class="btn btn-primary btn-sm btn-inspect"><span>ดูสกิน & สี</span><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>
      </div>
    `;

    card.addEventListener('mouseenter', () => playTacticalAudio('hover'));
    card.querySelector('.btn-wishlist-star')?.addEventListener('click', (e) => toggleWishlist(offer.uuid, e));
    card.addEventListener('click', () => openSkinModal(offer));
    grid.appendChild(card);
  });
}

// Global Skin Lookup helper
window.openSkinByUuid = async function(uuid) {
  try {
    const res = await apiFetch('/api/skin/' + uuid);
    const data = await res.json();
    if (data.ok && data.skin) {
      openSkinModal(data.skin);
    }
  } catch (e) {
    console.error(e);
  }
};

// Open Interactive Skin / Item Modal
function openSkinModal(skin) {
  currentInspectedSkin = skin;
  playTacticalAudio('inspect');
  
  const hint = document.getElementById('turntableHint');
  if (hint) hint.style.opacity = '1';
  
  // Header
  const skinNameEl = document.getElementById('modalSkinName');
  if (skinNameEl) skinNameEl.textContent = skin.name || 'Valorant Item';
  
  const tierNameEl = document.getElementById('modalTierName');
  if (tierNameEl) tierNameEl.textContent = skin.tier?.name || skin.itemType || 'Edition';
  
  const tierIconEl = document.getElementById('modalTierIcon');
  if (tierIconEl) {
    if (skin.tier?.displayIcon) {
      tierIconEl.src = skin.tier.displayIcon;
      tierIconEl.classList.remove('hidden');
    } else {
      tierIconEl.classList.add('hidden');
    }
  }

  // Price
  const priceValEl = document.getElementById('modalPriceVal');
  const modalSkinPrice = document.getElementById('modalSkinPrice');
  const displayPrice = skin.discountedPrice || skin.price || skin.basePrice || skin.cost;
  if (displayPrice && priceValEl && modalSkinPrice) {
    priceValEl.textContent = displayPrice.toLocaleString();
    modalSkinPrice.classList.remove('hidden');
  } else if (modalSkinPrice) {
    modalSkinPrice.classList.add('hidden');
  }

  // Update Real Money Compare Quick Bar in Skin Modal
  const compareBar = document.getElementById('modalSkinPriceCompareBar');
  const thbEstEl = document.getElementById('modalSkinThbEst');
  const cheapestStoreEl = document.getElementById('modalSkinCheapestStore');
  const btnInspectCompare = document.getElementById('btnInspectCompareStores');

  if (displayPrice && displayPrice > 0 && compareBar) {
    const opt = window.calculateOptimalOverTopup(displayPrice);
    const inGameEstimate = Math.round(displayPrice * 0.300);
    const savings = Math.max(0, inGameEstimate - opt.totalPrice);

    const comboBadgeEl = document.getElementById("modalSkinOverTopupCombo");
    const vpGainEl = document.getElementById("modalSkinVpGain");
    const vpLeftoverEl = document.getElementById("modalSkinVpLeftover");
    const savingsEl = document.getElementById("modalSkinSavingsTag");

    if (comboBadgeEl) comboBadgeEl.textContent = opt.comboText || `${opt.totalPrice.toLocaleString()} ฿`;
    if (vpGainEl) vpGainEl.textContent = `ได้รับ ${opt.totalVp.toLocaleString()} VP`;
    if (vpLeftoverEl) {
      if (opt.leftoverVp > 0) {
        vpLeftoverEl.textContent = `คงเหลือ +${opt.leftoverVp.toLocaleString()} VP ในไอดี`;
        vpLeftoverEl.style.display = "inline-flex";
      } else {
        vpLeftoverEl.style.display = "none";
      }
    }
    if (savingsEl) {
      savingsEl.textContent = savings > 0 ? `ประหยัดได้ ~${savings.toLocaleString()} ฿` : "เรทคุ้มกว่าเติมตรงในเกม";
    }

    compareBar.classList.remove("hidden");
    if (btnInspectCompare) {
      btnInspectCompare.onclick = (e) => {
        e.stopPropagation();
        window.openVpCompareModal(displayPrice);
      };
    }
  } else if (compareBar) {
    compareBar.classList.add("hidden");
  }

  // Default In-Game HD Weapon Artwork Render
  const imgEl = document.getElementById('modalSkinImg');
  const defaultImg = skin.largeArt || skin.displayIcon || skin.chromas?.[0]?.fullRender || skin.chromas?.[0]?.displayIcon || window.generateItemFallbackSvg(skin.name, skin.itemType);
  if (imgEl) {
    imgEl.src = defaultImg;
    imgEl.onerror = function() {
      imgEl.onerror = null;
      imgEl.src = window.generateItemFallbackSvg(skin.name, skin.itemType || 'Accessory');
    };
  }

  // Set spotlight color matching skin tier
  const spotlight = document.getElementById('inspectSpotlight');
  if (spotlight && skin.tier?.highlightColor) {
    spotlight.style.background = `radial-gradient(circle, ${skin.tier.highlightColor}28 0%, transparent 70%)`;
  }

  // Render Chromas
  renderModalChromas(skin.chromas || []);

  // Render Levels & Video
  renderModalLevels(skin.levels || []);

  // Default view
  switchMediaView('image');

  // Show Modal
  skinModal?.classList.remove('hidden');
  resetInspectTransform();
}

// Render Chromas in Modal
function renderModalChromas(chromas) {
  const container = document.getElementById('chromasContainer');
  const label = document.getElementById('selectedChromaName');
  const selectorSection = container?.closest('.inspector-control-section, .selector-section');
  if (!container || !label) return;
  container.innerHTML = '';

  if (!chromas || chromas.length <= 1) {
    if (selectorSection) {
      selectorSection.style.display = (chromas && chromas.length === 1) ? 'block' : 'none';
    }
    if (chromas && chromas.length === 1) {
      label.textContent = chromas[0].name || chromas[0].colorName || 'Base';
      container.innerHTML = '<p style="font-size:12px; color:var(--val-gray); padding: 4px 0;">สีดั้งเดิม (Base / Original)</p>';
    }
    return;
  }

  if (selectorSection) selectorSection.style.display = 'block';
  label.textContent = chromas[0].name || chromas[0].colorName || 'Base';

  chromas.forEach((chroma, idx) => {
    const pill = document.createElement('div');
    pill.className = 'chroma-pill ' + (idx === 0 ? 'active' : '');
    
    let swatchHtml = '';
    if (chroma.swatch) {
      swatchHtml = '<img src="' + chroma.swatch + '" alt="" class="chroma-swatch-img" onerror="this.style.display=\'none\'">';
    } else {
      swatchHtml = '<span style="width:18px;height:18px;border-radius:50%;background:#ff4655;display:inline-block;"></span>';
    }

    pill.innerHTML = swatchHtml + '<span>' + (chroma.colorName || chroma.name) + '</span>';

    pill.addEventListener('click', () => {
      document.querySelectorAll('.chroma-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      label.textContent = chroma.name || chroma.colorName;
      playTacticalAudio('chroma');

      const newImg = chroma.fullRender || chroma.displayIcon || currentInspectedSkin?.displayIcon;
      const modalSkinImg = document.getElementById('modalSkinImg');
      if (modalSkinImg) {
        modalSkinImg.style.opacity = '0.5';
        modalSkinImg.src = newImg;
        setTimeout(() => { modalSkinImg.style.opacity = '1'; }, 100);
      }

      if (chroma.streamedVideo) {
        setModalVideo(chroma.streamedVideo);
        switchMediaView('video');
      } else {
        switchMediaView('image');
      }
    });

    container.appendChild(pill);
  });
}

// Render Levels in Modal
function renderModalLevels(levels) {
  const container = document.getElementById('levelsContainer');
  const label = document.getElementById('selectedLevelName');
  const btnVid = document.getElementById('btnShowVideo');
  const selectorSection = container?.closest('.inspector-control-section, .selector-section');
  if (!container || !label) return;
  container.innerHTML = '';

  const hasAnyVideo = (levels && levels.some(l => l.streamedVideo)) || (currentInspectedSkin?.chromas && currentInspectedSkin.chromas.some(c => c.streamedVideo));

  if (btnVid) {
    if (hasAnyVideo) {
      btnVid.disabled = false;
      btnVid.title = 'คลิกเพื่อดูวิดีโอเอฟเฟกต์ / Finisher';
      btnVid.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="5 3 19 12 5 21 5 3"/></svg> <span>วิดีโอเอฟเฟกต์ (VFX & Finisher)</span>`;
    } else {
      btnVid.disabled = true;
      btnVid.title = 'สกินนี้ไม่มีคลิปวิดีโอจากระบบ';
      btnVid.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="5 3 19 12 5 21 5 3"/></svg> <span>วิดีโอเอฟเฟกต์ (VFX & Finisher)</span>`;
    }
  }

  if (!levels || levels.length === 0) {
    if (selectorSection) selectorSection.style.display = 'none';
    label.textContent = 'Standard';
    return;
  }

  if (selectorSection) selectorSection.style.display = 'block';
  label.textContent = levels[0].levelItem || 'Level 1';

  // Set default video to highest level with video
  const videoLevel = levels.slice().reverse().find(l => l.streamedVideo);
  if (videoLevel) {
    setModalVideo(videoLevel.streamedVideo);
  }

  levels.forEach((lvl, idx) => {
    const card = document.createElement('div');
    card.className = 'level-card ' + (idx === 0 ? 'active' : '') + (lvl.streamedVideo ? ' has-video' : '');

    card.innerHTML = '<div class="lvl-num">LVL ' + (lvl.levelNum || idx + 1) + '</div>' +
      '<div class="lvl-item">' + (lvl.levelItem || 'Animation / VFX') + '</div>';

    card.addEventListener('click', () => {
      document.querySelectorAll('.level-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      label.textContent = lvl.levelItem || ('Level ' + (lvl.levelNum || idx + 1));
      playTacticalAudio('level');

      if (lvl.streamedVideo) {
        setModalVideo(lvl.streamedVideo);
        switchMediaView('video');
      }
    });

    container.appendChild(card);
  });
}

function setModalVideo(url) {
  const player = document.getElementById('modalVideoPlayer');
  if (!player) return;
  if (player.src !== url) {
    player.src = url;
    player.load();
  }
}

function switchMediaView(view) {
  const imgBox = document.getElementById('imagePreviewBox');
  const vidBox = document.getElementById('videoPreviewBox');
  const btnImg = document.getElementById('btnShowImage');
  const btnVid = document.getElementById('btnShowVideo');
  const player = document.getElementById('modalVideoPlayer');
  const btnSound = document.getElementById('btnToggleSound');
  const btnPlay = document.getElementById('btnTogglePlay');

  if (view === 'video') {
    if (!player || !player.src) return;
    imgBox?.classList.add('hidden');
    vidBox?.classList.remove('hidden');
    btnImg?.classList.remove('active');
    btnVid?.classList.add('active');

    player.muted = false;
    if (btnSound) btnSound.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> <span>เปิดเสียง</span>`;
    if (btnPlay) btnPlay.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> <span>หยุด</span>`;

    const playPromise = player.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        player.muted = true;
        if (btnSound) btnSound.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg> <span>ปิดเสียง (แตะเพื่อเปิด)</span>`;
        player.play().catch(() => {});
      });
    }
  } else {
    vidBox?.classList.add('hidden');
    imgBox?.classList.remove('hidden');
    btnVid?.classList.remove('active');
    btnImg?.classList.add('active');
    if (player) player.pause();
  }
}

// Sound & Playback Controls in Modal
document.getElementById('btnToggleSound')?.addEventListener('click', () => {
  const player = document.getElementById('modalVideoPlayer');
  const btnSound = document.getElementById('btnToggleSound');
  if (!player || !btnSound) return;

  player.muted = !player.muted;
  btnSound.innerHTML = player.muted ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg> <span>ปิดเสียง (แตะเพื่อเปิด)</span>' : '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> <span>เปิดเสียง</span>';
});

document.getElementById('btnTogglePlay')?.addEventListener('click', () => {
  const player = document.getElementById('modalVideoPlayer');
  const btnPlay = document.getElementById('btnTogglePlay');
  if (!player || !btnPlay) return;

  if (player.paused) {
    player.play().catch(() => {});
    btnPlay.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> <span>หยุด</span>`;
  } else {
    player.pause();
    btnPlay.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="5 3 19 12 5 21 5 3"/></svg> <span>เล่น</span>`;
  }
});

document.getElementById('btnShowImage')?.addEventListener('click', () => switchMediaView('image'));
document.getElementById('btnShowVideo')?.addEventListener('click', () => switchMediaView('video'));

// Close Modal Handler
function closeModalHandler() {
  playTacticalAudio('close');
  stopAutoSpin360();
  skinModal?.classList.add('hidden');
  const player = document.getElementById('modalVideoPlayer');
  if (player) {
    player.pause();
    player.src = '';
  }
}

btnCloseModal?.addEventListener('click', closeModalHandler);

skinModal?.addEventListener('click', (e) => {
  if (e.target === skinModal) {
    closeModalHandler();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && skinModal && !skinModal.classList.contains('hidden')) {
    closeModalHandler();
  }
});

// Refresh Shop
btnRefreshShop?.addEventListener('click', async () => {
  playTacticalAudio('refresh');
  btnRefreshShop.style.transform = 'rotate(180deg)';
  await checkAuth();
  setTimeout(() => { btnRefreshShop.style.transform = 'none'; }, 300);
});

// Logout
btnLogout?.addEventListener('click', async () => {
  playTacticalAudio('close');
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {}
  try {
    localStorage.removeItem('val_sid');
    localStorage.removeItem('val_auth_pack');
    document.cookie = 'val_auth_pack=; Max-Age=0; path=/;';
    document.cookie = 'val_sid=; Max-Age=0; path=/;';
  } catch (e) {}
  showLoginView();
});

// Navigation Mode Switching (Unified Desktop & Mobile Bottom Nav)
const btnTabStore = document.getElementById('btnTabStore');
const btnTabInventory = document.getElementById('btnTabInventory');
const btnTabCrosshairs = document.getElementById('btnTabCrosshairs');
const btnTabCareer = document.getElementById('btnTabCareer');
const btnTabAgents = document.getElementById('btnTabAgents');
const btnTabCatalog = document.getElementById('btnTabCatalog');
const btnMobOpenVp = document.getElementById('btnMobOpenVp');

const inventorySection = document.getElementById('inventorySection');
const crosshairsSection = document.getElementById('crosshairsSection');

function triggerSectionAnimation(el) {
  if (!el) return;
  el.classList.remove('page-view-enter');
  void el.offsetWidth;
  el.classList.add('page-view-enter');
}

function switchAppMode(mode) {
  playTacticalAudio('tab');
  currentAppMode = mode;

  // Update top desktop tabs
  btnTabStore?.classList.toggle('active', mode === 'store');
  btnTabInventory?.classList.toggle('active', mode === 'inventory');
  btnTabCrosshairs?.classList.toggle('active', mode === 'crosshairs');
  btnTabCareer?.classList.toggle('active', mode === 'career');
  btnTabAgents?.classList.toggle('active', mode === 'agents');
  btnTabCatalog?.classList.toggle('active', mode === 'catalog');

  // Update mobile bottom nav items
  document.querySelectorAll('.mobile-nav-item[data-tab]').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === mode);
  });

  catalogSection?.classList.add('hidden');
  careerSection?.classList.add('hidden');
  agentsSection?.classList.add('hidden');
  storeSection?.classList.add('hidden');
  inventorySection?.classList.add('hidden');
  crosshairsSection?.classList.add('hidden');

  if (mode === 'store') {
    if (currentUser) {
      storeSection?.classList.remove('hidden');
      loginSection?.classList.add('hidden');
      triggerSectionAnimation(storeSection);
    } else {
      loginSection?.classList.remove('hidden');
      storeSection?.classList.add('hidden');
      triggerSectionAnimation(loginSection);
    }
  } else if (mode === 'inventory') {
    if (currentUser) {
      inventorySection?.classList.remove('hidden');
      loginSection?.classList.add('hidden');
      triggerSectionAnimation(inventorySection);
      loadPlayerInventory();
    } else {
      loginSection?.classList.remove('hidden');
      inventorySection?.classList.add('hidden');
      triggerSectionAnimation(loginSection);
    }
  } else if (mode === 'crosshairs') {
    loginSection?.classList.add('hidden');
    storeSection?.classList.add('hidden');
    careerSection?.classList.add('hidden');
    agentsSection?.classList.add('hidden');
    catalogSection?.classList.add('hidden');
    inventorySection?.classList.add('hidden');
    crosshairsSection?.classList.remove('hidden');
    triggerSectionAnimation(crosshairsSection);
    loadProCrosshairs();
  } else if (mode === 'career') {
    if (currentUser) {
      careerSection?.classList.remove('hidden');
      loginSection?.classList.add('hidden');
      triggerSectionAnimation(careerSection);
      loadCareer();
    } else {
      loginSection?.classList.remove('hidden');
      careerSection?.classList.add('hidden');
      triggerSectionAnimation(loginSection);
    }
  } else if (mode === 'agents') {
    loginSection?.classList.add('hidden');
    storeSection?.classList.add('hidden');
    careerSection?.classList.add('hidden');
    catalogSection?.classList.add('hidden');
    inventorySection?.classList.add('hidden');
    crosshairsSection?.classList.add('hidden');
    agentsSection?.classList.remove('hidden');
    triggerSectionAnimation(agentsSection);
    loadAgentsEncyclopedia();
  } else if (mode === 'catalog') {
    loginSection?.classList.add('hidden');
    storeSection?.classList.add('hidden');
    careerSection?.classList.add('hidden');
    agentsSection?.classList.add('hidden');
    inventorySection?.classList.add('hidden');
    crosshairsSection?.classList.add('hidden');
    catalogSection?.classList.remove('hidden');
    triggerSectionAnimation(catalogSection);
    resetAndLoadCatalog();
  }
}

btnTabStore?.addEventListener('click', () => switchAppMode('store'));
btnTabInventory?.addEventListener('click', () => switchAppMode('inventory'));
btnTabCrosshairs?.addEventListener('click', () => switchAppMode('crosshairs'));
btnTabCareer?.addEventListener('click', () => switchAppMode('career'));
btnTabAgents?.addEventListener('click', () => switchAppMode('agents'));
btnTabCatalog?.addEventListener('click', () => switchAppMode('catalog'));

// Mobile Bottom Nav Click Handlers
document.querySelectorAll('.mobile-nav-item[data-tab]').forEach(item => {
  item.addEventListener('click', () => {
    const tab = item.dataset.tab;
    if (tab) switchAppMode(tab);
  });
});

btnMobOpenVp?.addEventListener('click', () => {
  playTacticalAudio('click');
  window.openVpCompareModal?.();
});

// Load weapons list for dropdown
async function loadWeaponsList() {
  try {
    const res = await apiFetch('/api/weapons');
    const data = await res.json();
    if (data.ok && data.weapons) {
      allWeaponsList = data.weapons;
      populateWeaponDropdown(data.weapons);
    }
  } catch (err) {
    console.error('Failed to load weapons:', err);
  }
}

function populateWeaponDropdown(weapons) {
  const select = document.getElementById('filterWeapon');
  if (!select) return;
  
  select.innerHTML = '<option value="all">ปืนทุกชนิด (All Weapons)</option>';
  
  weapons.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w.name;
    opt.textContent = w.name + ' (' + (w.skinCount || 0) + ' สกิน)';
    select.appendChild(opt);
  });
}

// Category Pills Handler
document.querySelectorAll('.cat-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentCategoryFilter = pill.dataset.category || 'all';

    const filterWeaponEl = document.getElementById('filterWeapon');
    if (filterWeaponEl && currentCategoryFilter !== 'all' && currentCategoryFilter !== 'wishlist') {
      filterWeaponEl.value = 'all';
    }

    resetAndLoadCatalog();
  });
});

// Catalog Search & Filter Controls
const catalogSearchInput = document.getElementById('catalogSearchInput');
const btnClearSearch = document.getElementById('btnClearSearch');
const filterWeapon = document.getElementById('filterWeapon');
const filterTier = document.getElementById('filterTier');
const btnLoadMoreSkins = document.getElementById('btnLoadMoreSkins');
const catalogSkinsGrid = document.getElementById('catalogSkinsGrid');
const catalogTotalCount = document.getElementById('catalogTotalCount');

catalogSearchInput?.addEventListener('input', (e) => {
  const val = e.target.value;
  if (val.length > 0) {
    btnClearSearch?.classList.remove('hidden');
  } else {
    btnClearSearch?.classList.add('hidden');
  }
  clearTimeout(catalogSearchDebounce);
  catalogSearchDebounce = setTimeout(() => {
    resetAndLoadCatalog();
  }, 250);
});

btnClearSearch?.addEventListener('click', () => {
  if (catalogSearchInput) catalogSearchInput.value = '';
  btnClearSearch?.classList.add('hidden');
  resetAndLoadCatalog();
});

filterWeapon?.addEventListener('change', () => {
  if (filterWeapon.value !== 'all') {
    currentCategoryFilter = 'all';
    document.querySelectorAll('.cat-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.category === 'all');
    });
  }
  resetAndLoadCatalog();
});

filterTier?.addEventListener('change', () => resetAndLoadCatalog());

btnLoadMoreSkins?.addEventListener('click', () => {
  loadCatalogSkins(false);
});

function resetAndLoadCatalog() {
  catalogOffset = 0;
  if (catalogSkinsGrid) catalogSkinsGrid.innerHTML = '';
  loadCatalogSkins(true);
}

async function loadCatalogSkins(isNewFilter = false) {
  const search = catalogSearchInput?.value?.trim() || '';
  const weapon = filterWeapon?.value || 'all';
  const tier = filterTier?.value || 'all';
  const category = currentCategoryFilter;

  if (isNewFilter && catalogSkinsGrid) {
    catalogOffset = 0;
    catalogSkinsGrid.innerHTML = '<div class="loading-msg" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--val-gray);">กำลังโหลดสกินทั้งหมด...</div>';
  }

  if (btnLoadMoreSkins) {
    btnLoadMoreSkins.disabled = true;
    btnLoadMoreSkins.textContent = 'กำลังโหลด...';
  }

  try {
    const params = new URLSearchParams({
      search,
      weapon,
      category: category === 'wishlist' ? 'all' : category,
      tier,
      limit: (category === 'wishlist' ? 300 : catalogLimit).toString(),
      offset: (category === 'wishlist' ? 0 : catalogOffset).toString()
    });

    const res = await apiFetch('/api/skins/all?' + params.toString());
    const data = await res.json();

    if (!data.ok) throw new Error('ไม่สามารถโหลดคลังสกินได้');

    let skinsToRender = data.skins || [];

    // Filter by Wishlist if selected
    if (category === 'wishlist') {
      const wishlistSet = getWishlist();
      skinsToRender = skinsToRender.filter(s => wishlistSet.has(s.uuid.toLowerCase()));
      catalogTotal = skinsToRender.length;
    } else {
      catalogTotal = data.total;
    }

    if (isNewFilter && catalogSkinsGrid) {
      catalogSkinsGrid.innerHTML = '';
    }

    if (catalogTotalCount) {
      catalogTotalCount.textContent = category === 'wishlist' ? `สกินที่คุณอยากได้ (${catalogTotal} สกิน)` : `ทั้งหมด ${catalogTotal.toLocaleString()} สกิน`;
    }

    renderCatalogItems(skinsToRender);
    catalogOffset += skinsToRender.length;

    if (btnLoadMoreSkins) {
      if (category === 'wishlist' || catalogOffset >= catalogTotal || skinsToRender.length === 0) {
        btnLoadMoreSkins.classList.add('hidden');
      } else {
        btnLoadMoreSkins.classList.remove('hidden');
        btnLoadMoreSkins.textContent = `โหลดสกินเพิ่มเติม (เหลืออีก ${(catalogTotal - catalogOffset).toLocaleString()} สกิน)...`;
      }
    }
  } catch (err) {
    if (isNewFilter && catalogSkinsGrid) {
      catalogSkinsGrid.innerHTML = '<div class="empty-msg" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--val-red);">เกิดข้อผิดพลาด: ' + err.message + '</div>';
    }
  } finally {
    if (btnLoadMoreSkins) {
      btnLoadMoreSkins.disabled = false;
    }
  }
}

function renderCatalogItems(skins) {
  if (!catalogSkinsGrid) return;

  if (!skins || skins.length === 0) {
    if (catalogOffset === 0) {
      const msg = currentCategoryFilter === 'wishlist' ? 
        'ยังไม่มีสกินในรายการที่อยากได้ (แตะไอคอนดาวบนสกินใดก็ได้เพื่อเพิ่มในรายการ)' : 
        'ไม่พบสกินที่ตรงกับคำค้นหา';
      catalogSkinsGrid.innerHTML = `<div class="empty-msg" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--val-gray);">${msg}</div>`;
    }
    return;
  }

  skins.forEach((skin, idx) => {
    const tierColor = skin.tier?.highlightColor || '#ff4655';
    const card = document.createElement('div');
    card.className = 'skin-card';
    card.style.setProperty('--card-tier-color', tierColor);
    card.style.setProperty('--card-tier-glow', tierColor + '40');
    card.style.animationDelay = (Math.min(idx, 24) * 0.04) + 's';

    const chromasCount = skin.chromas ? skin.chromas.length : 1;
    const hasVideo = skin.hasVideo || (skin.levels && skin.levels.some(l => l.streamedVideo));
    const safeIcon = skin.displayIcon || 'https://media.valorant-api.com/weapons/skins/default/displayicon.png';
    const starred = isWishlisted(skin.uuid);

    card.innerHTML = `
      <button class="btn-wishlist-star ${starred ? 'starred' : ''}" data-uuid="${skin.uuid.toLowerCase()}" title="${starred ? 'อยู่ในรายการที่อยากได้' : 'เพิ่มในรายการที่อยากได้'}">
        ${starred ? `<svg viewBox="0 0 24 24" width="15" height="15" fill="var(--val-gold)" stroke="var(--val-gold)" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` : `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`}
      </button>

      <div class="skin-card-header">
        <div class="skin-tier-info">
          ${skin.tier?.displayIcon ? `<img src="${skin.tier.displayIcon}" alt="" class="skin-tier-icon">` : ''}
          <span class="skin-tier-name">${skin.tier?.name || 'Edition'}</span>
        </div>
        <div class="skin-features-badge">
          ${chromasCount > 1 ? `<span class="badge-feat">${chromasCount} สี</span>` : ''}
          ${hasVideo ? '<span class="badge-feat"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:middle; margin-right:3px;"><polygon points="5 3 19 12 5 21 5 3"/></svg> วิดีโอ VFX</span>' : ''}
        </div>
      </div>

      <div class="skin-image-box">
        <img src="${safeIcon}" alt="${skin.name}" loading="lazy">
      </div>

      <div class="skin-card-footer">
        <div class="skin-name" title="${skin.name}">${skin.name}</div>
        <div class="skin-meta-row">
          <span style="font-size:12px; color:var(--val-gray); font-weight:500;">${skin.weaponType || 'Weapon'}</span>
          <button class="btn btn-primary btn-sm btn-inspect"><span>ดูเอฟเฟกต์ & สี</span><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>
      </div>
    `;

    card.addEventListener('mouseenter', () => playTacticalAudio('hover'));
    card.querySelector('.btn-wishlist-star')?.addEventListener('click', (e) => toggleWishlist(skin.uuid, e));
    card.addEventListener('click', () => openSkinModal(skin));
    catalogSkinsGrid.appendChild(card);
  });
}

// ==========================================================
// ALL AGENTS ENCYCLOPEDIA & COMPATIBILITY MODULE
// ==========================================================

async function loadAgentsEncyclopedia() {
  const grid = document.getElementById('allAgentsGrid');
  if (grid && (!allPlayableAgents || allPlayableAgents.length === 0)) {
    grid.innerHTML = '<div class="loading-msg" style="grid-column:1/-1; text-align:center; padding:40px; color:var(--val-gray);">กำลังโหลดข้อมูลตัวละครทั้งหมด...</div>';
  }

  if (!allPlayableAgents || allPlayableAgents.length === 0) {
    await loadAllAgents();
  }

  renderAllAgentsGrid(allPlayableAgents);
}

function calculateAgentMatchPercent(agent) {
  let score = 74;
  const w = agent.playstyleWeights || { entry: 0.5, lurk: 0.5, smoke: 0.5, recon: 0.5 };
  
  if (allCareerMatches && allCareerMatches.length > 0) {
    let totalFb = 0, totalHs = 0, totalHits = 0, totalRounds = 0, totalDmg = 0;
    allCareerMatches.forEach(m => {
      const st = m.myStats || {};
      totalFb += st.firstBloods || 0;
      totalHs += st.headshots || 0;
      totalHits += (st.headshots || 0) + (st.bodyshots || 0) + (st.legshots || 0);
      totalRounds += st.roundsPlayed || 1;
      totalDmg += st.totalDamage || 0;
    });
    const avgFb = totalFb / allCareerMatches.length;
    const avgAdr = totalRounds > 0 ? (totalDmg / totalRounds) : 0;
    const avgHs = totalHits > 0 ? (totalHs / totalHits) : 0;

    if (avgFb >= 1.8 || avgAdr >= 140) score += (w.entry || 0.5) * 23;
    else score += (1 - (w.entry || 0.5)) * 12;

    if (avgHs >= 0.22) score += (w.lurk || 0.5) * 18;
  }
  return Math.min(99, Math.max(62, Math.round(score)));
}

function renderAllAgentsGrid(agents) {
  const grid = document.getElementById('allAgentsGrid');
  const countEl = document.getElementById('agentsTotalCount');
  const searchInput = document.getElementById('agentSearchInput');
  if (!grid) return;

  grid.innerHTML = '';
  const search = searchInput?.value?.trim().toLowerCase() || '';

  let filtered = agents || [];

  if (currentAgentRoleFilter && currentAgentRoleFilter !== 'all') {
    filtered = filtered.filter(a => (a.role || '').toLowerCase() === currentAgentRoleFilter.toLowerCase());
  }

  if (search) {
    filtered = filtered.filter(a => 
      (a.displayName || '').toLowerCase().includes(search) || 
      (a.role || '').toLowerCase().includes(search) ||
      (a.description || '').toLowerCase().includes(search)
    );
  }

  if (countEl) {
    countEl.textContent = `แสดง ${filtered.length} จาก ${agents.length} ตัวละคร`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-msg" style="grid-column:1/-1; text-align:center; padding:40px; color:var(--val-gray);">ไม่พบตัวละครที่ตรงกับคำค้นหา</div>';
    return;
  }

  filtered.forEach((ag, idx) => {
    const card = document.createElement('div');
    card.className = 'agent-catalog-card';
    card.style.animationDelay = (Math.min(idx, 20) * 0.04) + 's';

    const matchPct = calculateAgentMatchPercent(ag);
    const matchClass = matchPct >= 90 ? 'match-high' : (matchPct >= 75 ? 'match-mid' : 'match-low');
    const matchLabel = matchPct >= 90 ? `${matchPct}% PERFECT MATCH` : `${matchPct}% MATCH`;

    const portrait = ag.fullPortrait || ag.displayIcon || 'https://media.valorant-api.com/agents/roles/4be47ced-40d3-832a-0ec4-5396661402a6/displayicon.png';
    const priceTag = ag.pricing?.tag || '8,000 KC / 1,000 VP';
    const diff = ag.difficulty || 'ปานกลาง';

    const abilitiesPreview = (ag.abilities || []).map(ab => `
      <img src="${ab.displayIcon || ''}" class="agent-ability-mini-icon" title="${ab.slot}: ${ab.displayName}" alt="${ab.displayName}">
    `).join('');

    card.innerHTML = `
      <div class="agent-catalog-card-header">
        <div class="agent-role-pill">
          ${ag.roleIcon ? `<img src="${ag.roleIcon}" alt="" class="role-mini-icon">` : ''}
          <span>${ag.role || 'AGENT'}</span>
        </div>
        <span class="agent-match-badge ${matchClass}">
          ${matchPct >= 90 ? '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' : ''}
          <span>${matchLabel}</span>
        </span>
      </div>

      <div class="agent-card-portrait-wrap">
        <img src="${portrait}" alt="${ag.displayName}" class="agent-card-portrait" loading="lazy">
      </div>

      <div>
        <div class="agent-card-name-row">
          <h3 class="agent-card-name">${ag.displayName}</h3>
          <span class="agent-card-diff">${diff}</span>
        </div>
        
        <div class="agent-price-pill">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:middle; margin-right:3px;"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          <span>${priceTag}</span>
        </div>

        <div class="agent-card-abilities-preview">
          ${abilitiesPreview}
        </div>
      </div>

      <button class="btn btn-outline-primary btn-sm btn-block btn-inspect-agent">
        ดูสถิติเจาะลึก & วิธีเล่น
      </button>
    `;

    card.addEventListener('mouseenter', () => playTacticalAudio('hover'));
    card.addEventListener('click', () => openAgentDetailsModal(ag, null));
    grid.appendChild(card);
  });
}

// Role Filter Pills in Agents Section
document.querySelectorAll('#agentRolePills .cat-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('#agentRolePills .cat-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentAgentRoleFilter = pill.dataset.role || 'all';
    renderAllAgentsGrid(allPlayableAgents);
  });
});

// Agent Search Controls
const agentSearchInput = document.getElementById('agentSearchInput');
const btnClearAgentSearch = document.getElementById('btnClearAgentSearch');

agentSearchInput?.addEventListener('input', (e) => {
  const val = e.target.value;
  btnClearAgentSearch?.classList.toggle('hidden', val.length === 0);
  renderAllAgentsGrid(allPlayableAgents);
});

btnClearAgentSearch?.addEventListener('click', () => {
  if (agentSearchInput) agentSearchInput.value = '';
  btnClearAgentSearch?.classList.add('hidden');
  renderAllAgentsGrid(allPlayableAgents);
});

// ==========================================================
// CAREER & MATCH HISTORY MODULE
// ==========================================================

async function loadCareer() {
  const container = document.getElementById('matchesContainer');
  if (container) {
    container.innerHTML = '<div class="loading-msg" style="text-align: center; padding: 40px; color: var(--val-gray);">กำลังดึงประวัติการเล่นจาก Riot...</div>';
  }

  try {
    // 1. Fetch MMR
    const mmrPromise = apiFetch('/api/career/mmr').then(r => r.json()).catch(() => ({ ok: false }));
    // 2. Fetch Matches
    const queueParam = currentCareerQueue ? `?queue=${encodeURIComponent(currentCareerQueue)}` : '';
    const matchPromise = apiFetch(`/api/matches${queueParam}`).then(r => r.json()).catch(() => ({ ok: false }));

    const [mmrRes, matchRes] = await Promise.all([mmrPromise, matchPromise]);

    if (mmrRes.ok && mmrRes.mmr) {
      renderCareerMmr(mmrRes.mmr);
    }

    if (matchRes.ok && matchRes.history) {
      allCareerMatches = matchRes.history.matches || [];
      renderMatchesList(allCareerMatches);
    } else {
      if (container) {
        container.innerHTML = '<div class="empty-msg" style="text-align: center; padding: 40px; color: var(--val-gray);">ไม่พบประวัติการเล่น หรือเซิร์ฟเวอร์ยังไม่เปิดเผยข้อมูล</div>';
      }
    }
  } catch (err) {
    if (container) {
      container.innerHTML = '<div class="empty-msg" style="text-align: center; padding: 40px; color: var(--val-red);">เกิดข้อผิดพลาด: ' + err.message + '</div>';
    }
  }
}

function renderCareerMmr(mmr) {
  const rankIcon = document.getElementById('careerRankIcon');
  const rankName = document.getElementById('careerRankName');
  const rrBar = document.getElementById('careerRrBar');
  const rrText = document.getElementById('careerRrText');
  const peakRank = document.getElementById('careerPeakRank');

  if (rankIcon && mmr.rankIcon) rankIcon.src = mmr.rankIcon;
  if (rankName) {
    rankName.textContent = mmr.tierName || 'UNRANKED';
    if (mmr.color) rankName.style.color = mmr.color;
  }
  if (rrBar) rrBar.style.width = Math.min(100, Math.max(0, mmr.rankedRating || 0)) + '%';
  if (rrText) rrText.textContent = `${mmr.rankedRating || 0} / 100 RR`;
  if (peakRank) peakRank.textContent = `Peak: ${mmr.peakRankName || 'Unranked'}`;
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'เมื่อสักครู่';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  return `${days} วันที่แล้ว`;
}

function renderMatchesList(matches) {
  const container = document.getElementById('matchesContainer');
  if (!container) return;
  container.innerHTML = '';

  if (!matches || matches.length === 0) {
    container.innerHTML = '<div class="empty-msg" style="text-align: center; padding: 40px; color: var(--val-gray);">ไม่พบประวัติการเล่นในโหมดนี้</div>';
    // Clear summary boxes
    document.getElementById('careerTotalGames').textContent = '0';
    document.getElementById('careerWinRate').textContent = '0%';
    document.getElementById('careerAvgKd').textContent = '0.00';
    document.getElementById('careerAvgAcs').textContent = '0';
    return;
  }

  // Calculate Aggregates
  let wins = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAcs = 0;

  matches.forEach(m => {
    if (m.outcome === 'VICTORY') wins++;
    totalKills += m.myStats?.kills || 0;
    totalDeaths += m.myStats?.deaths || 0;
    totalAcs += m.myStats?.acs || 0;
  });

  const totalGames = matches.length;
  const winRate = Math.round((wins / totalGames) * 100);
  const avgKd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);
  const avgAcs = Math.round(totalAcs / totalGames);

  const totalGamesEl = document.getElementById('careerTotalGames');
  const winRateEl = document.getElementById('careerWinRate');
  const avgKdEl = document.getElementById('careerAvgKd');
  const avgAcsEl = document.getElementById('careerAvgAcs');

  if (totalGamesEl) totalGamesEl.textContent = `${totalGames} นัด (${wins}W - ${totalGames - wins}L)`;
  if (winRateEl) winRateEl.textContent = `${winRate}%`;
  if (avgKdEl) avgKdEl.textContent = avgKd;
  if (avgAcsEl) avgAcsEl.textContent = avgAcs.toLocaleString();

  // Run AI Playstyle & Best Agent Analysis
  analyzePlayerPlaystyleAndBestAgent(matches);

  // Render match cards
  matches.forEach((m, idx) => {
    const card = document.createElement('div');
    card.style.animationDelay = (Math.min(idx, 15) * 0.05) + 's';
    const outcomeClass = m.outcome === 'VICTORY' ? 'outcome-win' : (m.outcome === 'DEFEAT' ? 'outcome-loss' : 'outcome-draw');
    const outcomeTextClass = m.outcome === 'VICTORY' ? 'outcome-win-text' : (m.outcome === 'DEFEAT' ? 'outcome-loss-text' : 'outcome-draw-text');
    const outcomeLabel = m.outcome === 'VICTORY' ? 'VICTORY (ชนะ)' : (m.outcome === 'DEFEAT' ? 'DEFEAT (แพ้)' : 'DRAW (เสมอ)');

    card.className = `match-card ${outcomeClass}`;

    const agentIcon = m.myAgent?.displayIcon || 'https://media.valorant-api.com/agents/roles/4be47ced-40d3-832a-0ec4-5396661402a6/displayicon.png';
    const agentName = m.myAgent?.displayName || 'Agent';
    const mapName = m.map?.displayName || 'Map';
    const timeAgo = formatTimeAgo(m.gameStartMillis);

    // Friendly & Enemy Rosters preview
    const friendlyRoster = (m.friendlyTeam || []).map(p => {
      const icon = p.agent?.displayIcon || 'https://media.valorant-api.com/agents/roles/4be47ced-40d3-832a-0ec4-5396661402a6/displayicon.png';
      return `<img src="${icon}" class="roster-mini-avatar ${p.isMe ? 'is-me' : ''}" title="${escapeHtml(p.gameName)}#${escapeHtml(p.tagLine)} (${escapeHtml(p.agent?.displayName || 'Agent')})" alt="${escapeHtml(p.gameName)}">`;
    }).join('');

    const enemyRoster = (m.enemyTeam || []).map(p => {
      const icon = p.agent?.displayIcon || 'https://media.valorant-api.com/agents/roles/4be47ced-40d3-832a-0ec4-5396661402a6/displayicon.png';
      return `<img src="${icon}" class="roster-mini-avatar" title="${escapeHtml(p.gameName)}#${escapeHtml(p.tagLine)} (${escapeHtml(p.agent?.displayName || 'Agent')})" alt="${escapeHtml(p.gameName)}">`;
    }).join('');

    card.innerHTML = `
      <div class="outcome-indicator-bar"></div>

      <div class="match-agent-box">
        <img src="${agentIcon}" alt="${agentName}" class="match-agent-avatar">
        <span class="match-agent-name">${agentName}</span>
      </div>

      <div class="match-info-box">
        <span class="match-queue-tag">${m.queueName || 'Competitive'}</span>
        <span class="match-map-title">${mapName}</span>
        <span class="match-time-ago">${timeAgo}</span>
      </div>

      <div class="match-score-box">
        <span class="match-outcome-badge ${outcomeTextClass}">${outcomeLabel}</span>
        <span class="match-score-digits">${m.myTeamScore} - ${m.enemyTeamScore}</span>
        ${(friendlyRoster || enemyRoster) ? `
          <div class="match-rosters-preview">
            <div class="roster-team-group" title="ทีมของคุณ">${friendlyRoster}</div>
            <span class="roster-vs">VS</span>
            <div class="roster-team-group" title="ทีมตรงข้าม">${enemyRoster}</div>
          </div>
        ` : ''}
      </div>

      <div class="match-stats-box">
        <div class="match-kda-row">
          <span>${m.myStats.kills}</span> / <span style="color:var(--val-red);">${m.myStats.deaths}</span> / <span style="color:var(--val-gray);">${m.myStats.assists}</span>
          <span style="font-size:12px; color:var(--val-cyan); margin-left:6px;">(${m.myStats.kd} K/D)</span>
        </div>
        <div class="match-substats-row">
          <span>ACS: <strong>${m.myStats.acs}</strong></span>
          <span>HS: <strong>${m.myStats.hsPercent}%</strong></span>
        </div>
      </div>

      <div class="match-action-box">
        <button class="btn btn-outline-primary btn-sm btn-view-scoreboard">
          ตารางคะแนน 10 คน
        </button>
      </div>
    `;

    card.addEventListener('mouseenter', () => playTacticalAudio('hover'));
    card.querySelector('.btn-view-scoreboard')?.addEventListener('click', () => openMatchScoreboard(m));
    container.appendChild(card);
  });
}

let currentActiveMatch = null;

function switchMatchModalSubtab(tabName) {
  document.querySelectorAll('.subnav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.subtab === tabName);
  });
  const subScoreboard = document.getElementById('subtabScoreboardContent');
  const subRounds = document.getElementById('subtabRoundsContent');
  const subStats = document.getElementById('subtabStatsContent');

  if (subScoreboard) subScoreboard.classList.toggle('hidden', tabName !== 'scoreboard');
  if (subRounds) subRounds.classList.toggle('hidden', tabName !== 'rounds');
  if (subStats) subStats.classList.toggle('hidden', tabName !== 'stats');

  if (tabName === 'rounds' && currentActiveMatch) {
    renderRoundTimeline(currentActiveMatch);
  } else if (tabName === 'stats' && currentActiveMatch) {
    renderAdvancedStats(currentActiveMatch);
  }
}

document.querySelectorAll('.subnav-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    switchMatchModalSubtab(btn.dataset.subtab);
  });
});

function openMatchScoreboard(match) {
  if (!match) return;
  playTacticalAudio('inspect');
  currentActiveMatch = match;

  const queueEl = document.getElementById('modalMatchQueue');
  const mapEl = document.getElementById('modalMatchMap');
  const dateEl = document.getElementById('modalMatchDate');
  const outcomeEl = document.getElementById('modalMatchOutcome');
  const scoreEl = document.getElementById('modalMatchScore');
  const tbody = document.getElementById('modalScoreboardRows');

  if (queueEl) queueEl.textContent = match.queueName || 'MATCH';
  if (mapEl) mapEl.textContent = match.map?.displayName || 'MAP';
  if (dateEl) dateEl.textContent = formatTimeAgo(match.gameStartMillis);

  if (outcomeEl) {
    outcomeEl.textContent = match.outcome === 'VICTORY' ? 'VICTORY' : (match.outcome === 'DEFEAT' ? 'DEFEAT' : 'DRAW');
    outcomeEl.className = 'outcome-title ' + (match.outcome === 'VICTORY' ? 'outcome-win' : (match.outcome === 'DEFEAT' ? 'outcome-loss' : 'outcome-draw'));
  }

  if (scoreEl) {
    scoreEl.textContent = `${match.myTeamScore} - ${match.enemyTeamScore}`;
  }

  if (tbody) {
    tbody.innerHTML = '';
    
    const renderPlayerRow = (p, teamTypeClass) => {
      const tr = document.createElement('tr');
      if (p.isMe) tr.classList.add('player-row-me');
      else if (teamTypeClass) tr.classList.add(teamTypeClass);

      const agIcon = p.agent?.displayIcon || 'https://media.valorant-api.com/agents/roles/4be47ced-40d3-832a-0ec4-5396661402a6/displayicon.png';
      const rankIcon = p.rank?.smallIcon || p.rank?.largeIcon;
      const rankColor = p.rank?.color || '#ffffff';

      tr.innerHTML = `
        <td>
          <div class="player-cell-info">
            <img src="${agIcon}" alt="" class="player-cell-agent-img">
            <div>
              <div class="player-cell-name">
                <span>${escapeHtml(p.gameName)}</span>
                ${p.isMe ? '<span class="you-pill">คุณ</span>' : ''}
              </div>
              <div class="player-cell-tag">#${escapeHtml(p.tagLine)}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="player-rank-cell">
            ${rankIcon ? `<img src="${rankIcon}" alt="" class="player-rank-mini-icon">` : ''}
            <span style="font-size:12px; font-weight:700; color:${rankColor};">${p.rank?.tierName || 'UNRANKED'}</span>
          </div>
        </td>
        <td style="font-family:'Rajdhani', sans-serif; font-size:16px; font-weight:800; color:var(--val-gold);">${p.stats.acs}</td>
        <td style="font-family:'Rajdhani', sans-serif; font-size:15px; font-weight:700;">${p.stats.kills} / <span style="color:var(--val-red);">${p.stats.deaths}</span> / <span style="color:var(--val-gray);">${p.stats.assists}</span></td>
        <td style="font-family:'Rajdhani', sans-serif; font-weight:700;">${p.stats.kd}</td>
        <td style="font-family:'Rajdhani', sans-serif; font-weight:700; color:#fff;">${p.stats.adr || 0}</td>
        <td style="font-weight:600; color:var(--val-cyan);">${p.stats.hsPercent}%</td>
        <td style="font-size:12px; color:var(--val-gray); font-weight:600;">${p.stats.topWeapon || 'Vandal'}</td>
        <td style="font-family:'Rajdhani', sans-serif; font-weight:700; color:#fff;">${(p.stats.score || 0).toLocaleString()}</td>
      `;
      return tr;
    };

    if (match.friendlyTeam && match.enemyTeam && match.friendlyTeam.length > 0) {
      // 1. Friendly Team Section Header
      const fHead = document.createElement('tr');
      fHead.className = 'team-header-row team-header-friendly';
      fHead.innerHTML = `
        <td colspan="9">
          <div class="team-header-content">
            <span class="team-dot dot-friendly"></span>
            <strong>ทีมของคุณ (YOUR TEAM)</strong>
            <span class="team-score-badge">${match.myTeamScore} รอบ</span>
          </div>
        </td>
      `;
      tbody.appendChild(fHead);
      match.friendlyTeam.forEach(p => tbody.appendChild(renderPlayerRow(p, 'team-row-friendly')));

      // 2. Enemy Team Section Header
      const eHead = document.createElement('tr');
      eHead.className = 'team-header-row team-header-enemy';
      eHead.innerHTML = `
        <td colspan="9">
          <div class="team-header-content">
            <span class="team-dot dot-enemy"></span>
            <strong>ทีมตรงข้าม (ENEMY TEAM)</strong>
            <span class="team-score-badge">${match.enemyTeamScore} รอบ</span>
          </div>
        </td>
      `;
      tbody.appendChild(eHead);
      match.enemyTeam.forEach(p => tbody.appendChild(renderPlayerRow(p, 'team-row-enemy')));
    } else {
      // FFA / Deathmatch
      (match.players || []).forEach(p => tbody.appendChild(renderPlayerRow(p, '')));
    }
  }

  switchMatchModalSubtab('scoreboard');
  matchModal?.classList.remove('hidden');
}

let allCareerMatches = [];
let currentAiAnalysisMode = '';
let allPlayableAgents = [];
const allPlayableAgentsMap = new Map();

async function loadAllAgents() {
  try {
    const res = await apiFetch('/api/agents');
    const data = await res.json();
    if (data.ok && Array.isArray(data.agents)) {
      allPlayableAgents = data.agents;
      for (const ag of data.agents) {
        if (ag.uuid) allPlayableAgentsMap.set(ag.uuid.toLowerCase(), ag);
        if (ag.displayName) allPlayableAgentsMap.set(ag.displayName.toLowerCase(), ag);
      }
    }
  } catch (e) {}
}

function getFullAgentData(agentRef) {
  if (!agentRef) return null;
  const name = typeof agentRef === 'string' ? agentRef : (agentRef.displayName || agentRef.uuid || '');
  const found = allPlayableAgentsMap.get(name.toLowerCase()) || allPlayableAgentsMap.get((agentRef.uuid || '').toLowerCase());
  if (found) return found;

  return {
    displayName: agentRef.displayName || 'Agent',
    role: agentRef.role || 'Duelist',
    roleIcon: agentRef.roleIcon || null,
    displayIcon: agentRef.displayIcon || 'https://media.valorant-api.com/agents/roles/4be47ced-40d3-832a-0ec4-5396661402a6/displayicon.png',
    fullPortrait: agentRef.fullPortrait || agentRef.displayIcon || 'https://media.valorant-api.com/agents/roles/4be47ced-40d3-832a-0ec4-5396661402a6/displayicon.png',
    description: agentRef.description || 'เจ้าหน้าที่พิเศษแห่งหน่วย VALORANT Protocol',
    abilities: agentRef.abilities || []
  };
}

// Agent Deep-Dive Modal
const agentModal = document.getElementById('agentModal');
const btnCloseAgentModal = document.getElementById('btnCloseAgentModal');

function openAgentDetailsModal(agentData, metricsData) {
  if (!agentData) return;
  playTacticalAudio('inspect');
  const fullAgent = getFullAgentData(agentData);

  const imgEl = document.getElementById('agentModalImg');
  const nameEl = document.getElementById('agentModalName');
  const roleTextEl = document.getElementById('agentModalRoleText');
  const roleIconEl = document.getElementById('agentModalRoleIcon');
  const tierTextEl = document.getElementById('agentModalTierText');
  const descEl = document.getElementById('agentModalDesc');
  const metricsGrid = document.getElementById('agentModalMetricsGrid');
  const abilitiesGrid = document.getElementById('agentModalAbilitiesGrid');

  if (imgEl) imgEl.src = fullAgent.fullPortrait || fullAgent.displayIcon;
  if (nameEl) nameEl.textContent = (fullAgent.displayName || 'Agent').toUpperCase();
  if (roleTextEl) roleTextEl.textContent = (fullAgent.role || 'AGENT').toUpperCase();
  if (roleIconEl) {
    if (fullAgent.roleIcon) {
      roleIconEl.src = fullAgent.roleIcon;
      roleIconEl.style.display = 'inline-block';
    } else {
      roleIconEl.style.display = 'none';
    }
  }
  if (descEl) {
    const priceTag = fullAgent.pricing?.tag || '8,000 Kingdom Credits หรือ 1,000 VP';
    const diff = fullAgent.difficulty || 'ปานกลาง (Medium)';
    const maps = (fullAgent.bestMaps || ['Ascent', 'Haven', 'Bind']).join(', ');
    const guide = fullAgent.howToPlay || 'เปิดไฟต์และประสานงานกับเพื่อนร่วมทีม';
    const tip = fullAgent.proTips || 'เลือกมุมยิงและจังหวะใช้สกิลให้ได้เปรียบ';

    descEl.innerHTML = `
      <p style="margin-bottom:8px;">${fullAgent.description || 'เจ้าหน้าที่พิเศษแห่งหน่วย VALORANT Protocol'}</p>
      
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin:10px 0;">
        <span class="agent-price-pill" style="margin:0;">
          <strong>ราคาปลดล็อก:</strong> ${priceTag}
        </span>
        <span class="agent-role-pill" style="background:rgba(255,255,255,0.06); color:#fff; border-color:rgba(255,255,255,0.15);">
          <strong>ความยาก:</strong> ${diff}
        </span>
      </div>

      <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:10px 12px; margin-top:8px;">
        <div style="font-size:11px; color:var(--val-gold); font-weight:700; margin-bottom:2px;">แผนที่ที่เก่งที่สุด (BEST MAPS):</div>
        <div style="font-size:12px; color:#fff;">${maps}</div>
        <div style="font-size:11px; color:var(--val-cyan); font-weight:700; margin-top:6px; margin-bottom:2px;">วิธีเล่นและเทคนิค (STRATEGY & PRO TIPS):</div>
        <div style="font-size:11px; color:#c0d3e8; line-height:1.4;">${guide} — <em>${tip}</em></div>
      </div>
    `;
  }

  // Look up if user has actually played this agent in real match history
  let actualPlayedStats = metricsData;
  if (!actualPlayedStats && allCareerMatches && allCareerMatches.length > 0) {
    const agName = (fullAgent.displayName || '').toLowerCase();
    const agUuid = (fullAgent.uuid || '').toLowerCase();
    
    const agentMatches = allCareerMatches.filter(m => {
      const myAg = m.myAgent;
      return (myAg?.uuid && myAg.uuid.toLowerCase() === agUuid) ||
             (myAg?.displayName && myAg.displayName.toLowerCase() === agName);
    });

    if (agentMatches.length > 0) {
      let wins = 0, kills = 0, deaths = 0, assists = 0, score = 0, damage = 0, rounds = 0, headshots = 0, totalHits = 0, firstBloods = 0, plants = 0, defuses = 0;
      agentMatches.forEach(m => {
        if (m.outcome === 'VICTORY') wins++;
        const st = m.myStats || {};
        kills += st.kills || 0;
        deaths += st.deaths || 0;
        assists += st.assists || 0;
        score += st.score || 0;
        damage += st.totalDamage || 0;
        rounds += st.roundsPlayed || 1;
        headshots += st.headshots || 0;
        totalHits += (st.headshots || 0) + (st.bodyshots || 0) + (st.legshots || 0);
        firstBloods += st.firstBloods || 0;
        plants += st.plants || 0;
        defuses += st.defuses || 0;
      });

      const winRate = Math.round((wins / agentMatches.length) * 100);
      const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
      const acs = rounds > 0 ? Math.round(score / rounds) : 0;
      const adr = rounds > 0 ? Math.round(damage / rounds) : 0;
      const hsPercent = totalHits > 0 ? Math.round((headshots / totalHits) * 100) : 0;
      const performanceRating = (winRate * 0.4) + (parseFloat(kd) * 25) + (acs * 0.15) + (firstBloods * 3);

      actualPlayedStats = {
        hasPlayed: true,
        games: agentMatches.length,
        wins,
        kills,
        deaths,
        assists,
        score,
        damage,
        rounds,
        winRate,
        kd,
        acs,
        adr,
        hsPercent,
        firstBloods,
        plants,
        defuses,
        performanceRating
      };
    }
  }

  // Render Real Stats or Unplayed State
  if (actualPlayedStats && actualPlayedStats.games > 0) {
    const m = actualPlayedStats;
    const ratingScore = m.performanceRating || (m.winRate * 0.4 + parseFloat(m.kd) * 25 + m.acs * 0.15);

    let tierBadgeClass = 'tier-s';
    let tierLabel = `S+ MVP TIER (คะแนน: ${Math.round(ratingScore)}/100)`;

    if (ratingScore >= 80) {
      tierBadgeClass = 'tier-s';
      tierLabel = `S+ MVP TIER (คะแนน: ${Math.round(ratingScore)}/100)`;
    } else if (ratingScore >= 65) {
      tierBadgeClass = 'tier-s';
      tierLabel = `S PRO TIER (คะแนน: ${Math.round(ratingScore)}/100)`;
    } else if (ratingScore >= 50) {
      tierBadgeClass = 'playstyle-pill';
      tierLabel = `A SOLID TIER (คะแนน: ${Math.round(ratingScore)}/100)`;
    } else {
      tierBadgeClass = 'tier-pill';
      tierLabel = `B AVERAGE TIER (คะแนน: ${Math.round(ratingScore)}/100)`;
    }

    if (tierTextEl) {
      tierTextEl.textContent = tierLabel;
      tierTextEl.className = 'tier-pill ' + tierBadgeClass;
    }

    if (metricsGrid) {
      metricsGrid.innerHTML = `
        <div class="agent-metric-box">
          <span class="agent-metric-lbl">อัตราชนะ (WIN RATE)</span>
          <span class="agent-metric-val accent-green">${m.winRate}%</span>
        </div>
        <div class="agent-metric-box">
          <span class="agent-metric-lbl">K/D RATIO</span>
          <span class="agent-metric-val accent-cyan">${m.kd}</span>
        </div>
        <div class="agent-metric-box">
          <span class="agent-metric-lbl">คะแนนต่อรอบ (ACS)</span>
          <span class="agent-metric-val accent-gold">${m.acs}</span>
        </div>
        <div class="agent-metric-box">
          <span class="agent-metric-lbl">ดาเมจต่อรอบ (ADR)</span>
          <span class="agent-metric-val">${m.adr}</span>
        </div>
        <div class="agent-metric-box">
          <span class="agent-metric-lbl">อัตราเข้าหัว (HS%)</span>
          <span class="agent-metric-val accent-green">${m.hsPercent}%</span>
        </div>
        <div class="agent-metric-box">
          <span class="agent-metric-lbl">สังหารแรก (FK)</span>
          <span class="agent-metric-val accent-cyan">${m.firstBloods || 0}</span>
        </div>
        <div class="agent-metric-box">
          <span class="agent-metric-lbl">วาง/กู้ สไปก์</span>
          <span class="agent-metric-val">${(m.plants || 0)} / ${(m.defuses || 0)}</span>
        </div>
        <div class="agent-metric-box">
          <span class="agent-metric-lbl">แมตช์ที่เล่นจริง</span>
          <span class="agent-metric-val">${m.games} นัด (${m.wins}W - ${m.games - m.wins}L)</span>
        </div>
      `;
    }
  } else {
    // Unplayed / Not purchased agent state
    const matchPct = calculateAgentMatchPercent(fullAgent);
    if (tierTextEl) {
      tierTextEl.textContent = `ยังไม่เคยเล่นในแมตช์จริง (${matchPct}% MATCH)`;
      tierTextEl.className = 'tier-pill playstyle-pill';
    }

    if (metricsGrid) {
      metricsGrid.innerHTML = `
        <div style="grid-column: 1/-1; background: rgba(0,0,0,0.35); border: 1px dashed rgba(255,255,255,0.12); border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 4px;">ยังไม่มีประวัติสถิติการเล่นกับตัวละครนี้</div>
          <p style="font-size: 12px; color: var(--val-gray); line-height: 1.5;">
            คุณยังไม่เคยนำ <strong>${fullAgent.displayName}</strong> ไปเล่นในแมตช์จริง หรือยังไม่ได้ปลดล็อกตัวละครนี้<br>
            <span style="color: var(--val-cyan); font-weight: 600;">ความเข้ากันได้กับสไตล์การเล่นของคุณ: ${matchPct}% MATCH</span> (สามารถศึกษาคู่มือสกิลและเทคนิคด้านล่างได้เลย)
          </p>
        </div>
      `;
    }
  }

  if (abilitiesGrid) {
    const abilities = fullAgent.abilities || [];
    if (abilities.length > 0) {
      abilitiesGrid.innerHTML = abilities.map(ab => `
        <div class="ability-card-item">
          <img src="${ab.displayIcon || 'https://media.valorant-api.com/agents/roles/4be47ced-40d3-832a-0ec4-5396661402a6/displayicon.png'}" class="ability-card-icon" alt="${ab.displayName}">
          <div class="ability-card-info">
            <span class="ability-slot-tag">${ab.slot || 'ABILITY'}</span>
            <div class="ability-card-name">${ab.displayName}</div>
            <p class="ability-card-desc">${ab.description || 'กดใช้เพื่อสนับสนุนทีมในการต่อสู้'}</p>
          </div>
        </div>
      `).join('');
    } else {
      abilitiesGrid.innerHTML = '<div style="color:var(--val-gray); font-size:12px; grid-column:1/-1;">ไม่มีข้อมูลสกิล</div>';
    }
  }

  agentModal?.classList.remove('hidden');
}

function closeAgentModalHandler() {
  playTacticalAudio('close');
  agentModal?.classList.add('hidden');
}

btnCloseAgentModal?.addEventListener('click', closeAgentModalHandler);
agentModal?.addEventListener('click', (e) => {
  if (e.target === agentModal) closeAgentModalHandler();
});

function analyzePlayerPlaystyleAndBestAgent(matches, selectedMode = '') {
  const bestAgentBox = document.getElementById('bestAgentBody');
  const playstyleBadge = document.getElementById('playstyleTypeBadge');
  const playstyleBox = document.getElementById('playstyleBody');
  const agentsListEl = document.getElementById('agentsPerfList');
  const bestTierPill = document.getElementById('bestAgentTierPill');

  if (!bestAgentBox || !playstyleBox) return;

  if (!matches || matches.length === 0) {
    const modeName = selectedMode ? (selectedMode.toUpperCase()) : 'โหมดนี้';
    bestAgentBox.innerHTML = `<div style="padding:20px; text-align:center; color:var(--val-gray); font-size:12px;">ยังไม่มีประวัติการเล่นในโหมด ${modeName}</div>`;
    playstyleBox.innerHTML = `<div style="padding:20px; text-align:center; color:var(--val-gray); font-size:12px;">กรุณาเล่นอย่างน้อย 1 แมตช์ในโหมด ${modeName} เพื่อให้ระบบวิเคราะห์สไตล์</div>`;
    if (agentsListEl) {
      agentsListEl.innerHTML = `<div style="grid-column:1/-1; padding:20px; text-align:center; color:var(--val-gray); font-size:12px;">ไม่มีข้อมูลตัวละครในโหมด ${modeName}</div>`;
    }
    if (playstyleBadge) playstyleBadge.textContent = 'NO MATCHES';
    if (bestTierPill) bestTierPill.textContent = 'N/A';
    return;
  }

  // 1. Group statistics per Agent
  const agentMap = new Map();

  let overallKills = 0;
  let overallDeaths = 0;
  let overallDamage = 0;
  let overallRounds = 0;
  let overallFirstBloods = 0;
  let overallFirstDeaths = 0;
  let overallHeadshots = 0;
  let overallTotalHits = 0;
  let overallAssists = 0;
  let overallPlants = 0;
  let overallDefuses = 0;

  matches.forEach(m => {
    const ag = m.myAgent;
    const agUuid = ag?.uuid || ag?.displayName || 'agent';
    if (!agentMap.has(agUuid)) {
      agentMap.set(agUuid, {
        agent: ag,
        games: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        score: 0,
        damage: 0,
        rounds: 0,
        headshots: 0,
        totalHits: 0,
        firstBloods: 0,
        firstDeaths: 0,
        plants: 0,
        defuses: 0
      });
    }

    const item = agentMap.get(agUuid);
    item.games += 1;
    if (m.outcome === 'VICTORY') item.wins += 1;
    
    const st = m.myStats || {};
    item.kills += (st.kills || 0);
    item.deaths += (st.deaths || 0);
    item.assists += (st.assists || 0);
    item.score += (st.score || 0);
    item.damage += (st.totalDamage || 0);
    item.rounds += (st.roundsPlayed || 1);
    item.headshots += (st.headshots || 0);
    item.totalHits += (st.headshots || 0) + (st.bodyshots || 0) + (st.legshots || 0);
    item.firstBloods += (st.firstBloods || 0);
    item.firstDeaths += (st.firstDeaths || 0);
    item.plants += (st.plants || 0);
    item.defuses += (st.defuses || 0);

    overallKills += (st.kills || 0);
    overallDeaths += (st.deaths || 0);
    overallDamage += (st.totalDamage || 0);
    overallRounds += (st.roundsPlayed || 1);
    overallFirstBloods += (st.firstBloods || 0);
    overallFirstDeaths += (st.firstDeaths || 0);
    overallHeadshots += (st.headshots || 0);
    overallTotalHits += (st.headshots || 0) + (st.bodyshots || 0) + (st.legshots || 0);
    overallAssists += (st.assists || 0);
    overallPlants += (st.plants || 0);
    overallDefuses += (st.defuses || 0);
  });

  // Calculate ratings per agent
  const agentResults = [];
  agentMap.forEach((data, uuid) => {
    const winRate = Math.round((data.wins / data.games) * 100);
    const kd = data.deaths > 0 ? (data.kills / data.deaths).toFixed(2) : data.kills.toFixed(2);
    const acs = data.rounds > 0 ? Math.round(data.score / data.rounds) : 0;
    const adr = data.rounds > 0 ? Math.round(data.damage / data.rounds) : 0;
    const hsPercent = data.totalHits > 0 ? Math.round((data.headshots / data.totalHits) * 100) : 0;
    
    // Comprehensive Performance Index Formula
    const performanceRating = (winRate * 0.4) + (parseFloat(kd) * 25) + (acs * 0.15) + (data.firstBloods * 3) + (data.games * 4);

    agentResults.push({
      ...data,
      winRate,
      kd,
      acs,
      adr,
      hsPercent,
      performanceRating
    });
  });

  agentResults.sort((a, b) => b.performanceRating - a.performanceRating);

  const bestAgent = agentResults[0];

  // Render Best Agent Card
  if (bestAgent && bestAgent.agent) {
    const fullBest = getFullAgentData(bestAgent.agent);
    const portrait = fullBest.fullPortrait || fullBest.displayIcon;
    const agentName = fullBest.displayName || 'Agent';
    const agentRole = fullBest.role || 'Duelist';

    if (bestTierPill) {
      const score = Math.round(bestAgent.performanceRating);
      bestTierPill.textContent = score >= 80 ? 'S+ TIER' : (score >= 65 ? 'S TIER' : 'A TIER');
    }

    bestAgentBox.innerHTML = `
      <div class="best-agent-hero">
        <div class="best-agent-portrait-stage">
          <img src="${portrait}" class="best-agent-3d-model" alt="${agentName}" loading="lazy">
          <div class="agent-role-corner-badge">
            ${fullBest.roleIcon ? `<img src="${fullBest.roleIcon}" alt="" width="11" height="11">` : ''}
            <span>${agentRole}</span>
          </div>
        </div>
        <div class="best-agent-meta">
          <div class="best-agent-title-row">
            <h3 class="agent-title-large">${agentName}</h3>
            <span class="agent-mastery-tag">MVP AGENT</span>
          </div>
          <div class="best-agent-subtitle">
            <span>ลงเล่นไป <strong>${bestAgent.games}</strong> แมตช์</span>
            <span class="dot-sep">•</span>
            <span class="accent-green">ชนะ <strong>${bestAgent.wins}</strong> แมตช์</span>
          </div>
          <div class="best-agent-stats-row">
            <div class="agent-mini-stat-card">
              <span class="mini-stat-lbl">อัตราชนะ</span>
              <span class="mini-stat-val accent-green">${bestAgent.winRate}%</span>
            </div>
            <div class="agent-mini-stat-card">
              <span class="mini-stat-lbl">K/D RATIO</span>
              <span class="mini-stat-val accent-cyan">${bestAgent.kd}</span>
            </div>
            <div class="agent-mini-stat-card">
              <span class="mini-stat-lbl">ACS เฉลี่ย</span>
              <span class="mini-stat-val accent-gold">${bestAgent.acs}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const clickBox = document.getElementById('bestAgentCardClickable');
    if (clickBox) {
      clickBox.onclick = () => openAgentDetailsModal(fullBest, bestAgent);
    }
  }

  // 2. Playstyle Diagnosis & Recommendation Logic
  const totalMatchesCount = matches.length || 1;
  const avgFbPerMatch = overallFirstBloods / totalMatchesCount;
  const avgAdr = overallRounds > 0 ? (overallDamage / overallRounds) : 0;
  const avgHsRate = overallTotalHits > 0 ? (overallHeadshots / overallTotalHits) : 0;
  const avgAssistsPerMatch = overallAssists / totalMatchesCount;
  const avgObjectivePerMatch = (overallPlants + overallDefuses) / totalMatchesCount;

  let playstyleTitle = 'DUELIST / ENTRY';
  let playstyleDesc = '';
  let recomName = 'Jett';
  let recomRole = 'Duelist';
  let recomAdvice = '';

  if (avgFbPerMatch >= 1.8 || avgAdr >= 140) {
    playstyleTitle = 'ENTRY FRAGGER / DUELIST';
    playstyleDesc = 'คุณเป็นผู้เล่นสายบุกทะลวง (Aggressive Entry) กล้าเปิดไฟต์เพื่อสร้างความได้เปรียบให้ทีม สปีดการเล่นเร็วและกล้าเสี่ยงเพื่อชิงพื้นที่';
    recomName = (bestAgent?.agent?.displayName === 'Reyna') ? 'Jett' : 'Reyna';
    recomRole = 'Duelist';
    recomAdvice = 'ใช้สกิล Dash/Dismiss หลบหนีหลังเปิดคิล และกดดันศัตรูในไซต์ตั้งแต่ช่วง 15 วินาทีแรกของรอบ';
  } else if (avgHsRate >= 0.22 || overallFirstDeaths <= 2) {
    playstyleTitle = 'TACTICAL LURKER / SENTINEL';
    playstyleDesc = 'คุณเป็นผู้เล่นสายคุมพื้นที่และลอบสังหาร (Tactical Anchor & Lurker) ใจเย็น ยิงแม่นยำ และอ่านการเคลื่อนไหวของศัตรูได้ขาด';
    recomName = (bestAgent?.agent?.displayName === 'Cypher') ? 'Killjoy' : 'Cypher';
    recomRole = 'Sentinel';
    recomAdvice = 'วาง Spycam และ Trapwire เพื่อล็อกพื้นที่ Flank และดักเก็บศัตรูที่หมุนตำแหน่งช้า';
  } else if (avgObjectivePerMatch >= 1.2 || avgAssistsPerMatch >= 5) {
    playstyleTitle = 'STRATEGIC CONTROLLER';
    playstyleDesc = 'คุณเป็นมันสมองของทีม (Smoke Specialist) เชี่ยวชาญการใช้สกิลควันปิดวิสัยทัศน์ศัตรูและเปิดพื้นที่ปลอดภัยให้เพื่อนร่วมทีม';
    recomName = (bestAgent?.agent?.displayName === 'Omen') ? 'Clove' : 'Omen';
    recomRole = 'Controller';
    recomAdvice = 'วาง Smoke ปิดมุม Crossfire ล่วงหน้า และใช้สกิลเปิดพื้นที่ปลอดภัยให้เพื่อนร่วมทีม';
  } else {
    playstyleTitle = 'TACTICAL INITIATOR';
    playstyleDesc = 'คุณเป็นผู้เปิดข้อมูลและสนับสนุนเพื่อนร่วมทีม (Recon & Flash Playmaker) สแกนตำแหน่งและเปิดจังหวะเข้ายึดไซต์';
    recomName = (bestAgent?.agent?.displayName === 'Gekko') ? 'Fade' : 'Gekko';
    recomRole = 'Initiator';
    recomAdvice = 'ส่ง Wingman วางหรือกู้สไปก์อัตโนมัติ และใช้ Dizzy แฟลชตรวจจับศัตรูก่อนที่ทีมจะเข้าพื้นที่';
  }

  const fullRecom = getFullAgentData(recomName);
  const recomImg = fullRecom.fullPortrait || fullRecom.displayIcon;

  if (playstyleBadge) playstyleBadge.textContent = playstyleTitle;

  playstyleBox.innerHTML = `
    <div class="playstyle-desc-box">${playstyleDesc}</div>
    <div class="recommended-agent-hero-card">
      <div class="recom-model-stage">
        <img src="${recomImg}" class="recom-3d-model" alt="${recomName}" loading="lazy">
        <div class="agent-role-corner-badge cyan">
          ${fullRecom.roleIcon ? `<img src="${fullRecom.roleIcon}" alt="" width="11" height="11">` : ''}
          <span>${fullRecom.role || recomRole}</span>
        </div>
      </div>
      <div class="recom-info-details">
        <div class="recom-badge-top">AI แนะนำตัวละครที่เข้ากับสไตล์ของคุณ:</div>
        <h3 class="recom-agent-name">${recomName}</h3>
        <p class="recom-strategy-advice">${recomAdvice}</p>
        <div class="recom-action-hint">แตะเพื่อดูเทคนิค &amp; สกิลของ ${recomName}</div>
      </div>
    </div>
  `;

  const recomClickBox = document.getElementById('recomAgentCardClickable');
  if (recomClickBox) {
    recomClickBox.onclick = () => openAgentDetailsModal(fullRecom, null);
  }

  // 3. Render Agent Mastery List
  if (agentsListEl) {
    agentsListEl.innerHTML = '';
    agentResults.forEach(agData => {
      const fullAg = getFullAgentData(agData.agent);
      const item = document.createElement('div');
      item.className = 'agent-perf-card';
      item.title = `คลิกเพื่อดูสถิติเจาะลึกและสกิลของ ${fullAg.displayName}`;
      const portrait = fullAg.fullPortrait || fullAg.displayIcon || 'https://media.valorant-api.com/agents/roles/4be47ced-40d3-832a-0ec4-5396661402a6/displayicon.png';
      
      item.innerHTML = `
        <div class="agent-perf-thumb-box">
          <img src="${portrait}" class="agent-perf-3d-img" alt="${fullAg.displayName}" loading="lazy">
        </div>
        <div class="agent-perf-details">
          <div class="agent-perf-name">
            <span class="ag-name-txt">${fullAg.displayName || 'Agent'}</span>
            <span class="ag-wr-badge">${agData.winRate}% WR</span>
          </div>
          <div class="agent-perf-role-tag">${(fullAg.role || 'Agent').toUpperCase()} • ${agData.games} แมตช์</div>
          <div class="agent-perf-sub">
            <span>K/D: <strong class="accent-cyan">${agData.kd}</strong></span>
            <span>ACS: <strong class="accent-gold">${agData.acs}</strong></span>
          </div>
        </div>
      `;
      item.addEventListener('click', () => openAgentDetailsModal(fullAg, agData));
      agentsListEl.appendChild(item);
    });
  }
}

// AI Mode Filter Fetch Handler
async function fetchAiAnalysisByMode(mode) {
  const bestAgentBox = document.getElementById('bestAgentBody');
  const playstyleBox = document.getElementById('playstyleBody');
  const agentsListEl = document.getElementById('agentsPerfList');

  if (bestAgentBox) bestAgentBox.innerHTML = '<div class="loading-mini-txt" style="padding:20px; text-align:center;">กำลังดึงสถิติและวิเคราะห์จาก Riot...</div>';
  if (playstyleBox) playstyleBox.innerHTML = '<div class="loading-mini-txt" style="padding:20px; text-align:center;">กำลังวิเคราะห์สไตล์...</div>';

  try {
    const queueParam = mode ? `?limit=20&queue=${encodeURIComponent(mode)}` : '?limit=20';
    const res = await apiFetch(`/api/matches${queueParam}`);
    const data = await res.json();

    if (data.ok && data.history && Array.isArray(data.history.matches)) {
      analyzePlayerPlaystyleAndBestAgent(data.history.matches, mode);
    } else {
      analyzePlayerPlaystyleAndBestAgent([], mode);
    }
  } catch (e) {
    if (allCareerMatches && allCareerMatches.length > 0) {
      const filtered = mode ? allCareerMatches.filter(m => (m.queueId || '').toLowerCase() === mode.toLowerCase()) : allCareerMatches;
      analyzePlayerPlaystyleAndBestAgent(filtered, mode);
    } else {
      analyzePlayerPlaystyleAndBestAgent([], mode);
    }
  }
}

// AI Mode Filter Pills Handler
document.querySelectorAll('#aiModePills .ai-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    playTacticalAudio('click');
    document.querySelectorAll('#aiModePills .ai-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentAiAnalysisMode = btn.dataset.aimode || '';
    fetchAiAnalysisByMode(currentAiAnalysisMode);
  });
});

document.getElementById('btnToggleReplayAudio')?.addEventListener('click', () => {
  replayAudioMuted = !replayAudioMuted;
  const btn = document.getElementById('btnToggleReplayAudio');
  if (btn) {
    btn.innerHTML = replayAudioMuted ? 
      `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--val-red)" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>` : 
      `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
    btn.title = replayAudioMuted ? 'เปิดเสียงเอฟเฟกต์' : 'ปิดเสียงเอฟเฟกต์';
  }
});

// ==========================================================
// 2D INTERACTIVE MINIMAP REPLAY ENGINE
// ==========================================================

let replayTimer = null;
let replayCurrentTime = 0; // in seconds
let replayMaxTime = 100; // in seconds
let replayIsPlaying = false;
let replaySpeed = 2.0;
let activeReplayRound = null;

function projectCoordinates(x, y, mapMeta) {
  if (x === undefined || y === undefined || x === null || y === null) return null;
  const xMult = mapMeta?.xMultiplier || 0.00007;
  const yMult = mapMeta?.yMultiplier || -0.00007;
  const xScalar = mapMeta?.xScalarToAdd || 0.5;
  const yScalar = mapMeta?.yScalarToAdd || 0.5;

  const leftPercent = (y * xMult + xScalar) * 100;
  const topPercent = (x * yMult + yScalar) * 100;

  return {
    left: Math.max(3, Math.min(97, leftPercent)),
    top: Math.max(3, Math.min(97, topPercent))
  };
}

function render2dMinimapReplay(round, match) {
  activeReplayRound = round;
  pauseReplay();

  const minimapImg = document.getElementById('replayMinimapImg');
  const slider = document.getElementById('replayTimeSlider');
  const timeDisplay = document.getElementById('replayTimeDisplay');

  if (minimapImg && match?.map?.displayIcon) {
    minimapImg.src = match.map.displayIcon;
  }

  // Calculate max round time
  let maxSecs = 90;
  if (round.killfeed && round.killfeed.length > 0) {
    const lastKill = round.killfeed[round.killfeed.length - 1];
    const lastSecs = Math.ceil((lastKill.roundTimeMillis || 0) / 1000) + 5;
    if (lastSecs > maxSecs) maxSecs = lastSecs;
  }
  replayMaxTime = Math.max(45, maxSecs);

  if (slider) {
    slider.max = replayMaxTime;
    slider.value = 0;
  }

  replayCurrentTime = 0;
  updateReplayCanvas();
}

function updateReplayCanvas() {
  const slider = document.getElementById('replayTimeSlider');
  const timeDisplay = document.getElementById('replayTimeDisplay');
  const markersLayer = document.getElementById('replayMarkersLayer');
  const tracerSvg = document.getElementById('replayTracerSvg');

  if (slider) slider.value = replayCurrentTime;
  if (timeDisplay) {
    const mins = Math.floor(replayCurrentTime / 60);
    const secs = (replayCurrentTime % 60).toString().padStart(2, '0');
    timeDisplay.textContent = `${mins}:${secs}`;
  }

  if (!markersLayer || !tracerSvg || !activeReplayRound || !currentActiveMatch) return;

  markersLayer.innerHTML = '';
  tracerSvg.innerHTML = '';

  const mapMeta = currentActiveMatch.map;
  const currentMillis = replayCurrentTime * 1000;

  // Calculate live player alive count for HUD
  let friendlyAlive = (currentActiveMatch.friendlyTeam || []).length || 5;
  let enemyAlive = (currentActiveMatch.enemyTeam || []).length || 5;

  const hudFriendly = document.getElementById('hudFriendlyAlive');
  const hudEnemy = document.getElementById('hudEnemyAlive');
  const hudTimer = document.getElementById('hudRoundTimer');
  const hudSpike = document.getElementById('hudSpikeIndicator');
  const hudSpikeCountdown = document.getElementById('hudSpikeCountdown');

  // Render Spike Plant Beacon if planted
  if (activeReplayRound.plantLocation) {
    const plantCoords = projectCoordinates(activeReplayRound.plantLocation.x, activeReplayRound.plantLocation.y, mapMeta);
    if (plantCoords) {
      const beacon = document.createElement('div');
      beacon.className = 'spike-beacon';
      beacon.style.left = `${plantCoords.left}%`;
      beacon.style.top = `${plantCoords.top}%`;
      beacon.title = `Spike Site ${activeReplayRound.plantSite || ''}`;
      markersLayer.appendChild(beacon);
    }
  }

  // Render Kills and Tracers occurred up to current time
  const kills = activeReplayRound.killfeed || [];

  kills.forEach(k => {
    const killTimeMillis = k.roundTimeMillis || 0;
    const isPast = currentMillis >= killTimeMillis;
    const isRecent = isPast && (currentMillis - killTimeMillis <= 5000);

    if (isPast) {
      if (k.victimTeam === currentActiveMatch.myTeamId) friendlyAlive = Math.max(0, friendlyAlive - 1);
      else enemyAlive = Math.max(0, enemyAlive - 1);
    }

    // Victim marker
    if (k.victimLocation) {
      const vCoords = projectCoordinates(k.victimLocation.x, k.victimLocation.y, mapMeta);
      if (vCoords) {
        const marker = document.createElement('div');
        marker.className = `replay-marker ${k.victimTeam === currentActiveMatch.myTeamId ? 'marker-friendly' : 'marker-enemy'} ${isPast ? 'marker-dead' : ''}`;
        marker.style.left = `${vCoords.left}%`;
        marker.style.top = `${vCoords.top}%`;

        const avatar = k.victimAgent?.displayIcon || 'https://media.valorant-api.com/agents/roles/4be47ced-40d3-832a-0ec4-5396661402a6/displayicon.png';
        marker.innerHTML = `
          <img src="${avatar}" class="marker-agent-avatar" alt="${k.victimName}">
          ${isPast ? '<span class="marker-death-cross"></span>' : ''}
        `;
        marker.title = `${k.victimName} (${isPast ? 'Eliminated' : 'Alive'})`;
        markersLayer.appendChild(marker);
      }
    }

    // Killer marker & Tracer Line
    if (k.killerLocation && isRecent) {
      const kCoords = projectCoordinates(k.killerLocation.x, k.killerLocation.y, mapMeta);
      const vCoords = k.victimLocation ? projectCoordinates(k.victimLocation.x, k.victimLocation.y, mapMeta) : null;

      if (kCoords) {
        const marker = document.createElement('div');
        marker.className = `replay-marker ${k.killerTeam === currentActiveMatch.myTeamId ? 'marker-friendly' : 'marker-enemy'}`;
        marker.style.left = `${kCoords.left}%`;
        marker.style.top = `${kCoords.top}%`;

        const avatar = k.killerAgent?.displayIcon || 'https://media.valorant-api.com/agents/roles/4be47ced-40d3-832a-0ec4-5396661402a6/displayicon.png';
        marker.innerHTML = `<img src="${avatar}" class="marker-agent-avatar" alt="${k.killerName}">`;
        marker.title = `${k.killerName} (Killer)`;
        markersLayer.appendChild(marker);
      }

      // Draw kill tracer line
      if (kCoords && vCoords) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', `${kCoords.left}%`);
        line.setAttribute('y1', `${kCoords.top}%`);
        line.setAttribute('x2', `${vCoords.left}%`);
        line.setAttribute('y2', `${vCoords.top}%`);
        line.setAttribute('stroke', k.killerTeam === currentActiveMatch.myTeamId ? '#00f5d4' : '#ff4655');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '4 2');
        line.setAttribute('opacity', '0.8');
        tracerSvg.appendChild(line);
      }
    }
  });

  if (hudFriendly) hudFriendly.textContent = `${friendlyAlive} ALIVE`;
  if (hudEnemy) hudEnemy.textContent = `${enemyAlive} ALIVE`;
  if (hudTimer) {
    const mins = Math.floor(replayCurrentTime / 60);
    const secs = (replayCurrentTime % 60).toString().padStart(2, '0');
    hudTimer.textContent = `${mins}:${secs}`;
  }
}

function playReplay() {
  if (replayIsPlaying) return;
  replayIsPlaying = true;

  const btnText = document.getElementById('btnPlayReplayText');
  if (btnText) btnText.textContent = 'หยุดชั่วคราว';

  const intervalMs = Math.max(50, Math.round(500 / replaySpeed));
  clearInterval(replayTimer);
  replayTimer = setInterval(() => {
    if (replayCurrentTime >= replayMaxTime) {
      pauseReplay();
      return;
    }
    replayCurrentTime += 1;
    updateReplayCanvas();
  }, intervalMs);
}

function pauseReplay() {
  replayIsPlaying = false;
  clearInterval(replayTimer);
  const btnText = document.getElementById('btnPlayReplayText');
  if (btnText) btnText.textContent = 'เล่น 2D Replay';
}

function resetReplay() {
  pauseReplay();
  replayCurrentTime = 0;
  updateReplayCanvas();
}

// Replay UI Controls Listeners
document.getElementById('btnPlayReplay')?.addEventListener('click', () => {
  if (replayIsPlaying) pauseReplay();
  else playReplay();
});

document.getElementById('btnResetReplay')?.addEventListener('click', resetReplay);

document.getElementById('replayTimeSlider')?.addEventListener('input', (e) => {
  pauseReplay();
  replayCurrentTime = parseInt(e.target.value, 10) || 0;
  updateReplayCanvas();
});

document.getElementById('replaySpeedSelect')?.addEventListener('change', (e) => {
  replaySpeed = parseFloat(e.target.value) || 2.0;
  if (replayIsPlaying) {
    pauseReplay();
    playReplay();
  }
});

// Render Round-by-Round Timeline & Killfeed
function renderRoundTimeline(match) {
  const roundsPills = document.getElementById('roundsPillsList');
  const roundBox = document.getElementById('activeRoundDetailBox');
  if (!roundsPills || !roundBox) return;

  const rounds = match.rounds || [];
  if (rounds.length === 0) {
    roundBox.innerHTML = '<div class="empty-msg" style="text-align:center; padding:30px; color:var(--val-gray);">ไม่มีข้อมูลเหตุการณ์รายรอบสำหรับโหมดนี้</div>';
    roundsPills.innerHTML = '';
    return;
  }

  roundsPills.innerHTML = '';
  rounds.forEach((r, idx) => {
    const btn = document.createElement('button');
    btn.className = `round-pill-btn ${r.isMyTeamWon ? 'round-won' : 'round-lost'} ${idx === 0 ? 'active' : ''}`;
    btn.innerHTML = `<span>R${r.roundNum}</span>`;
    btn.title = `รอบที่ ${r.roundNum} (${r.winTypeTh})`;

    btn.addEventListener('click', () => {
      document.querySelectorAll('.round-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderSingleRoundDetail(r);
      render2dMinimapReplay(r, match);
    });

    roundsPills.appendChild(btn);
  });

  renderSingleRoundDetail(rounds[0]);
  render2dMinimapReplay(rounds[0], match);
}

function renderSingleRoundDetail(round) {
  const box = document.getElementById('activeRoundDetailBox');
  if (!box || !round) return;

  const winClass = round.isMyTeamWon ? 'accent-green' : 'outcome-loss-text';
  const winLabel = round.isMyTeamWon ? 'ทีมของคุณชนะรอบนี้' : 'ทีมตรงข้ามชนะรอบนี้';

  const killfeedHtml = (round.killfeed && round.killfeed.length > 0) ? round.killfeed.map(k => `
    <div class="killfeed-row">
      <div class="killfeed-actor ${k.killerTeam === currentActiveMatch?.myTeamId ? 'friendly' : 'enemy'}">
        <img src="${k.killerAgent?.displayIcon || ''}" class="killfeed-agent-img" alt="">
        <strong>${escapeHtml(k.killerName)}</strong>
      </div>
      <div class="killfeed-weapon-wrap">
        ${k.weaponIcon ? `<img src="${k.weaponIcon}" class="killfeed-wp-icon" alt="${escapeHtml(k.weaponName)}">` : `<span>${escapeHtml(k.weaponName)}</span>`}
        ${k.isHeadshot ? '<span class="headshot-badge">HEADSHOT</span>' : ''}
        <span style="font-size:11px; color:var(--val-gray); margin-left:4px;">${escapeHtml(k.roundTime)}</span>
      </div>
      <div class="killfeed-actor ${k.victimTeam === currentActiveMatch?.myTeamId ? 'friendly' : 'enemy'}">
        <img src="${k.victimAgent?.displayIcon || ''}" class="killfeed-agent-img" alt="">
        <strong>${escapeHtml(k.victimName)}</strong>
      </div>
    </div>
  `).join('') : '<div style="color:var(--val-gray); font-size:12px; text-align:center; padding:10px;">ไม่มีการคิลในรอบนี้</div>';

  box.innerHTML = `
    <div class="round-meta-strip">
      <div>
        <span style="font-size:11px; color:var(--val-gray); letter-spacing:1px; display:block;">ผลลัพธ์รอบที่ ${round.roundNum}</span>
        <strong class="round-result-badge ${winClass}">${winLabel} (${round.winTypeTh})</strong>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        ${round.ceremonyTh ? `<span class="round-ceremony-pill">${round.ceremonyTh}</span>` : ''}
        ${round.plantSite ? `<span class="badge-tag">วางสไปก์ไซต์ ${round.plantSite}</span>` : ''}
      </div>
    </div>

    ${round.planterName ? `<div style="font-size:12px; color:var(--val-gold); margin-bottom:8px;">ผู้ติดตั้งสไปก์: <strong>${round.planterName}</strong> (Site ${round.plantSite || ''})</div>` : ''}
    ${round.defuserName ? `<div style="font-size:12px; color:var(--val-cyan); margin-bottom:8px;">ผู้กู้สไปก์: <strong>${round.defuserName}</strong></div>` : ''}

    <h5 style="font-size:12px; color:var(--val-gray); letter-spacing:1px; margin:14px 0 8px 0;">ไทม์ไลน์การคิล (KILLFEED TIMELINE)</h5>
    <div class="killfeed-list">
      ${killfeedHtml}
    </div>
  `;
}

// Render Advanced Match Analytics
function renderAdvancedStats(match) {
  const grid = document.getElementById('advancedStatsGrid');
  if (!grid || !match) return;

  const myStats = match.myStats || {};

  grid.innerHTML = `
    <div class="stat-feature-card">
      <div class="card-label">ดาเมจเฉลี่ยต่อรอบ (ADR)</div>
      <div class="card-big-val accent-gold">${myStats.adr || 0}</div>
    </div>
    <div class="stat-feature-card">
      <div class="card-label">สังหารแรก / ถูกคิลแรก (FK / FD)</div>
      <div class="card-big-val accent-cyan">${myStats.firstBloods || 0} / <span style="color:var(--val-red);">${myStats.firstDeaths || 0}</span></div>
    </div>
    <div class="stat-feature-card">
      <div class="card-label">อัตราเข้าหัว (HEADSHOT %)</div>
      <div class="card-big-val accent-green">${myStats.hsPercent || 0}%</div>
    </div>
    <div class="stat-feature-card">
      <div class="card-label">มัลติคิล (MULTI-KILLS)</div>
      <div class="card-big-val" style="font-size:18px;">
        ${myStats.aces > 0 ? `<span style="color:var(--val-gold);">ACE: ${myStats.aces}x </span>` : ''}
        <span>4K: ${myStats.quadraKills || 0}</span> | <span>3K: ${myStats.tripleKills || 0}</span> | <span>2K: ${myStats.doubleKills || 0}</span>
      </div>
    </div>
    <div class="stat-feature-card">
      <div class="card-label">วาง / กู้ สไปก์ (PLANTS / DEFUSES)</div>
      <div class="card-big-val accent-cyan">${myStats.plants || 0} / ${myStats.defuses || 0}</div>
    </div>
    <div class="stat-feature-card">
      <div class="card-label">ประสิทธิภาพการเงิน (ECON RATING)</div>
      <div class="card-big-val accent-gold">${myStats.econRating || 0}</div>
    </div>
  `;
}

// Close Match Modal
function closeMatchModalHandler() {
  playTacticalAudio('close');
  matchModal?.classList.add('hidden');
}

btnCloseMatchModal?.addEventListener('click', closeMatchModalHandler);
matchModal?.addEventListener('click', (e) => {
  if (e.target === matchModal) closeMatchModalHandler();
});

// Career Queue Filters
document.querySelectorAll('#careerQueuePills .cat-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#careerQueuePills .cat-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCareerQueue = btn.dataset.queue || '';
    loadCareer();
  });
});

// Refresh Matches Button
btnRefreshMatches?.addEventListener('click', async () => {
  btnRefreshMatches.innerHTML = `<span>กำลังดึงข้อมูล...</span>`;
  btnRefreshMatches.disabled = true;
  await loadCareer();
  btnRefreshMatches.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg> <span>รีเฟรชประวัติ</span>`;
  btnRefreshMatches.disabled = false;
});

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.update().catch(() => {});
    }).catch(err => {
      console.log('SW registration failed:', err);
    });
  });
}

// PWA Install Prompt Handler
let deferredInstallPrompt = null;
const btnInstallPwa = document.getElementById('btnInstallPwa');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (btnInstallPwa) {
    btnInstallPwa.classList.remove('hidden');
  }
});

btnInstallPwa?.addEventListener('click', async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      btnInstallPwa.classList.add('hidden');
    }
    deferredInstallPrompt = null;
  }
});

// ==========================================================
// AUTHENTIC VALORANT IN-GAME INSPECT STAGE CONTROLLER
// ==========================================================
let isInspectDragging = false;
let startInspectX = 0;
let startInspectY = 0;
let inspectRotX = 0;
let inspectRotY = 0;
let lastInspectSoundTime = 0;

function resetInspectTransform() {
  inspectRotX = 0;
  inspectRotY = 0;
  const wrap = document.getElementById('inspectWeaponWrap');
  const spotlight = document.getElementById('inspectSpotlight');
  if (wrap) wrap.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)';
  if (spotlight) spotlight.style.transform = 'translate(-50%, -50%)';
}

function initInspectStageControls() {
  const stage = document.getElementById('tacticalInspectStage');
  const wrap = document.getElementById('inspectWeaponWrap');
  const spotlight = document.getElementById('inspectSpotlight');
  const hint = document.getElementById('turntableHint');

  if (!stage) return;

  stage.addEventListener('pointerdown', (e) => {
    isInspectDragging = true;
    startInspectX = e.clientX;
    startInspectY = e.clientY;
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    if (hint) hint.style.opacity = '0';
  });

  stage.addEventListener('pointermove', (e) => {
    if (!stage || !wrap) return;
    const rect = stage.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // 3D Perspective Tilt on Move
    const rotY = x * 28;
    const rotX = -y * 20;
    const translateY = y * 4;

    wrap.style.transform = `perspective(900px) rotateY(${rotY}deg) rotateX(${rotX}deg) translateY(${translateY}px) scale3d(1.03, 1.03, 1.03)`;

    // Move Spotlight along with pointer
    if (spotlight) {
      const spotX = e.clientX - rect.left;
      const spotY = e.clientY - rect.top;
      spotlight.style.left = `${spotX}px`;
      spotlight.style.top = `${spotY}px`;
    }

    const now = Date.now();
    if (now - lastInspectSoundTime > 90) {
      lastInspectSoundTime = now;
      playTacticalAudio('hover');
    }
  });

  const onPointerEnd = (e) => {
    isInspectDragging = false;
    try { stage.releasePointerCapture(e.pointerId); } catch (err) {}
    if (wrap) {
      wrap.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translateY(0px) scale3d(1, 1, 1)';
    }
    if (spotlight) {
      spotlight.style.left = '50%';
      spotlight.style.top = '50%';
    }
  };

  stage.addEventListener('pointerup', onPointerEnd);
  stage.addEventListener('pointerleave', onPointerEnd);
  stage.addEventListener('pointercancel', onPointerEnd);
}

// Close Modal Handler
function closeModalHandler() {
  playTacticalAudio('close');
  resetInspectTransform();
  skinModal?.classList.add('hidden');
  const player = document.getElementById('modalVideoPlayer');
  if (player) {
    player.pause();
    player.src = '';
  }
}

// ==========================================================
// VP PRICE COMPARISON & OVERTOPUP COMPARATOR MODULE
// ==========================================================
let customShopDebounceTimer = null;
let inputCalcVpDebounceTimer = null;

// OverTopup Live Packages Database (https://www.overtopup.com/th/game-topup/valorant)
const DEFAULT_VP_STORES = {
  overtopup: {
    id: "overtopup",
    name: "Over Topup (overtopup.com)",
    shortName: "Over Topup",
    badge: "เรทคุ้มสุด (~18-25% OFF)",
    trustLevel: "ร้านค้าจดทะเบียนทางการ OverTopup",
    type: "partner",
    accentColor: "#00F5D4",
    logoIcon: "",
    webUrl: "https://www.overtopup.com/th/game-topup/valorant",
    paymentMethods: ["PromptPay QR", "โอนผ่านธนาคาร", "TrueMoney"],
    description: "เติมเกม Valorant สะดวก รวดเร็ว เพียงกรอก Riot ID ไทย รับ VP อัตโนมัติในเกม",
    packages: [
      { vp: 475, price: 123, bonusVp: 0, tag: "475 VP" },
      { vp: 1000, price: 246, bonusVp: 0, tag: "1,000 VP" },
      { vp: 1475, price: 368, bonusVp: 0, tag: "1,475 VP" },
      { vp: 2050, price: 489, bonusVp: 0, tag: "2,050 VP" },
      { vp: 2525, price: 616, bonusVp: 0, tag: "2,525 VP" },
      { vp: 3050, price: 737, bonusVp: 0, tag: "3,050 VP" },
      { vp: 3650, price: 866, bonusVp: 0, tag: "3,650 VP" },
      { vp: 4100, price: 977, bonusVp: 0, tag: "4,100 VP" },
      { vp: 4125, price: 991, bonusVp: 0, tag: "4,125 VP" },
      { vp: 4650, price: 1112, bonusVp: 0, tag: "4,650 VP" },
      { vp: 5350, price: 1241, bonusVp: 0, tag: "5,350 VP" },
      { vp: 5825, price: 1361, bonusVp: 0, tag: "5,825 VP" },
      { vp: 6350, price: 1487, bonusVp: 0, tag: "6,350 VP" },
      { vp: 6825, price: 1607, bonusVp: 0, tag: "6,825 VP" },
      { vp: 7150, price: 1709, bonusVp: 0, tag: "7,150 VP" },
      { vp: 7400, price: 1732, bonusVp: 0, tag: "7,400 VP" },
      { vp: 7875, price: 1852, bonusVp: 0, tag: "7,875 VP" },
      { vp: 8200, price: 1959, bonusVp: 0, tag: "8,200 VP" },
      { vp: 8400, price: 1978, bonusVp: 0, tag: "8,400 VP" },
      { vp: 8750, price: 2089, bonusVp: 0, tag: "8,750 VP" },
      { vp: 9000, price: 2107, bonusVp: 0, tag: "9,000 VP" },
      { vp: 9800, price: 2334, bonusVp: 0, tag: "9,800 VP" },
      { vp: 11000, price: 2482, bonusVp: 0, tag: "11,000 VP" },
      { vp: 12000, price: 2733, bonusVp: 0, tag: "12,000 VP" },
      { vp: 13050, price: 2978, bonusVp: 0, tag: "13,050 VP" },
      { vp: 14650, price: 3353, bonusVp: 0, tag: "14,650 VP" },
      { vp: 16350, price: 3733, bonusVp: 0, tag: "16,350 VP" },
      { vp: 22000, price: 4964, bonusVp: 0, tag: "22,000 VP" }
    ]
  },
  riot_official: {
    id: "riot_official",
    name: "Riot Games In-Game Direct (ทางการในเกม)",
    shortName: "Riot ทางการ (In-Game)",
    badge: "ราคาปกติในเกม",
    trustLevel: "Direct Riot In-Game Client",
    type: "official",
    accentColor: "#FF4655",
    logoIcon: "",
    webUrl: "https://playvalorant.com",
    paymentMethods: ["PromptPay QR", "TrueMoney Wallet", "บัตรเครดิต/เดบิต", "AIS / Dtac / True"],
    description: "เติมตรงผ่านหน้าร้านค้าในเกม VALORANT เรทมาตรฐานสากลของ Riot Games",
    packages: [
      { vp: 500, price: 150, bonusVp: 0, tag: "500 VP" },
      { vp: 1000, price: 300, bonusVp: 0, tag: "1,000 VP" },
      { vp: 2050, price: 600, bonusVp: 50, tag: "2,050 VP" },
      { vp: 3650, price: 1000, bonusVp: 350, tag: "3,650 VP" },
      { vp: 5600, price: 1500, bonusVp: 600, tag: "5,600 VP" },
      { vp: 11500, price: 3000, bonusVp: 1500, tag: "11,500 VP" }
    ]
  }
};

// Client-side exact Knapsack solver
function solveTopupCombinationLocal(targetVp, packages) {
  if (targetVp <= 0) {
    return { totalPrice: 0, totalVp: 0, leftoverVp: 0, combination: [] };
  }
  const pkgs = [...packages].sort((a, b) => a.price - b.price);
  const maxPkgVp = Math.max(...pkgs.map(p => p.vp));
  const searchLimit = targetVp + maxPkgVp + 100;
  const dp = new Array(searchLimit + 1);
  dp[0] = { cost: 0, prevV: -1, pkgIndex: -1 };

  for (let v = 0; v <= searchLimit; v++) {
    if (!dp[v]) continue;
    for (let i = 0; i < pkgs.length; i++) {
      const nextV = v + pkgs[i].vp;
      if (nextV > searchLimit) continue;
      const nextCost = dp[v].cost + pkgs[i].price;
      if (!dp[nextV] || nextCost < dp[nextV].cost) {
        dp[nextV] = { cost: nextCost, prevV: v, pkgIndex: i };
      }
    }
  }

  let bestV = -1;
  let minCost = Infinity;
  for (let v = targetVp; v <= searchLimit; v++) {
    if (dp[v] && dp[v].cost < minCost) {
      minCost = dp[v].cost;
      bestV = v;
    } else if (dp[v] && dp[v].cost === minCost && (bestV === -1 || v > bestV)) {
      bestV = v;
    }
  }

  if (bestV === -1 || minCost === Infinity) {
    const largest = pkgs[pkgs.length - 1];
    const count = Math.ceil(targetVp / largest.vp);
    return {
      totalPrice: count * largest.price,
      totalVp: count * largest.vp,
      leftoverVp: (count * largest.vp) - targetVp,
      combination: [{ package: largest, count, subtotalPrice: count * largest.price, subtotalVp: count * largest.vp }]
    };
  }

  const counts = {};
  let curr = bestV;
  while (curr > 0 && dp[curr] && dp[curr].pkgIndex !== -1) {
    const idx = dp[curr].pkgIndex;
    counts[idx] = (counts[idx] || 0) + 1;
    curr = dp[curr].prevV;
  }

  const combination = [];
  for (const idx in counts) {
    combination.push({
      package: pkgs[idx],
      count: counts[idx],
      subtotalPrice: counts[idx] * pkgs[idx].price,
      subtotalVp: counts[idx] * pkgs[idx].vp
    });
  }
  combination.sort((a, b) => b.package.vp - a.package.vp);

  return {
    totalPrice: minCost,
    totalVp: bestV,
    leftoverVp: bestV - targetVp,
    combination
  };
}

function calculateAllStoresLocal(targetVp, currentWalletVp, deductWallet) {
  const neededVp = deductWallet ? Math.max(0, targetVp - currentWalletVp) : targetVp;
  const officialSol = solveTopupCombinationLocal(neededVp, DEFAULT_VP_STORES.riot_official.packages);
  const officialPrice = officialSol.totalPrice;

  const stores = [];
  for (const [storeId, store] of Object.entries(DEFAULT_VP_STORES)) {
    const sol = solveTopupCombinationLocal(neededVp, store.packages);
    const savingsThb = Math.max(0, officialPrice - sol.totalPrice);
    const savingsPct = officialPrice > 0 ? ((savingsThb / officialPrice) * 100).toFixed(1) : "0.0";
    const ratePerVp = sol.totalVp > 0 ? (sol.totalPrice / sol.totalVp).toFixed(4) : "0.3000";
    const ratePer100Vp = sol.totalVp > 0 ? ((sol.totalPrice / sol.totalVp) * 100).toFixed(2) : "30.00";

    stores.push({
      storeId,
      name: store.name,
      shortName: store.shortName,
      badge: store.badge,
      trustLevel: store.trustLevel,
      type: store.type,
      accentColor: store.accentColor,
      logoIcon: store.logoIcon,
      webUrl: store.webUrl,
      paymentMethods: store.paymentMethods,
      description: store.description,
      totalPrice: sol.totalPrice,
      totalVp: sol.totalVp,
      leftoverVp: sol.leftoverVp,
      combination: sol.combination,
      ratePerVp: parseFloat(ratePerVp),
      ratePer100Vp: parseFloat(ratePer100Vp),
      savingsThb,
      savingsPct: parseFloat(savingsPct)
    });
  }

  stores.sort((a, b) => {
    if (a.totalPrice !== b.totalPrice) return a.totalPrice - b.totalPrice;
    return b.totalVp - a.totalVp;
  });

  stores.forEach((res, index) => {
    res.rank = index + 1;
    if (res.storeId === "overtopup") {
      res.isCheapest = true;
      res.rankTitle = "Over Topup (ประหยัดที่สุด)";
    } else {
      res.rankTitle = "Riot Games Official (ราคาปกติในเกม)";
    }
  });

  const overtopupResult = stores.find(s => s.storeId === "overtopup") || stores[0];
  const maxSavings = Math.max(0, officialPrice - overtopupResult.totalPrice);

  return {
    targetVp,
    currentWalletVp,
    deductWallet,
    neededVp,
    cheapestStore: overtopupResult,
    officialPrice,
    maxSavingsThb: maxSavings,
    maxSavingsPct: officialPrice > 0 ? ((maxSavings / officialPrice) * 100).toFixed(1) : 0,
    stores
  };
}

// Open VP Comparison Modal
window.openVpCompareModal = function(presetVp = null) {
  playTacticalAudio("open");
  const modal = document.getElementById("vpCalcModal");
  if (!modal) return;

  if (presetVp !== null && !isNaN(presetVp) && presetVp > 0) {
    const input = document.getElementById("inputCalcVp");
    if (input) input.value = presetVp;

    document.querySelectorAll(".calc-preset-btn").forEach(btn => {
      btn.classList.toggle("active", parseInt(btn.dataset.vp, 10) === presetVp);
    });
  }

  modal.classList.remove("hidden");
  updateVpCalculator();
  loadAllStoresMatrix();
};

// Close VP Comparison Modal
function closeVpCompareModal() {
  playTacticalAudio("close");
  const modal = document.getElementById("vpCalcModal");
  if (modal) modal.classList.add("hidden");
}

// Update VP Calculator UI
async function updateVpCalculator() {
  const inputEl = document.getElementById("inputCalcVp");
  const targetVp = parseInt(inputEl?.value || "1775", 10) || 0;
  
  let walletVp = 0;
  if (typeof currentUserData !== "undefined" && currentUserData?.wallet?.vp !== undefined) {
    walletVp = currentUserData.wallet.vp;
  } else {
    const walletText = document.getElementById("walletVp")?.textContent?.replace(/,/g, "");
    walletVp = parseInt(walletText, 10) || 0;
  }

  const deductWallet = document.getElementById("checkDeductWallet")?.checked ?? true;

  const labelWallet = document.getElementById("labelCurrentVpInWallet");
  if (labelWallet) labelWallet.textContent = `(ในไอดีมี: ${walletVp.toLocaleString()} VP)`;

  const targetVpDisplay = document.getElementById("calcTargetVpDisplay");
  if (targetVpDisplay) targetVpDisplay.textContent = `${targetVp.toLocaleString()} VP`;

  const walletDisplay = document.getElementById("calcWalletBalance");
  if (walletDisplay) walletDisplay.textContent = `${walletVp.toLocaleString()} VP`;

  const neededVp = deductWallet ? Math.max(0, targetVp - walletVp) : targetVp;
  const neededDisplay = document.getElementById("calcNeededVp");
  if (neededDisplay) {
    neededDisplay.textContent = `${neededVp.toLocaleString()} VP`;
    if (neededVp === 0 && targetVp > 0) {
      neededDisplay.textContent = "0 VP (มีพอแล้ว)";
      neededDisplay.style.color = "var(--val-cyan)";
    } else {
      neededDisplay.style.color = "var(--val-gold)";
    }
  }

  let result = null;
  try {
    const res = await apiFetch(`/api/vp-pricing/compare?vp=${targetVp}&wallet=${walletVp}&deduct=${deductWallet}`);
    const data = await res.json();
    if (data.ok && data.comparison) {
      result = data.comparison;
    }
  } catch (err) {
    // fallback to local
  }

  if (!result) {
    result = calculateAllStoresLocal(targetVp, walletVp, deductWallet);
  }

  renderVpComparisonResults(result);
}

// Render Comparison Results UI
function renderVpComparisonResults(result) {
  const winner = result.cheapestStore;
  if (!winner) return;

  const winnerStoreNameEl = document.getElementById("winnerStoreName");
  const winnerStoreTagEl = document.getElementById("winnerStoreTag");
  const winnerPriceThbEl = document.getElementById("winnerPriceThb");
  const winnerSavingsTagEl = document.getElementById("winnerSavingsTag");
  const winnerComboNoteEl = document.getElementById("winnerComboNote");

  if (winnerStoreNameEl) winnerStoreNameEl.textContent = "Over Topup (overtopup.com)";
  if (winnerStoreTagEl) winnerStoreTagEl.textContent = "เติมเข้า Riot ID ไทย อัตโนมัติ • PromptPay / โอนธนาคาร";
  if (winnerPriceThbEl) winnerPriceThbEl.textContent = `~${winner.totalPrice.toLocaleString()}`;

  if (winnerSavingsTagEl) {
    if (result.maxSavingsThb > 0) {
      winnerSavingsTagEl.textContent = `ประหยัดได้ ${result.maxSavingsThb.toLocaleString()} ฿ (-${result.maxSavingsPct}% จากเติมในเกม)`;
      winnerSavingsTagEl.style.display = "inline-block";
    } else {
      winnerSavingsTagEl.textContent = "ราคาใกล้เคียงกับในเกม";
      winnerSavingsTagEl.style.display = "inline-block";
    }
  }

  if (winnerComboNoteEl) {
    if (winner.combination && winner.combination.length > 0) {
      const comboTxt = winner.combination.map(c => `${c.count}x ${c.package.tag} (${c.subtotalPrice}฿)`).join(" + ");
      winnerComboNoteEl.innerHTML = `<span>แพ็กเกจที่แนะนำบน OverTopup: <strong>${comboTxt}</strong> (ได้รับรวม <strong>${winner.totalVp.toLocaleString()} VP</strong>, เหลือ <strong>${winner.leftoverVp.toLocaleString()} VP</strong> หลังซื้อ)</span>`;
    } else {
      winnerComboNoteEl.innerHTML = `<span>คุณมี VP ในกระเป๋าเพียงพอสำหรับซื้อสกินนี้แล้ว ไม่จำเป็นต้องเติมเงินเพิ่ม!</span>`;
    }
  }

  const grid = document.getElementById("storesComparisonGrid");
  if (!grid) return;
  grid.innerHTML = "";

  result.stores.forEach((st) => {
    const card = document.createElement("div");
    card.className = `store-rank-card ${st.isCheapest ? "is-cheapest" : ""}`;

    const isOver = st.storeId === "overtopup";
    const comboSummary = st.combination && st.combination.length > 0
      ? st.combination.map(c => `${c.count}x ${c.package.tag}`).join(" + ")
      : "ไม่ต้องเติมเพิ่ม";

    const payMethodsHtml = (st.paymentMethods || []).map(m => `<span class="pay-tag">${m}</span>`).join("");

    card.innerHTML = `
      <div class="store-card-header">
        <div class="store-header-left">
          <span class="store-rank-badge ${isOver ? "rank-1" : "rank-other"}">${isOver ? "อันดับ 1 (OverTopup)" : "ราคาปกติ (ในเกม)"}</span>
          <div>
            <div class="store-name-title">${st.logoIcon || ""} ${st.name}</div>
            <span class="store-trust-pill">${st.badge} • ${st.trustLevel}</span>
          </div>
        </div>
        <div class="store-price-tag-box">
          <div class="store-main-price">${st.totalPrice.toLocaleString()} ฿</div>
          ${st.savingsThb > 0 ? `<span class="store-savings-tag">ประหยัด ${st.savingsThb} ฿ (-${st.savingsPct}%)</span>` : `<span class="store-savings-tag" style="color:var(--val-gray);">ราคาปกติ</span>`}
        </div>
      </div>

      <div class="store-combo-box">
        <span class="store-combo-label">แพ็กเกจที่ต้องกดซื้อ:</span>
        <div class="store-combo-list">${comboSummary}</div>
      </div>

      <div class="store-meta-grid">
        <div class="store-meta-item">ได้รับรวม: <strong>${st.totalVp.toLocaleString()} VP</strong></div>
        <div class="store-meta-item">คงเหลือในไอดี: <strong>+${st.leftoverVp.toLocaleString()} VP</strong></div>
        <div class="store-meta-item">เฉลี่ยต่อ 100 VP: <strong>${st.ratePer100Vp} ฿</strong></div>
        <div class="store-meta-item">สถานะ: <strong>${isOver ? "ประหยัดกว่า 18-25%" : "เรทมาตรฐานในเกม"}</strong></div>
      </div>

      <div class="store-paymethods-tags">
        ${payMethodsHtml}
      </div>

      ${isOver ? `
        <a href="https://www.overtopup.com/th/game-topup/valorant" target="_blank" rel="noopener noreferrer" class="store-action-btn" style="background:var(--val-cyan); color:#080B10; font-weight:800;">
          <span>สั่งซื้อที่ OverTopup (overtopup.com)</span>
        </a>
      ` : `
        <div style="font-size:11px; color:var(--val-gray); text-align:center; padding:4px 0;">เติมผ่านหน้าร้านค้าในเกม VALORANT (F10 / กดที่ไอคอน VP)</div>
      `}
    `;

    grid.appendChild(card);
  });
}

// Load OverTopup 28-package Matrix Table
async function loadAllStoresMatrix() {
  const tbody = document.getElementById("matrixTableBody");
  if (!tbody) return;

  const overPackages = DEFAULT_VP_STORES.overtopup.packages;
  tbody.innerHTML = "";

  overPackages.forEach(pkg => {
    const officialSol = solveTopupCombinationLocal(pkg.vp, DEFAULT_VP_STORES.riot_official.packages);
    const savings = Math.max(0, officialSol.totalPrice - pkg.price);
    const savingsPct = officialSol.totalPrice > 0 ? ((savings / officialSol.totalPrice) * 100).toFixed(1) : "0.0";
    const ratePer100 = ((pkg.price / pkg.vp) * 100).toFixed(2);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${pkg.vp.toLocaleString()} VP</strong></td>
      <td class="matrix-cheapest-cell"><strong>${pkg.price.toLocaleString()} ฿ [BEST]</strong></td>
      <td style="color:var(--val-gray); font-weight:600;">${officialSol.totalPrice.toLocaleString()} ฿</td>
      <td style="color:var(--val-gold); font-weight:700;">+${savings.toLocaleString()} ฿</td>
      <td><span class="hero-savings-pill" style="font-size:10.5px;">-${savingsPct}%</span></td>
      <td style="color:#d0e0f0;">${ratePer100} ฿</td>
    `;
    tbody.appendChild(row);
  });
}

// Initialize VP Compare Module Listeners
function initVpCompareModule() {
  const btnOpen = document.getElementById("btnOpenVpCalc");
  const btnClose = document.getElementById("btnCloseVpCalcModal");
  const modal = document.getElementById("vpCalcModal");

  btnOpen?.addEventListener("click", () => window.openVpCompareModal());
  btnClose?.addEventListener("click", closeVpCompareModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeVpCompareModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
      closeVpCompareModal();
    }
  });

  // Modal Subtab Switchers
  const subnavBtns = modal?.querySelectorAll(".subnav-tab-btn");
  subnavBtns?.forEach(btn => {
    btn.addEventListener("click", () => {
      playTacticalAudio("click");
      subnavBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const mode = btn.dataset.vpmode;
      document.getElementById("vpOptimizerPanel")?.classList.toggle("hidden", mode !== "optimizer");
      document.getElementById("vpMatrixPanel")?.classList.toggle("hidden", mode !== "matrix");
      document.getElementById("vpCustomPanel")?.classList.toggle("hidden", mode !== "custom");

      if (mode === "matrix") loadAllStoresMatrix();
    });
  });

  // Preset Buttons
  modal?.querySelectorAll(".calc-preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      playTacticalAudio("click");
      modal.querySelectorAll(".calc-preset-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const vp = parseInt(btn.dataset.vp, 10);
      const input = document.getElementById("inputCalcVp");
      if (input) input.value = vp;
      updateVpCalculator();
    });
  });

  // VP Input Real-time debounce
  const inputVp = document.getElementById("inputCalcVp");
  inputVp?.addEventListener("input", () => {
    clearTimeout(inputCalcVpDebounceTimer);
    inputCalcVpDebounceTimer = setTimeout(() => {
      const val = parseInt(inputVp.value, 10);
      modal?.querySelectorAll(".calc-preset-btn").forEach(b => {
        b.classList.toggle("active", parseInt(b.dataset.vp, 10) === val);
      });
      updateVpCalculator();
    }, 150);
  });

  // Deduct Wallet Checkbox
  document.getElementById("checkDeductWallet")?.addEventListener("change", () => {
    playTacticalAudio("click");
    updateVpCalculator();
  });

  // Pull from Wishlist Button
  document.getElementById("btnCalcPullWishlist")?.addEventListener("click", () => {
    playTacticalAudio("click");
    const wishlistUuids = Array.from(wishlistSet || []);
    if (wishlistUuids.length === 0) {
      alert("คุณยังไม่มีสกินที่บันทึก Wishlist ไว้ในรายการ");
      return;
    }

    let totalWishlistVp = 0;
    wishlistUuids.forEach(uuid => {
      const skin = (typeof skinCatalog !== "undefined" && skinCatalog.getSkinById) ? skinCatalog.getSkinById(uuid) : null;
      if (skin && skin.price) {
        totalWishlistVp += skin.price;
      } else {
        totalWishlistVp += 1775;
      }
    });

    if (totalWishlistVp <= 0) totalWishlistVp = wishlistUuids.length * 1775;

    const input = document.getElementById("inputCalcVp");
    if (input) input.value = totalWishlistVp;
    updateVpCalculator();
  });

  // Pull from Daily Shop Button
  document.getElementById("btnCalcPullDailyShop")?.addEventListener("click", () => {
    playTacticalAudio("click");
    if (!currentStore || !currentStore.dailyOffers || currentStore.dailyOffers.length === 0) {
      alert("ไม่พบข้อมูลร้านค้าประจำวัน กรุณาล็อกอินหรือรีเฟรชร้านค้าก่อน");
      return;
    }

    const totalDailyVp = currentStore.dailyOffers.reduce((sum, s) => sum + (s.price || 0), 0);
    const input = document.getElementById("inputCalcVp");
    if (input) input.value = totalDailyVp || 7100;
    updateVpCalculator();
  });

  // Pull from Featured Bundle Button
  document.getElementById("btnCalcPullBundle")?.addEventListener("click", () => {
    playTacticalAudio("click");
    if (!currentStore || !currentStore.featuredBundles || currentStore.featuredBundles.length === 0) {
      alert("ไม่พบข้อมูลบันเดิลเด่นในขณะนี้");
      return;
    }

    const b = currentStore.featuredBundles[0];
    const bundleVp = b.totalDiscountedCost || b.totalBaseCost || b.price || 7100;
    const input = document.getElementById("inputCalcVp");
    if (input) input.value = bundleVp;
    updateVpCalculator();
  });
}

// App Bootstrap
updateSoundToggleUi();
initInspectStageControls();
initVpCompareModule();
loadWeaponsList();
loadAllAgents();
checkAuth();

// ==========================================================
// 3D HOLOGRAPHIC MOUSE PARALLAX TRACKER (60 FPS BUTTERY)
// ==========================================================
document.addEventListener('mousemove', (e) => {
  const card = e.target.closest('.skin-card, .bundle-hero, .agent-catalog-card');
  if (card) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = Math.round((x / rect.width) * 100);
    const py = Math.round((y / rect.height) * 100);
    card.style.setProperty('--mouse-x', `${px}%`);
    card.style.setProperty('--mouse-y', `${py}%`);
  }
});

// ==========================================================
// TACTILE HOVER SOUND FEEDBACK (SMOOTH & LIGHT DEBOUNCED)
// ==========================================================
let lastMotionSoundTime = 0;

document.addEventListener('mouseover', (e) => {
  const interactive = e.target.closest('.skin-card, .agent-catalog-card, .match-card, .btn, .cat-pill, .mode-tab-btn, .tab-btn, .chroma-pill, .level-card, .btn-wishlist-star, .btn-inspect, .btn-bundle-calc, .btn-pill, .btn-terminal-action');
  if (interactive && !interactive.contains(e.relatedTarget)) {
    const now = Date.now();
    if (now - lastMotionSoundTime > 90) {
      lastMotionSoundTime = now;
      playTacticalAudio('hover');
    }
  }
});

// ==========================================================
// DYNAMIC SCROLL AUDIO & SCROLL REVEAL OBSERVER (60 FPS)
// ==========================================================
let lastScrollAudioTime = 0;
let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;

window.addEventListener('scroll', () => {
  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollDiff = Math.abs(currentScrollTop - lastScrollTop);
  
  if (scrollDiff > 40) {
    const now = Date.now();
    if (now - lastScrollAudioTime > 90) {
      lastScrollAudioTime = now;
      lastScrollTop = currentScrollTop;
      playTacticalAudio('scroll_tick');
    }
  }
}, { passive: true });

// Universal IntersectionObserver for Staggered Scroll Animations
const scrollRevealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
    }
  });
}, {
  threshold: 0.05,
  rootMargin: '0px 0px -30px 0px'
});

function observeScrollElements() {
  document.querySelectorAll('.skin-card, .bundle-hero, .section-header, .career-summary-card, .agent-catalog-card, .tactical-login-card, .all-agents-catalog-grid, .night-market-card, .bundle-item-card').forEach(el => {
    if (!el.classList.contains('scroll-observed')) {
      el.classList.add('scroll-observed', 'scroll-reveal');
      scrollRevealObserver.observe(el);
    }
  });
}

// Observe on initial load and periodically when new cards render
observeScrollElements();
setInterval(observeScrollElements, 800);

// ==========================================================
// 1. PLAYER INVENTORY & ACCOUNT VALUATION MODULE
// ==========================================================
let playerInventoryData = null;
let filteredInvSkins = [];

async function loadPlayerInventory(forceRefresh = false) {
  const grid = document.getElementById('invSkinsGrid');
  if (!grid) return;

  if (playerInventoryData && !forceRefresh) {
    renderInventoryView(playerInventoryData);
    return;
  }

  grid.innerHTML = `
    <div class="catalog-loading-state" style="grid-column: 1 / -1; padding: 60px 20px; text-align: center;">
      <div class="loading-spinner"></div>
      <div style="font-family:var(--font-heading); font-size:18px; font-weight:700; color:var(--val-cyan); margin-top:14px; letter-spacing:1px;">
        กำลังตรวจสอบคลังสกินและประเมินมูลค่าไอดีจาก Riot Games...
      </div>
      <div style="font-size:12px; color:var(--val-gray); margin-top:4px;">ระบบกำลังสแกนไอเทมที่ครอบครองทั้งหมด</div>
    </div>
  `;

  try {
    const res = await apiFetch('/api/inventory');
    const data = await res.json();

    if (!data.ok || !data.inventory) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">ไม่สามารถโหลดคลังสกินได้ (${escapeHtml(data.error || 'กรุณาลองใหม่อีกครั้ง')})</div>`;
      return;
    }

    playerInventoryData = data.inventory;
    populateInventoryWeaponFilter(playerInventoryData);
    renderInventoryView(playerInventoryData);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">เกิดข้อผิดพลาดในการเชื่อมต่อคลังสกิน: ${escapeHtml(err.message)}</div>`;
  }
}

function renderInventoryView(inv) {
  // 1. Render Highlights
  const vpEl = document.getElementById('invTotalVp');
  const thbOverEl = document.getElementById('invTotalThbOver');
  const thbRiotEl = document.getElementById('invTotalThbRiot');
  const countEl = document.getElementById('invTotalSkinsCount');
  const tierBreakdownEl = document.getElementById('invTierBreakdown');

  if (vpEl) vpEl.innerHTML = `${(inv.totalVpValue || 0).toLocaleString()} <span class="unit-vp">VP</span>`;
  if (thbOverEl) thbOverEl.textContent = `~${(inv.estimatedThbOverTopup || 0).toLocaleString()} ฿`;
  if (thbRiotEl) thbRiotEl.textContent = `~${(inv.estimatedThbRiotOfficial || 0).toLocaleString()} ฿`;
  if (countEl) countEl.innerHTML = `${(inv.totalSkinsCount || 0).toLocaleString()} <span class="unit-vp">ชิ้น</span>`;

  // 2. Render Tier Breakdown Chips
  if (tierBreakdownEl && inv.tierBreakdown) {
    const tb = inv.tierBreakdown;
    tierBreakdownEl.innerHTML = `
      <div class="inv-tier-chip"><span class="tier-dot" style="background:#F5D36C;"></span>Ultra: <strong>${tb.ultra || 0}</strong></div>
      <div class="inv-tier-chip"><span class="tier-dot" style="background:#FF9900;"></span>Exclusive: <strong>${tb.exclusive || 0}</strong></div>
      <div class="inv-tier-chip"><span class="tier-dot" style="background:#B366FF;"></span>Premium: <strong>${tb.premium || 0}</strong></div>
      <div class="inv-tier-chip"><span class="tier-dot" style="background:#2ECC71;"></span>Deluxe: <strong>${tb.deluxe || 0}</strong></div>
      <div class="inv-tier-chip"><span class="tier-dot" style="background:#3498DB;"></span>Select: <strong>${tb.select || 0}</strong></div>
    `;
  }

  filterAndRenderInventoryGrid();
}

function populateInventoryWeaponFilter(inv) {
  const select = document.getElementById('filterInvWeapon');
  if (!select || !inv.weaponBreakdown) return;

  const currentVal = select.value;
  select.innerHTML = '<option value="all">อาวุธทั้งหมด (All Weapons)</option>';

  Object.entries(inv.weaponBreakdown)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([weapon, info]) => {
      const opt = document.createElement('option');
      opt.value = weapon;
      opt.textContent = `${weapon} (${info.count} สกิน • ${info.totalVp.toLocaleString()} VP)`;
      select.appendChild(opt);
    });

  if (currentVal) select.value = currentVal;
}

function filterAndRenderInventoryGrid() {
  const grid = document.getElementById('invSkinsGrid');
  if (!grid || !playerInventoryData) return;

  const search = (document.getElementById('invSearchInput')?.value || '').toLowerCase().trim();
  const weaponFilter = document.getElementById('filterInvWeapon')?.value || 'all';
  const sort = document.getElementById('filterInvSort')?.value || 'equipped';

  let list = [...(playerInventoryData.skins || [])];

  if (search) {
    list = list.filter(s => 
      (s.name || '').toLowerCase().includes(search) || 
      (s.weaponType || '').toLowerCase().includes(search) ||
      (s.contentTier?.name || '').toLowerCase().includes(search)
    );
  }

  if (weaponFilter !== 'all') {
    list = list.filter(s => (s.weaponType || '').toLowerCase() === weaponFilter.toLowerCase());
  }

  if (sort === 'equipped') {
    list.sort((a, b) => {
      if (b.isEquipped !== a.isEquipped) return b.isEquipped ? 1 : -1;
      return (b.estimatedVpPrice || 0) - (a.estimatedVpPrice || 0);
    });
  } else if (sort === 'price_desc') {
    list.sort((a, b) => (b.estimatedVpPrice || 0) - (a.estimatedVpPrice || 0));
  } else if (sort === 'price_asc') {
    list.sort((a, b) => (a.estimatedVpPrice || 0) - (b.estimatedVpPrice || 0));
  } else if (sort === 'name_asc') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 50px 20px; text-align: center;">
        <div style="font-size:16px; color:var(--val-gray);">ไม่พบสกินที่ตรงกับเงื่อนไขการค้นหาในคลังของคุณ</div>
      </div>
    `;
    return;
  }

  grid.innerHTML = '';
  list.forEach(skin => {
    const card = document.createElement('div');
    card.className = `skin-card inv-skin-card ${skin.isEquipped ? 'is-equipped-card' : ''}`;
    card.dataset.uuid = skin.uuid;

    const tierName = skin.contentTier?.name || 'Standard Edition';
    const tierColor = skin.contentTier?.color || '#FFFFFF';
    const tierIcon = skin.contentTier?.displayIcon || '';
    const imgUrl = skin.displayIcon || 'assets/icon-192.png';
    const priceFormatted = (skin.estimatedVpPrice || 0) > 0 ? (skin.estimatedVpPrice.toLocaleString() + ' VP') : 'Battlepass / Reward';

    card.innerHTML = `
      ${skin.isEquipped ? '<div class="inv-equipped-badge">EQUIPPED / กำลังใช้งาน</div>' : ''}
      <div class="skin-tier-indicator" style="background-color: ${tierColor};"></div>
      
      <div class="skin-card-header">
        <div class="tier-badge-pill" style="border-color: ${tierColor}; color: ${tierColor};">
          ${tierIcon ? `<img src="${tierIcon}" alt="tier" class="tier-icon-small">` : ''}
          <span>${escapeHtml(tierName)}</span>
        </div>
        <div class="skin-weapon-tag">${escapeHtml(skin.weaponType || 'Weapon')}</div>
      </div>

      <div class="skin-image-box">
        <img src="${imgUrl}" alt="${escapeHtml(skin.name)}" class="skin-render-img" loading="lazy">
      </div>

      <div class="skin-card-footer">
        <h3 class="skin-title" title="${escapeHtml(skin.name)}">${escapeHtml(skin.name)}</h3>
        <div class="skin-price-row">
          <div class="skin-price-box">
            ${(skin.estimatedVpPrice || 0) > 0 ? '<img src="https://media.valorant-api.com/currencies/85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741/largeicon.png" alt="VP" class="vp-symbol">' : ''}
            <span class="price-number" style="font-size:13px; font-weight:700;">${priceFormatted}</span>
          </div>
          <button class="btn btn-sm btn-inspect" title="ดูสีปืนและคลิป Finisher">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>ตรวจสกิน</span>
          </button>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      playTacticalAudio('inspect');
      window.openSkinModal?.(skin.uuid);
    });

    grid.appendChild(card);
  });

  observeScrollElements();
}

// Inventory Search & Filter Listeners
document.getElementById('invSearchInput')?.addEventListener('input', (e) => {
  const val = e.target.value;
  const clearBtn = document.getElementById('btnClearInvSearch');
  if (clearBtn) clearBtn.classList.toggle('hidden', !val);
  filterAndRenderInventoryGrid();
});

document.getElementById('btnClearInvSearch')?.addEventListener('click', () => {
  const input = document.getElementById('invSearchInput');
  if (input) input.value = '';
  document.getElementById('btnClearInvSearch')?.classList.add('hidden');
  filterAndRenderInventoryGrid();
});

document.getElementById('filterInvWeapon')?.addEventListener('change', () => {
  playTacticalAudio('click');
  filterAndRenderInventoryGrid();
});

document.getElementById('filterInvSort')?.addEventListener('change', () => {
  playTacticalAudio('click');
  filterAndRenderInventoryGrid();
});

document.getElementById('btnRefreshInventory')?.addEventListener('click', () => {
  playTacticalAudio('click');
  loadPlayerInventory(true);
});

// ==========================================================
// 2. PRO PLAYER CROSSHAIRS & CANVAS GENERATOR MODULE
// ==========================================================
let allCrosshairsList = [];
let currentChCategory = 'all';

function parseCrosshairCode(codeStr) {
  if (!codeStr || typeof codeStr !== 'string') return null;

  const parts = codeStr.trim().split(';');
  const settings = {
    color: '#00FFFF',
    outlines: true,
    outlineThickness: 1,
    outlineOpacity: 1,
    centerDot: false,
    centerDotSize: 2,
    centerDotOpacity: 1,
    showInnerLines: true,
    innerThickness: 1,
    innerLength: 4,
    innerOffset: 2,
    innerOpacity: 1,
    showOuterLines: false,
    outerThickness: 1,
    outerLength: 2,
    outerOffset: 10,
    outerOpacity: 1
  };

  const colorMap = {
    '0': '#FFFFFF',
    '1': '#00FF00',
    '2': '#7FFF00',
    '3': '#DFFF00',
    '4': '#FFFF00',
    '5': '#00FFFF',
    '6': '#FF00FF',
    '7': '#FF4655'
  };

  let inPrimary = false;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    const val = parts[i + 1];
    if (key === 'P') { inPrimary = true; continue; }
    if (key === 'A' || key === 'S') { inPrimary = false; }
    
    if (inPrimary) {
      if (key === 'c' && colorMap[val]) settings.color = colorMap[val];
      else if (key === 'u' && val) settings.color = '#' + val.slice(0, 6);
      else if (key === 'h') settings.outlines = val !== '0';
      else if (key === 't') settings.outlineThickness = parseFloat(val) || 1;
      else if (key === 'o') settings.outlineOpacity = parseFloat(val) || 1;
      else if (key === 'd') settings.centerDot = val === '1';
      else if (key === 'z') settings.centerDotSize = parseFloat(val) || 2;
      else if (key === 'a') settings.centerDotOpacity = parseFloat(val) || 1;
      else if (key === '0b') settings.showInnerLines = val !== '0';
      else if (key === '0t') settings.innerThickness = parseFloat(val) || 1;
      else if (key === '0l') settings.innerLength = parseFloat(val) || 4;
      else if (key === '0o') settings.innerOffset = parseFloat(val) || 2;
      else if (key === '0a') settings.innerOpacity = parseFloat(val) || 1;
      else if (key === '1b') settings.showOuterLines = val === '1';
      else if (key === '1t') settings.outerThickness = parseFloat(val) || 1;
      else if (key === '1l') settings.outerLength = parseFloat(val) || 2;
      else if (key === '1o') settings.outerOffset = parseFloat(val) || 10;
      else if (key === '1a') settings.outerOpacity = parseFloat(val) || 1;
    }
  }
  return settings;
}

function drawCrosshairOnCanvas(canvas, codeStr) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);

  // Background gradient & tactical grid
  ctx.fillStyle = '#0B1018';
  ctx.fillRect(0, 0, w, h);

  // Subtle grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < w; x += 16) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y < h; y += 16) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // Subtle Target Guide Rings
  ctx.strokeStyle = 'rgba(0, 245, 212, 0.12)';
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.arc(cx, cy, 48, 0, Math.PI * 2);
  ctx.stroke();

  const cfg = parseCrosshairCode(codeStr);
  if (!cfg) return;

  const color = cfg.color || '#00FFFF';
  const outlines = cfg.outlines;
  const outThick = cfg.outlineThickness;

  function drawRectWithOutline(x, y, rw, rh, opacity) {
    if (outlines) {
      ctx.fillStyle = `rgba(0, 0, 0, ${cfg.outlineOpacity})`;
      ctx.fillRect(x - outThick, y - outThick, rw + outThick * 2, rh + outThick * 2);
    }
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.fillRect(x, y, rw, rh);
    ctx.globalAlpha = 1.0;
  }

  // Draw Center Dot
  if (cfg.centerDot) {
    const s = Math.max(1, cfg.centerDotSize);
    const half = Math.floor(s / 2);
    drawRectWithOutline(cx - half, cy - half, s, s, cfg.centerDotOpacity);
  }

  // Draw Inner Lines
  if (cfg.showInnerLines && cfg.innerLength > 0) {
    const t = Math.max(1, cfg.innerThickness);
    const l = cfg.innerLength;
    const off = cfg.innerOffset;
    const halfT = Math.floor(t / 2);

    // Top
    drawRectWithOutline(cx - halfT, cy - off - l, t, l, cfg.innerOpacity);
    // Bottom
    drawRectWithOutline(cx - halfT, cy + off, t, l, cfg.innerOpacity);
    // Left
    drawRectWithOutline(cx - off - l, cy - halfT, l, t, cfg.innerOpacity);
    // Right
    drawRectWithOutline(cx + off, cy - halfT, l, t, cfg.innerOpacity);
  }

  // Draw Outer Lines
  if (cfg.showOuterLines && cfg.outerLength > 0) {
    const t = Math.max(1, cfg.outerThickness);
    const l = cfg.outerLength;
    const off = cfg.outerOffset;
    const halfT = Math.floor(t / 2);

    // Top
    drawRectWithOutline(cx - halfT, cy - off - l, t, l, cfg.outerOpacity);
    // Bottom
    drawRectWithOutline(cx - halfT, cy + off, t, l, cfg.outerOpacity);
    // Left
    drawRectWithOutline(cx - off - l, cy - halfT, l, t, cfg.outerOpacity);
    // Right
    drawRectWithOutline(cx + off, cy - halfT, l, t, cfg.outerOpacity);
  }
}

async function loadProCrosshairs() {
  const grid = document.getElementById('crosshairsGrid');
  if (!grid) return;

  if (allCrosshairsList.length > 0) {
    filterAndRenderCrosshairs();
    return;
  }

  grid.innerHTML = `
    <div class="catalog-loading-state" style="grid-column: 1 / -1; padding: 50px 20px; text-align: center;">
      <div class="loading-spinner"></div>
      <div style="font-family:var(--font-heading); font-size:18px; font-weight:700; color:var(--val-cyan); margin-top:14px;">
        กำลังโหลดฐานข้อมูลเป้าเล็งโปรเพลเยอร์...
      </div>
    </div>
  `;

  try {
    const res = await fetch('/api/crosshairs');
    const data = await res.json();
    if (data.ok && data.crosshairs) {
      allCrosshairsList = data.crosshairs;
      filterAndRenderCrosshairs();

      // Set initial custom tester
      const customInput = document.getElementById('customCrosshairInput');
      const customCanvas = document.getElementById('customChCanvas');
      if (customInput && customCanvas && allCrosshairsList[0]) {
        customInput.value = allCrosshairsList[0].code;
        drawCrosshairOnCanvas(customCanvas, allCrosshairsList[0].code);
      }
    }
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">ไม่สามารถโหลดฐานข้อมูลเป้าเล็งได้: ${escapeHtml(err.message)}</div>`;
  }
}

function filterAndRenderCrosshairs() {
  const grid = document.getElementById('crosshairsGrid');
  if (!grid) return;

  const search = (document.getElementById('crosshairSearchInput')?.value || '').toLowerCase().trim();
  let list = allCrosshairsList;

  if (currentChCategory !== 'all') {
    list = list.filter(c => c.category === currentChCategory);
  }

  if (search) {
    list = list.filter(c => 
      c.player.toLowerCase().includes(search) ||
      c.team.toLowerCase().includes(search) ||
      c.role.toLowerCase().includes(search) ||
      c.style.toLowerCase().includes(search)
    );
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 50px 20px; text-align: center;">
        <div style="font-size:16px; color:var(--val-gray);">ไม่พบเป้าเล็งของโปรเพลเยอร์ที่ตรงกับการค้นหา</div>
      </div>
    `;
    return;
  }

  grid.innerHTML = '';
  list.forEach(ch => {
    const card = document.createElement('div');
    card.className = 'crosshair-card';

    card.innerHTML = `
      <div class="ch-card-header">
        <div>
          <div class="ch-player-name">${escapeHtml(ch.player)}</div>
          <div class="ch-player-team">${escapeHtml(ch.team)} • ${escapeHtml(ch.role)}</div>
        </div>
        <div class="ch-team-badge">${escapeHtml(ch.teamLogo || 'PRO')}</div>
      </div>

      <div class="ch-canvas-stage">
        <canvas width="260" height="120" class="card-ch-canvas" id="canvas_${ch.id}"></canvas>
      </div>

      <div class="ch-meta-row">
        <span class="ch-style-tag">${escapeHtml(ch.style)}</span>
        <span style="color:${ch.colorHex}; font-weight:700;">${escapeHtml(ch.colorName)}</span>
      </div>

      <div class="ch-desc-text">${escapeHtml(ch.description)}</div>

      <button class="ch-copy-btn" data-code="${escapeHtml(ch.code)}">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        <span>คัดลอกโค้ดเป้าเล็ง</span>
      </button>
    `;

    grid.appendChild(card);

    // Render Canvas
    const canvas = card.querySelector(`#canvas_${ch.id}`);
    if (canvas) {
      drawCrosshairOnCanvas(canvas, ch.code);
    }
  });

  // Attach copy listeners
  grid.querySelectorAll('.ch-copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = btn.dataset.code;
      if (!code) return;

      playTacticalAudio('click');
      navigator.clipboard.writeText(code).then(() => {
        btn.classList.add('copied');
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>คัดลอกสำเร็จ! นำไปวางในเกมได้เลย</span>
        `;
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>คัดลอกโค้ดเป้าเล็ง</span>
          `;
        }, 2200);
      });
    });
  });

  observeScrollElements();
}

// Category Pills Handler for Crosshairs
document.querySelectorAll('.ch-cat-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    playTacticalAudio('tab');
    document.querySelectorAll('.ch-cat-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentChCategory = pill.dataset.cat || 'all';
    filterAndRenderCrosshairs();
  });
});

document.getElementById('crosshairSearchInput')?.addEventListener('input', () => {
  filterAndRenderCrosshairs();
});

document.getElementById('btnPreviewCustomCh')?.addEventListener('click', () => {
  playTacticalAudio('click');
  const input = document.getElementById('customCrosshairInput');
  const canvas = document.getElementById('customChCanvas');
  if (input && canvas && input.value.trim()) {
    drawCrosshairOnCanvas(canvas, input.value.trim());
  }
});

document.getElementById('customCrosshairInput')?.addEventListener('input', (e) => {
  const canvas = document.getElementById('customChCanvas');
  if (canvas && e.target.value.trim()) {
    drawCrosshairOnCanvas(canvas, e.target.value.trim());
  }
});
