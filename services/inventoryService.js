const config = require('../config');
const skinCatalog = require('./skinCatalog');

/**
 * Valorant Inventory Service
 * Fetches player owned skins, loadout items, chromas, and estimates total account valuation.
 */
class InventoryService {
  async getPlayerInventory(puuid, region, accessToken, entitlementsToken, apiService) {
    try {
      // 1. Fetch player weapon skin entitlements (try specific type first, fallback to all)
      let rawEntitlements = [];
      let activeShard = region || 'ap';

      try {
        const entResult = await apiService.fetchWithShardFallback(
          puuid,
          region,
          '/store/v1/entitlements/{puuid}/e7c63390-eda7-46e0-bb7a-a6abdacd2433',
          'GET',
          null,
          accessToken,
          entitlementsToken
        );
        activeShard = entResult.activeShard || activeShard;
        
        if (entResult.data?.EntitlementsByTypes) {
          for (const t of entResult.data.EntitlementsByTypes) {
            if (Array.isArray(t.Entitlements)) rawEntitlements.push(...t.Entitlements);
          }
        } else if (Array.isArray(entResult.data?.Entitlements)) {
          rawEntitlements.push(...entResult.data.Entitlements);
        } else if (Array.isArray(entResult.data)) {
          rawEntitlements.push(...entResult.data);
        }
      } catch (errEntSpecific) {
        console.log('[InventoryService] Specific entitlement endpoint error, trying global endpoint...');
        try {
          const globalEntResult = await apiService.fetchWithShardFallback(
            puuid,
            region,
            '/store/v1/entitlements/{puuid}',
            'GET',
            null,
            accessToken,
            entitlementsToken
          );
          activeShard = globalEntResult.activeShard || activeShard;

          if (globalEntResult.data?.EntitlementsByTypes) {
            for (const t of globalEntResult.data.EntitlementsByTypes) {
              if (t.ItemTypeID?.toLowerCase() === 'e7c63390-eda7-46e0-bb7a-a6abdacd2433' || !t.ItemTypeID) {
                if (Array.isArray(t.Entitlements)) rawEntitlements.push(...t.Entitlements);
              }
            }
          }
        } catch (errEntGlobal) {
          console.error('[InventoryService] Global entitlement fetch failed:', errEntGlobal.message);
        }
      }

      // 2. Fetch Player Loadout to identify currently equipped skins and chromas
      let loadoutData = null;
      try {
        const loadoutRes = await apiService.fetchWithShardFallback(
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
        console.log('[InventoryService] Player loadout lookup skipped/failed:', e.message);
      }

      // Map of currently equipped weapon skin items
      const equippedMap = new Set();
      const equippedChromas = new Map(); // skinUuid -> chromaUuid
      if (loadoutData && loadoutData.Guns) {
        for (const g of loadoutData.Guns) {
          if (g.SkinID) {
            equippedMap.add(g.SkinID.toLowerCase());
            if (g.ChromaID) equippedChromas.set(g.SkinID.toLowerCase(), g.ChromaID.toLowerCase());
          }
          if (g.SkinLevelID) {
            equippedMap.add(g.SkinLevelID.toLowerCase());
          }
          if (g.ChromaID) {
            equippedMap.add(g.ChromaID.toLowerCase());
          }
        }
      }

      // Set of all raw entitlement ItemIDs for precise level & chroma resolution
      const ownedItemIdsSet = new Set();
      for (const ent of rawEntitlements) {
        const id = (ent.ItemID || ent.Item?.ItemID || ent.OfferID || '').toLowerCase();
        if (id) ownedItemIdsSet.add(id);
      }

      // 3. Resolve all owned skins
      const ownedSkinMap = new Map(); // skinUuid -> skin object

      for (const ent of rawEntitlements) {
        const itemId = (ent.ItemID || ent.Item?.ItemID || ent.OfferID || '').toLowerCase();
        if (!itemId) continue;

        let skin = skinCatalog.getSkinById(itemId);
        let skinId = skin ? skin.uuid : null;

        if (!skin) {
          const skinObj = skinCatalog.getSkinByItemUuid(itemId);
          if (skinObj) {
            skin = skinObj;
            skinId = skinObj.uuid;
          }
        }

        if (skin && skin.uuid) {
          skinId = skin.uuid;

          if (!ownedSkinMap.has(skinId)) {
            let price = skin.estimatedVpPrice || 0;

            // Smart VP price estimation by Content Tier if catalog doesn't have exact price
            if (!price) {
              const tierName = (skin.contentTier?.name || skin.tier?.name || '').toLowerCase();
              if (tierName.includes('ultra')) {
                price = 2475;
              } else if (tierName.includes('exclusive')) {
                price = 2175;
              } else if (tierName.includes('premium')) {
                price = 1775;
              } else if (tierName.includes('deluxe')) {
                price = 1275;
              } else if (tierName.includes('select')) {
                price = 875;
              } else {
                price = 0;
              }
            }

            // Exclude default starter weapons from account valuation
            const isStandardDefault = (skin.name || '').toLowerCase().startsWith('standard ') || (skin.name || '').toLowerCase() === 'melee';
            if (isStandardDefault) {
              price = 0;
            }

            const isEquipped = equippedMap.has(skinId) || 
                              (skin.levels && skin.levels.some(l => equippedMap.has((l.id || l.uuid || '').toLowerCase())));

            const equippedChromaId = equippedChromas.get(skinId);
            let activeDisplayIcon = skin.displayIcon;
            if (equippedChromaId && skin.chromas) {
              const activeChr = skin.chromas.find(c => (c.id || c.uuid || '').toLowerCase() === equippedChromaId);
              if (activeChr && (activeChr.fullRender || activeChr.displayIcon)) {
                activeDisplayIcon = activeChr.fullRender || activeChr.displayIcon;
              }
            }

            // Radianite Upgrade Breakdown
            const totalLevels = Array.isArray(skin.levels) ? skin.levels.length : 1;
            let unlockedLevels = 1;
            if (Array.isArray(skin.levels) && skin.levels.length > 1) {
              const matchCount = skin.levels.filter(l => ownedItemIdsSet.has((l.uuid || l.id || '').toLowerCase())).length;
              if (matchCount > 0) unlockedLevels = matchCount;
            }

            const totalChromas = (Array.isArray(skin.chromas) && skin.chromas.length > 1) ? skin.chromas.length : 0;
            let unlockedChromas = 0;
            if (totalChromas > 0) {
              unlockedChromas = 1; // default chroma is always included
              const extraUnlocked = skin.chromas.slice(1).filter(c => ownedItemIdsSet.has((c.uuid || c.id || '').toLowerCase())).length;
              unlockedChromas += extraUnlocked;
            }

            const remainingLevels = Math.max(0, totalLevels - unlockedLevels);
            const remainingChromas = Math.max(0, totalChromas - unlockedChromas);
            const radianiteNeeded = (remainingLevels * 10) + (remainingChromas * 15);
            const isMaxUpgraded = remainingLevels === 0 && remainingChromas === 0;

            ownedSkinMap.set(skinId, {
              ...skin,
              displayIcon: activeDisplayIcon,
              estimatedVpPrice: price,
              isStandardDefault,
              isEquipped,
              equippedChromaId,
              totalLevels,
              unlockedLevels,
              totalChromas,
              unlockedChromas,
              remainingLevels,
              remainingChromas,
              radianiteNeeded,
              isMaxUpgraded,
              ownedLevelsCount: unlockedLevels
            });
          }
        }
      }

      // Convert to array
      const allOwnedSkins = Array.from(ownedSkinMap.values());
      const premiumOwnedSkins = allOwnedSkins.filter(s => !s.isStandardDefault);

      // Sort by Equipped first, then Premium first, then VP Price descending, then Name
      allOwnedSkins.sort((a, b) => {
        if (b.isEquipped !== a.isEquipped) return b.isEquipped ? 1 : -1;
        if (b.isStandardDefault !== a.isStandardDefault) return a.isStandardDefault ? 1 : -1;
        if (b.estimatedVpPrice !== a.estimatedVpPrice) return b.estimatedVpPrice - a.estimatedVpPrice;
        return (a.name || '').localeCompare(b.name || '');
      });

      // Calculate total VP and THB valuation (only counting premium skins)
      let totalVpValue = 0;
      const weaponBreakdown = {};
      const tierBreakdown = {
        ultra: 0,
        exclusive: 0,
        premium: 0,
        deluxe: 0,
        select: 0,
        standard: 0
      };

      let totalRadianiteNeeded = 0;
      for (const s of allOwnedSkins) {
        if (!s.isStandardDefault) {
          totalVpValue += (s.estimatedVpPrice || 0);
          totalRadianiteNeeded += (s.radianiteNeeded || 0);
        }

        const wp = s.weaponType || 'Other';
        if (!weaponBreakdown[wp]) {
          weaponBreakdown[wp] = { count: 0, totalVp: 0 };
        }
        weaponBreakdown[wp].count++;
        if (!s.isStandardDefault) {
          weaponBreakdown[wp].totalVp += (s.estimatedVpPrice || 0);
        }

        const tName = (s.contentTier?.name || s.tier?.name || '').toLowerCase();
        if (tName.includes('ultra')) tierBreakdown.ultra++;
        else if (tName.includes('exclusive')) tierBreakdown.exclusive++;
        else if (tName.includes('premium')) tierBreakdown.premium++;
        else if (tName.includes('deluxe')) tierBreakdown.deluxe++;
        else if (tName.includes('select')) tierBreakdown.select++;
        else tierBreakdown.standard++;
      }

      const estimatedThbOverTopup = Math.round(totalVpValue * 0.238);
      const estimatedThbRiotOfficial = Math.round(totalVpValue * 0.293);

      return {
        totalSkinsCount: premiumOwnedSkins.length > 0 ? premiumOwnedSkins.length : allOwnedSkins.length,
        premiumSkinsCount: premiumOwnedSkins.length,
        totalVpValue,
        totalRadianiteNeeded,
        estimatedThbOverTopup,
        estimatedThbRiotOfficial,
        weaponBreakdown,
        tierBreakdown,
        skins: allOwnedSkins,
        allSkinsCount: allOwnedSkins.length,
        activeShard
      };
    } catch (e) {
      console.error('[InventoryService] Inventory lookup failed:', e.message);
      if (e.code === 'TOKEN_EXPIRED') throw e;
      return {
        totalSkinsCount: 0,
        totalVpValue: 0,
        totalRadianiteNeeded: 0,
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

  /**
   * Fetch Player Battle Pass progression, current Tier, XP requirements, and upcoming rewards
   */
  async getPlayerBattlepass(puuid, region, accessToken, entitlementsToken, apiService) {
    try {
      // 1. Fetch user contracts
      const userContractsRes = await apiService.fetchWithShardFallback(
        puuid,
        region,
        '/contracts/v1/contracts/{puuid}',
        'GET',
        null,
        accessToken,
        entitlementsToken
      );

      const contracts = userContractsRes.data?.Contracts || [];
      const userContractMap = new Map();
      for (const c of contracts) {
        if (c.ContractDefinitionID) {
          userContractMap.set(c.ContractDefinitionID.toLowerCase(), c);
        }
      }

      // 2. Fetch or use cached Contracts metadata from valorant-api.com
      if (!this._contractsCache || Date.now() - (this._contractsCacheTime || 0) > 3600000) {
        try {
          const res = await fetch('https://valorant-api.com/v1/contracts?language=en-US');
          const json = await res.json();
          if (json.data) {
            this._contractsCache = json.data;
            this._contractsCacheTime = Date.now();
          }
        } catch (e) {
          console.warn('[InventoryService] Failed to fetch contracts definition:', e.message);
        }
      }

      const allDefs = this._contractsCache || [];

      // Find the active Battle Pass contract (usually modern Act contract with multiple chapters)
      // We look for definition that exists in user contracts with highest progression, or latest Season pass
      let activeBpDef = null;
      let userBpData = null;

      // Filter passes that have chapters (Act battlepasses)
      const actPasses = allDefs.filter(d => 
        (d.content?.relationType === 'Season' || d.displayName?.includes('Act') || d.displayName?.includes('Season')) &&
        Array.isArray(d.content?.chapters) && d.content.chapters.length >= 5
      );

      for (const pass of actPasses) {
        const u = userContractMap.get(pass.uuid.toLowerCase());
        if (u) {
          if (!activeBpDef || (u.ContractProgression?.TotalProgressionEarned || 0) > (userBpData?.ContractProgression?.TotalProgressionEarned || 0)) {
            activeBpDef = pass;
            userBpData = u;
          }
        }
      }

      // Fallback to latest definition if user hasn't earned XP yet
      if (!activeBpDef && actPasses.length > 0) {
        activeBpDef = actPasses[actPasses.length - 1];
        userBpData = userContractMap.get(activeBpDef.uuid.toLowerCase()) || {
          ProgressionLevelReached: 0,
          ProgressionTowardsNextLevel: 0,
          ContractProgression: { TotalProgressionEarned: 0, HighestReachedLevel: 0 }
        };
      }

      if (!activeBpDef) {
        return { ok: false, error: 'No active Battle Pass found' };
      }

      // Calculate levels and tiers
      const chapters = activeBpDef.content?.chapters || [];
      const totalTiers = 50; // standard 50 tiers + 5 epilogue
      const currentLevel = userBpData?.ProgressionLevelReached ?? userBpData?.ContractProgression?.HighestReachedLevel ?? 0;
      const xpIntoCurrentLevel = userBpData?.ProgressionTowardsNextLevel || 0;
      const totalXpEarned = userBpData?.ContractProgression?.TotalProgressionEarned || 0;

      // Calculate standard required XP formula for Tier: (tier * 750) + 1250 (or ~20,000 for high tiers)
      const xpForNextLevel = Math.min(30000, Math.max(2000, 2000 + (currentLevel * 750)));
      const levelProgressPercent = Math.min(100, Math.round((xpIntoCurrentLevel / xpForNextLevel) * 100));

      const tiersRemaining = Math.max(0, totalTiers - currentLevel);
      const approxXpRemaining = (tiersRemaining * 20000) - xpIntoCurrentLevel;
      // Competitive gives ~4000 XP average, Spike Rush ~1000 XP
      const approxCompMatches = Math.max(0, Math.ceil(approxXpRemaining / 4000));
      const approxSpikeMatches = Math.max(0, Math.ceil(approxXpRemaining / 1000));

      return {
        ok: true,
        displayName: activeBpDef.displayName || 'Current Act Battle Pass',
        displayIcon: activeBpDef.displayIcon,
        currentTier: currentLevel,
        maxTier: totalTiers,
        isCompleted: currentLevel >= totalTiers,
        xpIntoCurrentLevel,
        xpForNextLevel,
        levelProgressPercent,
        totalXpEarned,
        tiersRemaining,
        approxCompMatches,
        approxSpikeMatches
      };
    } catch (e) {
      console.error('[InventoryService] Battlepass lookup failed:', e.message);
      return { ok: false, error: e.message };
    }
  }
}

module.exports = new InventoryService();
