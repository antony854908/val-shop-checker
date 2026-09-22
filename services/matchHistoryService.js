const skinCatalog = require('./skinCatalog');

/**
 * Valorant Match History Service
 * Handles match detail caching, player name resolution, round-by-round timeline,
 * combat metrics (damage, headshot %, first bloods), and presentation formatting.
 */
class MatchHistoryService {
  constructor() {
    this.playerNameCache = new Map();
    this.matchCache = new Map();
  }

  // Batch Resolve In-Game Player Names and TagLines using Riot Name Service
  async resolvePlayerNames(puuids, region, accessToken, entitlementsToken, apiService) {
    if (!puuids || puuids.length === 0) return new Map();

    const resultMap = new Map();
    const missingPuuids = [];

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
      const headers = apiService.getHeaders(accessToken, entitlementsToken, true);

      for (const shard of candidateShards) {
        const host = apiService.getPvpHost(shard);
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
  async getMatchDetails(matchId, region, accessToken, entitlementsToken, apiService) {
    if (this.matchCache.has(matchId)) {
      return this.matchCache.get(matchId);
    }

    const host = apiService.getPvpHost(region);
    const headers = apiService.getHeaders(accessToken, entitlementsToken);
    const res = await fetch(`https://${host}/match-details/v1/matches/${matchId}`, {
      headers
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Failed to fetch match details (Status: ${res.status}): ${errText}`);
    }

    const matchData = await res.json();
    this.matchCache.set(matchId, matchData);

    // Keep cache at max 100 matches to prevent memory bloat
    if (this.matchCache.size > 100) {
      const firstKey = this.matchCache.keys().next().value;
      this.matchCache.delete(firstKey);
    }

    return matchData;
  }

  // Fetch Match History List with Formatted Details
  async getMatchHistory(puuid, region, accessToken, entitlementsToken, apiService, limit = 10, queue = '', myGameName = '', myTagLine = '') {
    try {
      const queueParam = queue ? `&queue=${encodeURIComponent(queue)}` : '';
      const result = await apiService.fetchWithShardFallback(
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
          return await this.getMatchDetails(entry.MatchID, result.activeShard || region, accessToken, entitlementsToken, apiService);
        } catch (err) {
          console.error(`[MatchHistoryService] Error fetching match ${entry.MatchID}:`, err.message);
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
        entitlementsToken,
        apiService
      );

      // Format all matches with real player names
      const formattedMatches = rawMatches
        .map(raw => this.formatMatchData(puuid, raw, namesMap, myGameName, myTagLine))
        .filter(Boolean);

      return {
        total: historyData.Total || formattedMatches.length,
        matches: formattedMatches
      };
    } catch (e) {
      console.error('[MatchHistoryService] Match history lookup failed:', e.message);
      if (e.code === 'TOKEN_EXPIRED') throw e;
      return { total: 0, matches: [] };
    }
  }

  // Helper: Format raw match into rich presentation data
  formatMatchData(puuid, raw, namesMap = new Map(), myGameName = '', myTagLine = '') {
    const matchInfo = raw.matchInfo || {};
    const players = raw.players || [];
    const teams = raw.teams || [];
    const roundResults = raw.roundResults || [];

    if (puuid && myGameName) {
      namesMap.set(puuid.toLowerCase(), { gameName: myGameName, tagLine: myTagLine || 'VAL' });
    }

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

          // Track economy spend
          if (ps.economy && typeof ps.economy.spent === 'number') {
            pMetric.totalSpent += ps.economy.spent;
          }

          // Track weapon and damage events
          if (ps.damage) {
            for (const dmg of ps.damage) {
              pMetric.totalDamage += (dmg.damage || 0);
              pMetric.headshots += (dmg.headshots || 0);
              pMetric.bodyshots += (dmg.bodyshots || 0);
              pMetric.legshots += (dmg.legshots || 0);
            }
          }

          // Track kills
          if (ps.kills) {
            for (const k of ps.kills) {
              const victimSub = k.victim?.toLowerCase();
              const killerName = namesMap.get(pSub) ? `${namesMap.get(pSub).gameName}#${namesMap.get(pSub).tagLine}` : 'Agent';
              const victimName = namesMap.get(victimSub) ? `${namesMap.get(victimSub).gameName}#${namesMap.get(victimSub).tagLine}` : 'Agent';

              let weaponName = 'Ability / Melee';
              let weaponIcon = null;
              if (k.finishingDamage && k.finishingDamage.damageItem) {
                const wp = skinCatalog.getWeapon(k.finishingDamage.damageItem);
                if (wp) {
                  weaponName = wp.name;
                  weaponIcon = wp.displayIcon;
                  pMetric.weaponUsage.set(weaponName, (pMetric.weaponUsage.get(weaponName) || 0) + 1);
                }
              }

              roundKills.push({
                timeSinceRoundStartMillis: k.timeSinceRoundStartMillis || 0,
                killerPuuid: ps.subject,
                killerName,
                victimPuuid: k.victim,
                victimName,
                weaponName,
                weaponIcon,
                victimLocation: k.victimLocation || null,
                playerLocations: Array.isArray(k.playerLocations) ? k.playerLocations.map(pl => ({
                  puuid: pl.subject || pl.puuid,
                  viewRadians: typeof pl.viewRadians === 'number' ? pl.viewRadians : 0,
                  location: pl.location || null
                })) : [],
                finishingDamage: k.finishingDamage ? {
                  damageType: k.finishingDamage.damageType,
                  damageItem: k.finishingDamage.damageItem,
                  isSecondaryFireMode: !!k.finishingDamage.isSecondaryFireMode
                } : null
              });
            }
          }

          // Loadout for timeline
          if (ps.economy) {
            const resolved = namesMap.get(pSub);
            roundPlayerLoadouts.push({
              puuid: ps.subject,
              name: resolved ? `${resolved.gameName}#${resolved.tagLine}` : 'Agent',
              loadoutValue: ps.economy.loadoutValue || 0,
              spent: ps.economy.spent || 0,
              remaining: ps.economy.remaining || 0,
              weapon: ps.economy.weapon ? (skinCatalog.getWeapon(ps.economy.weapon)?.name || 'Sidearm') : 'Sidearm',
              armor: ps.economy.armor ? (skinCatalog.getItemById(ps.economy.armor)?.name || 'Shield') : 'None'
            });
          }
        }
      }

      // Sort kills by timestamp ascending
      roundKills.sort((a, b) => a.timeSinceRoundStartMillis - b.timeSinceRoundStartMillis);

      // Attribute First Blood & First Death
      if (roundKills.length > 0) {
        const fb = roundKills[0];
        if (fb.killerPuuid) {
          const km = initPlayerMetrics(fb.killerPuuid.toLowerCase());
          km.firstBloods++;
        }
        if (fb.victimPuuid) {
          const vm = initPlayerMetrics(fb.victimPuuid.toLowerCase());
          vm.firstDeaths++;
        }
      }

      // Track Multi-kills per round (Double, Triple, Quad, Ace)
      const killsByPlayerThisRound = new Map();
      for (const k of roundKills) {
        if (k.killerPuuid) {
          const kp = k.killerPuuid.toLowerCase();
          killsByPlayerThisRound.set(kp, (killsByPlayerThisRound.get(kp) || 0) + 1);
        }
      }
      for (const [pSub, count] of killsByPlayerThisRound.entries()) {
        const m = initPlayerMetrics(pSub);
        if (count === 2) m.doubleKills++;
        else if (count === 3) m.tripleKills++;
        else if (count === 4) m.quadraKills++;
        else if (count >= 5) m.aces++;
      }

      formattedRounds.push({
        roundNum,
        winningTeam,
        isMyTeamWon,
        winType,
        winTypeTh,
        ceremony,
        ceremonyTh,
        planterName,
        bombPlanter: r.bombPlanter || null,
        defuserName,
        bombDefuser: r.bombDefuser || null,
        plantRoundTime: r.plantRoundTime || 0,
        plantLocation: r.plantLocation || null,
        plantSite: r.plantSite || null,
        defuseRoundTime: r.defuseRoundTime || 0,
        defuseLocation: r.defuseLocation || null,
        roundResultCode: r.roundResultCode || null,
        kills: roundKills,
        loadouts: roundPlayerLoadouts
      });
    });

    // Scoreboard teams
    let myTeamScore = 0;
    let enemyTeamScore = 0;
    let outcome = 'Draw';

    if (isDeathmatch) {
      outcome = 'Completed';
    } else {
      const myTeam = teams.find(t => t.teamId === myTeamId);
      const enemyTeam = teams.find(t => t.teamId !== myTeamId);

      myTeamScore = myTeam?.roundsWon ?? 0;
      enemyTeamScore = enemyTeam?.roundsWon ?? 0;

      if (myTeam?.won) {
        outcome = 'Victory';
      } else if (enemyTeam?.won) {
        outcome = 'Defeat';
      } else if (myTeamScore > enemyTeamScore) {
        outcome = 'Victory';
      } else if (myTeamScore < enemyTeamScore) {
        outcome = 'Defeat';
      } else {
        outcome = 'Draw';
      }
    }

    // Process player statistics
    const roundsPlayed = Math.max(roundResults.length, 1);
    const myStatsRaw = me.stats || {};
    const kills = myStatsRaw.kills || 0;
    const deaths = myStatsRaw.deaths || 0;
    const assists = myStatsRaw.assists || 0;
    const score = myStatsRaw.score || 0;
    const acs = Math.round(score / roundsPlayed);
    const kd = deaths > 0 ? parseFloat((kills / deaths).toFixed(2)) : kills;
    const kda = deaths > 0 ? parseFloat(((kills + assists) / deaths).toFixed(2)) : (kills + assists);

    const myAgent = skinCatalog.getAgent(me.characterId);
    const myRank = skinCatalog.getRank(me.competitiveTier);
    const myMetric = playerMetrics.get(puuid.toLowerCase()) || {};

    const totalShots = (myMetric.headshots || 0) + (myMetric.bodyshots || 0) + (myMetric.legshots || 0);
    const myHsPercent = totalShots > 0 ? Math.round(((myMetric.headshots || 0) / totalShots) * 100) : 0;
    const myAdr = Math.round((myMetric.totalDamage || 0) / roundsPlayed);
    const myEcon = (myMetric.totalSpent || 0) > 0 ? Math.round(((myMetric.totalDamage || 0) / (myMetric.totalSpent || 1)) * 1000) : 0;

    // Build all players scoreboard list
    const allPlayers = players.map(p => {
      const pSub = p.subject?.toLowerCase();
      const st = p.stats || {};
      const ag = skinCatalog.getAgent(p.characterId);
      const rk = skinCatalog.getRank(p.competitiveTier);
      const m = playerMetrics.get(pSub) || {};

      const pKills = st.kills || 0;
      const pDeaths = st.deaths || 0;
      const pAssists = st.assists || 0;
      const pScore = st.score || 0;
      const pAcs = Math.round(pScore / roundsPlayed);
      const pKd = pDeaths > 0 ? parseFloat((pKills / pDeaths).toFixed(2)) : pKills;

      const pShots = (m.headshots || 0) + (m.bodyshots || 0) + (m.legshots || 0);
      const hsPercent = pShots > 0 ? Math.round(((m.headshots || 0) / pShots) * 100) : 0;
      const adr = Math.round((m.totalDamage || 0) / roundsPlayed);
      const econRating = (m.totalSpent || 0) > 0 ? Math.round(((m.totalDamage || 0) / (m.totalSpent || 1)) * 1000) : 0;

      const resolved = namesMap.get(pSub);
      const realGameName = resolved ? resolved.gameName : (p.gameName || 'Agent');
      const realTagLine = resolved ? resolved.tagLine : (p.tagLine || 'VAL');

      // Top weapon
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

module.exports = new MatchHistoryService();
