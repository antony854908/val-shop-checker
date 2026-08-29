const config = require('../config');

class SkinCatalog {
  constructor() {
    this.skins = new Map(); // uuid -> skin details
    this.levels = new Map(); // levelUuid -> skin details
    this.chromas = new Map(); // chromaUuid -> skin details
    this.bundles = new Map(); // bundleUuid -> bundle details
    this.otherItems = new Map(); // buddy/card/spray/title uuid -> item details
    this.rawLevels = new Map(); // raw levelUuid -> level details
    this.rawChromas = new Map(); // raw chromaUuid -> chroma details
    this.contentTiers = new Map(); // tierUuid -> tier details
    this.weapons = new Map(); // weaponUuid -> weapon details
    this.agents = new Map(); // agentUuid -> agent details
    this.maps = new Map(); // mapUrl / mapUuid -> map details
    this.ranks = new Map(); // tierNumber -> rank details
    this.seasons = new Map(); // seasonUuid -> season details
    this.orderedSeasonIds = []; // chronological act uuids
    this.uniqueSkinsList = [];
    this.weaponsList = [];
    this.clientVersion = config.DEFAULT_CLIENT_VERSION;
    this.initialized = false;
    this.lastFetch = 0;
  }

  formatLevelItemName(rawItem, levelNum) {
    if (!rawItem) return `Level ${levelNum}`;
    const clean = rawItem.replace('EEquippableSkinLevelItem::', '');
    const map = {
      'Finisher': 'Finisher (เอฟเฟกต์ปิดฉาก)',
      'VFX': 'VFX (เอฟเฟกต์แสงสี)',
      'Animation': 'Animation (แอนิเมชันพิเศษ)',
      'KillEffect': 'Kill Effect (เอฟเฟกต์สังหาร)',
      'KillBanner': 'Kill Banner (แบนเนอร์สังหาร)',
      'SoundEffects': 'Sound Effects (เสียงเอฟเฟกต์พิเศษ)',
      'InspectAndKill': 'Inspect & Kill (เอฟเฟกต์ตรวจสอบ & ปิดฉาก)',
      'Transformation': 'Transformation (เปลี่ยนร่าง/รูปทรง)',
      'Voiceover': 'Voiceover (เสียงพูดพากย์ตัวละคร)',
      'KillCounter': 'Kill Counter (ตัวนับคิล)',
      'HeartbeatAndMapSensor': 'Heartbeat & Map Sensor (เซนเซอร์แผนที่)',
      'FishAnimation': 'Fish Animation (แอนิเมชันปลา)',
      'TopFrag': 'Top Frag Effect (เอฟเฟกต์ท็อปฟราก)',
      'SongShuffle': 'Song Shuffle (สลับเพลง)',
      'AttackerDefenderSwap': 'Attacker/Defender Variant',
      'Randomizer': 'Randomizer Effect'
    };
    return map[clean] || clean;
  }

