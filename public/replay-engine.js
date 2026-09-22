/**
 * OP.GG 2D VALORANT REPLAY & ADVANCED MATCH COACHING ANALYSIS SUITE
 * High-performance 2D Minimap Engine, Skill Hexagon Radar, Spray Visualizer,
 * Movement Heatmap, Round Flow & AI Coaching Prescription.
 */

(function (window) {
  'use strict';

  // ==========================================
  // VALORANT MAP DEFINITIONS & COORDINATES
  // ==========================================
  const MAP_METADATA = {
    ascent: {
      name: 'Ascent',
      icon: 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png',
      sites: { A: { x: 14.2, y: 35.0 }, B: { x: 73.7, y: 28.5 }, Mid: { x: 48.8, y: 49.3 } },
      atkSpawn: { x: 48.8, y: 88.0 },
      defSpawn: { x: 48.8, y: 15.0 },
      xMultiplier: 0.00007, yMultiplier: -0.00007, xScalarToAdd: 0.5, yScalarToAdd: 0.5
    },
    haven: {
      name: 'Haven',
      icon: 'https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/displayicon.png',
      sites: { A: { x: 17.0, y: 40.2 }, B: { x: 50.1, y: 40.1 }, C: { x: 78.4, y: 41.5 } },
      atkSpawn: { x: 50.0, y: 88.0 },
      defSpawn: { x: 50.0, y: 15.0 },
      xMultiplier: 0.0000742, yMultiplier: -0.0000742, xScalarToAdd: 0.51, yScalarToAdd: 0.49
    },
    bind: {
      name: 'Bind',
      icon: 'https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/displayicon.png',
      sites: { A: { x: 38.0, y: 34.0 }, B: { x: 72.0, y: 40.0 } },
      atkSpawn: { x: 52.0, y: 88.0 },
      defSpawn: { x: 52.0, y: 15.0 },
      xMultiplier: 0.000059, yMultiplier: -0.000059, xScalarToAdd: 0.57, yScalarToAdd: 0.43
    },
    lotus: {
      name: 'Lotus',
      icon: 'https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/displayicon.png',
      sites: { A: { x: 32.0, y: 36.0 }, B: { x: 52.0, y: 45.0 }, C: { x: 74.0, y: 38.0 } },
      atkSpawn: { x: 50.0, y: 86.0 },
      defSpawn: { x: 50.0, y: 14.0 },
      xMultiplier: 0.000067, yMultiplier: -0.000067, xScalarToAdd: 0.52, yScalarToAdd: 0.48
    },
    sunset: {
      name: 'Sunset',
      icon: 'https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/displayicon.png',
      sites: { A: { x: 32.0, y: 35.0 }, B: { x: 74.0, y: 35.0 }, Mid: { x: 50.0, y: 48.0 } },
      atkSpawn: { x: 50.0, y: 88.0 },
      defSpawn: { x: 50.0, y: 15.0 },
      xMultiplier: 0.000078, yMultiplier: -0.000078, xScalarToAdd: 0.53, yScalarToAdd: 0.47
    },
    abyss: {
      name: 'Abyss',
      icon: 'https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/displayicon.png',
      sites: { A: { x: 30.0, y: 35.0 }, B: { x: 70.0, y: 35.0 } },
      atkSpawn: { x: 50.0, y: 85.0 },
      defSpawn: { x: 50.0, y: 15.0 },
      xMultiplier: 0.00007, yMultiplier: -0.00007, xScalarToAdd: 0.5, yScalarToAdd: 0.5
    },
    split: {
      name: 'Split',
      icon: 'https://media.valorant-api.com/maps/d960549e-485c-68e3-00ac-57849e7b2317/displayicon.png',
      sites: { A: { x: 68.0, y: 35.0 }, B: { x: 32.0, y: 35.0 }, Mid: { x: 50.0, y: 50.0 } },
      atkSpawn: { x: 50.0, y: 88.0 },
      defSpawn: { x: 50.0, y: 15.0 },
      xMultiplier: 0.000078, yMultiplier: -0.000078, xScalarToAdd: 0.5, yScalarToAdd: 0.5
    },
    icebox: {
      name: 'Icebox',
      icon: 'https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/displayicon.png',
      sites: { A: { x: 35.0, y: 30.0 }, B: { x: 68.0, y: 35.0 }, Mid: { x: 50.0, y: 50.0 } },
      atkSpawn: { x: 50.0, y: 85.0 },
      defSpawn: { x: 50.0, y: 15.0 },
      xMultiplier: 0.000072, yMultiplier: -0.000072, xScalarToAdd: 0.5, yScalarToAdd: 0.5
    },
    breeze: {
      name: 'Breeze',
      icon: 'https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/displayicon.png',
      sites: { A: { x: 65.0, y: 38.0 }, B: { x: 30.0, y: 38.0 }, Mid: { x: 48.0, y: 48.0 } },
      atkSpawn: { x: 50.0, y: 88.0 },
      defSpawn: { x: 50.0, y: 15.0 },
      xMultiplier: 0.00007, yMultiplier: -0.00007, xScalarToAdd: 0.5, yScalarToAdd: 0.5
    },
    fracture: {
      name: 'Fracture',
      icon: 'https://media.valorant-api.com/maps/b52973d4-4584-9d4d-2742-d8a52a360b41/displayicon.png',
      sites: { A: { x: 70.0, y: 40.0 }, B: { x: 30.0, y: 40.0 } },
      atkSpawn: { x: 50.0, y: 85.0 },
      defSpawn: { x: 50.0, y: 50.0 },
      xMultiplier: 0.000078, yMultiplier: -0.000078, xScalarToAdd: 0.5, yScalarToAdd: 0.5
    },
    pearl: {
      name: 'Pearl',
      icon: 'https://media.valorant-api.com/maps/fd267908-4e36-4c07-0705-f99b77215474/displayicon.png',
      sites: { A: { x: 68.0, y: 36.0 }, B: { x: 28.0, y: 36.0 }, Mid: { x: 50.0, y: 48.0 } },
      atkSpawn: { x: 50.0, y: 88.0 },
      defSpawn: { x: 50.0, y: 15.0 },
      xMultiplier: 0.000077, yMultiplier: -0.000077, xScalarToAdd: 0.5, yScalarToAdd: 0.5
    }
  };

  // Agent icons fallback (Official Valorant API)
  const AGENT_ICONS = {
    Jett: 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png',
    Reyna: 'https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png',
    Sova: 'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png',
    Omen: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png',
    Killjoy: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png',
    Viper: 'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png',
    Skye: 'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png',
    Cypher: 'https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png',
    Chamber: 'https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png',
    Fade: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png',
    Clove: 'https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/displayicon.png',
    Iso: 'https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/displayicon.png',
    Phoenix: 'https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png',
    Raze: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png',
    Brimstone: 'https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/displayicon.png',
    Sage: 'https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png'
  };

  // Preloaded Agent Images Cache for High-DPI Canvas Rendering
  const AGENT_IMG_CACHE = {};
  if (typeof Image !== 'undefined') {
    Object.entries(AGENT_ICONS).forEach(([agent, url]) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      AGENT_IMG_CACHE[agent] = img;
    });
  }

  // ==========================================
  // WEB AUDIO SYNTHESIZER (ZERO-ASSET SOUND FX)
  // ==========================================
  const SoundFX = {
    ctx: null,
    enabled: true,

    init() {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) this.ctx = new AudioContextClass();
      }
    },

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },

    playGunfire(isVandal = true) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      this.resume();

      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = isVandal ? 750 : 1200;
      filter.Q.value = 3.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    },

    playHeadshotDing() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      this.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2450, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    },

    playSpikeBeep(frequency = 1000) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      this.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    },

    playSpikePlant() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      this.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(740, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.42);
    }
  };

  // ==========================================
  // MATCH DATASETS & SIMULATED REPLAY ENGINE
  // ==========================================
  function createSampleMatch(mapId = 'ascent') {
    const meta = MAP_METADATA[mapId] || MAP_METADATA.ascent;
    
    // 10 Tournament Players
    const atkPlayers = [
      { id: 'p1', name: 'TenZ', agent: 'Jett', role: 'Duelist', rank: 'Radiant #1', isUser: true, acs: 342, adr: 198, hs: 46, kills: 24, deaths: 14, assists: 6, grade: 'S+' },
      { id: 'p2', name: 'zekken', agent: 'Raze', role: 'Duelist', rank: 'Radiant #7', isUser: false, acs: 284, adr: 165, hs: 38, kills: 19, deaths: 15, assists: 7, grade: 'S' },
      { id: 'p3', name: 'Sacy', agent: 'Sova', role: 'Initiator', rank: 'Radiant #22', isUser: false, acs: 218, adr: 135, hs: 32, kills: 14, deaths: 13, assists: 14, grade: 'A+' },
      { id: 'p4', name: 'johnqt', agent: 'Cypher', role: 'Sentinel', rank: 'Radiant #35', isUser: false, acs: 192, adr: 122, hs: 29, kills: 15, deaths: 12, assists: 9, grade: 'A' },
      { id: 'p5', name: 'Zellsis', agent: 'Omen', role: 'Controller', rank: 'Radiant #44', isUser: false, acs: 178, adr: 115, hs: 28, kills: 12, deaths: 14, assists: 11, grade: 'B+' }
    ];

    const defPlayers = [
      { id: 'p6', name: 'Boaster', agent: 'Omen', role: 'Controller', rank: 'Radiant #15', isUser: false, acs: 195, adr: 124, hs: 27, kills: 14, deaths: 16, assists: 12, grade: 'A' },
      { id: 'p7', name: 'Derke', agent: 'Jett', role: 'Duelist', rank: 'Radiant #3', isUser: false, acs: 310, adr: 182, hs: 41, kills: 22, deaths: 17, assists: 5, grade: 'S' },
      { id: 'p8', name: 'Alfajer', agent: 'Killjoy', role: 'Sentinel', rank: 'Radiant #8', isUser: false, acs: 276, adr: 160, hs: 44, kills: 18, deaths: 15, assists: 4, grade: 'S' },
      { id: 'p9', name: 'Chronicle', agent: 'Fade', role: 'Initiator', rank: 'Radiant #19', isUser: false, acs: 205, adr: 130, hs: 31, kills: 13, deaths: 14, assists: 10, grade: 'A' },
      { id: 'p10', name: 'Leo', agent: 'Sova', role: 'Initiator', rank: 'Radiant #11', isUser: false, acs: 225, adr: 142, hs: 34, kills: 15, deaths: 14, assists: 12, grade: 'A+' }
    ];

    // Build 24 detailed rounds
    const rounds = [];
    let atkScore = 0;
    let defScore = 0;
    const atkWinningRounds = [1, 3, 5, 8, 11, 12, 14, 15, 17, 18, 21, 23, 24]; // 13 wins

    for (let r = 1; r <= 24; r++) {
      const isAtkWin = atkWinningRounds.includes(r);
      if (isAtkWin) atkScore++; else defScore++;

      const winType = (r === 24) ? 'Elimination' : (r % 3 === 0) ? 'Spike Detonated' : (r % 4 === 0) ? 'Spike Defused' : 'Elimination';
      const roundDuration = (winType === 'Spike Detonated') ? 95 : (winType === 'Spike Defused') ? 85 : 72;
      const spikePlantTime = (winType === 'Spike Detonated' || winType === 'Spike Defused') ? 42 : null;
      const spikeSite = (r % 2 === 0) ? 'A' : 'B';

      // Detailed realistic tactical trajectory keyframes for each player (0s to roundDuration)
      const trajectories = {};
      const targetSite = (spikeSite === 'A') ? meta.sites.A : meta.sites.B;

      // Realistic tactical routes per map & site
      const tacticalCoords = (spikeSite === 'A') ? {
        p1: [ // TenZ (Jett) - A Main Duelist entry
          { t: 0, x: 20.0, y: 56.5, angle: 290, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 15, x: 20.1, y: 48.4, angle: 275, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 25, x: 17.5, y: 38.0, angle: 280, hp: 100, armor: 50, weapon: 'Vandal', ammo: 21 },
          { t: 42, x: 14.2, y: 35.0, angle: 240, hp: 80, armor: 30, weapon: 'Vandal', ammo: 18 },
          { t: roundDuration, x: 14.0, y: 32.0, angle: 225, hp: isAtkWin ? 65 : 0, armor: 10, weapon: 'Vandal', ammo: 15 }
        ],
        p2: [ // zekken (Raze) - A Lobby entry support
          { t: 0, x: 26.5, y: 60.5, angle: 285, hp: 100, armor: 50, weapon: 'Phantom', ammo: 30 },
          { t: 15, x: 22.0, y: 51.0, angle: 280, hp: 100, armor: 50, weapon: 'Phantom', ammo: 30 },
          { t: 32, x: 18.0, y: 41.0, angle: 315, hp: 0, armor: 0, weapon: 'Phantom', ammo: 24 },
          { t: roundDuration, x: 18.0, y: 41.0, angle: 315, hp: 0, armor: 0, weapon: 'Phantom', ammo: 0 }
        ],
        p3: [ // Sacy (Sova) - Mid Courtyard to Catwalk / Tree
          { t: 0, x: 48.8, y: 49.3, angle: 270, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 18, x: 41.1, y: 52.5, angle: 285, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 35, x: 29.5, y: 39.8, angle: 330, hp: 100, armor: 50, weapon: 'Vandal', ammo: 23 },
          { t: roundDuration, x: 24.0, y: 36.0, angle: 315, hp: isAtkWin ? 75 : 0, armor: 25, weapon: 'Vandal', ammo: 19 }
        ],
        p4: [ // johnqt (Cypher) - Spike Carrier & Flank Watch
          { t: 0, x: 15.5, y: 64.0, angle: 280, hp: 100, armor: 50, weapon: 'Guardian', ammo: 12 },
          { t: 20, x: 21.0, y: 50.0, angle: 280, hp: 100, armor: 50, weapon: 'Guardian', ammo: 12 },
          { t: 42, x: 14.2, y: 35.0, angle: 160, hp: 100, armor: 50, weapon: 'Guardian', ammo: 10 },
          { t: roundDuration, x: 14.2, y: 35.0, angle: 160, hp: isAtkWin ? 90 : 0, armor: 40, weapon: 'Guardian', ammo: 8 }
        ],
        p5: [ // Zellsis (Omen) - Controller smoking Heaven & Garden
          { t: 0, x: 33.0, y: 63.5, angle: 280, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 16, x: 26.0, y: 52.0, angle: 280, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 38, x: 19.0, y: 39.0, angle: 300, hp: 85, armor: 30, weapon: 'Vandal', ammo: 21 },
          { t: roundDuration, x: 16.0, y: 36.0, angle: 300, hp: isAtkWin ? 60 : 0, armor: 15, weapon: 'Vandal', ammo: 14 }
        ],
        // Defenders holding A Site & Mid
        p6: [ // Boaster (Omen) - Mid Heaven anchor & retake
          { t: 0, x: 41.5, y: 31.0, angle: 90, hp: 100, armor: 50, weapon: 'Phantom', ammo: 30 },
          { t: 22, x: 38.0, y: 30.0, angle: 60, hp: 100, armor: 50, weapon: 'Phantom', ammo: 30 },
          { t: 45, x: 30.9, y: 28.5, angle: 45, hp: 70, armor: 20, weapon: 'Phantom', ammo: 22 },
          { t: roundDuration, x: 20.0, y: 30.0, angle: 45, hp: !isAtkWin ? 40 : 0, armor: 0, weapon: 'Phantom', ammo: 15 }
        ],
        p7: [ // Derke (Jett) - A Heaven / Rafters aggressive peek
          { t: 0, x: 14.4, y: 23.9, angle: 100, hp: 100, armor: 50, weapon: 'Operator', ammo: 5 },
          { t: 18, x: 16.0, y: 30.0, angle: 100, hp: 100, armor: 50, weapon: 'Operator', ammo: 5 },
          { t: 24.5, x: 18.0, y: 36.0, angle: 95, hp: 0, armor: 0, weapon: 'Operator', ammo: 4 },
          { t: roundDuration, x: 18.0, y: 36.0, angle: 95, hp: 0, armor: 0, weapon: 'Operator', ammo: 0 }
        ],
        p8: [ // Alfajer (Killjoy) - A Default anchor
          { t: 0, x: 14.2, y: 35.0, angle: 90, hp: 100, armor: 50, weapon: 'Phantom', ammo: 30 },
          { t: 20, x: 12.0, y: 38.0, angle: 110, hp: 100, armor: 50, weapon: 'Phantom', ammo: 26 },
          { t: 33.1, x: 14.0, y: 37.0, angle: 120, hp: 0, armor: 0, weapon: 'Phantom', ammo: 18 },
          { t: roundDuration, x: 14.0, y: 37.0, angle: 120, hp: 0, armor: 0, weapon: 'Phantom', ammo: 0 }
        ],
        p9: [ // Chronicle (Fade) - Mid Market anchor
          { t: 0, x: 50.5, y: 29.5, angle: 85, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 25, x: 43.4, y: 22.0, angle: 45, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 50, x: 30.9, y: 28.5, angle: 30, hp: 55, armor: 15, weapon: 'Vandal', ammo: 18 },
          { t: roundDuration, x: 22.0, y: 32.0, angle: 20, hp: !isAtkWin ? 50 : 0, armor: 0, weapon: 'Vandal', ammo: 12 }
        ],
        p10: [ // Leo (Sova) - B Site anchor rotating
          { t: 0, x: 73.7, y: 28.5, angle: 80, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 28, x: 55.0, y: 18.0, angle: 60, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 52, x: 43.4, y: 13.2, angle: 40, hp: 80, armor: 25, weapon: 'Vandal', ammo: 20 },
          { t: roundDuration, x: 26.0, y: 26.0, angle: 30, hp: !isAtkWin ? 60 : 0, armor: 10, weapon: 'Vandal', ammo: 16 }
        ]
      } : {
        // Attackers pushing B Site via B Main & Mid Market
        p1: [ // TenZ - B Main entry
          { t: 0, x: 67.8, y: 71.7, angle: -90, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 16, x: 71.2, y: 48.0, angle: -85, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 26, x: 72.0, y: 36.0, angle: -60, hp: 100, armor: 50, weapon: 'Vandal', ammo: 21 },
          { t: 42, x: 73.7, y: 28.5, angle: 45, hp: 80, armor: 30, weapon: 'Vandal', ammo: 18 },
          { t: roundDuration, x: 75.0, y: 26.0, angle: 30, hp: isAtkWin ? 70 : 0, armor: 15, weapon: 'Vandal', ammo: 15 }
        ],
        p2: [ // zekken - B Main support
          { t: 0, x: 69.0, y: 74.0, angle: -85, hp: 100, armor: 50, weapon: 'Phantom', ammo: 30 },
          { t: 16, x: 71.5, y: 52.0, angle: -80, hp: 100, armor: 50, weapon: 'Phantom', ammo: 30 },
          { t: 32, x: 72.0, y: 39.0, angle: -45, hp: 0, armor: 0, weapon: 'Phantom', ammo: 24 },
          { t: roundDuration, x: 72.0, y: 39.0, angle: -45, hp: 0, armor: 0, weapon: 'Phantom', ammo: 0 }
        ],
        p3: [ // Sacy - Mid Courtyard to Market
          { t: 0, x: 48.8, y: 49.3, angle: -90, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 20, x: 49.0, y: 38.0, angle: -120, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 38, x: 55.0, y: 30.0, angle: -140, hp: 100, armor: 50, weapon: 'Vandal', ammo: 22 },
          { t: roundDuration, x: 68.0, y: 28.0, angle: -110, hp: isAtkWin ? 80 : 0, armor: 25, weapon: 'Vandal', ammo: 18 }
        ],
        p4: [ // johnqt - Spike Carrier B Site
          { t: 0, x: 66.0, y: 75.0, angle: -90, hp: 100, armor: 50, weapon: 'Guardian', ammo: 12 },
          { t: 22, x: 71.0, y: 52.0, angle: -80, hp: 100, armor: 50, weapon: 'Guardian', ammo: 12 },
          { t: 42, x: 73.7, y: 28.5, angle: -40, hp: 100, armor: 50, weapon: 'Guardian', ammo: 10 },
          { t: roundDuration, x: 73.7, y: 28.5, angle: -40, hp: isAtkWin ? 90 : 0, armor: 40, weapon: 'Guardian', ammo: 8 }
        ],
        p5: [ // Zellsis - Smoke Market & CT
          { t: 0, x: 58.0, y: 68.0, angle: -90, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 18, x: 64.0, y: 50.0, angle: -80, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 38, x: 70.0, y: 34.0, angle: -60, hp: 85, armor: 30, weapon: 'Vandal', ammo: 21 },
          { t: roundDuration, x: 72.0, y: 27.0, angle: 45, hp: isAtkWin ? 65 : 0, armor: 15, weapon: 'Vandal', ammo: 14 }
        ],
        // Defenders B Site
        p6: [ // Boaster - Market anchor
          { t: 0, x: 49.7, y: 29.8, angle: 90, hp: 100, armor: 50, weapon: 'Phantom', ammo: 30 },
          { t: 20, x: 55.0, y: 29.0, angle: 120, hp: 100, armor: 50, weapon: 'Phantom', ammo: 30 },
          { t: 45, x: 65.0, y: 28.0, angle: 140, hp: 60, armor: 20, weapon: 'Phantom', ammo: 22 },
          { t: roundDuration, x: 70.0, y: 27.0, angle: 140, hp: !isAtkWin ? 40 : 0, armor: 0, weapon: 'Phantom', ammo: 15 }
        ],
        p7: [ // Derke - B Main peek
          { t: 0, x: 73.7, y: 28.5, angle: 90, hp: 100, armor: 50, weapon: 'Operator', ammo: 5 },
          { t: 18, x: 72.0, y: 34.0, angle: 90, hp: 100, armor: 50, weapon: 'Operator', ammo: 5 },
          { t: 24.5, x: 71.5, y: 40.0, angle: 95, hp: 0, armor: 0, weapon: 'Operator', ammo: 4 },
          { t: roundDuration, x: 71.5, y: 40.0, angle: 95, hp: 0, armor: 0, weapon: 'Operator', ammo: 0 }
        ],
        p8: [ // Alfajer - B Site Shed anchor
          { t: 0, x: 78.0, y: 29.0, angle: 70, hp: 100, armor: 50, weapon: 'Phantom', ammo: 30 },
          { t: 20, x: 76.0, y: 32.0, angle: 80, hp: 100, armor: 50, weapon: 'Phantom', ammo: 26 },
          { t: 33.1, x: 74.0, y: 33.0, angle: 90, hp: 0, armor: 0, weapon: 'Phantom', ammo: 18 },
          { t: roundDuration, x: 74.0, y: 33.0, angle: 90, hp: 0, armor: 0, weapon: 'Phantom', ammo: 0 }
        ],
        p9: [ // Chronicle - Mid rotating to B
          { t: 0, x: 48.8, y: 49.3, angle: 90, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 22, x: 54.0, y: 34.0, angle: -160, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 48, x: 64.0, y: 29.0, angle: -140, hp: 60, armor: 20, weapon: 'Vandal', ammo: 18 },
          { t: roundDuration, x: 71.0, y: 28.0, angle: -130, hp: !isAtkWin ? 50 : 0, armor: 0, weapon: 'Vandal', ammo: 12 }
        ],
        p10: [ // Leo - A rotating through CT to B
          { t: 0, x: 14.2, y: 35.0, angle: 90, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 26, x: 30.0, y: 16.0, angle: -170, hp: 100, armor: 50, weapon: 'Vandal', ammo: 25 },
          { t: 50, x: 48.0, y: 14.0, angle: -160, hp: 75, armor: 25, weapon: 'Vandal', ammo: 20 },
          { t: roundDuration, x: 68.0, y: 26.0, angle: -140, hp: !isAtkWin ? 60 : 0, armor: 10, weapon: 'Vandal', ammo: 16 }
        ]
      };

      [...atkPlayers, ...defPlayers].forEach((p) => {
        trajectories[p.id] = tacticalCoords[p.id] || [];
      });

      // Events for this round
      const events = [
        {
          id: `ev_${r}_1`,
          time: 24.5,
          type: 'kill',
          killerId: 'p1',
          killerName: 'TenZ',
          killerAgent: 'Jett',
          killerTeam: 'atk',
          victimId: 'p7',
          victimName: 'Derke',
          victimAgent: 'Jett',
          victimTeam: 'def',
          weapon: 'Vandal',
          isHeadshot: true,
          damage: 160,
          callout: 'A Main / Short',
          isFirstBlood: true,
          isTraded: false
        },
        {
          id: `ev_${r}_2`,
          time: 32.2,
          type: 'kill',
          killerId: 'p8',
          killerName: 'Alfajer',
          killerAgent: 'Killjoy',
          killerTeam: 'def',
          victimId: 'p2',
          victimName: 'zekken',
          victimAgent: 'Raze',
          victimTeam: 'atk',
          weapon: 'Phantom',
          isHeadshot: true,
          damage: 140,
          callout: 'A Site / Tree',
          isFirstBlood: false,
          isTraded: true
        },
        {
          id: `ev_${r}_3`,
          time: 33.1,
          type: 'kill',
          killerId: 'p1',
          killerName: 'TenZ',
          killerAgent: 'Jett',
          killerTeam: 'atk',
          victimId: 'p8',
          victimName: 'Alfajer',
          victimAgent: 'Killjoy',
          victimTeam: 'def',
          weapon: 'Vandal',
          isHeadshot: false,
          damage: 120,
          callout: 'A Site / Tree',
          isFirstBlood: false,
          isTraded: true,
          tradeTimeMs: 900
        }
      ];

      if (spikePlantTime) {
        events.push({
          id: `ev_${r}_plant`,
          time: spikePlantTime,
          type: 'plant',
          planterId: 'p4',
          planterName: 'johnqt',
          planterAgent: 'Cypher',
          site: spikeSite,
          callout: `${spikeSite} Site / Default Box`
        });
      }

      if (winType === 'Spike Defused') {
        events.push({
          id: `ev_${r}_defuse`,
          time: roundDuration - 2,
          type: 'defuse',
          defuserName: 'Boaster',
          defuserAgent: 'Omen',
          site: spikeSite
        });
      }

      rounds.push({
        roundNum: r,
        winSide: isAtkWin ? 'atk' : 'def',
        winType: winType,
        scoreAtk: atkScore,
        scoreDef: defScore,
        duration: roundDuration,
        spikeSite: spikeSite,
        spikePlantTime: spikePlantTime,
        trajectories: trajectories,
        events: events
      });
    }

    return {
      matchId: `demo_${mapId}`,
      map: meta,
      scoreAtk: atkScore,
      scoreDef: defScore,
      atkPlayers: atkPlayers,
      defPlayers: defPlayers,
      rounds: rounds,
      powerGraph: {
        reflexes: { score: 92, label: 'Grade S', reactionTime: '182 ms', aimSettle: '110 ms' },
        aim: { score: 96, label: 'Grade S+', preAim: '4.2°', headLevel: '84%', firstBullet: '76%' },
        precision: { score: 88, label: 'Grade A+', hitRate: '48%', hs: '46%', dmgEff: '1.42' },
        movement: { score: 78, label: 'Grade B', counterStrafe: '81%', stillShot: '78%' },
        teamplay: { score: 94, label: 'Grade S', deathsTraded: '72%', tradeConv: '68%', baitRate: '4%' },
        impact: { score: 97, label: 'Grade S+', acs: '342', kd: '1.71', firstDuel: '67%', clutch: '38%' }
      }
    };
  }

  // Pre-cached demo matches
  const DEMO_MATCHES = {
    demo_ascent: createSampleMatch('ascent'),
    demo_haven: createSampleMatch('haven'),
    demo_bind: createSampleMatch('bind'),
    demo_lotus: createSampleMatch('lotus')
  };

  // ==========================================
  // 2D REPLAY CONTROLLER & STATE
  // ==========================================
  const ReplayState = {
    currentMatch: DEMO_MATCHES.demo_ascent,
    currentRoundIndex: 23, // round 24 (index 23)
    currentTime: 0,
    isPlaying: false,
    playbackSpeed: 1,
    focusedPlayerId: 'p1',
    lastAnimTime: null,
    canvas: null,
    ctx: null,
    activeSubView: '2d-map',
    activeSprayWeapon: 'vandal',
    activeSpraySeq: 'all',
    activeHeatmapPhase: 'all',
    activeHeatmapLayer: 'me',
    lastKillfeedRenderedCount: 0,
    lastBeepSecond: -1
  };

  // ==========================================
  // WEAPON RECOIL SPRAY PATTERNS (5° GRID)
  // ==========================================
  const SPRAY_DATA = {
    vandal: {
      name: 'Vandal',
      fireRate: '9.75 นัด/วินาที',
      runSpeed: '5.4 ม./วินาที',
      headDmg: '160 (ทุกระยะ)',
      bodyDmg: '40',
      bullets: [
        { n: 1, x: 0, y: 0 },
        { n: 2, x: 0.1, y: 0.8 },
        { n: 3, x: -0.1, y: 1.7 },
        { n: 4, x: 0.2, y: 2.8 },
        { n: 5, x: 0.4, y: 4.1 },
        { n: 6, x: -0.5, y: 5.2 },
        { n: 7, x: -1.2, y: 5.9 },
        { n: 8, x: -1.8, y: 6.2 },
        { n: 9, x: -2.3, y: 6.4 },
        { n: 10, x: -2.0, y: 6.5 },
        { n: 11, x: -1.1, y: 6.4 },
        { n: 12, x: 0.0, y: 6.3 },
        { n: 13, x: 1.2, y: 6.5 },
        { n: 14, x: 2.1, y: 6.6 },
        { n: 15, x: 2.6, y: 6.5 },
        { n: 16, x: 2.2, y: 6.4 },
        { n: 17, x: 1.0, y: 6.2 },
        { n: 18, x: -0.8, y: 6.3 },
        { n: 19, x: -2.1, y: 6.5 },
        { n: 20, x: -2.5, y: 6.4 },
        { n: 21, x: -1.8, y: 6.3 },
        { n: 22, x: 0.2, y: 6.4 },
        { n: 23, x: 1.9, y: 6.5 },
        { n: 24, x: 2.4, y: 6.6 },
        { n: 25, x: 1.8, y: 6.5 }
      ]
    },
    phantom: {
      name: 'Phantom',
      fireRate: '11.0 นัด/วินาที',
      runSpeed: '5.4 ม./วินาที',
      headDmg: '156 / 140 / 124',
      bodyDmg: '39 / 35 / 31',
      bullets: [
        { n: 1, x: 0, y: 0 },
        { n: 2, x: 0.05, y: 0.6 },
        { n: 3, x: -0.05, y: 1.3 },
        { n: 4, x: 0.1, y: 2.2 },
        { n: 5, x: 0.3, y: 3.2 },
        { n: 6, x: -0.4, y: 4.2 },
        { n: 7, x: -0.9, y: 4.8 },
        { n: 8, x: -1.4, y: 5.1 },
        { n: 9, x: -1.8, y: 5.2 },
        { n: 10, x: -1.4, y: 5.3 },
        { n: 11, x: -0.7, y: 5.2 },
        { n: 12, x: 0.2, y: 5.1 },
        { n: 13, x: 1.0, y: 5.2 },
        { n: 14, x: 1.6, y: 5.3 },
        { n: 15, x: 1.9, y: 5.2 }
      ]
    },
    spectre: {
      name: 'Spectre',
      fireRate: '13.33 นัด/วินาที',
      runSpeed: '5.73 ม./วินาที',
      headDmg: '78 / 66',
      bodyDmg: '26 / 22',
      bullets: [
        { n: 1, x: 0, y: 0 },
        { n: 2, x: 0.1, y: 0.5 },
        { n: 3, x: -0.1, y: 1.1 },
        { n: 4, x: 0.2, y: 1.8 },
        { n: 5, x: -0.4, y: 2.6 },
        { n: 6, x: -1.0, y: 3.4 },
        { n: 7, x: -1.5, y: 3.9 },
        { n: 8, x: -1.2, y: 4.2 },
        { n: 9, x: 0.1, y: 4.3 },
        { n: 10, x: 1.2, y: 4.4 }
      ]
    },
    sheriff: {
      name: 'Sheriff',
      fireRate: '4.0 นัด/วินาที',
      runSpeed: '5.4 ม./วินาที',
      headDmg: '159 / 145',
      bodyDmg: '55 / 50',
      bullets: [
        { n: 1, x: 0, y: 0 },
        { n: 2, x: 0.2, y: 3.2 },
        { n: 3, x: -0.4, y: 6.8 },
        { n: 4, x: 0.6, y: 9.5 },
        { n: 5, x: -0.8, y: 11.2 },
        { n: 6, x: 1.2, y: 12.8 }
      ]
    },
    odin: {
      name: 'Odin',
      fireRate: '12.0 -> 15.6 นัด/วินาที',
      runSpeed: '5.13 ม./วินาที',
      headDmg: '95 / 77',
      bodyDmg: '38 / 31',
      bullets: [
        { n: 1, x: 0, y: 0 },
        { n: 2, x: 0.1, y: 0.4 },
        { n: 3, x: -0.1, y: 0.9 },
        { n: 4, x: 0.2, y: 1.6 },
        { n: 5, x: -0.3, y: 2.4 },
        { n: 6, x: -0.8, y: 3.1 },
        { n: 7, x: -1.4, y: 3.6 },
        { n: 8, x: -1.7, y: 3.8 },
        { n: 9, x: -1.2, y: 3.9 },
        { n: 10, x: 0.0, y: 4.0 },
        { n: 11, x: 1.3, y: 4.1 },
        { n: 12, x: 1.8, y: 4.1 }
      ]
    }
  };

  // ==========================================
  // INITIALIZATION & EVENT LISTENERS
  // ==========================================
  function init() {
    ReplayState.canvas = document.getElementById('replayCanvas');
    if (ReplayState.canvas) {
      ReplayState.ctx = ReplayState.canvas.getContext('2d');
      setupCanvasClickListener();
    }

    setupSubNavigation();
    setupPlaybackControls();
    setupMatchSwitcher();
    setupVrfModal();
    setupAudioToggle();

    // Initial render
    loadMatch('demo_ascent');

    // Start requestAnimationFrame loop
    requestAnimationFrame(renderLoop);
  }

  function setupCanvasClickListener() {
    if (!ReplayState.canvas) return;
    ReplayState.canvas.addEventListener('click', (e) => {
      const rect = ReplayState.canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;

      const round = getCurrentRound();
      if (!round || !ReplayState.currentMatch) return;

      const allPlayers = [...ReplayState.currentMatch.atkPlayers, ...ReplayState.currentMatch.defPlayers];
      let nearest = null;
      let minDist = 7; // 7% radius tolerance

      allPlayers.forEach((p) => {
        const traj = round.trajectories[p.id];
        if (!traj || traj.length === 0) return;

        let prev = traj[0];
        let next = traj[traj.length - 1];

        for (let i = 0; i < traj.length - 1; i++) {
          if (ReplayState.currentTime >= traj[i].t && ReplayState.currentTime <= traj[i + 1].t) {
            prev = traj[i];
            next = traj[i + 1];
            break;
          }
        }

        const ratio = (next.t === prev.t) ? 0 : Math.max(0, Math.min(1, (ReplayState.currentTime - prev.t) / (next.t - prev.t)));
        const px = prev.x + (next.x - prev.x) * ratio;
        const py = prev.y + (next.y - prev.y) * ratio;

        const dist = Math.hypot(clickX - px, clickY - py);
        if (dist < minDist) {
          minDist = dist;
          nearest = p.id;
        }
      });

      if (nearest) {
        focusPlayer(nearest);
      }
    });
  }

  function setupSubNavigation() {
    const buttons = document.querySelectorAll('.replay-subnav-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const subviewId = btn.dataset.subview;
        switchSubView(subviewId);
      });
    });
  }

  function switchSubView(viewId) {
    ReplayState.activeSubView = viewId;

    // Update active button
    document.querySelectorAll('.replay-subnav-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.subview === viewId);
    });

    // Toggle panels
    const viewMap = {
      '2d-map': 'subview2dMap',
      'power-graph': 'subviewPowerGraph',
      'ten-players': 'subviewTenPlayers',
      'spray-analysis': 'subviewSprayAnalysis',
      'movement-heatmap': 'subviewMovementHeatmap',
      'round-flow': 'subviewRoundFlow',
      'coaching': 'subviewCoaching'
    };

    Object.entries(viewMap).forEach(([key, panelId]) => {
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.classList.toggle('hidden', key !== viewId);
        panel.classList.toggle('active', key === viewId);
      }
    });

    // Only the 2D broadcast map is laid out to fit exactly one screen.
    // Taller analytical panels must remain scrollable or their lower
    // half becomes unreachable.
    document.body.classList.toggle('replay-locked', viewId === '2d-map');

    // Specialized render triggers
    if (viewId === 'power-graph') renderSkillRadarChart();
    if (viewId === 'spray-analysis') renderSprayVisualizer();
    if (viewId === 'movement-heatmap') renderMovementHeatmap();
    if (viewId === 'round-flow') renderRoundFlowStream();
  }

  function setupPlaybackControls() {
    const btnPlayPause = document.getElementById('btnReplayPlayPause');
    const scrubber = document.getElementById('replayTimelineScrubber');
    const btnPrevSec = document.getElementById('btnReplayPrevSec');
    const btnNextSec = document.getElementById('btnReplayNextSec');
    const btnNextKill = document.getElementById('btnReplayNextKill');
    const speedPills = document.querySelectorAll('.btn-speed-pill');

    if (btnPlayPause) {
      btnPlayPause.addEventListener('click', togglePlayPause);
    }

    // Spacebar shortcut
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space' && ReplayState.activeSubView === '2d-map') {
        const replaySection = document.getElementById('replaySection');
        if (replaySection && !replaySection.classList.contains('hidden')) {
          e.preventDefault();
          togglePlayPause();
        }
      }
    });

    if (scrubber) {
      scrubber.addEventListener('input', (e) => {
        seekTo(parseFloat(e.target.value));
      });
    }

    if (btnPrevSec) {
      btnPrevSec.addEventListener('click', () => {
        seekTo(Math.max(0, ReplayState.currentTime - 5));
      });
    }

    if (btnNextSec) {
      btnNextSec.addEventListener('click', () => {
        const r = getCurrentRound();
        seekTo(Math.min(r ? r.duration : 105, ReplayState.currentTime + 5));
      });
    }

    if (btnNextKill) {
      btnNextKill.addEventListener('click', () => {
        jumpToNextCombatEvent();
      });
    }

    speedPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        speedPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        ReplayState.playbackSpeed = parseFloat(pill.dataset.speed) || 1;
      });
    });
  }

  function togglePlayPause() {
    ReplayState.isPlaying = !ReplayState.isPlaying;
    const iconPlay = document.getElementById('iconPlay');
    const iconPause = document.getElementById('iconPause');

    if (iconPlay && iconPause) {
      iconPlay.classList.toggle('hidden', ReplayState.isPlaying);
      iconPause.classList.toggle('hidden', !ReplayState.isPlaying);
    }
  }

  function seekTo(time) {
    ReplayState.currentTime = time;
    const scrubber = document.getElementById('replayTimelineScrubber');
    if (scrubber) scrubber.value = time;
    updateTimerHUD();
  }

  function jumpToNextCombatEvent() {
    const round = getCurrentRound();
    if (!round) return;

    const nextEvent = round.events.find((e) => e.time > ReplayState.currentTime + 0.5);
    if (nextEvent) {
      seekTo(Math.max(0, nextEvent.time - 1.5));
    } else {
      // Loop back to first event
      if (round.events.length > 0) {
        seekTo(Math.max(0, round.events[0].time - 1.5));
      }
    }
  }

  function setupMatchSwitcher() {
    const select = document.getElementById('replayMatchSelect');
    if (select) {
      select.addEventListener('change', (e) => {
        loadMatch(e.target.value);
      });
    }
  }

  function setupAudioToggle() {
    const btn = document.getElementById('btnToggleAudioSfx');
    const label = document.getElementById('labelAudioSfx');

    if (btn) {
      btn.addEventListener('click', () => {
        SoundFX.enabled = !SoundFX.enabled;
        btn.classList.toggle('active', SoundFX.enabled);
        if (label) {
          label.textContent = SoundFX.enabled ? 'เสียงเอฟเฟกต์: เปิด' : 'เสียงเอฟเฟกต์: ปิด';
        }
      });
    }
  }

  function setupVrfModal() {
    const btnOpenUpload = document.getElementById('btnOpenVrfUpload');
    const btnOpenGuide = document.getElementById('btnOpenVrfGuide');
    const modal = document.getElementById('vrfUploadModal');
    const btnClose = document.getElementById('btnCloseVrfModal');
    const btnCopyPath = document.getElementById('btnCopyVrfPath');
    const btnCopyLabel = document.getElementById('btnCopyVrfPathLabel');
    const dropZone = document.getElementById('vrfDropZone');
    const fileInput = document.getElementById('vrfFileInput');
    const btnBrowse = document.getElementById('btnBrowseVrfFile');
    const quickDemoBtns = document.querySelectorAll('.btn-quick-demo');

    function openModal() {
      if (modal) {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
      }
    }

    function closeModal() {
      if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
      }
    }

    if (btnOpenUpload) btnOpenUpload.addEventListener('click', openModal);
    if (btnOpenGuide) btnOpenGuide.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // Copy Path Helper
    if (btnCopyPath) {
      btnCopyPath.addEventListener('click', () => {
        const path = '%localappdata%\\VALORANT\\Saved\\Demos';
        navigator.clipboard.writeText(path).then(() => {
          if (btnCopyLabel) btnCopyLabel.textContent = 'คัดลอกสำเร็จ!';
          setTimeout(() => {
            if (btnCopyLabel) btnCopyLabel.textContent = 'คัดลอกพาธ';
          }, 2000);
        }).catch(() => {
          prompt('คัดลอกตำแหน่งโฟลเดอร์นี้:', path);
        });
      });
    }

    // Drag & Drop
    if (btnBrowse && fileInput) {
      btnBrowse.addEventListener('click', () => fileInput.click());
    }

    if (dropZone && fileInput) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
          handleVrfFile(e.dataTransfer.files[0]);
          closeModal();
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          handleVrfFile(e.target.files[0]);
          closeModal();
        }
      });
    }

    // Quick Demos inside modal
    quickDemoBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const demoKey = btn.dataset.demo;
        loadMatch(demoKey);
        closeModal();
      });
    });
  }

  function handleVrfFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        // Try parsing JSON or construct custom match
        let customData;
        try {
          customData = JSON.parse(content);
        } catch {
          // Binary VRF dummy loader - construct tournament match
          customData = createSampleMatch('ascent');
          customData.matchId = 'user_vrf_' + Date.now();
        }

        DEMO_MATCHES[customData.matchId] = customData;
        
        // Add option to dropdown
        const select = document.getElementById('replayMatchSelect');
        if (select) {
          const opt = document.createElement('option');
          opt.value = customData.matchId;
          opt.textContent = `[ไฟล์ของคุณ] ${file.name} (${customData.scoreAtk} - ${customData.scoreDef})`;
          opt.selected = true;
          select.prepend(opt);
        }

        loadMatch(customData.matchId);
      } catch (err) {
        console.error('Error parsing VRF file:', err);
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์รีเพลย์ กรุณาลองใหม่อีกครั้ง');
      }
    };

    if (file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  // ==========================================
  // LOAD MATCH & ROUNDS
  // ==========================================
  function loadMatch(matchKey) {
    if (matchKey && matchKey.startsWith('career_') && !DEMO_MATCHES[matchKey]) {
      const matchId = matchKey.replace('career_', '');
      const careerList = window.getAllCareerMatches ? window.getAllCareerMatches() : [];
      const careerMatch = careerList.find(m => m.matchId === matchId);
      if (careerMatch) {
        window.ValReplayEngine.loadFromUserCareerMatch(careerMatch);
        return;
      }
    }
    const match = DEMO_MATCHES[matchKey] || DEMO_MATCHES.demo_ascent;
    ReplayState.currentMatch = match;
    ReplayState.currentRoundIndex = Math.max(0, match.rounds.length - 1);
    ReplayState.currentTime = 0;
    ReplayState.isPlaying = false;
    ReplayState.lastKillfeedRenderedCount = 0;

    // Update Banner elements
    const ribbonAtk = document.getElementById('ribbonAtkScore');
    const ribbonDef = document.getElementById('ribbonDefScore');
    const ribbonMap = document.getElementById('ribbonMapTag');
    const bgImg = document.getElementById('replayMinimapBgImg');
    const heatmapBg = document.getElementById('heatmapBgImg');

    if (ribbonAtk) ribbonAtk.textContent = match.scoreAtk;
    if (ribbonDef) ribbonDef.textContent = match.scoreDef;
    if (ribbonMap) ribbonMap.textContent = match.map.name.toUpperCase();
    if (bgImg) bgImg.src = match.map.icon;
    if (heatmapBg) heatmapBg.src = match.map.icon;

    // Render Rounds Ribbon
    renderRoundsRibbon();

    // Render 10 Players Roster
    renderRosterList();

    // Render Focused Player HUD
    updateFocusedPlayerHUD();

    // Update Subviews
    renderSkillRadarChart();
    renderTenPlayersGrid();
    renderSprayVisualizer();
    renderMovementHeatmap();
    renderRoundFlowStream();
    renderCoachingPrescription();

    seekTo(0);
  }

  function getCurrentRound() {
    if (!ReplayState.currentMatch || !ReplayState.currentMatch.rounds) return null;
    return ReplayState.currentMatch.rounds[ReplayState.currentRoundIndex] || null;
  }

  function renderRoundsRibbon() {
    const container = document.getElementById('replayRoundsContainer');
    if (!container || !ReplayState.currentMatch) return;

    container.innerHTML = '';
    ReplayState.currentMatch.rounds.forEach((round, idx) => {
      const btn = document.createElement('button');
      btn.className = `round-pill-btn ${idx === ReplayState.currentRoundIndex ? 'active' : ''} ${round.winSide === 'atk' ? 'win-atk' : 'win-def'}`;
      
      const winIcon = (round.winType === 'Elimination') ? '💀' : (round.winType === 'Spike Detonated') ? '💥' : '🛡️';
      btn.innerHTML = `
        <span class="round-num">R${round.roundNum}</span>
        <span class="round-win-icon">${winIcon}</span>
      `;

      btn.addEventListener('click', () => {
        selectRound(idx);
      });

      container.appendChild(btn);
    });
  }

  function selectRound(index) {
    ReplayState.currentRoundIndex = index;
    ReplayState.currentTime = 0;
    ReplayState.lastKillfeedRenderedCount = 0;
    ReplayState.lastBeepSecond = -1;

    // Update active pill
    document.querySelectorAll('.round-pill-btn').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === index);
    });

    const round = getCurrentRound();
    const scrubber = document.getElementById('replayTimelineScrubber');
    const totalTimeEl = document.getElementById('ctrlTimeTotal');

    if (round && scrubber) {
      scrubber.max = round.duration;
      scrubber.value = 0;
    }
    if (round && totalTimeEl) {
      totalTimeEl.textContent = formatTime(round.duration);
    }

    updateTimerHUD();
    renderRoundFlowStream();
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateTimerHUD() {
    const round = getCurrentRound();
    if (!round) return;

    const roundPill = document.getElementById('hudRoundLabel');
    const phasePill = document.getElementById('hudPhaseLabel');
    const timerClock = document.getElementById('hudTimerClock');
    const ctrlCurrent = document.getElementById('ctrlTimeCurrent');

    if (roundPill) roundPill.textContent = `รอบที่ ${round.roundNum}`;
    if (ctrlCurrent) ctrlCurrent.textContent = formatTime(ReplayState.currentTime);

    // Phase determination
    let phase = 'BUY PHASE';
    if (ReplayState.currentTime > 5) phase = 'COMBAT / ENGAGEMENT';
    if (round.spikePlantTime && ReplayState.currentTime >= round.spikePlantTime) phase = 'RETREAT / DEFUSE';

    if (phasePill) phasePill.textContent = phase;
    if (timerClock) {
      const remaining = Math.max(0, round.duration - ReplayState.currentTime);
      timerClock.textContent = formatTime(remaining);
    }

    // Spike widget handling
    const spikeWidget = document.getElementById('replaySpikeWidget');
    const spikeCountdown = document.getElementById('spikeDetonationCount');
    const spikeBar = document.getElementById('spikeProgressBar');

    if (round.spikePlantTime && ReplayState.currentTime >= round.spikePlantTime && round.winType !== 'Spike Defused') {
      if (spikeWidget) spikeWidget.classList.remove('hidden');
      const spikeRemaining = Math.max(0, (round.spikePlantTime + 45) - ReplayState.currentTime);
      if (spikeCountdown) spikeCountdown.textContent = `${spikeRemaining.toFixed(1)}s`;
      if (spikeBar) spikeBar.style.width = `${(spikeRemaining / 45) * 100}%`;

      // Audio beeping
      const curSec = Math.floor(ReplayState.currentTime);
      if (curSec !== ReplayState.lastBeepSecond && spikeRemaining > 0) {
        ReplayState.lastBeepSecond = curSec;
        const pitch = (spikeRemaining < 10) ? 1400 : (spikeRemaining < 20) ? 1150 : 900;
        SoundFX.playSpikeBeep(pitch);
      }
    } else {
      if (spikeWidget) spikeWidget.classList.add('hidden');
    }
  }

  // ==========================================
  // 10-PLAYER ROSTER & FOCUSED PLAYER HUD
  // ==========================================
  function renderRosterList() {
    const atkContainer = document.getElementById('rosterAtkPlayers');
    const defContainer = document.getElementById('rosterDefPlayers');
    if (!atkContainer || !defContainer || !ReplayState.currentMatch) return;

    atkContainer.innerHTML = '';
    defContainer.innerHTML = '';

    const buildRow = (p, isAtk) => {
      const row = document.createElement('div');
      row.className = `roster-player-row ${p.id === ReplayState.focusedPlayerId ? 'active' : ''}`;
      row.dataset.playerId = p.id;

      const icon = AGENT_ICONS[p.agent] || AGENT_ICONS.Jett;
      row.innerHTML = `
        <div class="roster-player-left">
          <img src="${icon}" alt="${p.agent}" class="roster-agent-thumb">
          <div>
            <div class="roster-p-name">${p.name}</div>
            <div class="roster-p-role">${p.agent} · ${p.role}</div>
          </div>
        </div>
        <div class="roster-player-right">
          <span class="roster-hp-badge" id="rosterHp_${p.id}">100 HP</span>
        </div>
      `;

      row.addEventListener('click', () => {
        focusPlayer(p.id);
      });

      return row;
    };

    ReplayState.currentMatch.atkPlayers.forEach((p) => atkContainer.appendChild(buildRow(p, true)));
    ReplayState.currentMatch.defPlayers.forEach((p) => defContainer.appendChild(buildRow(p, false)));
  }

  function focusPlayer(playerId) {
    ReplayState.focusedPlayerId = playerId;
    document.querySelectorAll('.roster-player-row').forEach((r) => {
      r.classList.toggle('active', r.dataset.playerId === playerId);
    });
    updateFocusedPlayerHUD();
  }

  function updateFocusedPlayerHUD() {
    if (!ReplayState.currentMatch) return;
    const all = [...ReplayState.currentMatch.atkPlayers, ...ReplayState.currentMatch.defPlayers];
    const player = all.find((p) => p.id === ReplayState.focusedPlayerId) || all[0];
    if (!player) return;

    const img = document.getElementById('dossierAgentImg');
    const tag = document.getElementById('dossierTeamTag');
    const name = document.getElementById('dossierPlayerName');
    const agent = document.getElementById('dossierAgentName');
    const rank = document.getElementById('dossierRankTier');
    const acs = document.getElementById('dossierAcs');
    const adr = document.getElementById('dossierAdr');
    const hs = document.getElementById('dossierHs');
    const grade = document.getElementById('dossierGrade');

    if (img) img.src = AGENT_ICONS[player.agent] || AGENT_ICONS.Jett;
    const isAtk = ReplayState.currentMatch.atkPlayers.some((p) => p.id === player.id);
    if (tag) {
      tag.textContent = isAtk ? 'ATK' : 'DEF';
      tag.className = `dossier-team-badge ${isAtk ? 'team-atk' : 'team-def'}`;
    }
    if (name) name.textContent = player.name;
    if (agent) agent.textContent = `${player.agent} · ${player.role}`;
    if (rank) rank.textContent = player.rank;
    if (acs) acs.textContent = player.acs;
    if (adr) adr.textContent = player.adr;
    if (hs) hs.textContent = `${player.hs}%`;
    if (grade) grade.textContent = player.grade;
  }

  // ==========================================
  // REAL-TIME CANVAS 2D MINIMAP RENDERER
  // ==========================================
  function renderLoop(timestamp) {
    if (ReplayState.lastAnimTime === null) ReplayState.lastAnimTime = timestamp;
    const dt = (timestamp - ReplayState.lastAnimTime) / 1000;
    ReplayState.lastAnimTime = timestamp;

    const round = getCurrentRound();
    if (ReplayState.isPlaying && round) {
      ReplayState.currentTime += dt * ReplayState.playbackSpeed;
      if (ReplayState.currentTime >= round.duration) {
        ReplayState.currentTime = round.duration;
        ReplayState.isPlaying = false;
        const iconPlay = document.getElementById('iconPlay');
        const iconPause = document.getElementById('iconPause');
        if (iconPlay && iconPause) {
          iconPlay.classList.remove('hidden');
          iconPause.classList.add('hidden');
        }
      }

      const scrubber = document.getElementById('replayTimelineScrubber');
      if (scrubber) scrubber.value = ReplayState.currentTime;
      updateTimerHUD();
    }

    if (ReplayState.activeSubView === '2d-map' && ReplayState.canvas && ReplayState.ctx && round) {
      drawMinimapFrame(round);
    }

    requestAnimationFrame(renderLoop);
  }

  function drawMinimapFrame(round) {
    const canvas = ReplayState.canvas;
    const ctx = ReplayState.ctx;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const match = ReplayState.currentMatch;
    const allPlayers = [...match.atkPlayers, ...match.defPlayers];

    // 0. Draw Tactical Site & Map Watermark Callouts
    ctx.save();
    ctx.font = '900 12px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const callouts = [
      { text: 'A SITE', x: 10.5, y: 31.0 },
      { text: 'B SITE', x: 78.5, y: 24.5 },
      { text: 'MID', x: 48.8, y: 44.0 },
      { text: 'A MAIN', x: 20.1, y: 48.4 },
      { text: 'B MAIN', x: 71.2, y: 40.5 },
      { text: 'DEF SPAWN', x: 43.4, y: 10.5 },
      { text: 'ATK SPAWN', x: 56.9, y: 83.5 }
    ];

    callouts.forEach(c => {
      ctx.fillText(c.text, (c.x / 100) * w, (c.y / 100) * h);
    });
    ctx.restore();

    // Compute player positions at ReplayState.currentTime via interpolation
    const currentPositions = {};
    allPlayers.forEach((p) => {
      const traj = round.trajectories[p.id];
      if (!traj || traj.length === 0) return;

      let prev = traj[0];
      let next = traj[traj.length - 1];

      for (let i = 0; i < traj.length - 1; i++) {
        if (ReplayState.currentTime >= traj[i].t && ReplayState.currentTime <= traj[i + 1].t) {
          prev = traj[i];
          next = traj[i + 1];
          break;
        }
      }

      const ratio = (next.t === prev.t) ? 0 : Math.max(0, Math.min(1, (ReplayState.currentTime - prev.t) / (next.t - prev.t)));
      const x = prev.x + (next.x - prev.x) * ratio;
      const y = prev.y + (next.y - prev.y) * ratio;
      const angle = prev.angle + (next.angle - prev.angle) * ratio;
      const hp = Math.round(prev.hp + (next.hp - prev.hp) * ratio);
      const armor = Math.round(prev.armor + (next.armor - prev.armor) * ratio);

      currentPositions[p.id] = { x, y, angle, hp, armor, player: p };
    });

    // 1. Draw Player Movement Trails (Past 5 seconds)
    allPlayers.forEach((p, idx) => {
      const traj = round.trajectories[p.id];
      if (!traj) return;
      const isAtk = idx < 5;

      ctx.beginPath();
      ctx.strokeStyle = isAtk ? 'rgba(255, 70, 85, 0.25)' : 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);

      traj.forEach((pt, i) => {
        if (pt.t <= ReplayState.currentTime) {
          const px = (pt.x / 100) * w;
          const py = (pt.y / 100) * h;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 2. Draw Ability Utilites (Smokes & Recon Darts)
    if (round.spikePlantTime && ReplayState.currentTime >= round.spikePlantTime - 10) {
      // Omen Dark Cover Smoke on Site
      const targetSite = (round.spikeSite === 'A') ? match.map.sites.A : match.map.sites.B;
      const smokeX = (targetSite.x / 100) * w;
      const smokeY = (targetSite.y / 100) * h;

      ctx.save();
      const smokeGrad = ctx.createRadialGradient(smokeX, smokeY, 5, smokeX, smokeY, 48);
      smokeGrad.addColorStop(0, 'rgba(128, 90, 213, 0.55)');
      smokeGrad.addColorStop(0.8, 'rgba(88, 28, 135, 0.35)');
      smokeGrad.addColorStop(1, 'rgba(59, 7, 100, 0)');
      ctx.fillStyle = smokeGrad;
      ctx.beginPath();
      ctx.arc(smokeX, smokeY, 48, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Spike
    if (round.spikePlantTime && ReplayState.currentTime >= round.spikePlantTime) {
      const targetSite = (round.spikeSite === 'A') ? match.map.sites.A : match.map.sites.B;
      const spX = (targetSite.x / 100) * w;
      const spY = (targetSite.y / 100) * h;

      // Pulse ring
      const pulseSize = 16 + (Math.sin(ReplayState.currentTime * 5) + 1) * 8;
      ctx.beginPath();
      ctx.arc(spX, spY, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 70, 85, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Core spike icon
      ctx.fillStyle = '#ff4655';
      ctx.beginPath();
      ctx.arc(spX, spY, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Draw Vision Cones (100° FOV)
    allPlayers.forEach((p, idx) => {
      const pos = currentPositions[p.id];
      if (!pos || pos.hp <= 0) return;
      const isAtk = idx < 5;
      const px = (pos.x / 100) * w;
      const py = (pos.y / 100) * h;

      const fovRad = (100 * Math.PI) / 180;
      const angleRad = (pos.angle * Math.PI) / 180;
      const coneDist = 70;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, coneDist, angleRad - fovRad / 2, angleRad + fovRad / 2);
      ctx.closePath();

      const coneGrad = ctx.createRadialGradient(px, py, 2, px, py, coneDist);
      coneGrad.addColorStop(0, isAtk ? 'rgba(255, 70, 85, 0.35)' : 'rgba(0, 240, 255, 0.35)');
      coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coneGrad;
      ctx.fill();
      ctx.restore();
    });

    // 5. Draw Gunfire Tracers during Combat Events
    round.events.forEach((ev) => {
      if (ev.type === 'kill' && Math.abs(ReplayState.currentTime - ev.time) < 0.6) {
        const killerPos = currentPositions[ev.killerId];
        const victimPos = currentPositions[ev.victimId];
        if (killerPos && victimPos) {
          const kx = (killerPos.x / 100) * w;
          const ky = (killerPos.y / 100) * h;
          const vx = (victimPos.x / 100) * w;
          const vy = (victimPos.y / 100) * h;

          // Laser tracer
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(kx, ky);
          ctx.lineTo(vx, vy);
          ctx.strokeStyle = ev.isHeadshot ? '#ffd700' : '#ff4655';
          ctx.lineWidth = 3;
          ctx.shadowColor = ev.isHeadshot ? '#ffd700' : '#ff4655';
          ctx.shadowBlur = 10;
          ctx.stroke();

          // Muzzle spark
          ctx.beginPath();
          ctx.arc(kx, ky, 9, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          // Impact hit spark
          ctx.beginPath();
          ctx.arc(vx, vy, 11, 0, Math.PI * 2);
          ctx.fillStyle = ev.isHeadshot ? '#ffd700' : '#ff4655';
          ctx.fill();
          ctx.restore();
        }
      }
    });

    // 6. Compute Smart Dynamic Vertical Offsets for Player Labels (Anti-Collision)
    const verticalOffsets = {};
    allPlayers.forEach(p => { verticalOffsets[p.id] = -34; });

    for (let i = 0; i < allPlayers.length; i++) {
      const p1 = allPlayers[i];
      const pos1 = currentPositions[p1.id];
      if (!pos1 || pos1.hp <= 0) continue;

      for (let j = i + 1; j < allPlayers.length; j++) {
        const p2 = allPlayers[j];
        const pos2 = currentPositions[p2.id];
        if (!pos2 || pos2.hp <= 0) continue;

        const p1x = (pos1.x / 100) * w;
        const p1y = (pos1.y / 100) * h;
        const p2x = (pos2.x / 100) * w;
        const p2y = (pos2.y / 100) * h;

        const dist = Math.hypot(p1x - p2x, p1y - p2y);
        if (dist < 38) {
          if (p1.id === ReplayState.focusedPlayerId) {
            verticalOffsets[p1.id] = -42;
            verticalOffsets[p2.id] = -24;
          } else if (p2.id === ReplayState.focusedPlayerId) {
            verticalOffsets[p2.id] = -42;
            verticalOffsets[p1.id] = -24;
          } else {
            verticalOffsets[p1.id] = -41;
            verticalOffsets[p2.id] = -23;
          }
        }
      }
    }

    // 7. Draw 10 Player Avatars
    allPlayers.forEach((p, idx) => {
      const pos = currentPositions[p.id];
      if (!pos) return;
      const isAtk = idx < 5;
      const isFocused = (p.id === ReplayState.focusedPlayerId);
      const px = (pos.x / 100) * w;
      const py = (pos.y / 100) * h;

      if (pos.hp <= 0) {
        // Skull Death Marker
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f1923';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✕', px, py);
        return;
      }

      // Focused ring
      if (isFocused) {
        ctx.beginPath();
        ctx.arc(px, py, 21, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Outer team glowing circle
      ctx.beginPath();
      ctx.arc(px, py, 16, 0, Math.PI * 2);
      ctx.fillStyle = isAtk ? 'rgba(255, 70, 85, 0.95)' : 'rgba(0, 240, 255, 0.95)';
      ctx.fill();

      // Inner circular avatar clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 13.5, 0, Math.PI * 2);
      ctx.clip();

      const agentImg = AGENT_IMG_CACHE[p.agent];
      if (agentImg && agentImg.complete && agentImg.naturalWidth > 0) {
        ctx.drawImage(agentImg, px - 13.5, py - 13.5, 27, 27);
      } else {
        ctx.fillStyle = '#0f1923';
        ctx.fill();
        ctx.fillStyle = isAtk ? '#ff6b78' : '#5ce9ff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.agent.charAt(0), px, py);
      }
      ctx.restore();

      // Glowing team border
      ctx.beginPath();
      ctx.arc(px, py, 14.5, 0, Math.PI * 2);
      ctx.strokeStyle = isAtk ? '#ff4655' : '#00f0ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Facing Direction Arrow (radar pointer)
      const angleRad = (pos.angle * Math.PI) / 180;
      const arrowX = px + Math.cos(angleRad) * 19;
      const arrowY = py + Math.sin(angleRad) * 19;
      ctx.beginPath();
      ctx.arc(arrowX, arrowY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = isAtk ? '#ff4655' : '#00f0ff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Name Badge with Dark Rounded Pill (Guarantees 100% legibility)
      const labelOffset = verticalOffsets[p.id] || -34;
      ctx.font = 'bold 9.5px sans-serif';
      const txtW = ctx.measureText(p.name).width;
      ctx.fillStyle = isFocused ? 'rgba(0, 240, 255, 0.28)' : 'rgba(8, 14, 20, 0.92)';
      ctx.fillRect(px - txtW / 2 - 4, py + labelOffset, txtW + 8, 13);
      ctx.strokeStyle = isFocused ? '#00f0ff' : (isAtk ? 'rgba(255, 70, 85, 0.55)' : 'rgba(0, 240, 255, 0.55)');
      ctx.lineWidth = isFocused ? 1.5 : 1;
      ctx.strokeRect(px - txtW / 2 - 4, py + labelOffset, txtW + 8, 13);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.name, px, py + labelOffset + 6.5);

      // HP Bar below name pill
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(px - 12, py - 20, 24, 3.5);
      ctx.fillStyle = (pos.hp > 50) ? '#10b981' : (pos.hp > 25) ? '#f59e0b' : '#ef4444';
      ctx.fillRect(px - 12, py - 20, (pos.hp / 100) * 24, 3.5);

      // Spike Carrier Golden Indicator
      if (p.id === 'p4' && (!round.spikePlantTime || ReplayState.currentTime < round.spikePlantTime)) {
        ctx.save();
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(px, py + labelOffset - 9);
        ctx.lineTo(px + 4.5, py + labelOffset - 5);
        ctx.lineTo(px, py + labelOffset - 1);
        ctx.lineTo(px - 4.5, py + labelOffset - 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    });

    // 7. Update Dynamic Killfeed Overlay & Sound Triggers
    updateKillfeedOverlay(round);

    // 8. Update HUD Vitals for focused player
    const focusedPos = currentPositions[ReplayState.focusedPlayerId];
    if (focusedPos) {
      const hpVal = document.getElementById('dossierHpVal');
      const hpBar = document.getElementById('dossierHpBar');
      const armVal = document.getElementById('dossierArmorVal');
      const armBar = document.getElementById('dossierArmorBar');
      const angleVal = document.getElementById('dossierFacingAngle');

      const angleDeg = Math.round(((focusedPos.angle % 360) + 360) % 360);
      if (hpVal) hpVal.textContent = focusedPos.hp;
      if (hpBar) hpBar.style.width = `${focusedPos.hp}%`;
      if (armVal) armVal.textContent = focusedPos.armor;
      if (armBar) armBar.style.width = `${(focusedPos.armor / 50) * 100}%`;
      if (angleVal) angleVal.textContent = `${angleDeg}°`;
    }
  }

  function updateKillfeedOverlay(round) {
    const container = document.getElementById('replayKillfeedOverlay');
    if (!container) return;

    const visibleKills = round.events.filter((e) => e.type === 'kill' && e.time <= ReplayState.currentTime);

    // Trigger gunshot / headshot sound when new kill appears during playback
    if (visibleKills.length > ReplayState.lastKillfeedRenderedCount) {
      const latest = visibleKills[visibleKills.length - 1];
      if (latest.isHeadshot) SoundFX.playHeadshotDing();
      else SoundFX.playGunfire();
    }
    ReplayState.lastKillfeedRenderedCount = visibleKills.length;

    // Show last 3 recent kills
    const recent = visibleKills.slice(-3);
    container.innerHTML = recent.map((k) => `
      <div class="killfeed-row-item ${k.victimTeam === 'atk' ? 'victim-atk' : 'victim-def'}">
        <img src="${AGENT_ICONS[k.killerAgent] || AGENT_ICONS.Jett}" class="kf-agent-icon" alt="">
        <span class="kf-name ${k.killerTeam === 'atk' ? 'team-atk' : 'team-def'}">${k.killerName}</span>
        <span class="kf-weapon-badge">${k.weapon}</span>
        ${k.isHeadshot ? '<span class="kf-hs-icon">HS</span>' : ''}
        <span class="kf-name ${k.victimTeam === 'atk' ? 'team-atk' : 'team-def'}">${k.victimName}</span>
        <img src="${AGENT_ICONS[k.victimAgent] || AGENT_ICONS.Jett}" class="kf-agent-icon" alt="">
      </div>
    `).join('');
  }

  // ==========================================
  // SUBVIEW 2: SKILL HEXAGON (POWER GRAPH)
  // ==========================================
  function renderSkillRadarChart() {
    const canvas = document.getElementById('skillRadarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w * 0.38;

    ctx.clearRect(0, 0, w, h);

    const labels = [
      'Reflexes (ตอบสนอง)',
      'Aim (การเล็ง)',
      'Precision (ความแม่น)',
      'Movement (วินัยเดินยิง)',
      'Teamplay (การเล่นทีม)',
      'Impact (อิมแพ็ค)'
    ];

    const match = ReplayState.currentMatch;
    const pData = match ? match.powerGraph : null;

    const myScores = pData ? [
      pData.reflexes.score / 100,
      pData.aim.score / 100,
      pData.precision.score / 100,
      pData.movement.score / 100,
      pData.teamplay.score / 100,
      pData.impact.score / 100
    ] : [0.92, 0.96, 0.88, 0.78, 0.94, 0.97];

    const radiantScores = [0.95, 0.95, 0.92, 0.90, 0.92, 0.93];
    const immortalScores = [0.82, 0.84, 0.79, 0.76, 0.80, 0.82];

    const numAxes = 6;
    const angleStep = (Math.PI * 2) / numAxes;

    // 1. Concentric Hexagons
    for (let level = 1; level <= 5; level++) {
      const r = (radius / 5) * level;
      ctx.beginPath();
      for (let i = 0; i < numAxes; i++) {
        const a = i * angleStep - Math.PI / 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = (level === 5) ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 2. Axis Lines & Labels
    for (let i = 0; i < numAxes; i++) {
      const a = i * angleStep - Math.PI / 2;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.stroke();

      // Axis Label
      const lx = cx + Math.cos(a) * (radius + 28);
      const ly = cy + Math.sin(a) * (radius + 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], lx, ly);
    }

    // 3. Radiant Benchmark Polygon (Gold Dotted)
    drawRadarPolygon(ctx, cx, cy, radius, radiantScores, angleStep, 'rgba(255, 215, 0, 0.7)', 'rgba(255, 215, 0, 0.05)', true);

    // 4. Immortal Benchmark Polygon (Cyan Dotted)
    drawRadarPolygon(ctx, cx, cy, radius, immortalScores, angleStep, 'rgba(0, 240, 255, 0.6)', 'rgba(0, 240, 255, 0.04)', true);

    // 5. My Player Polygon (Red Glow Solid)
    drawRadarPolygon(ctx, cx, cy, radius, myScores, angleStep, '#ff4655', 'rgba(255, 70, 85, 0.35)', false);
  }

  function drawRadarPolygon(ctx, cx, cy, radius, scores, angleStep, strokeColor, fillColor, isDashed = false) {
    ctx.save();
    ctx.beginPath();
    scores.forEach((s, i) => {
      const a = i * angleStep - Math.PI / 2;
      const r = radius * s;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    if (isDashed) ctx.setLineDash([4, 4]);
    ctx.stroke();

    // Data points
    scores.forEach((s, i) => {
      const a = i * angleStep - Math.PI / 2;
      const r = radius * s;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
    });

    ctx.restore();
  }

  // ==========================================
  // SUBVIEW 3: 10 PLAYERS COMPARISON GRID
  // ==========================================
  function renderTenPlayersGrid() {
    const gridAtk = document.getElementById('gridAtkCards');
    const gridDef = document.getElementById('gridDefCards');
    if (!gridAtk || !gridDef || !ReplayState.currentMatch) return;

    gridAtk.innerHTML = '';
    gridDef.innerHTML = '';

    const createPlayerRow = (p) => {
      const card = document.createElement('div');
      card.className = 'player-stat-card-row';

      const icon = AGENT_ICONS[p.agent] || AGENT_ICONS.Jett;
      card.innerHTML = `
        <div class="pcard-left">
          <img src="${icon}" class="pcard-avatar" alt="${p.agent}">
          <div class="pcard-name-col">
            <span class="pcard-name">${p.name}</span>
            <span class="pcard-meta">${p.agent} · ${p.rank}</span>
          </div>
        </div>

        <div class="pcard-stats-row">
          <div class="pcard-metric">
            <span class="k">ACS</span>
            <span class="v">${p.acs}</span>
          </div>
          <div class="pcard-metric">
            <span class="k">K / D</span>
            <span class="v">${p.kills}/${p.deaths}</span>
          </div>
          <div class="pcard-metric">
            <span class="k">ADR</span>
            <span class="v">${p.adr}</span>
          </div>
          <div class="pcard-metric">
            <span class="k">HS %</span>
            <span class="v">${p.hs}%</span>
          </div>
          <span class="pcard-grade-badge ${p.grade.startsWith('S') ? 'grade-s' : 'grade-a'}">${p.grade}</span>
          <button class="btn-focus-player" data-pid="${p.id}">โฟกัสใน 2D</button>
        </div>
      `;

      card.querySelector('.btn-focus-player').addEventListener('click', () => {
        focusPlayer(p.id);
        switchSubView('2d-map');
      });

      return card;
    };

    ReplayState.currentMatch.atkPlayers.forEach((p) => gridAtk.appendChild(createPlayerRow(p)));
    ReplayState.currentMatch.defPlayers.forEach((p) => gridDef.appendChild(createPlayerRow(p)));
  }

  // ==========================================
  // SUBVIEW 4: SPRAY ANALYSIS VISUALIZER
  // ==========================================
  function renderSprayVisualizer() {
    const canvas = document.getElementById('sprayCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h * 0.72; // bullseye target lowered to leave room for vertical recoil

    ctx.clearRect(0, 0, w, h);

    // Setup pills listeners once
    setupSprayPills();

    const weaponData = SPRAY_DATA[ReplayState.activeSprayWeapon] || SPRAY_DATA.vandal;

    // 1. Draw 5° Grid Lines
    const scale = 32; // pixels per degree
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    for (let x = -5; x <= 5; x++) {
      ctx.beginPath();
      ctx.moveTo(cx + x * 5 * (scale / 5), 0);
      ctx.lineTo(cx + x * 5 * (scale / 5), h);
      ctx.stroke();
    }

    for (let y = -1; y <= 10; y++) {
      ctx.beginPath();
      ctx.moveTo(0, cy - y * 5 * (scale / 5));
      ctx.lineTo(w, cy - y * 5 * (scale / 5));
      ctx.stroke();
    }

    // 2. Center Bullseye Target (Crosshair point 0,0)
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Filter bullets by sequence
    let bullets = weaponData.bullets;
    if (ReplayState.activeSpraySeq === 'first4') bullets = bullets.slice(0, 4);
    if (ReplayState.activeSpraySeq === 'mid') bullets = bullets.slice(4, 12);
    if (ReplayState.activeSpraySeq === 'late') bullets = bullets.slice(12);

    // 4. Draw Ideal Compensation Vector
    const showComp = document.getElementById('chkShowRecoilComp')?.checked;
    if (showComp && bullets.length > 0) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      bullets.forEach((b) => {
        const bx = cx - b.x * scale; // inverted for compensation
        const by = cy + b.y * scale;
        ctx.lineTo(bx, by);
      });
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Draw Bullet Trajectory Curve
    ctx.beginPath();
    bullets.forEach((b, idx) => {
      const bx = cx + b.x * scale;
      const by = cy - b.y * scale;
      if (idx === 0) ctx.moveTo(bx, by);
      else ctx.lineTo(bx, by);
    });
    ctx.strokeStyle = 'rgba(255, 70, 85, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 6. Draw Bullet Hits
    bullets.forEach((b, idx) => {
      const bx = cx + b.x * scale;
      const by = cy - b.y * scale;

      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fillStyle = (idx < 4) ? '#10b981' : '#ff4655';
      ctx.fill();

      // Avoid crowded bullet number overlap
      const shouldDrawNum = [1, 2, 3, 4, 6, 9, 13, 17, 21, 25].includes(b.n) || bullets.length <= 8;
      if (shouldDrawNum) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.n, bx, by);
      }
    });
  }

  function setupSprayPills() {
    const weaponPills = document.querySelectorAll('.weapon-spray-pill');
    const seqPills = document.querySelectorAll('.seq-pill');
    const btnAnimate = document.getElementById('btnAnimateSpray');
    const chkComp = document.getElementById('chkShowRecoilComp');

    weaponPills.forEach((p) => {
      p.onclick = () => {
        weaponPills.forEach((w) => w.classList.remove('active'));
        p.classList.add('active');
        ReplayState.activeSprayWeapon = p.dataset.weapon;
        updateWeaponSpecHUD();
        renderSprayVisualizer();
      };
    });

    seqPills.forEach((p) => {
      p.onclick = () => {
        seqPills.forEach((s) => s.classList.remove('active'));
        p.classList.add('active');
        ReplayState.activeSpraySeq = p.dataset.seq;
        renderSprayVisualizer();
      };
    });

    if (chkComp) {
      chkComp.onchange = () => renderSprayVisualizer();
    }

    if (btnAnimate) {
      btnAnimate.onclick = () => {
        let frame = 0;
        const weaponData = SPRAY_DATA[ReplayState.activeSprayWeapon] || SPRAY_DATA.vandal;
        const animInterval = setInterval(() => {
          frame++;
          SoundFX.playGunfire(ReplayState.activeSprayWeapon === 'vandal');
          if (frame >= weaponData.bullets.length) clearInterval(animInterval);
        }, 100);
      };
    }
  }

  function updateWeaponSpecHUD() {
    const w = SPRAY_DATA[ReplayState.activeSprayWeapon] || SPRAY_DATA.vandal;
    const title = document.getElementById('sprayWeaponTitle');
    const fireRate = document.getElementById('specFireRate');
    const runSpeed = document.getElementById('specRunSpeed');
    const headDmg = document.getElementById('specHeadDmg');
    const bodyDmg = document.getElementById('specBodyDmg');

    if (title) title.textContent = `${w.name} Weapon Profile`;
    if (fireRate) fireRate.textContent = w.fireRate;
    if (runSpeed) runSpeed.textContent = w.runSpeed;
    if (headDmg) headDmg.textContent = w.headDmg;
    if (bodyDmg) bodyDmg.textContent = w.bodyDmg;
  }

  // ==========================================
  // SUBVIEW 5: MOVEMENT HEATMAP
  // ==========================================
  function renderMovementHeatmap() {
    const canvas = document.getElementById('movementHeatmapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    setupHeatmapPills();

    const match = ReplayState.currentMatch;
    if (!match) return;

    // Collect coordinates from rounds based on layer and phase
    const points = [];
    match.rounds.forEach((round) => {
      const allPlayers = [...match.atkPlayers, ...match.defPlayers];
      allPlayers.forEach((p, idx) => {
        const isAtk = idx < 5;

        // Filter layer
        if (ReplayState.activeHeatmapLayer === 'me' && !p.isUser) return;
        if (ReplayState.activeHeatmapLayer === 'team' && isAtk) return;
        if (ReplayState.activeHeatmapLayer === 'enemy' && !isAtk) return;

        const traj = round.trajectories[p.id];
        if (traj) {
          traj.forEach((pt) => {
            points.push({ x: (pt.x / 100) * w, y: (pt.y / 100) * h });
          });
        }
      });
    });

    // Render thermal hotspots
    points.forEach((pt) => {
      const grad = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, 35);
      grad.addColorStop(0, 'rgba(255, 70, 85, 0.45)');
      grad.addColorStop(0.3, 'rgba(234, 179, 8, 0.25)');
      grad.addColorStop(0.7, 'rgba(34, 197, 94, 0.12)');
      grad.addColorStop(1, 'rgba(0, 240, 255, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 35, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function setupHeatmapPills() {
    const phaseBtns = document.querySelectorAll('.heatmap-phase-btn');
    const layerBtns = document.querySelectorAll('.heatmap-layer-btn');

    phaseBtns.forEach((b) => {
      b.onclick = () => {
        phaseBtns.forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        ReplayState.activeHeatmapPhase = b.dataset.phase;
        renderMovementHeatmap();
      };
    });

    layerBtns.forEach((b) => {
      b.onclick = () => {
        layerBtns.forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        ReplayState.activeHeatmapLayer = b.dataset.layer;
        renderMovementHeatmap();
      };
    });
  }

  // ==========================================
  // SUBVIEW 6: ROUND FLOW (COMBAT STREAM)
  // ==========================================
  function renderRoundFlowStream() {
    const container = document.getElementById('roundFlowEventStream');
    if (!container) return;

    const round = getCurrentRound();
    if (!round) return;

    container.innerHTML = round.events.map((ev) => {
      const isKill = ev.type === 'kill';
      const isPlant = ev.type === 'plant';
      const isDefuse = ev.type === 'defuse';

      const timeStr = formatTime(ev.time);

      if (isKill) {
        return `
          <div class="flow-event-card" data-time="${ev.time}">
            <div class="flow-event-left">
              <span class="flow-time-pill">${timeStr}</span>
              <div class="flow-combat-sequence">
                <img src="${AGENT_ICONS[ev.killerAgent] || AGENT_ICONS.Jett}" class="flow-agent-thumb" alt="">
                <span class="flow-pname ${ev.killerTeam === 'atk' ? 'team-atk' : 'team-def'}">${ev.killerName}</span>
                <span class="flow-action-badge">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                  <span>${ev.weapon}</span>
                  ${ev.isHeadshot ? '· HS' : ''}
                </span>
                <span class="flow-pname ${ev.victimTeam === 'atk' ? 'team-atk' : 'team-def'}">${ev.victimName}</span>
                <img src="${AGENT_ICONS[ev.victimAgent] || AGENT_ICONS.Jett}" class="flow-agent-thumb" alt="">
              </div>
            </div>

            <div class="flow-event-right">
              ${ev.isFirstBlood ? '<span class="flow-tag-pill tag-fb">First Blood</span>' : ''}
              ${ev.isTraded ? `<span class="flow-tag-pill tag-traded">Traded (${ev.tradeTimeMs ? ev.tradeTimeMs + 'ms' : '0.9s'})</span>` : ''}
              <button class="btn-jump-event">กระโดดไป 2D</button>
            </div>
          </div>
        `;
      } else if (isPlant) {
        return `
          <div class="flow-event-card" style="border-left-color:#ffd700;" data-time="${ev.time}">
            <div class="flow-event-left">
              <span class="flow-time-pill">${timeStr}</span>
              <div class="flow-combat-sequence">
                <img src="${AGENT_ICONS[ev.planterAgent] || AGENT_ICONS.Jett}" class="flow-agent-thumb" alt="">
                <span class="flow-pname">${ev.planterName}</span>
                <span class="flow-action-badge" style="color:#ffd700; border-color:#ffd700;">วาง Spike บน Site ${ev.site}</span>
              </div>
            </div>
            <div class="flow-event-right">
              <span class="flow-tag-pill tag-fb">Spike Planted</span>
              <button class="btn-jump-event">กระโดดไป 2D</button>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="flow-event-card" style="border-left-color:#00f0ff;" data-time="${ev.time}">
            <div class="flow-event-left">
              <span class="flow-time-pill">${timeStr}</span>
              <div class="flow-combat-sequence">
                <span class="flow-pname">${ev.defuserName}</span>
                <span class="flow-action-badge" style="color:#00f0ff; border-color:#00f0ff;">กู้ Spike สำเร็จ</span>
              </div>
            </div>
            <div class="flow-event-right">
              <span class="flow-tag-pill tag-traded">Spike Defused</span>
              <button class="btn-jump-event">กระโดดไป 2D</button>
            </div>
          </div>
        `;
      }
    }).join('');

    // Attach click triggers to jump replay time
    container.querySelectorAll('.flow-event-card').forEach((card) => {
      card.addEventListener('click', () => {
        const time = parseFloat(card.dataset.time);
        if (!isNaN(time)) {
          seekTo(Math.max(0, time - 1.5));
          switchSubView('2d-map');
          if (!ReplayState.isPlaying) togglePlayPause();
        }
      });
    });
  }

  // ==========================================
  // SUBVIEW 7: COACHING PRESCRIPTION
  // ==========================================
  function renderCoachingPrescription() {
    const match = ReplayState.currentMatch;
    if (!match || !match.metrics || !match.metrics.prescriptions) return;
    const presc = match.metrics.prescriptions;

    if (presc.weaknesses && presc.weaknesses.length > 0) {
      const wTitle = document.querySelector('.coaching-card.weakness h4');
      const wBadge = document.querySelector('.coaching-card.weakness .badge-outline');
      const wDesc = document.querySelector('.coaching-card.weakness p');
      if (wTitle) wTitle.textContent = presc.weaknesses[0].title;
      if (wBadge) wBadge.textContent = presc.weaknesses[0].grade || 'Grade B-';
      if (wDesc) wDesc.innerHTML = presc.weaknesses[0].desc;
    }

    if (presc.strengths && presc.strengths.length > 0) {
      const sTitle = document.querySelector('.coaching-card.strength h4');
      const sBadge = document.querySelector('.coaching-card.strength .badge-outline');
      const sDesc = document.querySelector('.coaching-card.strength p');
      if (sTitle) sTitle.textContent = presc.strengths[0].title;
      if (sBadge) sBadge.textContent = presc.strengths[0].grade || 'Grade S+';
      if (sDesc) sDesc.innerHTML = presc.strengths[0].desc;
    }

    if (presc.drills && presc.drills.length > 0) {
      const drillItems = document.querySelectorAll('.drill-item p');
      presc.drills.forEach((drillText, i) => {
        if (drillItems[i]) drillItems[i].textContent = drillText;
      });
    }
  }

  // ==========================================
  // REAL VALORANT MATCH CONVERTER (API -> 2D REPLAY)
  // ==========================================
  function convertValorantApiMatchToReplay(rawMatch) {
    if (!rawMatch) return null;
    const matchId = String(rawMatch.matchId || ('match_' + Date.now()));

    // 1. Resolve Map Metadata
    const rawMapName = (rawMatch.map?.displayName || rawMatch.mapName || 'Ascent');
    const mapKey = rawMapName.toLowerCase();
    const mapMeta = MAP_METADATA[mapKey] || {
      name: rawMapName,
      icon: rawMatch.map?.displayIcon || rawMatch.mapIcon || 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png',
      sites: { A: { x: 30.0, y: 35.0 }, B: { x: 70.0, y: 35.0 }, Mid: { x: 50.0, y: 48.0 } },
      atkSpawn: { x: 50.0, y: 88.0 },
      defSpawn: { x: 50.0, y: 15.0 },
      xMultiplier: rawMatch.map?.xMultiplier || 0.00007,
      yMultiplier: rawMatch.map?.yMultiplier || -0.00007,
      xScalarToAdd: typeof rawMatch.map?.xScalarToAdd === 'number' ? rawMatch.map.xScalarToAdd : 0.5,
      yScalarToAdd: typeof rawMatch.map?.yScalarToAdd === 'number' ? rawMatch.map.yScalarToAdd : 0.5
    };

    // Helper: In-game 3D World (x, y) to Radar Minimap % (0-100)
    function worldToPercent(loc) {
      if (!loc || typeof loc.x !== 'number' || typeof loc.y !== 'number') return null;
      const xm = mapMeta.xMultiplier || 0.00007;
      const ym = mapMeta.yMultiplier || -0.00007;
      const xs = typeof mapMeta.xScalarToAdd === 'number' ? mapMeta.xScalarToAdd : 0.5;
      const ys = typeof mapMeta.yScalarToAdd === 'number' ? mapMeta.yScalarToAdd : 0.5;
      // Riot standard radar projection: radarX = (worldY * xMultiplier) + xScalarToAdd
      let px = ((loc.y * xm) + xs) * 100;
      let py = ((loc.x * ym) + ys) * 100;
      px = Math.max(5, Math.min(95, px));
      py = Math.max(5, Math.min(95, py));
      return { x: parseFloat(px.toFixed(1)), y: parseFloat(py.toFixed(1)) };
    }

    // 2. Format 10 Players (ATK / DEF)
    let sourcePlayers = [];
    if (Array.isArray(rawMatch.players) && rawMatch.players.length > 0) {
      sourcePlayers = rawMatch.players;
    } else {
      sourcePlayers = [...(rawMatch.friendlyTeam || []), ...(rawMatch.enemyTeam || [])];
    }

    const atkPlayers = [];
    const defPlayers = [];

    const formatPlayer = (p, idx, isAtk) => {
      const pid = p.puuid || p.subject || ('p' + (idx + 1));
      const gName = p.gameName ? `${p.gameName}#${p.tagLine || ''}`.replace(/#$/, '') : (p.name || 'Agent');
      const agName = p.agent?.displayName || p.agent?.name || p.agent || 'Jett';
      const rName = p.rank?.tierName || p.rank?.name || p.rank || 'Platinum';
      const st = p.stats || p.myStats || {};
      const acs = Math.round(st.acs || (210 + (Math.random() * 40 - 20)));
      const adr = Math.round(st.adr || (135 + (Math.random() * 30 - 15)));
      const hs = Math.round(st.hsPercent || 25);
      const k = st.kills || 0;
      const d = st.deaths || 0;
      const a = st.assists || 0;
      const grade = acs >= 280 ? 'S+' : acs >= 230 ? 'S' : acs >= 180 ? 'A+' : acs >= 140 ? 'A' : 'B+';

      return {
        id: pid,
        name: gName,
        agent: agName,
        role: p.agent?.role || 'Duelist',
        rank: rName,
        isUser: !!(p.isMe || (rawMatch.userPuuid && pid === rawMatch.userPuuid)),
        acs,
        adr,
        hs,
        kills: k,
        deaths: d,
        assists: a,
        grade
      };
    };

    sourcePlayers.forEach((p, idx) => {
      const team = (p.teamId || '').toLowerCase();
      const isRed = team === 'red' || idx < 5;
      if (isRed) {
        atkPlayers.push(formatPlayer(p, idx, true));
      } else {
        defPlayers.push(formatPlayer(p, idx, false));
      }
    });

    while (atkPlayers.length < 5) {
      atkPlayers.push({ id: 'atk_' + atkPlayers.length, name: 'Agent ' + (atkPlayers.length + 1), agent: 'Jett', role: 'Duelist', rank: 'Platinum', isUser: false, acs: 200, adr: 130, hs: 25, kills: 12, deaths: 10, assists: 4, grade: 'A' });
    }
    while (defPlayers.length < 5) {
      defPlayers.push({ id: 'def_' + defPlayers.length, name: 'Agent ' + (defPlayers.length + 1), agent: 'Omen', role: 'Controller', rank: 'Platinum', isUser: false, acs: 190, adr: 125, hs: 22, kills: 10, deaths: 12, assists: 6, grade: 'B+' });
    }

    const allPlayersList = [...atkPlayers, ...defPlayers];
    const playerLookup = new Map();
    allPlayersList.forEach(p => playerLookup.set(p.id, p));

    // 3. Format Rounds and Trajectories
    const rawRounds = Array.isArray(rawMatch.rounds) ? rawMatch.rounds : [];
    const rounds = [];
    let redScore = 0;
    let blueScore = 0;

    const roundCount = Math.max(rawRounds.length, (rawMatch.myTeamScore ? (rawMatch.myTeamScore + rawMatch.enemyTeamScore) : 1));

    for (let rIdx = 0; rIdx < roundCount; rIdx++) {
      const r = rawRounds[rIdx] || {};
      const roundNum = r.roundNum || (rIdx + 1);
      const isRedWon = (r.winningTeam === 'Red' || r.winningTeam === 'Attackers' || (r.winningTeam && r.winningTeam.toLowerCase().includes('red')) || (rIdx % 2 === 0));
      if (isRedWon) redScore++; else blueScore++;

      const winType = r.winType || (r.winningTeam ? 'Elimination' : 'Elimination');
      const roundDuration = Math.max(45, Math.min(105, r.plantRoundTime ? Math.round(r.plantRoundTime / 1000 + 45) : 75));
      const spikePlantTime = r.plantRoundTime ? Math.round(r.plantRoundTime / 1000) : (winType.toLowerCase().includes('bomb') ? 42 : null);
      const spikeDefused = winType.toLowerCase().includes('defuse');
      const spikeSite = r.plantSite || 'A';

      let plantPct = worldToPercent(r.plantLocation) || (spikeSite === 'A' ? mapMeta.sites.A : (mapMeta.sites.B || mapMeta.sites.A));
      let defusePct = worldToPercent(r.defuseLocation) || plantPct;

      const trajectories = {};
      const killsList = [];
      const eventsList = [];
      const rawKills = Array.isArray(r.kills) ? r.kills : [];

      rawKills.forEach(k => {
        const kSec = Math.max(2, Math.min(roundDuration - 1, Math.round((k.timeSinceRoundStartMillis || 0) / 1000)));
        const killer = playerLookup.get(k.killerPuuid) || { name: k.killerName || 'Killer', agent: 'Agent' };
        const victim = playerLookup.get(k.victimPuuid) || { name: k.victimName || 'Victim', agent: 'Agent' };
        const vPos = worldToPercent(k.victimLocation) || (mapMeta.sites.Mid || { x: 50, y: 50 });

        killsList.push({
          time: kSec,
          killerId: k.killerPuuid,
          victimId: k.victimPuuid,
          killerName: killer.name,
          victimName: victim.name,
          killerAgent: killer.agent,
          victimAgent: victim.agent,
          weapon: k.weaponName || 'Vandal',
          x: vPos.x,
          y: vPos.y,
          isHeadshot: !!(k.finishingDamage && k.finishingDamage.damageItem)
        });

        eventsList.push({
          time: kSec,
          type: 'kill',
          text: `${killer.name} (${killer.agent}) สังหาร ${victim.name} ด้วย ${k.weaponName || 'Vandal'}`
        });
      });

      if (spikePlantTime) {
        eventsList.push({
          time: spikePlantTime,
          type: 'plant',
          text: `วาง Spike ที่ Site ${spikeSite}`
        });
      }
      if (spikeDefused) {
        const defuseTime = r.defuseRoundTime ? Math.round(r.defuseRoundTime / 1000) : (spikePlantTime ? spikePlantTime + 30 : roundDuration - 5);
        eventsList.push({
          time: defuseTime,
          type: 'defuse',
          text: `กู้ Spike สำเร็จ! (${r.defuserName || 'Defuser'})`
        });
      }

      eventsList.sort((a, b) => a.time - b.time);

      // Trajectories for all 10 players
      allPlayersList.forEach((p, pIdx) => {
        const isAtk = atkPlayers.some(ap => ap.id === p.id);
        const spawn = isAtk ? mapMeta.atkSpawn : mapMeta.defSpawn;
        const jitterX = (pIdx % 5 - 2) * 4.2;
        const jitterY = Math.floor(pIdx / 5) * 3.5;
        const startX = Math.max(5, Math.min(95, (spawn?.x || 50) + jitterX));
        const startY = Math.max(5, Math.min(95, (spawn?.y || 80) + jitterY));

        const targetSite = spikeSite === 'A' ? mapMeta.sites.A : (mapMeta.sites.B || mapMeta.sites.A);
        const keyframes = [];

        keyframes.push({
          t: 0,
          x: startX,
          y: startY,
          angle: isAtk ? 270 : 90,
          hp: 100,
          armor: 50,
          weapon: 'Vandal',
          ammo: 25
        });

        const playerKill = killsList.find(k => k.victimId === p.id);
        const killTime = playerKill ? playerKill.time : null;

        const t15 = Math.min(15, killTime ? Math.max(1, killTime - 3) : 15);
        const midX = isAtk ? (startX * 0.6 + targetSite.x * 0.4) : (startX * 0.5 + targetSite.x * 0.5);
        const midY = isAtk ? (startY * 0.6 + targetSite.y * 0.4) : (startY * 0.5 + targetSite.y * 0.5);

        keyframes.push({
          t: t15,
          x: parseFloat(midX.toFixed(1)),
          y: parseFloat(midY.toFixed(1)),
          angle: isAtk ? 280 : 100,
          hp: 100,
          armor: 50,
          weapon: 'Vandal',
          ammo: 25
        });

        if (playerKill && killTime) {
          keyframes.push({
            t: killTime,
            x: playerKill.x,
            y: playerKill.y,
            angle: 0,
            hp: 0,
            armor: 0,
            weapon: 'Vandal',
            ammo: 0
          });
          keyframes.push({
            t: roundDuration,
            x: playerKill.x,
            y: playerKill.y,
            angle: 0,
            hp: 0,
            armor: 0,
            weapon: 'Vandal',
            ammo: 0
          });
        } else {
          const finalX = targetSite.x + ((pIdx % 3 - 1) * 3.5);
          const finalY = targetSite.y + ((pIdx % 2) * 3.5);
          keyframes.push({
            t: Math.round(roundDuration * 0.65),
            x: parseFloat(finalX.toFixed(1)),
            y: parseFloat(finalY.toFixed(1)),
            angle: isAtk ? 315 : 45,
            hp: 85,
            armor: 25,
            weapon: 'Vandal',
            ammo: 18
          });
          keyframes.push({
            t: roundDuration,
            x: parseFloat(finalX.toFixed(1)),
            y: parseFloat(finalY.toFixed(1)),
            angle: isAtk ? 315 : 45,
            hp: (isAtk ? isRedWon : !isRedWon) ? 75 : 0,
            armor: 15,
            weapon: 'Vandal',
            ammo: 12
          });
        }

        keyframes.sort((a, b) => a.t - b.t);
        trajectories[p.id] = keyframes;
      });

      rounds.push({
        roundNumber: roundNum,
        scoreAtk: redScore,
        scoreDef: blueScore,
        winner: isRedWon ? 'ATK' : 'DEF',
        winType,
        duration: roundDuration,
        spike: {
          planted: !!spikePlantTime,
          site: spikeSite,
          time: spikePlantTime,
          defused: spikeDefused,
          location: plantPct
        },
        trajectories,
        kills: killsList,
        skills: [],
        events: eventsList
      });
    }

    // 4. Metrics & AI Coach Prescription
    const userPlayer = allPlayersList.find(p => p.isUser) || atkPlayers[0];
    const uHs = userPlayer.hs || 25;
    const uAcs = userPlayer.acs || 205;
    const uAdr = userPlayer.adr || 135;
    const uKd = userPlayer.deaths > 0 ? parseFloat((userPlayer.kills / userPlayer.deaths).toFixed(2)) : userPlayer.kills;

    const radar = {
      reflexes: Math.min(99, Math.max(60, Math.round(180 + (280 - uAcs) * 0.35))),
      aim: Math.min(99, Math.max(65, Math.round(uHs * 2.2 + 25))),
      precision: Math.min(99, Math.max(60, Math.round(uAdr * 0.4 + 35))),
      movement: Math.min(98, Math.max(65, Math.round(82 + (uKd >= 1 ? 5 : -5)))),
      teamplay: Math.min(99, Math.max(60, Math.round(70 + userPlayer.assists * 2.5))),
      impact: Math.min(99, Math.max(60, Math.round(uAcs * 0.28 + 15)))
    };

    return {
      matchId,
      isRealMatch: true,
      map: mapMeta,
      scoreAtk: redScore,
      scoreDef: blueScore,
      atkPlayers,
      defPlayers,
      rounds,
      metrics: {
        radar,
        recoil: {
          avgError: (Math.max(0.4, (100 - uHs) * 0.02)).toFixed(2),
          firstTightness: (Math.max(0.2, (50 - uHs) * 0.015)).toFixed(2),
          retention: Math.min(92, Math.max(70, Math.round(uHs * 1.5 + 40))),
          weapon: 'Vandal'
        },
        zones: {
          siteA: 45,
          mid: 28,
          siteB: 27,
          survivalTime: 58.4,
          riskSpot: `${mapMeta.name} A Short / Choke`,
          lurkRate: 14
        },
        prescriptions: {
          weaknesses: [
            {
              title: 'วินัยการหยุดก่อนลั่นไก (Counter-strafing)',
              grade: radar.movement < 80 ? 'Grade B-' : 'Grade B+',
              desc: `ระบบตรวจพบอัตรา Headshot ${uHs}% แนะนำให้ฝึก Counter-strafing ปล่อยปุ่มเดินแล้วเคาะปุ่มตรงข้าม 1 จังหวะก่อนยิงนัดแรกเพื่อให้กระสุนตรงเป้าหมาย 100%`
            }
          ],
          strengths: [
            {
              title: `ADR และการทำความเสียหายเฉลี่ย (${uAdr} dmg/round)`,
              grade: uAdr > 145 ? 'Grade S+' : 'Grade A',
              desc: `คุณทำดาเมจเฉลี่ย ${uAdr} หน่วยต่อรอบ และทำคะแนน ACS ได้ ${uAcs} มีความดุดันและสร้างความได้เปรียบให้ทีมได้ดี`
            }
          ],
          drills: [
            `ฝึกเคาะแบบ 2-3 Bullet Burst แล้วก้าวหลบ (Strafe) ก่อนยิงชุดถัดไปในระยะเกิน 20 เมตร`,
            `เกาะระยะกับเพื่อนร่วมทีมไม่เกิน 10 เมตร เพื่อเทรดคิลปิดจังหวะทันทีเมื่อเพื่อนล้ม`,
            `เปิด Shooting Error Graph ในเกม เพื่อลดเส้นสีส้ม (Movement Error) ให้เป็น 0%`
          ]
        }
      }
    };
  }

  // ==========================================
  // EXPORTED PUBLIC INTERFACE (BRIDGE)
  // ==========================================
  window.ValReplayEngine = {
    init: init,
    loadMatch: loadMatch,
    selectRound: selectRound,
    focusPlayer: focusPlayer,
    switchSubView: switchSubView,
    seekTo: seekTo,
    togglePlayPause: togglePlayPause,
    getState: () => ReplayState,
    convertValorantApiMatchToReplay: convertValorantApiMatchToReplay,
    loadFromUserCareerMatch: async (careerMatch) => {
      if (!careerMatch) return;
      const matchId = careerMatch.matchId || Date.now();
      const toast = (msg, isErr = false) => {
        if (typeof showToast === 'function') showToast(msg, isErr);
        else console.log(`[ReplayEngine] ${msg}`);
      };

      toast('กำลังดึงข้อมูลแมตช์จริงจาก Riot และเรนเดอร์ 2D Replay...');

      try {
        let fullMatchData = careerMatch;
        // If match details not yet fully loaded (need round details from API)
        if (!fullMatchData.rounds || !fullMatchData.players) {
          try {
            const res = await fetch(`/api/match/${matchId}`);
            if (res.ok) {
              const json = await res.json();
              if (json.ok && json.match) {
                fullMatchData = json.match;
              }
            }
          } catch (e) {
            console.warn('[ReplayEngine] API fetch match details failed, converting with summary data:', e);
          }
        }

        const converted = convertValorantApiMatchToReplay(fullMatchData);
        if (converted) {
          const replayKey = `career_${converted.matchId}`;
          DEMO_MATCHES[replayKey] = converted;

          const select = document.getElementById('replayMatchSelect');
          if (select) {
            let existingOpt = select.querySelector(`option[value="${replayKey}"]`);
            const optLabel = `[แมตช์จริง] ${converted.map.name} (${converted.scoreAtk} - ${converted.scoreDef})`;
            if (!existingOpt) {
              existingOpt = document.createElement('option');
              existingOpt.value = replayKey;
              select.insertBefore(existingOpt, select.firstChild);
            }
            existingOpt.textContent = optLabel;
            select.value = replayKey;
          }

          loadMatch(replayKey);
          toast(`โหลดรีเพลย์ 2D แมตช์จริงสำเร็จ! (${converted.map.name})`);
          return converted;
        }
      } catch (err) {
        console.error('[ReplayEngine] Failed to load real match:', err);
        toast('ไม่สามารถโหลดข้อมูลแบบสดได้ กำลังแสดงตัวอย่างจำลอง', true);
      }

      // Graceful fallback
      const fallback = createSampleMatch(careerMatch.mapName ? careerMatch.mapName.toLowerCase() : 'ascent');
      fallback.matchId = 'career_' + matchId;
      DEMO_MATCHES[fallback.matchId] = fallback;
      loadMatch(fallback.matchId);
    }
  };

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
