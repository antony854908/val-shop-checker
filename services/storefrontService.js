const config = require('../config');
const skinCatalog = require('./skinCatalog');

const DEFAULT_ITEM_TYPES = {
  SKIN: 'e7c63390-eda7-46e0-bb7a-a6abdacd2433',
  BUDDY: 'dd3bf334-87f3-40bd-b043-682a57a8dc3a',
  CARD: '3f296c07-64c3-494c-923b-fe692a4fa1bd',
  SPRAY: 'd5f120f8-ff8c-4aac-92ea-f2b5acbe9e47',
  TITLE: 'de7caa6b-adf7-4588-bbd1-143831e786c6'
};

/**
 * Valorant Storefront Service
 * Handles parsing and resolving daily store offers, featured bundles,
 * Night Market (bonus store), and accessory store offers.
 */
class StorefrontService {
  constructor() {
    this.cachedFeaturedBundles = null;
  }

  /**
   * Fetch and parse storefront data (Daily, Featured Bundles, Night Market, Accessories)
   */
  async getStorefront(puuid, region, accessToken, entitlementsToken, apiService) {
    let result;
    try {
      // Riot Storefront V3 Endpoint (POST with {})
      result = await apiService.fetchWithShardFallback(
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
      console.log('[StorefrontService] V3 Storefront failed, trying V2 fallback...');
      // Fallback to V2 if needed
      result = await apiService.fetchWithShardFallback(
        puuid,
        region,
        '/store/v2/storefront/{puuid}',
        'GET',
        null,
        accessToken,
        entitlementsToken
      );
    }

    const raw = result?.data || {};
    const activeShard = result?.activeShard || region || 'ap';
    const itemTypes = config.ITEM_TYPES || DEFAULT_ITEM_TYPES;

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
          itemRewardId = itemEntry.Offer?.Rewards?.[0]?.ItemID || 
                         itemEntry.Item?.ItemID || 
                         itemEntry.ItemID || 
                         itemEntry.OfferID ||
                         itemEntry.ID;
          itemTypeId = itemEntry.Item?.ItemTypeID || itemEntry.Offer?.Rewards?.[0]?.ItemTypeID;
        }

        if (!itemRewardId) continue;

        let basePrice = 0;
        let discountedPrice = 0;
        let discountPercent = 0;

        if (itemEntry.BasePrice !== undefined) {
          basePrice = itemEntry.BasePrice;
          discountedPrice = itemEntry.DiscountedPrice !== undefined ? itemEntry.DiscountedPrice : basePrice;
          discountPercent = itemEntry.DiscountPercent || 0;
        } else if (itemEntry.Offer?.Cost) {
          basePrice = itemEntry.Offer.Cost[config.CURRENCIES.VP] || Object.values(itemEntry.Offer.Cost)[0] || 0;
          discountedPrice = itemEntry.DiscountedCost ? (itemEntry.DiscountedCost[config.CURRENCIES.VP] || Object.values(itemEntry.DiscountedCost)[0] || basePrice) : basePrice;
          discountPercent = itemEntry.DiscountPercent || 0;
        }

        let itemMeta = skinCatalog.getItemById(itemRewardId);
        if (!itemMeta) {
          const skin = skinCatalog.getSkinById(itemRewardId);
          if (skin) {
            itemMeta = {
              uuid: skin.uuid,
              name: skin.name,
              itemType: 'skin',
              isWeaponSkin: true,
              displayIcon: skin.displayIcon,
              streamedVideo: skin.streamedVideo,
              contentTier: skin.contentTier
            };
          }
        }

        const displayName = itemMeta?.name || 'Bundle Exclusive Item';
        const isWeaponSkin = itemMeta?.isWeaponSkin ?? (
          (itemTypeId && itemTypeId.toLowerCase() === (itemTypes.SKIN || '').toLowerCase()) ||
          skinCatalog.getSkinById(itemRewardId) !== null
        );

        let itemType = itemMeta?.itemType || 'item';
        if (isWeaponSkin) {
          itemType = 'skin';
        } else if (itemTypeId) {
          const tid = itemTypeId.toLowerCase();
          if (tid === (itemTypes.BUDDY || '').toLowerCase()) itemType = 'buddy';
          else if (tid === (itemTypes.CARD || '').toLowerCase()) itemType = 'card';
          else if (tid === (itemTypes.SPRAY || '').toLowerCase()) itemType = 'spray';
          else if (tid === (itemTypes.TITLE || '').toLowerCase()) itemType = 'title';
        }

        let displayIcon = itemMeta?.displayIcon || null;
        if (!displayIcon) {
          const fallbackAcc = skinCatalog.getItemById(itemRewardId);
          displayIcon = fallbackAcc?.largeArt || fallbackAcc?.displayIcon || null;
        }

        if (!displayIcon) {
          continue;
        }

        bundleItems.push({
          uuid: itemRewardId,
          name: displayName,
          itemType: itemType,
          isWeaponSkin: isWeaponSkin,
          displayIcon: displayIcon,
          basePrice: basePrice,
          price: discountedPrice,
          discountPercent: discountPercent,
          contentTier: itemMeta?.contentTier || null
        });
      }

