const config = require('../config');
const skinCatalog = require('./skinCatalog');
const storefrontService = require('./storefrontService');
const inventoryService = require('./inventoryService');
const matchHistoryService = require('./matchHistoryService');

/**
 * Valorant API Façade Service
 * Coordinates network transport across Riot regional shards and delegates
 * storefront, inventory, and match-history domain operations to specialized subservices.
 */
class ValorantApiService {
  constructor() {
    this.storefrontService = storefrontService;
    this.inventoryService = inventoryService;
    this.matchHistoryService = matchHistoryService;
  }

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
          if ((res.status === 400 && errBody.includes('BAD_CLAIMS')) || res.status === 401) {
            const err = new Error('TOKEN_EXPIRED: Access Token หมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
            err.code = 'TOKEN_EXPIRED';
            throw err;
          }
        }
      } catch (e) {
        if (e.code === 'TOKEN_EXPIRED') throw e;
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

  // --- Subservice Façade Delegations (Guarantees 100% Backwards Compatibility) ---

  async getStorefront(puuid, region, accessToken, entitlementsToken) {
    return this.storefrontService.getStorefront(puuid, region, accessToken, entitlementsToken, this);
  }

  async getPlayerInventory(puuid, region, accessToken, entitlementsToken) {
    return this.inventoryService.getPlayerInventory(puuid, region, accessToken, entitlementsToken, this);
  }

  async resolvePlayerNames(puuids, region, accessToken, entitlementsToken) {
    return this.matchHistoryService.resolvePlayerNames(puuids, region, accessToken, entitlementsToken, this);
  }

  async getMatchDetails(matchId, region, accessToken, entitlementsToken) {
    return this.matchHistoryService.getMatchDetails(matchId, region, accessToken, entitlementsToken, this);
  }

  async getMatchHistory(puuid, region, accessToken, entitlementsToken, limit = 10, queue = '') {
    return this.matchHistoryService.getMatchHistory(puuid, region, accessToken, entitlementsToken, this, limit, queue);
  }

  formatMatchData(puuid, raw, namesMap = new Map()) {
    return this.matchHistoryService.formatMatchData(puuid, raw, namesMap);
  }

  formatQueueName(queueId) {
    return this.matchHistoryService.formatQueueName(queueId);
  }
}

module.exports = new ValorantApiService();
