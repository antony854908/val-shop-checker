const config = require('../config');
const skinCatalog = require('./skinCatalog');

class ValorantApiService {
  getHeaders(accessToken, entitlementsToken, isPost = false) {
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'X-Riot-Entitlements-JWT': entitlementsToken,
      'X-Riot-ClientVersion': skinCatalog.getClientVersion(),
      'X-Riot-ClientPlatform': config.DEFAULT_CLIENT_PLATFORM
    };
    if (isPost) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  getPvpHost(region) {
    const regConfig = config.REGIONS[region ? region.toLowerCase() : 'ap'] || config.REGIONS.ap;
    return regConfig.pvp;
  }

  // Auto retry across shards if 404 / mismatch occurs
  async fetchWithShardFallback(puuid, preferredRegion, path, method = 'GET', body = null, accessToken, entitlementsToken) {
    const candidateShards = [preferredRegion || 'ap', 'ap', 'na', 'eu', 'kr', 'latam', 'br'];
    const tried = new Set();
    const headers = this.getHeaders(accessToken, entitlementsToken, method === 'POST');

    for (const shard of candidateShards) {
      if (tried.has(shard)) continue;
      tried.add(shard);

      const host = this.getPvpHost(shard);
      const url = `https://${host}${path.replace('{puuid}', puuid).replace('{shard}', shard)}`;

      try {
        const res = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : (method === 'POST' ? '{}' : undefined)
        });

        if (res.ok) {
          const data = await res.json();
          return { data, activeShard: shard };
        } else {
          const errBody = await res.text().catch(() => '');
          console.log(`[ValorantApi] Shard ${shard} (${method} ${path}) -> Status: ${res.status}, Body: ${errBody}`);
          if ((res.status === 400 && errBody.includes('BAD_CLAIMS')) || res.status === 401) {
            const err = new Error('TOKEN_EXPIRED: Access Token หมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
            err.code = 'TOKEN_EXPIRED';
            throw err;
          }
        }
      } catch (e) {
        // Try next shard
      }
    }

