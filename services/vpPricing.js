/**
 * VP Pricing & Top-Up Store Comparison Service - OverTopup vs Riot Official
 * Real packages directly synced from https://www.overtopup.com/th/game-topup/valorant
 */

const STORES = {
  overtopup: {
    id: 'overtopup',
    name: 'Over Topup (เติมผ่าน UID)',
    shortName: 'Over Topup',
    badge: 'เรทคุ้มสุด (~18-25% OFF)',
    trustLevel: 'ร้านค้าจดทะเบียนทางการ OverTopup',
    type: 'partner',
    accentColor: '#00F5D4',
    logoIcon: "",
    webUrl: 'https://www.overtopup.com/th/game-topup/valorant',
    paymentMethods: ['PromptPay QR', 'โอนผ่านธนาคาร', 'TrueMoney'],
    description: 'เติมเกม Valorant สะดวก รวดเร็ว เพียงกรอก Riot ID ไทย รับ VP อัตโนมัติในเกม',
    packages: [
      { vp: 475, price: 123, bonusVp: 0, tag: '475 VP' },
      { vp: 1000, price: 246, bonusVp: 0, tag: '1,000 VP' },
      { vp: 1475, price: 368, bonusVp: 0, tag: '1,475 VP' },
      { vp: 2050, price: 489, bonusVp: 0, tag: '2,050 VP' },
      { vp: 2525, price: 616, bonusVp: 0, tag: '2,525 VP' },
      { vp: 3050, price: 737, bonusVp: 0, tag: '3,050 VP' },
      { vp: 3650, price: 866, bonusVp: 0, tag: '3,650 VP' },
      { vp: 4100, price: 977, bonusVp: 0, tag: '4,100 VP' },
      { vp: 4125, price: 991, bonusVp: 0, tag: '4,125 VP' },
      { vp: 4650, price: 1112, bonusVp: 0, tag: '4,650 VP' },
      { vp: 5350, price: 1241, bonusVp: 0, tag: '5,350 VP' },
      { vp: 5825, price: 1361, bonusVp: 0, tag: '5,825 VP' },
      { vp: 6350, price: 1487, bonusVp: 0, tag: '6,350 VP' },
      { vp: 6825, price: 1607, bonusVp: 0, tag: '6,825 VP' },
      { vp: 7150, price: 1709, bonusVp: 0, tag: '7,150 VP' },
      { vp: 7400, price: 1732, bonusVp: 0, tag: '7,400 VP' },
      { vp: 7875, price: 1852, bonusVp: 0, tag: '7,875 VP' },
      { vp: 8200, price: 1959, bonusVp: 0, tag: '8,200 VP' },
      { vp: 8400, price: 1978, bonusVp: 0, tag: '8,400 VP' },
      { vp: 8750, price: 2089, bonusVp: 0, tag: '8,750 VP' },
      { vp: 9000, price: 2107, bonusVp: 0, tag: '9,000 VP' },
      { vp: 9800, price: 2334, bonusVp: 0, tag: '9,800 VP' },
      { vp: 11000, price: 2482, bonusVp: 0, tag: '11,000 VP' },
      { vp: 12000, price: 2733, bonusVp: 0, tag: '12,000 VP' },
      { vp: 13050, price: 2978, bonusVp: 0, tag: '13,050 VP' },
      { vp: 14650, price: 3353, bonusVp: 0, tag: '14,650 VP' },
      { vp: 16350, price: 3733, bonusVp: 0, tag: '16,350 VP' },
      { vp: 22000, price: 4964, bonusVp: 0, tag: '22,000 VP' }
    ]
  },
  riot_official: {
    id: 'riot_official',
    name: 'Riot Games In-Game Direct (ทางการในเกม)',
    shortName: 'Riot ทางการ (In-Game)',
    badge: 'ราคาปกติของเกม',
    trustLevel: 'Direct Riot In-Game Client',
    type: 'official',
    accentColor: '#FF4655',
    logoIcon: "",
    webUrl: 'https://playvalorant.com',
    paymentMethods: ['PromptPay QR', 'TrueMoney Wallet', 'บัตรเครดิต/เดบิต', 'AIS / Dtac / True'],
    description: 'เติมตรงผ่านหน้าร้านค้าในเกม VALORANT เรทมาตรฐานสากลของ Riot Games',
    packages: [
      { vp: 500, price: 150, bonusVp: 0, tag: '500 VP' },
      { vp: 1000, price: 300, bonusVp: 0, tag: '1,000 VP' },
      { vp: 2050, price: 600, bonusVp: 50, tag: '2,050 VP' },
      { vp: 3650, price: 1000, bonusVp: 350, tag: '3,650 VP' },
      { vp: 5600, price: 1500, bonusVp: 600, tag: '5,600 VP' },
      { vp: 11500, price: 3000, bonusVp: 1500, tag: '11,500 VP' }
    ]
  }
};

/**
 * Solve optimal package combination using Exact DP
 */