      // Deduplicate items by uuid
      const seenUuids = new Set();
      const uniqueItems = [];
      for (const itm of bundleItems) {
        if (!seenUuids.has(itm.uuid)) {
          seenUuids.add(itm.uuid);
          uniqueItems.push(itm);
        }
      }

      // Fallback if items were empty in Riot response
      if (uniqueItems.length === 0 && bundleMeta) {
        const catalogItems = skinCatalog.uniqueSkinsList || [];
        for (const cat of catalogItems) {
          if (cat.name && bundleMeta.name && 
              cat.name.toLowerCase().includes(bundleMeta.name.toLowerCase().replace('bundle', '').trim())) {
            uniqueItems.push({
              uuid: cat.uuid,
              name: cat.name,
              itemType: cat.itemType || 'skin',
              isWeaponSkin: cat.isWeaponSkin || true,
              displayIcon: cat.displayIcon,
              basePrice: cat.estimatedVpPrice || 1775,
              price: cat.estimatedVpPrice || 1775,
              discountPercent: 0,
              contentTier: cat.contentTier || null
            });
          }
        }
      }

      // Calculate total bundle price
      let totalBasePrice = b.TotalBaseCost ? (b.TotalBaseCost[config.CURRENCIES.VP] || Object.values(b.TotalBaseCost)[0] || 0) : 0;
      let bundlePrice = b.TotalDiscountedCost ? (b.TotalDiscountedCost[config.CURRENCIES.VP] || Object.values(b.TotalDiscountedCost)[0] || totalBasePrice) : totalBasePrice;

      if (!bundlePrice && uniqueItems.length > 0) {
        bundlePrice = uniqueItems.reduce((acc, it) => acc + (it.price || 0), 0);
      }
      if (!totalBasePrice) {
        totalBasePrice = uniqueItems.reduce((acc, it) => acc + (it.basePrice || it.price || 0), 0) || bundlePrice;
      }

      const bundleRemainingSeconds = b.RemainingDurationInSeconds || 
                                     raw.FeaturedBundle?.BundleRemainingDurationInSeconds || 
                                     0;