    throw new Error('ไม่พบข้อมูลบัญชีในเซิร์ฟเวอร์ใดๆ (All region shards returned error)');
  }

  async getPlayerName(puuid, region, accessToken, entitlementsToken) {
    try {
      const candidateShards = [region || 'ap', 'ap', 'na', 'eu', 'kr'];
      const headers = this.getHeaders(accessToken, entitlementsToken);

      for (const shard of candidateShards) {
        const host = this.getPvpHost(shard);
        try {
          const res = await fetch(`https://${host}/name-service/v2/players`, {
            method: 'PUT',
            headers,
            body: JSON.stringify([puuid])
          });

          if (res.ok) {
            const data = await res.json();
            if (data && data[0] && data[0].GameName) {
              return {
                gameName: data[0].GameName,
                tagLine: data[0].TagLine,
                shard
              };
            }
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error('[ValorantApi] Name lookup failed:', e.message);
    }
    return { gameName: 'Agent', tagLine: 'VAL', shard: region || 'ap' };
  }

  async getWallet(puuid, region, accessToken, entitlementsToken) {
    try {
      const result = await this.fetchWithShardFallback(
        puuid,
        region,
        '/store/v1/wallet/{puuid}',
        'GET',
        null,
        accessToken,
        entitlementsToken
      );

      const balances = result.data.Balances || {};
      return {
        vp: balances[config.CURRENCIES.VP] || 0,
        rp: balances[config.CURRENCIES.RP] || 0,
        kc: balances[config.CURRENCIES.KC] || 0,
        activeShard: result.activeShard
      };
    } catch (e) {
      console.error('[ValorantApi] Wallet lookup failed:', e.message);
      if (e.code === 'TOKEN_EXPIRED') throw e;
      return { vp: 0, rp: 0, kc: 0, activeShard: region || 'ap' };
    }
  }

  async getAccountLevel(puuid, region, accessToken, entitlementsToken) {
    try {
      const result = await this.fetchWithShardFallback(
        puuid,
        region,
        '/account-xp/v1/players/{puuid}',
        'GET',
        null,
        accessToken,
        entitlementsToken
      );

      return {
        level: result.data.Progress?.Level || 1,
        xp: result.data.Progress?.XP || 0
      };
    } catch (e) {
      if (e.code === 'TOKEN_EXPIRED') throw e;
      return { level: 1, xp: 0 };
    }
  }

  async getStorefront(puuid, region, accessToken, entitlementsToken) {
    let result;
    try {
      // Riot Storefront V3 Endpoint (POST with {})
      result = await this.fetchWithShardFallback(
        puuid,
        region,
        '/store/v3/storefront/{puuid}',
        'POST',
        {},
        accessToken,
        entitlementsToken
      );
    } catch (errV3) {
      if (errV3.code === 'TOKEN_EXPIRED') throw errV3;
      console.log('[ValorantApi] V3 Storefront failed, trying V2 fallback...');
      // Fallback to V2 if needed
      result = await this.fetchWithShardFallback(
        puuid,
        region,
        '/store/v2/storefront/{puuid}',
        'GET',
        null,
        accessToken,
        entitlementsToken
      );
    }

    const raw = result.data;
    const activeShard = result.activeShard;

    // 1. Parse Daily Offers (SingleItemOffers)
    const dailyOffers = [];
    const remainingSeconds = raw.SkinsPanelLayout?.SingleItemOffersRemainingDurationInSeconds || 0;
    const singleOffers = raw.SkinsPanelLayout?.SingleItemOffers || [];

    for (const itemUuid of singleOffers) {
      const skin = skinCatalog.getSkinById(itemUuid);
      
      // Price lookup in SingleItemStoreOffers
      let price = 0;
      if (raw.SkinsPanelLayout?.SingleItemStoreOffers) {
        const offer = raw.SkinsPanelLayout.SingleItemStoreOffers.find(o => 
          o.OfferID?.toLowerCase() === itemUuid.toLowerCase() || 
          (o.Rewards && o.Rewards.some(r => r.ItemID?.toLowerCase() === itemUuid.toLowerCase()))
        );
        if (offer && offer.Cost) {
          price = offer.Cost[config.CURRENCIES.VP] || Object.values(offer.Cost)[0] || 0;
        }
      }

      if (skin) {
        dailyOffers.push({
          ...skin,
          price,
          offerId: itemUuid
        });
      } else {
        const item = skinCatalog.getItemById(itemUuid);
        if (item && item.isWeaponSkin) {
          dailyOffers.push({
            ...item,
            price,
            offerId: itemUuid
          });
        }
      }
    }

    // 2. Parse Featured Bundles
    const featuredBundles = [];
    const bundlesList = (raw.FeaturedBundle && raw.FeaturedBundle.Bundles) || 
                        (raw.FeaturedBundle?.Bundle ? [raw.FeaturedBundle.Bundle] : []) ||
                        (raw.FeaturedBundle ? [raw.FeaturedBundle] : []);

    for (const b of bundlesList) {
      if (!b) continue;
      const bundleMeta = skinCatalog.getBundleById(b.DataAssetID || b.ID);
      const bundleItems = [];

      // Merge items from b.Items and b.ItemOffers
      const rawItemList = [];
      if (Array.isArray(b.Items) && b.Items.length > 0) {
        rawItemList.push(...b.Items);
      }
      if (Array.isArray(b.ItemOffers) && b.ItemOffers.length > 0) {
        rawItemList.push(...b.ItemOffers);
      }

      for (const itemEntry of rawItemList) {
        if (!itemEntry) continue;

        let itemRewardId = null;
        let itemTypeId = null;

        if (typeof itemEntry === 'string') {
          itemRewardId = itemEntry;
        } else {
          itemTypeId = itemEntry.Item?.ItemTypeID || 
                       itemEntry.item?.itemTypeId || 
                       itemEntry.Offer?.Rewards?.[0]?.ItemTypeID || 
                       itemEntry.ItemTypeID || 
                       itemEntry.itemTypeId;

          itemRewardId = (typeof itemEntry.Item === 'string' ? itemEntry.Item : null) ||
                         itemEntry.Item?.ItemID || 
                         itemEntry.item?.itemId || 
                         itemEntry.Offer?.Rewards?.[0]?.ItemID ||
                         itemEntry.offer?.rewards?.[0]?.itemId ||
                         (typeof itemEntry.Offer === 'string' ? itemEntry.Offer : null) ||
                         itemEntry.Offer?.OfferID || 
                         itemEntry.offer?.offerId || 
                         itemEntry.ItemID ||
                         itemEntry.itemId ||
                         itemEntry.BundleItemOfferID ||
                         itemEntry.bundleItemOfferId ||
                         itemEntry.OfferID ||
                         itemEntry.offerId ||
                         itemEntry.ID ||
                         itemEntry.id;
        }

        if (!itemRewardId) continue;

        const itemMeta = skinCatalog.getItemById(itemRewardId, itemTypeId);
        // Only include items that actually exist in the game catalog
        if (!itemMeta) {
          continue;
        }

        const isWeaponSkin = !!(itemMeta.isWeaponSkin || itemMeta.weaponType || itemMeta.chromas || itemMeta.levels);

        let basePrice = itemEntry.BasePrice || 
                        itemEntry.Offer?.Cost?.[config.CURRENCIES.VP] || 
                        itemEntry.Offer?.Cost?.['85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741'] || 
                        (itemEntry.Offer?.Cost ? Object.values(itemEntry.Offer.Cost)[0] : 0) || 0;

        let discountedPrice = itemEntry.DiscountedPrice || 
                              itemEntry.DiscountedCost?.[config.CURRENCIES.VP] || 
                              itemEntry.DiscountedCost?.['85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741'] || 
                              (itemEntry.DiscountedCost ? Object.values(itemEntry.DiscountedCost)[0] : basePrice);

        let discountPercent = itemEntry.DiscountPercent || 0;

        let displayName = itemMeta.name || 'Valorant Item';
        let itemType = isWeaponSkin ? (itemMeta.weaponType || 'Weapon Skin') : (itemMeta.itemType || 'Accessory');

        const lowerName = (displayName || '').toLowerCase();
        if (lowerName.includes('aeris spray') || (lowerName.includes('aeris') && (itemType || '').toLowerCase().includes('spray'))) {
          continue; // Aeris Spray does not exist in Valorant
        }

        let displayIcon = itemMeta.displayIcon || 
                          (itemMeta.chromas && itemMeta.chromas[0]?.displayIcon) || 
                          (itemMeta.levels && itemMeta.levels[0]?.displayIcon) ||
                          itemMeta.largeArt || 
                          itemMeta.wideArt;

        if (!displayIcon) {
          continue;
        }

        bundleItems.push({
          uuid: itemRewardId,
          name: displayName,
          itemType: itemType,
          isWeaponSkin: isWeaponSkin,
          displayIcon: displayIcon,
          skin: isWeaponSkin ? (itemMeta?.chromas ? itemMeta : { ...itemMeta, chromas: [], levels: [] }) : itemMeta,
          basePrice,
          discountedPrice,
          discountPercent
        });
      }

      // Deduplicate items
      const uniqueItems = [];
      const seenUuids = new Set();
      for (const itm of bundleItems) {
        const key = (itm.uuid || '').toLowerCase();
        if (key && !seenUuids.has(key)) {
          seenUuids.add(key);
          uniqueItems.push(itm);
        }
      }

      // If bundle items were not fully returned by Riot API, resolve them from the game catalog
      if (uniqueItems.length === 0 && bundleMeta) {
        const bundleNameLower = (bundleMeta.name || '').toLowerCase();
        for (const s of skinCatalog.skins.values()) {
          if (s.name && (s.name.toLowerCase().includes(bundleNameLower) || (bundleMeta.themeUuid && s.themeUuid === bundleMeta.themeUuid))) {
            const isMelee = s.weaponType === 'Melee' || s.name.toLowerCase().includes('suit of') || s.name.toLowerCase().includes('blade') || s.name.toLowerCase().includes('knife');
            uniqueItems.push({
              uuid: s.uuid,
              name: s.name,
              itemType: s.weaponType || 'Weapon Skin',
              isWeaponSkin: true,
              displayIcon: s.displayIcon,
              skin: s,
              basePrice: isMelee ? 4350 : 2175,
              discountedPrice: isMelee ? 4350 : 2175,
              discountPercent: 0
            });
          }
        }
        const seenAcc = new Set();
        for (const a of skinCatalog.otherItems.values()) {
          if (a.name && a.name.toLowerCase().includes(bundleNameLower)) {
            const accKey = (a.name + '_' + a.itemType).toLowerCase();
            if (!seenAcc.has(accKey)) {
              seenAcc.add(accKey);
              uniqueItems.push({
                uuid: a.uuid,
                name: a.name,
                itemType: a.itemType || 'Accessory',
                isWeaponSkin: false,
                displayIcon: a.displayIcon,
                skin: null,
                basePrice: a.itemType === 'Gun Buddy' ? 475 : (a.itemType === 'Player Card' ? 375 : 325),
                discountedPrice: a.itemType === 'Gun Buddy' ? 475 : (a.itemType === 'Player Card' ? 375 : 325),
                discountPercent: 0
              });
            }
          }
        }
      }

      const totalBase = b.TotalBaseCost ? (b.TotalBaseCost[config.CURRENCIES.VP] || Object.values(b.TotalBaseCost)[0] || 0) : 0;
      const totalDiscounted = b.TotalDiscountedCost ? (b.TotalDiscountedCost[config.CURRENCIES.VP] || Object.values(b.TotalDiscountedCost)[0] || 0) : 0;

      featuredBundles.push({
        bundleUuid: b.DataAssetID || b.ID,
        name: bundleMeta?.name || b.DisplayName || 'Featured Collection',
        subName: bundleMeta?.subName || b.DisplayNameSubText || '',
        displayIcon: bundleMeta?.displayIcon || bundleMeta?.verticalPromoImage || null,
        logoIcon: bundleMeta?.logoIcon || null,
        totalBaseCost: totalBase,
        totalDiscountedCost: totalDiscounted,
        totalDiscountPercent: b.TotalDiscountPercent || 0,
        remainingDurationInSeconds: b.DurationRemainingInSeconds || raw.FeaturedBundle?.BundleRemainingDurationInSeconds || 0,
        items: uniqueItems
      });
    }

    // 3. Parse Night Market (BonusStore)
    let nightMarket = null;
    if (raw.BonusStore && raw.BonusStore.BonusStoreOffers) {
      const nmOffers = [];
      for (const offer of raw.BonusStore.BonusStoreOffers) {
        const skinUuid = offer.Offer?.OfferID || offer.Offer?.Rewards?.[0]?.ItemID;
        const skin = skinCatalog.getSkinById(skinUuid);
        const originalPrice = offer.Offer?.Cost?.[config.CURRENCIES.VP] || 0;
        const discountPercent = offer.DiscountPercent || 0;
        const discountedPrice = offer.DiscountCosts?.[config.CURRENCIES.VP] || Math.round(originalPrice * (1 - discountPercent / 100));

        nmOffers.push({
          ...(skin || { uuid: skinUuid, name: 'Bonus Offer', tier: { highlightColor: '#ff4655', name: 'Edition' }, chromas: [], levels: [] }),
          originalPrice,
          discountedPrice,
          discountPercent,
          isSeen: offer.IsSeen || false
        });
      }

      nightMarket = {
        remainingDurationInSeconds: raw.BonusStore.BonusStoreRemainingDurationInSeconds || 0,
        offers: nmOffers
      };
    }

    // 4. Parse Accessory Store (Kingdom Credits Shop)
    let accessoryStore = null;
    if (raw.AccessoryStore && raw.AccessoryStore.AccessoryStoreOffers) {
      const accOffers = [];
      for (const offer of raw.AccessoryStore.AccessoryStoreOffers) {
        const rewardId = offer.Offer?.Rewards?.[0]?.ItemID || offer.Offer?.OfferID;
        const itemTypeId = offer.Offer?.Rewards?.[0]?.ItemTypeID;
        const itemMeta = skinCatalog.getItemById(rewardId, itemTypeId);
        const cost = offer.Offer?.Cost?.[config.CURRENCIES.KC] || (offer.Offer?.Cost ? Object.values(offer.Offer.Cost)[0] : 0) || 0;

        accOffers.push({
          uuid: rewardId,
          name: itemMeta?.name || 'Valorant Accessory',
          itemType: itemMeta?.itemType || 'Accessory',
          displayIcon: itemMeta?.displayIcon || itemMeta?.largeArt || 'https://media.valorant-api.com/weapons/skins/default/displayicon.png',
          cost,
          contractId: offer.ContractID
        });
      }

      accessoryStore = {
        remainingDurationInSeconds: raw.AccessoryStore.AccessoryStoreRemainingDurationInSeconds || 0,
        offers: accOffers
      };
    }

    return {
      dailyOffers,
      dailyRemainingSeconds: remainingSeconds,
      featuredBundles,
      nightMarket,
      accessoryStore,
      activeShard
    };
  }

  // Fetch Player Inventory & Owned Skins + Total Account Value
  async getPlayerInventory(puuid, region, accessToken, entitlementsToken) {
    try {
      // 1. Fetch player weapon skin entitlements
      const entResult = await this.fetchWithShardFallback(
        puuid,
        region,
        '/store/v1/entitlements/{puuid}/e7c63390-eda7-46e0-bb7a-a6abdacd2433',
        'GET',
        null,
        accessToken,
        entitlementsToken
      );

      // 2. Fetch equipped player loadout
      let loadoutData = null;
      try {
        const loadoutRes = await this.fetchWithShardFallback(
          puuid,
          region,
          '/personalization/v2/players/{puuid}/playerloadout',
          'GET',
          null,
          accessToken,
          entitlementsToken
        );
        loadoutData = loadoutRes.data;
      } catch (e) {
        // Loadout is optional fallback
      }

      // Map equipped skins by weapon UUID or skin UUID
      const equippedMap = new Map();
      const equippedChromas = new Map();
      if (loadoutData && loadoutData.Guns) {
        for (const g of loadoutData.Guns) {
          if (g.SkinID) equippedMap.set(g.SkinID.toLowerCase(), true);
          if (g.SkinLevelID) equippedMap.set(g.SkinLevelID.toLowerCase(), true);
          if (g.ChromaID) equippedChromas.set(g.SkinID?.toLowerCase(), g.ChromaID.toLowerCase());
        }
      }

      // 3. Process Entitlements
      const rawEntitlements = entResult.data?.EntitlementsByTypes?.[0]?.Entitlements || 
                             entResult.data?.Entitlements || 
                             [];

      const ownedSkinMap = new Map();
      const ownedLevelsSet = new Set();

      for (const ent of rawEntitlements) {
        const itemId = (ent.ItemID || ent.Item?.ID || ent.id || '').toLowerCase();
        if (!itemId) continue;

        ownedLevelsSet.add(itemId);

        // Resolve parent skin from level or chroma or skin UUID
        const skin = skinCatalog.levels.get(itemId) || 
                     skinCatalog.chromas.get(itemId) || 
                     skinCatalog.skins.get(itemId) || 
                     skinCatalog.getSkinById(itemId);

        if (skin && skin.uuid) {
          const skinId = skin.uuid.toLowerCase();
          if (!ownedSkinMap.has(skinId)) {
            // Determine price estimation
            let price = skin.price || 0;
            const isMelee = (skin.weaponType || '').toLowerCase().includes('melee') || (skin.name || '').toLowerCase().includes('knife') || (skin.name || '').toLowerCase().includes('blade') || (skin.name || '').toLowerCase().includes('dagger') || (skin.name || '').toLowerCase().includes('karambit') || (skin.name || '').toLowerCase().includes('sword') || (skin.name || '').toLowerCase().includes('scythe') || (skin.name || '').toLowerCase().includes('axe');
            const tierName = (skin.contentTier?.name || '').toLowerCase();

            if (!price) {
              if (tierName.includes('ultra')) {
                price = isMelee ? 4950 : 2475;
              } else if (tierName.includes('exclusive')) {
                price = isMelee ? 4350 : 2175;
              } else if (tierName.includes('premium')) {
                price = isMelee ? 3550 : 1775;
              } else if (tierName.includes('deluxe')) {
                price = isMelee ? 2550 : 1275;
              } else if (tierName.includes('select')) {
                price = isMelee ? 1750 : 875;
              } else {
                price = 0; // Standard default or reward
              }
            }

            // Exclude default starter weapons from account valuation
            const isStandardDefault = (skin.name || '').toLowerCase().startsWith('standard ') || (skin.name || '').toLowerCase() === 'melee';
            if (isStandardDefault) {
              price = 0;
            }

            const isEquipped = equippedMap.has(skinId) || 
                              (skin.levels && skin.levels.some(l => equippedMap.has(l.uuid.toLowerCase())));

            const equippedChromaId = equippedChromas.get(skinId);
            let activeDisplayIcon = skin.displayIcon;
            if (equippedChromaId && skin.chromas) {
              const activeChr = skin.chromas.find(c => c.uuid.toLowerCase() === equippedChromaId);
              if (activeChr && (activeChr.fullRender || activeChr.displayIcon)) {
                activeDisplayIcon = activeChr.fullRender || activeChr.displayIcon;
              }
            }

            ownedSkinMap.set(skinId, {
              ...skin,
              displayIcon: activeDisplayIcon,
              estimatedVpPrice: price,
              isStandardDefault,
              isEquipped,
              equippedChromaId,
              ownedLevelsCount: 1
            });
          } else {
            const existing = ownedSkinMap.get(skinId);
            existing.ownedLevelsCount = (existing.ownedLevelsCount || 1) + 1;
          }
        }
      }

      // Convert to array and filter out standard starter weapons for stats calculation
      const allOwnedSkins = Array.from(ownedSkinMap.values());
      const premiumOwnedSkins = allOwnedSkins.filter(s => !s.isStandardDefault);

      // Sort by VP Price descending, then Name
      premiumOwnedSkins.sort((a, b) => {
        if (b.isEquipped !== a.isEquipped) return b.isEquipped ? 1 : -1;
        if (b.estimatedVpPrice !== a.estimatedVpPrice) return b.estimatedVpPrice - a.estimatedVpPrice;
        return (a.name || '').localeCompare(b.name || '');
      });

      // Calculate total VP and THB valuation
      let totalVpValue = 0;
      const weaponBreakdown = {};
      const tierBreakdown = {
        ultra: 0,
        exclusive: 0,
        premium: 0,
        deluxe: 0,
        select: 0,
        other: 0
      };

      for (const s of premiumOwnedSkins) {
        totalVpValue += (s.estimatedVpPrice || 0);

        const wp = s.weaponType || 'Other';
        if (!weaponBreakdown[wp]) {
          weaponBreakdown[wp] = { count: 0, totalVp: 0 };
        }
        weaponBreakdown[wp].count++;
        weaponBreakdown[wp].totalVp += (s.estimatedVpPrice || 0);

        const tName = (s.contentTier?.name || '').toLowerCase();
        if (tName.includes('ultra')) tierBreakdown.ultra++;
        else if (tName.includes('exclusive')) tierBreakdown.exclusive++;
        else if (tName.includes('premium')) tierBreakdown.premium++;
        else if (tName.includes('deluxe')) tierBreakdown.deluxe++;
        else if (tName.includes('select')) tierBreakdown.select++;
        else tierBreakdown.other++;
      }

      const estimatedThbOverTopup = Math.round(totalVpValue * 0.238);
      const estimatedThbRiotOfficial = Math.round(totalVpValue * 0.293);

      return {
        totalSkinsCount: premiumOwnedSkins.length,
        totalVpValue,
        estimatedThbOverTopup,
        estimatedThbRiotOfficial,
        weaponBreakdown,
        tierBreakdown,
        skins: premiumOwnedSkins,
        allSkinsCount: allOwnedSkins.length,
        activeShard: entResult.activeShard || region
      };
    } catch (e) {
      console.error('[ValorantApi] Inventory lookup failed:', e.message);
      if (e.code === 'TOKEN_EXPIRED') throw e;
      return {
        totalSkinsCount: 0,
        totalVpValue: 0,
        estimatedThbOverTopup: 0,
        estimatedThbRiotOfficial: 0,
        weaponBreakdown: {},
        tierBreakdown: {},
        skins: [],
        allSkinsCount: 0,
        activeShard: region || 'ap'
      };
    }
  }

  // Fetch Player MMR & Rank Stats
  async getMmr(puuid, region, accessToken, entitlementsToken) {
    try {
      const result = await this.fetchWithShardFallback(
        puuid,
        region,
        '/mmr/v1/players/{puuid}',
        'GET',
        null,
        accessToken,
        entitlementsToken
      );

      const data = result.data || {};
      const queueSkills = data.QueueSkills || {};
      const compInfo = queueSkills.competitive || {};
      const seasonalInfo = compInfo.SeasonalInfoBySeasonID || {};
      const latestUpdate = data.LatestCompetitiveUpdate;

      let currentTier = 0;
      let currentRR = 0;
      let currentWins = 0;
      let peakTier = 0;
      let leaderboardRank = 0;

      // 1. Calculate Peak Tier across all seasons
      for (const sData of Object.values(seasonalInfo)) {
        if (sData && typeof sData.CompetitiveTier === 'number') {
          if (sData.CompetitiveTier > peakTier) {
            peakTier = sData.CompetitiveTier;
          }
        }
      }

      // 2. Try latest competitive update first (most up-to-date)
      if (latestUpdate && typeof latestUpdate.TierAfterUpdate === 'number' && latestUpdate.TierAfterUpdate > 0) {
        currentTier = latestUpdate.TierAfterUpdate;
        currentRR = typeof latestUpdate.RankedRatingAfterUpdate === 'number' ? latestUpdate.RankedRatingAfterUpdate : (latestUpdate.RankedRatingEarned || 0);
      }

      // 3. Match against chronological season list (from latest to oldest)
      const orderedActs = (skinCatalog.orderedSeasonIds && skinCatalog.orderedSeasonIds.length > 0)
        ? [...skinCatalog.orderedSeasonIds].reverse()
        : Object.keys(seasonalInfo);

      for (const sId of orderedActs) {
        const sData = seasonalInfo[sId] || seasonalInfo[sId.toLowerCase()];
        if (sData) {
          if (sData.CompetitiveTier > peakTier) {
            peakTier = sData.CompetitiveTier;
          }
          if (currentTier === 0 && sData.CompetitiveTier > 0) {
            currentTier = sData.CompetitiveTier;
            currentRR = sData.RankedRating || 0;
            currentWins = sData.NumberOfWinsWithPlacements || sData.NumberOfWins || 0;
            leaderboardRank = sData.LeaderboardRank || 0;
            break;
          } else if (currentWins === 0 && (sData.NumberOfWinsWithPlacements || sData.NumberOfWins)) {
            currentWins = sData.NumberOfWinsWithPlacements || sData.NumberOfWins || 0;
            if (!leaderboardRank) leaderboardRank = sData.LeaderboardRank || 0;
          }
        }
      }

      if (currentTier > peakTier) {
        peakTier = currentTier;
      }

      const gamesNeeded = compInfo.TotalGamesNeededForRating || 0;
      const rankMeta = skinCatalog.getRank(currentTier);
      const peakRankMeta = skinCatalog.getRank(peakTier);

      return {
        tier: currentTier,
        tierName: rankMeta.tierName || 'UNRANKED',
        divisionName: rankMeta.divisionName || 'UNRANKED',
        color: rankMeta.color || '#ffffff',
        rankIcon: rankMeta.largeIcon || rankMeta.smallIcon || 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png',
        rankedRating: currentRR,
        gamesNeededForRating: gamesNeeded,
        seasonalWins: currentWins,
        peakTier,
        peakRankName: peakRankMeta.tierName || 'UNRANKED',
        peakRankIcon: peakRankMeta.largeIcon || peakRankMeta.smallIcon || 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png',
        leaderboardRank
      };
    } catch (e) {
      console.error('[ValorantApi] MMR lookup failed:', e.message);
      const unranked = skinCatalog.getRank(0);
      return {
        tier: 0,
        tierName: 'UNRANKED',
        divisionName: 'UNRANKED',
        color: '#ffffff',
        rankIcon: unranked.largeIcon || unranked.smallIcon || 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png',
        rankedRating: 0,
        gamesNeededForRating: 0,
        seasonalWins: 0,
        peakTier: 0,
        peakRankName: 'UNRANKED',
        peakRankIcon: null,
        leaderboardRank: 0
      };
    }
  }

  // Batch resolve real player names & tags from PUUIDs
  async resolvePlayerNames(puuids, region, accessToken, entitlementsToken) {
    if (!this.playerNameCache) {
      this.playerNameCache = new Map();
    }

    const missingPuuids = [];
    const resultMap = new Map();

    for (const puuid of puuids) {
      if (!puuid) continue;
      const lower = puuid.toLowerCase();
      if (this.playerNameCache.has(lower)) {
        resultMap.set(lower, this.playerNameCache.get(lower));
      } else {
        missingPuuids.push(puuid);
      }
    }

    if (missingPuuids.length > 0) {
      const candidateShards = [region || 'ap', 'ap', 'na', 'eu', 'kr'];
      const headers = this.getHeaders(accessToken, entitlementsToken, true);

      for (const shard of candidateShards) {
        const host = this.getPvpHost(shard);
        try {
          const res = await fetch(`https://${host}/name-service/v2/players`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(missingPuuids)
          });

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              for (const entry of data) {
                if (entry && entry.Subject) {
                  const info = {
                    gameName: entry.GameName || 'Agent',
                    tagLine: entry.TagLine || 'VAL'
                  };
                  this.playerNameCache.set(entry.Subject.toLowerCase(), info);
                  resultMap.set(entry.Subject.toLowerCase(), info);
                }
              }
              break;
            }
          }
        } catch (e) {}
      }
    }

    return resultMap;
  }

  // Fetch Match Details by Match ID (with in-memory caching)
  async getMatchDetails(matchId, region, accessToken, entitlementsToken) {
    if (!this.matchCache) {
      this.matchCache = new Map();
    }

    if (this.matchCache.has(matchId)) {
      return this.matchCache.get(matchId);
    }

    const host = this.getPvpHost(region);
    const headers = this.getHeaders(accessToken, entitlementsToken);
    const res = await fetch(`https://${host}/match-details/v1/matches/${matchId}`, {
      headers
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Failed to fetch match details (Status: ${res.status}): ${errText}`);
    }

    const matchData = await res.json();
    this.matchCache.set(matchId, matchData);

    // Keep cache at max 100 matches
    if (this.matchCache.size > 100) {
      const firstKey = this.matchCache.keys().next().value;
      this.matchCache.delete(firstKey);
    }

    return matchData;
  }

  // Fetch Match History List with Formatted Details
  async getMatchHistory(puuid, region, accessToken, entitlementsToken, limit = 10, queue = '') {
    try {
      const queueParam = queue ? `&queue=${encodeURIComponent(queue)}` : '';
      const result = await this.fetchWithShardFallback(
        puuid,
        region,
        `/match-history/v1/history/{puuid}?startIndex=0&endIndex=${limit}${queueParam}`,
        'GET',
        null,
        accessToken,
        entitlementsToken
      );

      const historyData = result.data || {};
      const matchEntries = historyData.History || [];
      const rawMatches = [];

      // Fetch match details in parallel
      const detailPromises = matchEntries.map(async (entry) => {
        try {
          return await this.getMatchDetails(entry.MatchID, result.activeShard || region, accessToken, entitlementsToken);
        } catch (err) {
          console.error(`[ValorantApi] Error fetching match ${entry.MatchID}:`, err.message);
          return null;
        }
      });

      const detailResults = await Promise.allSettled(detailPromises);
      for (const r of detailResults) {
        if (r.status === 'fulfilled' && r.value) {
          rawMatches.push(r.value);
        }
      }

      // Collect all unique player PUUIDs from all matches
      const allPuuids = new Set();
      for (const m of rawMatches) {
        if (m.players) {
          for (const p of m.players) {
            if (p.subject) allPuuids.add(p.subject);
          }
        }
      }

      // Batch resolve real in-game player names & tags from Riot
      const namesMap = await this.resolvePlayerNames(
        Array.from(allPuuids),
        result.activeShard || region,
        accessToken,
        entitlementsToken
      );

      // Format all matches with real player names
      const formattedMatches = rawMatches
        .map(raw => this.formatMatchData(puuid, raw, namesMap))
        .filter(Boolean);

      return {
        total: historyData.Total || formattedMatches.length,
        matches: formattedMatches
      };
    } catch (e) {
      console.error('[ValorantApi] Match history lookup failed:', e.message);
      if (e.code === 'TOKEN_EXPIRED') throw e;
      return { total: 0, matches: [] };
    }
  }

  // Helper: Format raw match into rich presentation data
  formatMatchData(puuid, raw, namesMap = new Map()) {
    const matchInfo = raw.matchInfo || {};
    const players = raw.players || [];
    const teams = raw.teams || [];
    const roundResults = raw.roundResults || [];

    const mapMeta = skinCatalog.getMap(matchInfo.mapId);
    const queueName = this.formatQueueName(matchInfo.queueId);

    // Find target player
    const me = players.find(p => p.subject?.toLowerCase() === puuid.toLowerCase());
    if (!me) return null;

    const myTeamId = me.teamId;
    const isDeathmatch = (matchInfo.queueId || '').toLowerCase() === 'deathmatch';

    // Player metrics tracker
    const playerMetrics = new Map();
    const initPlayerMetrics = (pSub) => {
      if (!playerMetrics.has(pSub)) {
        playerMetrics.set(pSub, {
          totalDamage: 0,
          headshots: 0,
          bodyshots: 0,
          legshots: 0,
          firstBloods: 0,
          firstDeaths: 0,
          doubleKills: 0,
          tripleKills: 0,
          quadraKills: 0,
          aces: 0,
          plants: 0,
          defuses: 0,
          totalSpent: 0,
          weaponUsage: new Map() // weaponName -> count
        });
      }
      return playerMetrics.get(pSub);
    };

    // Initialize all players
    for (const p of players) {
      if (p.subject) initPlayerMetrics(p.subject.toLowerCase());
    }

    // Process all rounds & build round-by-round timeline
    const formattedRounds = [];

    roundResults.forEach((r, rIdx) => {
      const roundNum = rIdx + 1;
      const winningTeam = r.winningTeam;
      const isMyTeamWon = winningTeam === myTeamId;

      // Translate round result type
      let winType = r.roundResult || 'Elimination';
      let winTypeTh = 'กวาดล้างศัตรู';
      if (winType.includes('Defuse') || winType === 'Defused') {
        winType = 'Defused';
        winTypeTh = 'กู้สไปก์สำเร็จ';
      } else if (winType.includes('Bomb') || winType === 'Bomb detonated') {
        winType = 'Spike Detonated';
        winTypeTh = 'สไปก์ระเบิด';
      } else if (winType.includes('Time') || winType === 'Round timer expired') {
        winType = 'Time Expired';
        winTypeTh = 'หมดเวลา';
      } else if (winType.includes('Surrender')) {
        winType = 'Surrendered';
        winTypeTh = 'ยอมแพ้';
      }

      // Ceremony
      let ceremony = 'Default';
      let ceremonyTh = '';
      if (r.roundCeremony === 'CeremonyFlawless') {
        ceremony = 'Flawless';
        ceremonyTh = 'สมบูรณ์แบบ (Flawless)';
      } else if (r.roundCeremony === 'CeremonyAce') {
        ceremony = 'Ace';
        ceremonyTh = 'ACE (5 คิล)';
      } else if (r.roundCeremony === 'CeremonyClutch') {
        ceremony = 'Clutch';
        ceremonyTh = 'คลัทช์ (Clutch)';
      } else if (r.roundCeremony === 'CeremonyThrifty') {
        ceremony = 'Thrifty';
        ceremonyTh = 'ประหยัด (Thrifty)';
      }

      // Track Spike Planter & Defuser
      let planterName = null;
      let defuserName = null;

      if (r.bombPlanter) {
        const plSub = r.bombPlanter.toLowerCase();
        const plResolved = namesMap.get(plSub);
        planterName = plResolved ? `${plResolved.gameName}#${plResolved.tagLine}` : 'Agent';
        const m = initPlayerMetrics(plSub);
        m.plants++;
      }

      if (r.bombDefuser) {
        const dfSub = r.bombDefuser.toLowerCase();
        const dfResolved = namesMap.get(dfSub);
        defuserName = dfResolved ? `${dfResolved.gameName}#${dfResolved.tagLine}` : 'Agent';
        const m = initPlayerMetrics(dfSub);
        m.defuses++;
      }

      // Collect all kills in this round
      const roundKills = [];
      const roundPlayerLoadouts = [];

      if (r.playerStats) {
        for (const ps of r.playerStats) {
          const pSub = ps.subject?.toLowerCase();
          if (!pSub) continue;
          const pMetric = initPlayerMetrics(pSub);

          // Hits & Damage
          if (ps.damage) {
            for (const d of ps.damage) {
              pMetric.totalDamage += (d.damage || 0);
              pMetric.headshots += (d.headshots || 0);
              pMetric.bodyshots += (d.bodyshots || 0);
              pMetric.legshots += (d.legshots || 0);
            }
          }

          // Economy & Weapon Bought
          const econ = ps.economy || {};
          pMetric.totalSpent += (econ.spent || 0);

          let weaponName = 'Classic';
          let weaponIcon = null;
          if (econ.weapon) {
            const wp = skinCatalog.getWeapon(econ.weapon) || skinCatalog.getSkinById(econ.weapon);
            if (wp) {
              weaponName = wp.name;
              weaponIcon = wp.displayIcon || wp.killStreamIcon;
              pMetric.weaponUsage.set(weaponName, (pMetric.weaponUsage.get(weaponName) || 0) + 1);
            }
          }

          let armorName = 'None';
          if (econ.armor) {
            const aLower = econ.armor.toLowerCase();
            if (aLower.includes('heavy') || aLower.includes('4be47ced')) armorName = 'Heavy (50)';
            else if (aLower.includes('light')) armorName = 'Light (25)';
            else if (aLower.includes('regen') || aLower.includes('shield')) armorName = 'Regen Shield';
            else armorName = 'Armor';
          }

          const resolvedP = namesMap.get(pSub);
          const pObj = players.find(x => x.subject?.toLowerCase() === pSub);
          const pAgent = skinCatalog.getAgent(pObj?.characterId);

          roundPlayerLoadouts.push({
            puuid: pSub,
            gameName: resolvedP?.gameName || pObj?.gameName || 'Agent',
            tagLine: resolvedP?.tagLine || pObj?.tagLine || 'VAL',
            teamId: pObj?.teamId,
            agent: pAgent,
            weaponName,
            weaponIcon,
            armorName,
            spent: econ.spent || 0,
            remaining: econ.remaining || 0,
            damageThisRound: (ps.damage || []).reduce((acc, cur) => acc + (cur.damage || 0), 0)
          });

          // Kills in round
          if (ps.kills && Array.isArray(ps.kills)) {
            const killCount = ps.kills.length;
            if (killCount === 2) pMetric.doubleKills++;
            else if (killCount === 3) pMetric.tripleKills++;
            else if (killCount === 4) pMetric.quadraKills++;
            else if (killCount >= 5) pMetric.aces++;

            for (const k of ps.kills) {
              roundKills.push(k);
            }
          }
        }
      }

      // Sort kills by roundTime to find First Blood & Timeline
      roundKills.sort((a, b) => (a.roundTime || 0) - (b.roundTime || 0));

      if (roundKills.length > 0) {
        const firstKill = roundKills[0];
        if (firstKill.killer) {
          const kSub = firstKill.killer.toLowerCase();
          initPlayerMetrics(kSub).firstBloods++;
        }
        if (firstKill.victim) {
          const vSub = firstKill.victim.toLowerCase();
          initPlayerMetrics(vSub).firstDeaths++;
        }
      }

      // Format Killfeed Timeline
      const formattedKillfeed = roundKills.map(k => {
        const kSub = k.killer?.toLowerCase();
        const vSub = k.victim?.toLowerCase();
        const kResolved = namesMap.get(kSub);
        const vResolved = namesMap.get(vSub);
        const kPlayer = players.find(x => x.subject?.toLowerCase() === kSub);
        const vPlayer = players.find(x => x.subject?.toLowerCase() === vSub);

        const kAgent = skinCatalog.getAgent(kPlayer?.characterId);
        const vAgent = skinCatalog.getAgent(vPlayer?.characterId);

        let wpName = 'Weapon';
        let wpIcon = null;
        const wpUuid = k.finishingDamage?.damageItem || k.damageItem;
        if (wpUuid) {
          const wpObj = skinCatalog.getWeapon(wpUuid) || skinCatalog.getSkinById(wpUuid);
          if (wpObj) {
            wpName = wpObj.name;
            wpIcon = wpObj.displayIcon || wpObj.killStreamIcon;
          }
        }

        const roundSecs = Math.max(0, Math.floor((k.roundTime || 0) / 1000));
        const timeFormatted = `${Math.floor(roundSecs / 60)}:${(roundSecs % 60).toString().padStart(2, '0')}`;

        // Extract 2D map locations
        let killerLocation = null;
        if (k.playerLocations && Array.isArray(k.playerLocations)) {
          const kLocObj = k.playerLocations.find(pl => pl.subject?.toLowerCase() === kSub);
          if (kLocObj && kLocObj.location) {
            killerLocation = { x: kLocObj.location.x, y: kLocObj.location.y };
          }
        }

        const victimLocation = k.victimLocation ? { x: k.victimLocation.x, y: k.victimLocation.y } : null;

        return {
          killerName: kResolved?.gameName || kPlayer?.gameName || 'Agent',
          killerTag: kResolved?.tagLine || kPlayer?.tagLine || 'VAL',
          killerAgent: kAgent,
          killerTeam: kPlayer?.teamId,
          killerLocation,
          victimName: vResolved?.gameName || vPlayer?.gameName || 'Agent',
          victimTag: vResolved?.tagLine || vPlayer?.tagLine || 'VAL',
          victimAgent: vAgent,
          victimTeam: vPlayer?.teamId,
          victimLocation,
          weaponName: wpName,
          weaponIcon: wpIcon,
          isHeadshot: k.finishingDamage?.damageType === 'Weapon' && !k.finishingDamage?.isSecondaryFireMode,
          roundTime: timeFormatted,
          roundTimeMillis: k.roundTime || 0
        };
      });

      formattedRounds.push({
        roundNum,
        winningTeam,
        isMyTeamWon,
        winType,
        winTypeTh,
        ceremony,
        ceremonyTh,
        plantSite: r.plantSite || null,
        plantLocation: r.plantLocation ? { x: r.plantLocation.x, y: r.plantLocation.y } : null,
        defuseLocation: r.defuseLocation ? { x: r.defuseLocation.x, y: r.defuseLocation.y } : null,
        planterName,
        defuserName,
        killfeed: formattedKillfeed,
        loadouts: roundPlayerLoadouts
      });
    });

    // Team scores & Outcome
    let myTeamScore = 0;
    let enemyTeamScore = 0;
    let outcome = 'DRAW';

    if (isDeathmatch) {
      const sortedByKills = [...players].sort((a, b) => (b.stats?.kills || 0) - (a.stats?.kills || 0));
      const myRank = sortedByKills.findIndex(p => p.subject?.toLowerCase() === puuid.toLowerCase()) + 1;
      outcome = myRank === 1 ? 'VICTORY' : 'DEFEAT';
      myTeamScore = me.stats?.kills || 0;
      enemyTeamScore = sortedByKills[0]?.stats?.kills || 0;
    } else {
      const myTeam = teams.find(t => t.teamId === myTeamId);
      const enemyTeam = teams.find(t => t.teamId !== myTeamId);

      myTeamScore = myTeam ? myTeam.roundsWon : 0;
      enemyTeamScore = enemyTeam ? enemyTeam.roundsWon : 0;

      if (myTeam) {
        if (myTeam.won === true || myTeamScore > enemyTeamScore) {
          outcome = 'VICTORY';
        } else if (myTeamScore < enemyTeamScore) {
          outcome = 'DEFEAT';
        } else {
          outcome = 'DRAW';
        }
      }
    }

    const myAgent = skinCatalog.getAgent(me.characterId);
    const myRank = skinCatalog.getRank(me.competitiveTier);
    const myStats = me.stats || {};
    const roundsPlayed = myStats.roundsPlayed || (myTeamScore + enemyTeamScore) || 1;
    const kills = myStats.kills || 0;
    const deaths = myStats.deaths || 0;
    const assists = myStats.assists || 0;
    const score = myStats.score || 0;
    const acs = roundsPlayed > 0 ? Math.round(score / roundsPlayed) : 0;
    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
    const kda = deaths > 0 ? ((kills + assists) / deaths).toFixed(2) : (kills + assists).toFixed(2);

    const myMetric = playerMetrics.get(puuid.toLowerCase()) || {};
    const myTotalHits = (myMetric.headshots || 0) + (myMetric.bodyshots || 0) + (myMetric.legshots || 0);
    const myHsPercent = myTotalHits > 0 ? Math.round((myMetric.headshots / myTotalHits) * 100) : 0;
    const myAdr = roundsPlayed > 0 ? Math.round((myMetric.totalDamage || 0) / roundsPlayed) : 0;
    const myEcon = (myMetric.totalSpent || 0) > 0 ? Math.round(((myMetric.totalDamage || 0) / myMetric.totalSpent) * 1000) : 0;

    // Format all players for scoreboard with REAL in-game names & full analytics
    const allPlayers = players.map(p => {
      const pSub = p.subject?.toLowerCase();
      const resolvedName = namesMap.get(pSub);
      const realGameName = resolvedName?.gameName || p.gameName || 'Agent';
      const realTagLine = resolvedName?.tagLine || p.tagLine || 'VAL';

      const ag = skinCatalog.getAgent(p.characterId);
      const rk = skinCatalog.getRank(p.competitiveTier);
      const st = p.stats || {};
      const pRounds = st.roundsPlayed || roundsPlayed;
      const pKills = st.kills || 0;
      const pDeaths = st.deaths || 0;
      const pAssists = st.assists || 0;
      const pScore = st.score || 0;
      const pAcs = pRounds > 0 ? Math.round(pScore / pRounds) : 0;
      const pKd = pDeaths > 0 ? (pKills / pDeaths).toFixed(2) : pKills.toFixed(2);

      const m = playerMetrics.get(pSub) || {};
      const totHits = (m.headshots || 0) + (m.bodyshots || 0) + (m.legshots || 0);
      const hsPercent = totHits > 0 ? Math.round((m.headshots / totHits) * 100) : 0;
      const adr = pRounds > 0 ? Math.round((m.totalDamage || 0) / pRounds) : 0;
      const econRating = (m.totalSpent || 0) > 0 ? Math.round(((m.totalDamage || 0) / m.totalSpent) * 1000) : 0;

      // Find top used weapon
      let topWeapon = 'Vandal';
      let topWeaponCount = 0;
      if (m.weaponUsage) {
        for (const [wp, cnt] of m.weaponUsage.entries()) {
          if (cnt > topWeaponCount) {
            topWeaponCount = cnt;
            topWeapon = wp;
          }
        }
      }

      return {
        puuid: p.subject,
        gameName: realGameName,
        tagLine: realTagLine,
        teamId: p.teamId,
        isMe: pSub === puuid.toLowerCase(),
        agent: ag,
        rank: rk,
        stats: {
          kills: pKills,
          deaths: pDeaths,
          assists: pAssists,
          score: pScore,
          acs: pAcs,
          kd: pKd,
          adr,
          hsPercent,
          headshots: m.headshots || 0,
          bodyshots: m.bodyshots || 0,
          legshots: m.legshots || 0,
          totalDamage: m.totalDamage || 0,
          firstBloods: m.firstBloods || 0,
          firstDeaths: m.firstDeaths || 0,
          doubleKills: m.doubleKills || 0,
          tripleKills: m.tripleKills || 0,
          quadraKills: m.quadraKills || 0,
          aces: m.aces || 0,
          plants: m.plants || 0,
          defuses: m.defuses || 0,
          econRating,
          topWeapon,
          abilityCasts: st.abilityCasts || null
        }
      };
    });

    // Sort scoreboard players by ACS descending
    allPlayers.sort((a, b) => b.stats.acs - a.stats.acs);

    const friendlyTeam = allPlayers.filter(p => p.teamId === myTeamId);
    const enemyTeam = allPlayers.filter(p => p.teamId !== myTeamId);

    return {
      matchId: matchInfo.matchId,
      map: mapMeta,
      queueId: matchInfo.queueId || 'custom',
      queueName,
      isRanked: !!matchInfo.isRanked,
      gameStartMillis: matchInfo.gameStartMillis,
      gameLengthMillis: matchInfo.gameLengthMillis || 0,
      outcome,
      myTeamScore,
      enemyTeamScore,
      myTeamId,
      myAgent,
      myRank,
      myStats: {
        kills,
        deaths,
        assists,
        score,
        acs,
        kd,
        kda,
        adr: myAdr,
        hsPercent: myHsPercent,
        totalDamage: myMetric.totalDamage || 0,
        firstBloods: myMetric.firstBloods || 0,
        firstDeaths: myMetric.firstDeaths || 0,
        doubleKills: myMetric.doubleKills || 0,
        tripleKills: myMetric.tripleKills || 0,
        quadraKills: myMetric.quadraKills || 0,
        aces: myMetric.aces || 0,
        plants: myMetric.plants || 0,
        defuses: myMetric.defuses || 0,
        econRating: myEcon,
        roundsPlayed
      },
      friendlyTeam,
      enemyTeam,
      players: allPlayers,
      rounds: formattedRounds
    };
  }

  formatQueueName(queueId) {
    if (!queueId) return 'Custom Game';
    const q = queueId.toLowerCase();
    switch (q) {
      case 'competitive': return 'Competitive (จัดอันดับ)';
      case 'unrated': return 'Unrated (ทั่วไป)';
      case 'swiftplay': return 'Swiftplay (เล่นเร็ว)';
      case 'deathmatch': return 'Deathmatch (เดธแมตช์)';
      case 'spikerush': return 'Spike Rush (สไปก์รัช)';
      case 'hurm': return 'Team Deathmatch (TDM)';
      case 'premier': return 'Premier';
      case 'onefa': return 'Replication';
      case 'snowball': return 'Snowball Fight';
      case 'ggteam': return 'Escalation';
      case 'newmap': return 'New Map';
      case 'custom': return 'Custom Game';
      default: return queueId.charAt(0).toUpperCase() + queueId.slice(1);
    }
  }
}

module.exports = new ValorantApiService();