function solveOptimalCombination(targetVp, packages) {
  if (targetVp <= 0) {
    return {
      totalPrice: 0,
      totalVp: 0,
      leftoverVp: 0,
      combination: []
    };
  }

  // Check if there is an exact package matching or single package that fits
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

/**
 * Compare OverTopup with Riot Official for target VP and wallet
 */
function compareAllStores(targetVp, currentWalletVp = 0, deductWallet = true) {
  const neededVp = deductWallet ? Math.max(0, targetVp - currentWalletVp) : targetVp;

  const officialResult = solveOptimalCombination(neededVp, STORES.riot_official.packages);
  const officialPrice = officialResult.totalPrice;

  const storeResults = [];

  for (const [storeId, store] of Object.entries(STORES)) {
    const solution = solveOptimalCombination(neededVp, store.packages);
    const savingsThb = Math.max(0, officialPrice - solution.totalPrice);
    const savingsPct = officialPrice > 0 ? ((savingsThb / officialPrice) * 100).toFixed(1) : '0.0';
    const ratePerVp = solution.totalVp > 0 ? (solution.totalPrice / solution.totalVp).toFixed(4) : '0.3000';
    const ratePer100Vp = solution.totalVp > 0 ? ((solution.totalPrice / solution.totalVp) * 100).toFixed(2) : '30.00';

    storeResults.push({
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
      totalPrice: solution.totalPrice,
      totalVp: solution.totalVp,
      leftoverVp: solution.leftoverVp,
      combination: solution.combination,
      ratePerVp: parseFloat(ratePerVp),
      ratePer100Vp: parseFloat(ratePer100Vp),
      savingsThb,
      savingsPct: parseFloat(savingsPct)
    });
  }

  // Sort cheapest first
  storeResults.sort((a, b) => {
    if (a.totalPrice !== b.totalPrice) return a.totalPrice - b.totalPrice;
    return b.totalVp - a.totalVp;
  });

  storeResults.forEach((res, index) => {
    res.rank = index + 1;
    if (res.storeId === 'overtopup') {
      res.isCheapest = true;
      res.rankTitle = "Over Topup (ประหยัดที่สุด)";
    } else {
      res.rankTitle = "Riot Games Official (ราคามาตรฐานในเกม)";
    }
  });

  const overtopupResult = storeResults.find(s => s.storeId === 'overtopup') || storeResults[0];
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
    stores: storeResults,
    timestamp: Date.now()
  };
}

/**
 * Get full OverTopup price comparison matrix
 */
function getPriceMatrix() {
  const overPackages = STORES.overtopup.packages;
  const matrix = [];

  for (const pkg of overPackages) {
    const officialSol = solveOptimalCombination(pkg.vp, STORES.riot_official.packages);
    const savings = Math.max(0, officialSol.totalPrice - pkg.price);
    const savingsPct = officialSol.totalPrice > 0 ? ((savings / officialSol.totalPrice) * 100).toFixed(1) : '0.0';
    const ratePer100 = ((pkg.price / pkg.vp) * 100).toFixed(2);

    matrix.push({
      vp: pkg.vp,
      overtopupPrice: pkg.price,
      officialPrice: officialSol.totalPrice,
      savingsThb: savings,
      savingsPct: parseFloat(savingsPct),
      ratePer100: parseFloat(ratePer100)
    });
  }

  return matrix;
}

/**
 * Fetch and sync live packages from https://www.overtopup.com/th/game-topup/valorant
 */
async function syncLivePackages() {
  try {
    const res = await fetch('https://www.overtopup.com/th/game-topup/valorant', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return false;
    const html = await res.text();
    const regex = /<input[^>]*data-price="([^"]+)"[^>]*>[\s\S]*?<div class="title">([^<]+)<\/div>[\s\S]*?<div class="h5[^>]*>฿?([^<]+)<\/div>/g;
    const pkgs = [];
    let m;
    while ((m = regex.exec(html)) !== null) {
      const rawVp = m[2].replace(/[^\d]/g, '');
      const vp = parseInt(rawVp, 10);
      const price = parseFloat(m[1].replace(/,/g, ''));
      if (vp && price) {
        pkgs.push({
          vp,
          price,
          bonusVp: 0,
          tag: m[2].trim()
        });
      }
    }
    if (pkgs.length > 0) {
      pkgs.sort((a, b) => a.vp - b.vp);
      STORES.overtopup.packages = pkgs;
      STORES.overtopup.lastSynced = Date.now();
      console.log(`[VpPricing] Synced ${pkgs.length} live packages from overtopup.com`);
      return true;
    }
  } catch (err) {
    console.warn('[VpPricing] Live sync warning (using built-in 28 packages):', err.message);
  }
  return false;
}

// Initial live sync
syncLivePackages().catch(() => {});

module.exports = {
  STORES,
  solveOptimalCombination,
  compareAllStores,
  getPriceMatrix,
  syncLivePackages
};