  generateTitleBadgeSvg(titleName) {
    const safeName = (titleName || 'TITLE').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="160" viewBox="0 0 300 160">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#161D2B"/>
          <stop offset="100%" stop-color="#0C1018"/>
        </linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#F5D36C"/>
          <stop offset="100%" stop-color="#D1A250"/>
        </linearGradient>
      </defs>
      <rect width="300" height="160" rx="10" fill="url(#bg)" stroke="#2A364D" stroke-width="2"/>
      <rect x="18" y="18" width="264" height="124" rx="6" fill="#101520" stroke="#D1A250" stroke-dasharray="4 4" stroke-width="1.5"/>
      <text x="150" y="56" dominant-baseline="middle" text-anchor="middle" fill="url(#gold)" font-family="sans-serif" font-size="12" font-weight="bold" letter-spacing="2">PLAYER TITLE</text>
      <text x="150" y="96" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="16" font-weight="bold">&quot;${safeName}&quot;</text>
    </svg>`);
  }

  async init() {
    try {
      console.log('[SkinCatalog] Fetching complete Valorant metadata from valorant-api.com...');
      
      const [
        skinsRes,
        tiersRes,
        bundlesRes,
        weaponsRes,
        buddiesRes,
        cardsRes,
        spraysRes,
        titlesRes,
        rawLevelsRes,
        rawChromasRes,
        agentsRes,
        mapsRes,
        compTiersRes,
        seasonsRes,
        versionRes
      ] = await Promise.all([
        fetch('https://valorant-api.com/v1/weapons/skins?language=en-US').then(r => r.json()),
        fetch('https://valorant-api.com/v1/contenttiers').then(r => r.json()),
        fetch('https://valorant-api.com/v1/bundles').then(r => r.json()),
        fetch('https://valorant-api.com/v1/weapons').then(r => r.json()),
        fetch('https://valorant-api.com/v1/buddies').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('https://valorant-api.com/v1/playercards').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('https://valorant-api.com/v1/sprays').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('https://valorant-api.com/v1/playertitles').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('https://valorant-api.com/v1/weapons/skinlevels').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('https://valorant-api.com/v1/weapons/skinchromas').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('https://valorant-api.com/v1/agents?language=th-TH&isPlayableCharacter=true').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('https://valorant-api.com/v1/maps').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('https://valorant-api.com/v1/competitivetiers').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('https://valorant-api.com/v1/seasons').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('https://valorant-api.com/v1/version').then(r => r.json()).catch(() => null)
      ]);

      if (versionRes && versionRes.data && versionRes.data.riotClientVersion) {
        this.clientVersion = versionRes.data.riotClientVersion;
        console.log(`[SkinCatalog] Synced Riot Client Version: ${this.clientVersion}`);
      }

      // Map content tiers
      if (tiersRes && tiersRes.data) {
        for (const tier of tiersRes.data) {
          this.contentTiers.set(tier.uuid.toLowerCase(), {
            uuid: tier.uuid,
            name: tier.displayName,
            devName: tier.devName,
            rank: tier.rank,
            highlightColor: tier.highlightColor ? `#${tier.highlightColor.substring(0, 6)}` : '#ffffff',
            displayIcon: tier.displayIcon
          });
        }
      }

      // Map raw skin levels and raw chromas for 100% fallback coverage
      if (rawLevelsRes && rawLevelsRes.data) {
        for (const l of rawLevelsRes.data) {
          this.rawLevels.set(l.uuid.toLowerCase(), {
            uuid: l.uuid,
            name: l.displayName,
            displayIcon: l.displayIcon || `https://media.valorant-api.com/weaponskinlevels/${l.uuid}/displayicon.png`,
            itemType: 'Weapon Skin',
            isWeaponSkin: true
          });
        }
      }

      if (rawChromasRes && rawChromasRes.data) {
        for (const c of rawChromasRes.data) {
          this.rawChromas.set(c.uuid.toLowerCase(), {
            uuid: c.uuid,
            name: c.displayName,
            displayIcon: c.fullRender || c.displayIcon || `https://media.valorant-api.com/weaponskinchromas/${c.uuid}/fullrender.png`,
            itemType: 'Weapon Skin',
            isWeaponSkin: true
          });
        }
      }

      // Map weapons and build skin-to-weapon index
      const skinToWeaponMap = new Map();
      this.weaponsList = [];

      if (weaponsRes && weaponsRes.data) {
        for (const w of weaponsRes.data) {
          const cat = w.category ? w.category.replace('EEquippableCategory::', '') : 'Weapon';
          const weaponInfo = {
            uuid: w.uuid,
            name: w.displayName,
            category: cat,
            displayIcon: w.displayIcon,
            killStreamIcon: w.killStreamIcon,
            shopData: w.shopData,
            skinCount: (w.skins || []).length
          };
          this.weapons.set(w.uuid.toLowerCase(), weaponInfo);
          this.weaponsList.push(weaponInfo);

          if (w.skins) {
            for (const s of w.skins) {
              skinToWeaponMap.set(s.uuid.toLowerCase(), weaponInfo);
            }
          }
        }
      }

      // Map bundles
      if (bundlesRes && bundlesRes.data) {
        for (const b of bundlesRes.data) {
          this.bundles.set(b.uuid.toLowerCase(), {
            uuid: b.uuid,
            name: b.displayName,
            subName: b.displayNameSubText || '',
            description: b.description || '',
            displayIcon: b.displayIcon,
            displayIcon2: b.displayIcon2,
            verticalPromoImage: b.verticalPromoImage,
            logoIcon: b.logoIcon
          });
        }
      }

      // Map Buddies (Gun Buddies)
      if (buddiesRes && buddiesRes.data) {
        for (const b of buddiesRes.data) {
          const defaultIcon = b.displayIcon || (b.levels && b.levels[0]?.displayIcon) || `https://media.valorant-api.com/buddies/${b.uuid}/displayicon.png`;
          const buddyObj = {
            uuid: b.uuid,
            name: b.displayName,
            itemType: 'Gun Buddy',
            displayIcon: defaultIcon
          };
          this.otherItems.set(b.uuid.toLowerCase(), buddyObj);
          if (b.levels) {
            for (const l of b.levels) {
              this.otherItems.set(l.uuid.toLowerCase(), {
                uuid: l.uuid,
                name: b.displayName,
                itemType: 'Gun Buddy',
                displayIcon: l.displayIcon || defaultIcon
              });
            }
          }
        }
      }

      // Map Player Cards
      if (cardsRes && cardsRes.data) {
        for (const c of cardsRes.data) {
          const cardIcon = c.largeArt || c.displayIcon || c.wideArt || c.smallArt || `https://media.valorant-api.com/playercards/${c.uuid}/largeart.png`;
          const cardObj = {
            uuid: c.uuid,
            name: c.displayName,
            itemType: 'Player Card',
            displayIcon: cardIcon,
            largeArt: c.largeArt,
            wideArt: c.wideArt,
            smallArt: c.smallArt
          };
          this.otherItems.set(c.uuid.toLowerCase(), cardObj);
        }
      }

      // Map Sprays
      if (spraysRes && spraysRes.data) {
        for (const s of spraysRes.data) {
          const sprayIcon = s.fullTransparentIcon || s.displayIcon || s.fullIcon || s.animationPng || `https://media.valorant-api.com/sprays/${s.uuid}/fulltransparenticon.png`;
          const sprayObj = {
            uuid: s.uuid,
            name: s.displayName,
            itemType: 'Spray',
            displayIcon: sprayIcon
          };
          this.otherItems.set(s.uuid.toLowerCase(), sprayObj);
          if (s.levels) {
            for (const l of s.levels) {
              this.otherItems.set(l.uuid.toLowerCase(), {
                uuid: l.uuid,
                name: s.displayName,
                itemType: 'Spray',
                displayIcon: l.displayIcon || sprayIcon
              });
            }
          }
        }
      }

      // Map Player Titles
      if (titlesRes && titlesRes.data) {
        for (const t of titlesRes.data) {
          const rawName = t.displayName || t.titleText || 'Player Title';
          const cleanName = rawName.replace(/ Title$/i, '');
          const titleSvg = this.generateTitleBadgeSvg(cleanName);
          const titleObj = {
            uuid: t.uuid,
            name: rawName,
            itemType: 'Player Title',
            displayIcon: titleSvg
          };
          this.otherItems.set(t.uuid.toLowerCase(), titleObj);
        }
      }

      // Map skins with 100% complete fallback icons
      this.uniqueSkinsList = [];
      if (skinsRes && skinsRes.data) {
        for (const skin of skinsRes.data) {
          if (skin.displayName && skin.displayName.toLowerCase().includes('random favorite')) {
            continue;
          }

          const tier = skin.contentTierUuid ? this.contentTiers.get(skin.contentTierUuid.toLowerCase()) : null;
          const weaponInfo = skinToWeaponMap.get(skin.uuid.toLowerCase()) || {
            uuid: 'unknown',
            name: 'Weapon',
            category: 'Weapon',
            displayIcon: null
          };

          let bestIcon = skin.displayIcon;
          if (!bestIcon && skin.chromas && skin.chromas.length > 0) {
            for (const c of skin.chromas) {
              if (c.fullRender) { bestIcon = c.fullRender; break; }
              if (c.displayIcon) { bestIcon = c.displayIcon; break; }
            }
          }
          if (!bestIcon && skin.levels && skin.levels.length > 0) {
            for (const l of skin.levels) {
              if (l.displayIcon) { bestIcon = l.displayIcon; break; }
            }
          }
          if (!bestIcon) {
            bestIcon = weaponInfo.displayIcon || 'https://media.valorant-api.com/weapons/skins/default/displayicon.png';
          }

          const chromas = (skin.chromas || []).map((c, idx) => {
            const chromaIcon = c.fullRender || c.displayIcon || bestIcon;
            return {
              id: c.uuid,
              name: c.displayName,
              colorName: idx === 0 ? 'Base / Original' : (c.displayName.includes('(') ? c.displayName : `Variant ${idx}`),
              displayIcon: c.displayIcon || chromaIcon,
              fullRender: chromaIcon,
              swatch: c.swatch || null,
              streamedVideo: c.streamedVideo || null
            };
          });

          const levels = (skin.levels || []).map((l, idx) => {
            const lvlIcon = l.displayIcon || bestIcon;
            return {
              id: l.uuid,
              name: l.displayName,
              levelNum: idx + 1,
              levelItem: this.formatLevelItemName(l.levelItem, idx + 1),
              rawLevelItem: l.levelItem || null,
              displayIcon: lvlIcon,
              streamedVideo: l.streamedVideo || null
            };
          });

          const hasVideo = (levels && levels.some(l => l.streamedVideo)) || (chromas && chromas.some(c => c.streamedVideo));

          const skinObj = {
            uuid: skin.uuid,
            name: skin.displayName,
            weaponType: weaponInfo.name,
            weaponCategory: weaponInfo.category,
            weaponIcon: weaponInfo.displayIcon,
            themeUuid: skin.themeUuid,
            contentTierUuid: skin.contentTierUuid,
            tier: tier || {
              uuid: 'standard',
              name: skin.displayName.startsWith('Standard ') ? 'Standard' : 'Select Edition',
              highlightColor: '#5a9fe2',
              displayIcon: null
            },
            displayIcon: bestIcon,
            wallpaper: skin.wallpaper || null,
            chromas,
            levels,
            hasVideo: !!hasVideo,
            itemType: 'Weapon Skin',
            isWeaponSkin: true,
            assetPath: skin.assetPath
          };

          this.skins.set(skin.uuid.toLowerCase(), skinObj);
          this.uniqueSkinsList.push(skinObj);

          if (skin.levels) {
            for (const lvl of skin.levels) {
              this.levels.set(lvl.uuid.toLowerCase(), skinObj);
            }
          }

          if (skin.chromas) {
            for (const ch of skin.chromas) {
              this.chromas.set(ch.uuid.toLowerCase(), skinObj);
            }
          }
        }
      }

      // Map agents with rich tactical metadata, price, and gameplay guides
      if (agentsRes && agentsRes.data) {
        for (const ag of agentsRes.data) {
          const roleName = ag.role?.displayName || 'Agent';
          const strategyData = this.getAgentStrategyAndPricing(ag.displayName, roleName);

          const agentObj = {
            uuid: ag.uuid,
            displayName: ag.displayName,
            description: ag.description,
            displayIcon: ag.displayIcon || ag.displayIconSmall || `https://media.valorant-api.com/agents/${ag.uuid}/displayicon.png`,
            fullPortrait: ag.fullPortrait || ag.displayIcon || `https://media.valorant-api.com/agents/${ag.uuid}/fullportrait.png`,
            background: ag.background || null,
            role: roleName,
            roleIcon: ag.role?.displayIcon || null,
            roleDesc: this.getRoleDescription(roleName),
            pricing: strategyData.pricing,
            difficulty: strategyData.difficulty,
            bestMaps: strategyData.bestMaps,
            howToPlay: strategyData.howToPlay,
            proTips: strategyData.proTips,
            playstyleWeights: strategyData.playstyleWeights,
            abilities: (ag.abilities || []).map(ab => ({
              slot: this.formatSlotName(ab.slot),
              rawSlot: ab.slot,
              displayName: ab.displayName,
              description: this.formatConciseAbilityDesc(ab.description),
              displayIcon: ab.displayIcon
            }))
          };
          this.agents.set(ag.uuid.toLowerCase(), agentObj);
          if (ag.displayName) {
            this.agents.set(ag.displayName.toLowerCase(), agentObj);
          }
        }
      }

      // Map maps
      if (mapsRes && mapsRes.data) {
        for (const m of mapsRes.data) {
          const mapObj = {
            uuid: m.uuid,
            displayName: m.displayName,
            mapUrl: m.mapUrl,
            splash: m.splash || m.premierBackgroundImage,
            displayIcon: m.displayIcon,
            listViewIcon: m.listViewIcon || m.splash,
            xMultiplier: m.xMultiplier || 0.00007,
            yMultiplier: m.yMultiplier || -0.00007,
            xScalarToAdd: m.xScalarToAdd || 0.5,
            yScalarToAdd: m.yScalarToAdd || 0.5
          };
          if (m.mapUrl) this.maps.set(m.mapUrl.toLowerCase(), mapObj);
          if (m.uuid) this.maps.set(m.uuid.toLowerCase(), mapObj);
          if (m.displayName) this.maps.set(m.displayName.toLowerCase(), mapObj);
        }
      }

      // Map competitive ranks
      if (compTiersRes && compTiersRes.data && compTiersRes.data.length > 0) {
        const latestSeason = compTiersRes.data[compTiersRes.data.length - 1];
        if (latestSeason && Array.isArray(latestSeason.tiers)) {
          for (const t of latestSeason.tiers) {
            this.ranks.set(t.tier, {
              tier: t.tier,
              tierName: t.tierName || 'UNRANKED',
              divisionName: t.divisionName || 'UNRANKED',
              color: t.color ? `#${t.color.substring(0, 6)}` : '#ffffff',
              smallIcon: t.smallIcon || null,
              largeIcon: t.largeIcon || null
            });
          }
        }
      }

      // Map seasons chronologically
      if (seasonsRes && seasonsRes.data) {
        const sorted = [...seasonsRes.data].sort((a, b) => {
          const tA = a.startTime ? new Date(a.startTime).getTime() : 0;
          const tB = b.startTime ? new Date(b.startTime).getTime() : 0;
          return tA - tB;
        });
        for (const s of sorted) {
          const sObj = {
            uuid: s.uuid,
            displayName: s.displayName,
            startTime: s.startTime,
            endTime: s.endTime,
            type: s.type,
            parentUuid: s.parentUuid
          };
          this.seasons.set(s.uuid.toLowerCase(), sObj);
          if (s.type === 'EAresSeasonType::Act') {
            this.orderedSeasonIds.push(s.uuid.toLowerCase());
          }
        }
      }

      this.initialized = true;
      this.lastFetch = Date.now();
      console.log(`[SkinCatalog] Indexed ${this.skins.size} skins (${this.uniqueSkinsList.length} catalog items), ${this.otherItems.size} bundle accessories, ${this.agents.size} agents, ${this.maps.size} maps, ${this.ranks.size} ranks, ${this.weaponsList.length} weapons, ${this.bundles.size} bundles.`);
    } catch (err) {
      console.error('[SkinCatalog] Failed to initialize catalog:', err.message);
    }
  }

  getSkinById(uuid) {
    if (!uuid) return null;
    const lower = uuid.toLowerCase();
    return this.levels.get(lower) || 
           this.chromas.get(lower) || 
           this.skins.get(lower) || 
           this.rawLevels.get(lower) || 
           this.rawChromas.get(lower) || 
           null;
  }

  getItemById(uuid, itemTypeId = null) {
    if (!uuid) return null;
    const lower = uuid.toLowerCase();
    
    // 1. Check mapped skins & levels
    const skinMatch = this.levels.get(lower) || this.chromas.get(lower) || this.skins.get(lower);
    if (skinMatch) return skinMatch;

    // 2. Check accessory items (Buddies, Cards, Sprays, Titles)
    const otherMatch = this.otherItems.get(lower);
    if (otherMatch) return otherMatch;

    // 3. Check raw levels & raw chromas
    const rawLvl = this.rawLevels.get(lower);
    if (rawLvl) return rawLvl;

    const rawChr = this.rawChromas.get(lower);
    if (rawChr) return rawChr;

    // 4. Check bundles
    const bundleMatch = this.bundles.get(lower);
    if (bundleMatch) {
      return {
        uuid: bundleMatch.uuid,
        name: bundleMatch.name,
        itemType: 'Bundle',
        displayIcon: bundleMatch.displayIcon || bundleMatch.verticalPromoImage
      };
    }

    // 5. Direct CDN Fallback based on itemTypeId if unknown
    if (itemTypeId) {
      const typeLower = itemTypeId.toLowerCase();
      if (typeLower.includes('e7f014d4')) {
        return {
          uuid,
          name: 'Valorant Weapon Skin',
          itemType: 'Weapon Skin',
          isWeaponSkin: true,
          displayIcon: `https://media.valorant-api.com/weaponskinlevels/${uuid}/displayicon.png`
        };
      }
      if (typeLower.includes('dd3bf334')) {
        return {
          uuid,
          name: 'Valorant Gun Buddy',
          itemType: 'Gun Buddy',
          isWeaponSkin: false,
          displayIcon: `https://media.valorant-api.com/buddylevels/${uuid}/displayicon.png`
        };
      }
      if (typeLower.includes('3f296092')) {
        return {
          uuid,
          name: 'Valorant Player Card',
          itemType: 'Player Card',
          isWeaponSkin: false,
          displayIcon: `https://media.valorant-api.com/playercards/${uuid}/largeart.png`
        };
      }
      if (typeLower.includes('dbe138f1')) {
        return {
          uuid,
          name: 'Valorant Spray',
          itemType: 'Spray',
          isWeaponSkin: false,
          displayIcon: `https://media.valorant-api.com/sprays/${uuid}/fulltransparenticon.png`
        };
      }
    }

    return null;
  }

  getBundleById(uuid) {
    if (!uuid) return null;
    return this.bundles.get(uuid.toLowerCase()) || null;
  }

  getWeaponsList() {
    return this.weaponsList;
  }

  getAllSkins({ search, weapon, category, tier, limit = 48, offset = 0 } = {}) {
    let result = this.uniqueSkinsList;

    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.weaponType.toLowerCase().includes(q) ||
        s.weaponCategory.toLowerCase().includes(q) ||
        (s.tier?.name && s.tier.name.toLowerCase().includes(q))
      );
    }

    if (weapon && weapon !== 'all') {
      const w = weapon.toLowerCase();
      result = result.filter(s => s.weaponType.toLowerCase() === w);
    }

    if (category && category !== 'all') {
      const c = category.toLowerCase();
      result = result.filter(s => s.weaponCategory.toLowerCase() === c);
    }

    if (tier && tier !== 'all') {
      const t = tier.toLowerCase();
      result = result.filter(s => s.tier?.name?.toLowerCase().includes(t));
    }

    const total = result.length;
    const paginated = result.slice(offset, offset + limit);

    return {
      total,
      offset,
      limit,
      skins: paginated
    };
  }

  getWeapon(uuid) {
    if (!uuid) return null;
    const lower = uuid.toLowerCase();
    return this.weapons.get(lower) || null;
  }

  formatSlotName(slot) {
    if (!slot) return 'สกิล';
    switch (slot.toLowerCase()) {
      case 'grenade': return 'สกิล [ C ]';
      case 'ability1': return 'สกิล [ Q ]';
      case 'ability2': return 'สกิลหลัก [ E ]';
      case 'ultimate': return 'อัลติเมต [ X ]';
      case 'passive': return 'สกิลติดตัว (Passive)';
      default: return slot;
    }
  }

  formatConciseAbilityDesc(desc) {
    if (!desc) return 'กดใช้เพื่อสนับสนุนทีมในการต่อสู้';
    return desc.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  getRoleDescription(role) {
    const r = (role || '').toLowerCase();
    if (r.includes('duelist')) return 'สายบุกทะลวง / ตัวทำดาเมจหลัก (หน้าที่เปิดพื้นที่และล่าคิลแรก)';
    if (r.includes('initiator')) return 'สายค้นหาข้อมูล / เปิดมุม (หน้าที่สแกนตำแหน่งและแฟลชเปิดไฟต์)';
    if (r.includes('controller')) return 'สายคุมวิสัยทัศน์ / วางควัน (หน้าที่ปิดมุมยิงของศัตรูและเปิดทางปลอดภัย)';
    if (r.includes('sentinel')) return 'สายคุมพื้นที่ / ป้องกัน (หน้าที่ล็อกพื้นที่ วางกับดัก และดักหลัง)';
    return 'เจ้าหน้าที่พิเศษ VALORANT Protocol';
  }

  getAgentStrategyAndPricing(name, role) {
    const n = (name || '').toLowerCase();
    const isStarter = ['jett', 'phoenix', 'brimstone', 'sova', 'sage'].includes(n);
    const pricing = isStarter ? 
      { isFree: true, kc: 0, vp: 0, tag: 'ฟรีตั้งแต่เริ่มเกม (Starter Agent)' } : 
      { isFree: false, kc: 8000, vp: 1000, tag: '8,000 Kingdom Credits หรือ 1,000 VP' };

    let difficulty = 'ปานกลาง (Medium)';
    let bestMaps = ['Ascent', 'Haven', 'Lotus', 'Sunset', 'Bind'];
    let howToPlay = 'ประสานงานกับเพื่อนร่วมทีมและใช้สกิลเปิดพื้นที่เข้ายึดไซต์';
    let proTips = 'อ่านจังหวะการเคลื่อนไหวของศัตรูและเลือกตำแหน่ง Crosshair ให้ได้เปรียบ';
    let playstyleWeights = { entry: 0.5, lurk: 0.5, smoke: 0.5, recon: 0.5 };

    if (n === 'jett') {
      difficulty = 'ปานกลาง (Medium)';
      bestMaps = ['ทุกแผนที่ (All Maps)', 'Ascent', 'Haven', 'Breeze', 'Abyss'];
      howToPlay = 'ใช้สกิล Tailwind (Dash) และ Cloudburst (Smoke) บุกทะลวงเปิดไซต์คนแรกเพื่อดึง Crosshair ของศัตรู';
      proTips = 'เมื่อถือ Operator ให้ใช้ Dash ถอยเข้าที่กำบังทันทีหลังยิงนัดแรก';
      playstyleWeights = { entry: 0.95, lurk: 0.4, smoke: 0.3, recon: 0.2 };
    } else if (n === 'reyna') {
      difficulty = 'ง่าย (Easy)';
      bestMaps = ['Ascent', 'Sunset', 'Lotus', 'Icebox', 'Haven'];
      howToPlay = 'เปิดไฟต์ด้วย Leer (แฟลชตา) เล็งยิงเก็บคิลแรก แล้วใช้ Dismiss หรือ Devour เอาตัวรอด';
      proTips = 'ในรอบที่เปิด Empress (Ultimate) อัตรายิงและรีโหลดจะเร็วขึ้นมาก ให้เล่นเชิงรุกต่อเนื่อง';
      playstyleWeights = { entry: 0.9, lurk: 0.7, smoke: 0.1, recon: 0.1 };
    } else if (n === 'raze') {
      difficulty = 'ยาก (Hard)';
      bestMaps = ['Bind', 'Lotus', 'Split', 'Sunset'];
      howToPlay = 'ใช้ Blast Pack (Satchel) กระโดดลอยข้ามสิ่งกีดขวางเข้าไซต์อย่างรวดเร็ว พร้อมปาระเบิด Paint Shells เคลียร์มุมแคบ';
      proTips = 'ฝึก Satchel Jump 2 จังหวะเพื่อเพิ่มความเร็วในการเข้าทำไซต์โดยที่ศัตรูไม่ทันตั้งตัว';
      playstyleWeights = { entry: 0.95, lurk: 0.2, smoke: 0.1, recon: 0.2 };
    } else if (n === 'iso') {
      difficulty = 'ปานกลาง (Medium)';
      bestMaps = ['Haven', 'Abyss', 'Ascent', 'Sunset'];
      howToPlay = 'เปิดโล่ Double Tap ก่อนเข้าปะทะเพื่อรับดาเมจฟรี 1 นัด และใช้ Undercut ทำให้ศัตรูติดสถานะเปราะบาง';
      proTips = 'ใน Kill Contract (1v1 Arena) คุณมีที่กำบัง 2 ฝั่ง ให้ใจเย็นและจับจังหวะศัตรูโผล่';
      playstyleWeights = { entry: 0.85, lurk: 0.5, smoke: 0.1, recon: 0.2 };
    } else if (n === 'neon') {
      difficulty = 'ยาก (Hard)';
      bestMaps = ['Lotus', 'Fracture', 'Sunset', 'Abyss'];
      howToPlay = 'วิ่งสไลด์ด้วย High Gear หลบวิถีกระสุน และเปิดกำแพงสายฟ้า Fast Lane วิ่งเข้าไซต์ตรงๆ';
      proTips = 'จังหวะ Slide สามารถเล็งยิงกระสุนแม่นยำได้ทันที ให้ฝึก Slide-Shoot เพื่อสร้างช็อตมหัศจรรย์';
      playstyleWeights = { entry: 0.9, lurk: 0.3, smoke: 0.2, recon: 0.2 };
    } else if (n === 'omen') {
      difficulty = 'ปานกลาง (Medium)';
      bestMaps = ['Ascent', 'Haven', 'Lotus', 'Split', 'Sunset'];
      howToPlay = 'วาง Dark Cover ปิดวิสัยทัศน์ศัตรู และใช้ Paranoia (แฟลชดำ) ทะลุกำแพงเปิดทางให้เพื่อนร่วมทีมเข้าทำ';
      proTips = 'ใช้ Shrouded Step (เทเลพอร์ตสั้น) ข้ามกล่องขึ้นจุด One-Way หรือเทเลพอร์ตเข้าไปในควันตัวเอง';
      playstyleWeights = { entry: 0.4, lurk: 0.8, smoke: 0.95, recon: 0.4 };
    } else if (n === 'clove') {
      difficulty = 'ง่าย (Easy)';
      bestMaps = ['Ascent', 'Sunset', 'Lotus', 'Haven', 'Icebox'];
      howToPlay = 'เล่นสไตล์กึ่ง Duelist ได้อย่างมั่นใจ เพราะแม้จะตายก็ยังสามารถกดวาง Smoke ช่วยทีมได้ตลอดเวลา';
      proTips = 'หลังตาย รีบกดวาง Smoke ทันที และเมื่อใช้ Ultimate (Not Dead Yet) ต้องเก็บคิลหรือแอสซิสต์ภายในเวลาเพื่อชุบชีวิตถาวร';
      playstyleWeights = { entry: 0.7, lurk: 0.5, smoke: 0.9, recon: 0.3 };
    } else if (n === 'viper') {
      difficulty = 'ยาก (Hard)';
      bestMaps = ['Breeze', 'Icebox', 'Bind', 'Lotus'];
      howToPlay = 'วาง Toxic Screen (ม่านพิษ) ผ่าครึ่งไซต์เพื่อตัดมุมมองศัตรู และเล่น Lineup สกิล Snake Bite ป้องกันการกู้สไปก์';
      proTips = 'จำ Lineup จุดยืนยิง Snake Bite นอกไซต์เพื่อเล่นเวลาช่วงท้ายรอบหลังวางสไปก์';
      playstyleWeights = { entry: 0.2, lurk: 0.85, smoke: 0.95, recon: 0.3 };
    } else if (n === 'cypher') {
      difficulty = 'ปานกลาง (Medium)';
      bestMaps = ['Sunset', 'Bind', 'Breeze', 'Split', 'Ascent'];
      howToPlay = 'วาง Trapwire ดักมุมเข้าไซต์ วาง Spycam แอบดูมุมสูง และรอศัตรูติดกับดักเพื่อยิงทะลุควัน';
      proTips = 'อย่าวาง Trapwire ที่ความสูงเดิมทุกรอบ ให้สลับวางระดับข้อเท้าและระดับอกเพื่อไม่ให้ศัตรูยิงทิ้งง่ายๆ';
      playstyleWeights = { entry: 0.2, lurk: 0.95, smoke: 0.4, recon: 0.7 };
    } else if (n === 'killjoy') {
      difficulty = 'ปานกลาง (Medium)';
      bestMaps = ['Ascent', 'Lotus', 'Haven', 'Icebox'];
      howToPlay = 'วาง Turret และ Alarmbot คุมทางเข้าไซต์ และตั้ง Nanoswarm ใต้จุดวางสไปก์เพื่อกดสั่งระเบิดทางไกล';
      proTips = 'ใช้ Lockdown (Ultimate) ในจุดปลอดภัยใต้ที่กำบังเพื่อบีบศัตรูให้ออกจากไซต์ทั้งหมด';
      playstyleWeights = { entry: 0.2, lurk: 0.8, smoke: 0.2, recon: 0.6 };
    } else if (n === 'gekko') {
      difficulty = 'ง่าย (Easy)';
      bestMaps = ['Bind', 'Lotus', 'Sunset', 'Icebox', 'Abyss'];
      howToPlay = 'ส่ง Wingman ไปวางหรือกู้สไปก์อัตโนมัติ ทำให้ผู้เล่นทุกคนมีปืนพร้อมยิง และเก็บก้อนลูกพลังเพื่อรีโหลดสกิลมาใช้ใหม่';
      proTips = 'เก็บลูกพลัง Dizzy และ Wingman ให้บ่อยที่สุดในรอบเพื่อใช้สกิลได้ 3-4 ครั้งในรอบเดียว';
      playstyleWeights = { entry: 0.6, lurk: 0.4, smoke: 0.2, recon: 0.9 };
    } else if (n === 'sova') {
      difficulty = 'ยาก (Hard)';
      bestMaps = ['Ascent', 'Haven', 'Breeze', 'Icebox', 'Abyss'];
      howToPlay = 'ยิง Recon Bolt สแกนหาตำแหน่งศัตรูต้นรอบ และใช้ Owl Drone บินนำหน้าเข้าไปเคลียร์มุมบอด';
      proTips = 'ใช้ Hunter’s Fury (Ultimate) ยิงทะลุกำแพงตามจุด Ping ที่ Recon Bolt หรือโดรนสแกนเจอ';
      playstyleWeights = { entry: 0.3, lurk: 0.4, smoke: 0.2, recon: 0.95 };
    } else if (n === 'fade') {
      difficulty = 'ปานกลาง (Medium)';
      bestMaps = ['Lotus', 'Ascent', 'Sunset', 'Bind'];
      howToPlay = 'ปา Haunt ขึ้นหลังคาเพื่อเปิดรอยเท้าศัตรู และส่ง Prowler วิ่งตามรอยเท้าเพื่อกัดให้ศัตรูตาบอด';
      proTips = 'ใช้ Seize ดักจับศัตรูไม่ให้ขยับ แล้วคอมโบร่วมกับระเบิดของ Raze หรือลูกไฟของเพื่อน';
      playstyleWeights = { entry: 0.5, lurk: 0.4, smoke: 0.2, recon: 0.9 };
    } else {
      // Default dynamic rules by role
      if (role.toLowerCase().includes('duelist')) {
        playstyleWeights = { entry: 0.9, lurk: 0.5, smoke: 0.2, recon: 0.2 };
        howToPlay = 'เปิดไฟต์คนแรกและดึงจังหวะให้เพื่อนร่วมทีมตามเข้าไซต์';
      } else if (role.toLowerCase().includes('controller')) {
        playstyleWeights = { entry: 0.3, lurk: 0.7, smoke: 0.95, recon: 0.3 };
        howToPlay = 'วางควันปิดมุมอันตรายและช่วยเพื่อนร่วมทีมยึดไซต์อย่างปลอดภัย';
      } else if (role.toLowerCase().includes('sentinel')) {
        playstyleWeights = { entry: 0.2, lurk: 0.9, smoke: 0.3, recon: 0.6 };
        howToPlay = 'คุมพื้นที่ด้านหลัง วางกับดัก และป้องกันไม่ให้ศัตรูลอบตีท้ายครัว';
      } else {
        playstyleWeights = { entry: 0.4, lurk: 0.4, smoke: 0.3, recon: 0.9 };
        howToPlay = 'สแกนหาข้อมูลศัตรูและใช้แฟลชเปิดจังหวะให้เพื่อนร่วมทีม';
      }
    }

    return {
      pricing,
      difficulty,
      bestMaps,
      howToPlay,
      proTips,
      playstyleWeights
    };
  }

  getAllAgents() {
    const unique = new Map();
    for (const ag of this.agents.values()) {
      if (ag && ag.uuid && !unique.has(ag.uuid)) {
        unique.set(ag.uuid, ag);
      }
    }
    const list = Array.from(unique.values());
    list.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    return list;
  }

  getAgent(uuid) {
    if (!uuid) return null;
    return this.agents.get(uuid.toLowerCase()) || {
      uuid,
      displayName: 'Agent',
      displayIcon: 'https://media.valorant-api.com/agents/roles/4be47ced-40d3-832a-0ec4-5396661402a6/displayicon.png',
      fullPortrait: 'https://media.valorant-api.com/agents/roles/4be47ced-40d3-832a-0ec4-5396661402a6/displayicon.png',
      role: 'Agent'
    };
  }

  getMap(mapIdOrUrl) {
    if (!mapIdOrUrl) return null;
    const lower = mapIdOrUrl.toLowerCase();
    return this.maps.get(lower) || {
      displayName: mapIdOrUrl.split('/').pop() || 'Map',
      splash: 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png',
      displayIcon: null,
      listViewIcon: null
    };
  }

  getRank(tierNumber) {
    const tier = parseInt(tierNumber, 10) || 0;
    return this.ranks.get(tier) || {
      tier,
      tierName: 'UNRANKED',
      divisionName: 'UNRANKED',
      color: '#ffffff',
      smallIcon: null,
      largeIcon: null
    };
  }

  getClientVersion() {
    return this.clientVersion;
  }
}

module.exports = new SkinCatalog();