      featuredBundles.push({
        id: b.ID || b.DataAssetID,
        name: bundleMeta?.name || 'Featured Bundle',
        description: bundleMeta?.description || '',
        displayIcon: bundleMeta?.displayIcon || bundleMeta?.displayIcon2 || (uniqueItems[0]?.displayIcon) || null,
        price: bundlePrice,
        basePrice: totalBasePrice,
        remainingDurationInSeconds: bundleRemainingSeconds,
        items: uniqueItems
      });
    }

    // 3. Parse Night Market (BonusStore)
    let nightMarket = null;
    if (raw.BonusStore && raw.BonusStore.BonusStoreOffers) {
      const nmOffers = [];
      for (const offer of raw.BonusStore.BonusStoreOffers) {
        const reward = offer.Offer?.Rewards?.[0];
        const itemUuid = reward ? reward.ItemID : offer.Offer?.OfferID;
        const skin = skinCatalog.getSkinById(itemUuid) || skinCatalog.getItemById(itemUuid);

        const originalCost = offer.Offer?.Cost ? (offer.Offer.Cost[config.CURRENCIES.VP] || Object.values(offer.Offer.Cost)[0] || 0) : 0;
        const discountedCost = offer.DiscountCost ? (offer.DiscountCost[config.CURRENCIES.VP] || Object.values(offer.DiscountCost)[0] || originalCost) : originalCost;
        const discountPercent = offer.DiscountPercent || 0;

        if (skin) {
          nmOffers.push({
            ...skin,
            offerId: offer.BonusOfferID,
            originalPrice: originalCost,
            discountPrice: discountedCost,
            discountPercent,
            isPurchased: !!offer.IsPurchased
          });
        }
      }

      nightMarket = {
        remainingDurationInSeconds: raw.BonusStore.BonusStoreRemainingDurationInSeconds || 0,
        offers: nmOffers
      };
    }

    // 4. Parse Accessory Store
    let accessoryStore = null;
    if (raw.AccessoryStore && raw.AccessoryStore.AccessoryStoreOffers) {
      const accOffers = [];
      for (const offer of raw.AccessoryStore.AccessoryStoreOffers) {
        const reward = offer.Offer?.Rewards?.[0];
        const itemUuid = reward ? reward.ItemID : offer.Offer?.OfferID;
        const item = skinCatalog.getItemById(itemUuid);

        const costKc = offer.Offer?.Cost ? (offer.Offer.Cost[config.CURRENCIES.KC] || Object.values(offer.Offer.Cost)[0] || 0) : 0;

        accOffers.push({
          offerId: offer.Offer?.OfferID || itemUuid,
          uuid: itemUuid,
          name: item?.name || 'Accessory Item',
          itemType: item?.itemType || 'accessory',
          displayIcon: item?.displayIcon || null,
          costKc,
          contractId: offer.ContractID || null
        });
      }

      accessoryStore = {
        remainingDurationInSeconds: raw.AccessoryStore.AccessoryStoreRemainingDurationInSeconds || 0,
        offers: accOffers
      };
    }

    if (featuredBundles && featuredBundles.length > 0) {
      this.cachedFeaturedBundles = featuredBundles;
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

  /**
   * Return live cached featured bundles, or fallback to catalog bundle preview for guests
   */
  getCachedFeaturedBundles() {
    if (this.cachedFeaturedBundles && this.cachedFeaturedBundles.length > 0) {
      return this.cachedFeaturedBundles;
    }

    try {
      const candidateBundleIds = [
        'ed453815-44aa-4c4d-f3aa-77b4bcf048d7', // RGX 11z Pro
        '2270b116-4255-8a14-4486-db9de4979b89', // Arcane
        'ab83f73d-485f-e010-8ea0-24b538468a1a'  // Protocol 781-A
      ];

      for (const bid of candidateBundleIds) {
        const meta = skinCatalog.getBundleById(bid);
        if (!meta) continue;

        const cleanName = (meta.name || '').replace(/bundle/i, '').trim().toLowerCase();
        const catalogItems = skinCatalog.uniqueSkinsList || [];
        const matchingSkins = catalogItems.filter(s => 
          s.name && s.name.toLowerCase().includes(cleanName)
        ).slice(0, 5);

        if (matchingSkins.length >= 2) {
          const items = matchingSkins.map(s => ({
            uuid: s.uuid,
            name: s.name,
            itemType: 'skin',
            isWeaponSkin: true,
            displayIcon: s.displayIcon,
            basePrice: s.estimatedVpPrice || 2175,
            price: s.estimatedVpPrice || 2175,
            discountPercent: 0,
            contentTier: s.contentTier || null
          }));
          const totalPrice = items.reduce((acc, it) => acc + (it.price || 0), 0);
          return [{
            id: meta.uuid,
            name: meta.name,
            subName: 'Exclusive Valorant Collection',
            description: meta.description || 'Featured Collection',
            displayIcon: meta.displayIcon || meta.verticalPromoImage,
            price: totalPrice,
            basePrice: totalPrice,
            remainingDurationInSeconds: 86400 * 5 + 43200,
            items
          }];
        }
      }
    } catch (e) {
      console.warn('[StorefrontService] Fallback preview bundle error:', e.message);
    }

    return [];
  }
}

module.exports = new StorefrontService();
