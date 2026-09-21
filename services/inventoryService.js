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

      for (const s of allOwnedSkins) {
        if (!s.isStandardDefault) {
          totalVpValue += (s.estimatedVpPrice || 0);
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
}

module.exports = new InventoryService();
