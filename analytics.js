window.analytics = {
  uniqueValues(data, key) {
    return [...new Set(data.map(item => item[key]).filter(v => v != null))];
  },

  enrichData(data) {
    return data.map(item => ({
      ...item,
      openingRank: Number(item.openingRank) || 0,
      closingRank: Number(item.closingRank) || 0,
      rankGap: (Number(item.closingRank) || 0) - (Number(item.openingRank) || 0)
    }));
  },

  sortEntries(obj, limit = null, desc = true) {
    const entries = Object.entries(obj).sort((a, b) => desc ? b[1] - a[1] : a[1] - b[1]);
    return limit ? entries.slice(0, limit) : entries;
  },

  sortData(data, field, order) {
    const sorted = [...data].sort((a, b) => {
      const x = a[field] ?? 0;
      const y = b[field] ?? 0;
      if (typeof x === "string" && typeof y === "string") return x.localeCompare(y);
      return x - y;
    });
    return order === "desc" ? sorted.reverse() : sorted;
  },

  averageClosingRank(data) {
    const valid = data.filter(i => i.closingRank > 0);
    if (!valid.length) return null;
    return Math.round(valid.reduce((s, i) => s + i.closingRank, 0) / valid.length);
  },

  averageOpeningRank(data) {
    const valid = data.filter(i => i.openingRank > 0);
    if (!valid.length) return null;
    return Math.round(valid.reduce((s, i) => s + i.openingRank, 0) / valid.length);
  },

  // Helper: get only the last round of data (final allotment picture per year)
  lastRoundData(data) {
    const rounds = this.uniqueValues(data, "round").sort((a, b) => a - b);
    const lastRound = rounds.length ? rounds[rounds.length - 1] : null;
    if (!lastRound) return data;
    return data.filter(i => i.round === lastRound);
  },

  // ===== PARENT-FOCUSED INSIGHT FUNCTIONS =====

  // Q1: Should we wait for later rounds?
  roundWaitingAdvantage(data) {
    const rounds = this.uniqueValues(data, "round").sort((a, b) => a - b);
    if (rounds.length < 2) return null;
    const firstRound = rounds[0];
    const lastRound = rounds[rounds.length - 1];

    const r1 = data.filter(i => i.round === firstRound && i.closingRank > 0);
    const rLast = data.filter(i => i.round === lastRound && i.closingRank > 0);
    if (!r1.length || !rLast.length) return null;

    const avgR1 = Math.round(r1.reduce((s, i) => s + i.closingRank, 0) / r1.length);
    const avgLast = Math.round(rLast.reduce((s, i) => s + i.closingRank, 0) / rLast.length);

    return {
      firstRound, lastRound, avgR1, avgLast,
      improvement: avgLast - avgR1,
      percentBetter: avgR1 > 0 ? ((avgLast - avgR1) / avgR1 * 100).toFixed(1) : "0"
    };
  },

  // Q2: Which branches are rising in demand? (closing rank getting LOWER = harder)
  risingBranches(data) {
    const last = this.lastRoundData(data).filter(i => i.closingRank > 0);
    const map = {};
    last.forEach(item => {
      if (!map[item.branch]) map[item.branch] = {};
      if (!map[item.branch][item.year]) map[item.branch][item.year] = [];
      map[item.branch][item.year].push(item.closingRank);
    });

    const result = [];
    Object.keys(map).forEach(branch => {
      const years = Object.keys(map[branch]).map(Number).sort((a, b) => a - b);
      if (years.length >= 2) {
        const firstAvg = Math.round(map[branch][years[0]].reduce((a, b) => a + b, 0) / map[branch][years[0]].length);
        const lastAvg = Math.round(map[branch][years[years.length - 1]].reduce((a, b) => a + b, 0) / map[branch][years[years.length - 1]].length);
        result.push({ branch, firstYear: years[0], lastYear: years[years.length - 1], firstAvg, lastAvg, delta: lastAvg - firstAvg });
      }
    });
    // Negative delta = rank dropped = MORE popular
    return result.sort((a, b) => a.delta - b.delta);
  },

  // Q4: Old IITs vs New IITs
  oldVsNewIITs(data) {
    const oldCities = ["Bombay", "Delhi", "Madras", "Kanpur", "Kharagpur", "Roorkee", "Guwahati"];
    const valid = data.filter(i => i.closingRank > 0);
    const oldFiltered = valid.filter(i => oldCities.some(c => i.iit.includes(c)));
    const newFiltered = valid.filter(i => !oldCities.some(c => i.iit.includes(c)));

    if (!oldFiltered.length || !newFiltered.length) return null;

    const avgOld = Math.round(oldFiltered.reduce((s, i) => s + i.closingRank, 0) / oldFiltered.length);
    const avgNew = Math.round(newFiltered.reduce((s, i) => s + i.closingRank, 0) / newFiltered.length);

    return { avgOld, avgNew, gap: avgNew - avgOld };
  },

  // Q5: CSE at new IIT vs Core at old IIT
  cseVsOtherBranch(data) {
    const valid = data.filter(i => i.closingRank > 0);
    const oldCities = ["Bombay", "Delhi", "Madras", "Kanpur", "Kharagpur"];

    const cseNewIIT = valid.filter(i =>
      i.branch.toLowerCase().includes("computer science") &&
      !oldCities.some(c => i.iit.includes(c))
    ).sort((a, b) => b.closingRank - a.closingRank);

    const mechOldIIT = valid.filter(i =>
      (i.branch.toLowerCase().includes("mechanical") || i.branch.toLowerCase().includes("civil")) &&
      oldCities.some(c => i.iit.includes(c))
    ).sort((a, b) => a.closingRank - b.closingRank);

    return {
      easiestCSE: cseNewIIT.length ? cseNewIIT[0] : null,
      toughestCore: mechOldIIT.length ? mechOldIIT[0] : null
    };
  },

  // Q6: How reliable are cutoffs year to year?
  cutoffStability(data) {
    const last = this.lastRoundData(data).filter(i => i.closingRank > 0);
    const map = {};
    last.forEach(item => {
      const key = `${item.iit}|||${item.branch}`;
      if (!map[key]) map[key] = {};
      map[key][item.year] = item.closingRank;
    });

    let stableCount = 0;
    let volatileCount = 0;
    const volatile = [];

    Object.entries(map).forEach(([key, yearMap]) => {
      const years = Object.keys(yearMap).map(Number).sort((a, b) => a - b);
      if (years.length >= 2) {
        const ranks = years.map(y => yearMap[y]);
        const avg = ranks.reduce((a, b) => a + b, 0) / ranks.length;
        if (avg === 0) return;
        const maxDev = Math.max(...ranks.map(r => Math.abs(r - avg)));
        const devPercent = (maxDev / avg) * 100;

        if (devPercent < 20) stableCount++;
        else {
          volatileCount++;
          const [iit, branch] = key.split("|||");
          volatile.push({ iit, branch, deviation: Math.round(devPercent) });
        }
      }
    });

    const total = stableCount + volatileCount;
    if (total === 0) return null;

    volatile.sort((a, b) => b.deviation - a.deviation);
    return { stableCount, volatileCount, stablePercent: Math.round(stableCount / total * 100), topVolatile: volatile.slice(0, 3) };
  },

  // Q7: Which IITs are rising fastest in reputation?
  fastestRisingIITs(data) {
    const last = this.lastRoundData(data).filter(i => i.closingRank > 0);
    const map = {};
    last.forEach(item => {
      if (!map[item.iit]) map[item.iit] = {};
      if (!map[item.iit][item.year]) map[item.iit][item.year] = [];
      map[item.iit][item.year].push(item.closingRank);
    });

    const result = [];
    Object.keys(map).forEach(iit => {
      const years = Object.keys(map[iit]).map(Number).sort((a, b) => a - b);
      if (years.length >= 2) {
        const firstAvg = Math.round(map[iit][years[0]].reduce((a, b) => a + b, 0) / map[iit][years[0]].length);
        const lastAvg = Math.round(map[iit][years[years.length - 1]].reduce((a, b) => a + b, 0) / map[iit][years[years.length - 1]].length);
        result.push({ iit, firstYear: years[0], lastYear: years[years.length - 1], firstAvg, lastAvg, delta: lastAvg - firstAvg });
      }
    });
    return result.sort((a, b) => a.delta - b.delta);
  },

  // Q8: How many options at different rank levels?
  safeOptionsAtRankBrackets(data) {
    // Use all data, not just latest year — gives a better picture
    const valid = data.filter(i => i.closingRank > 0);

    const brackets = [
      { label: "Under 1000", min: 0, max: 1000 },
      { label: "1000-5000", min: 1000, max: 5000 },
      { label: "5000-10000", min: 5000, max: 10000 },
      { label: "10000+", min: 10000, max: 999999 }
    ];

    return brackets.map(b => {
      const matching = valid.filter(i => i.closingRank >= b.min && i.closingRank < b.max);
      // Deduplicate by IIT+branch for unique program count
      const uniqueProgs = new Set(matching.map(i => `${i.iit}|||${i.branch}`));
      const sample = matching.sort((a, b2) => a.closingRank - b2.closingRank).slice(0, 2);
      return { ...b, count: uniqueProgs.size, sample };
    });
  },

  // Programs offered by IIT
  programsOfferedByIIT(data) {
    const map = {};
    data.forEach(item => {
      if (!map[item.iit]) map[item.iit] = new Set();
      map[item.iit].add(item.branch);
    });
    const result = {};
    Object.keys(map).forEach(key => result[key] = map[key].size);
    return result;
  },

  // Top competitive programs — use ALL data, just sort by lowest closing rank
  mostCompetitive(data, limit = 5) {
    return [...data]
      .filter(i => i.closingRank > 0)
      .sort((a, b) => a.closingRank - b.closingRank)
      .slice(0, limit);
  },

  // Most accessible — highest closing ranks
  leastCompetitive(data, limit = 5) {
    return [...data]
      .filter(i => i.closingRank > 0)
      .sort((a, b) => b.closingRank - a.closingRank)
      .slice(0, limit);
  },

  // Competitiveness trend by year (for line chart)
  competitivenessTrendByYear(data) {
    const last = this.lastRoundData(data).filter(i => i.closingRank > 0);
    const map = {};
    last.forEach(item => {
      if (!map[item.year]) map[item.year] = { sum: 0, count: 0 };
      map[item.year].sum += item.closingRank;
      map[item.year].count += 1;
    });
    return Object.keys(map).map(Number).sort((a, b) => a - b)
      .map(year => [year, Math.round(map[year].sum / map[year].count)]);
  },

  // Branch coverage across IITs
  branchCoverageAcrossIITs(data) {
    const map = {};
    data.forEach(item => {
      if (!map[item.branch]) map[item.branch] = new Set();
      map[item.branch].add(item.iit);
    });
    const result = {};
    Object.keys(map).forEach(key => result[key] = map[key].size);
    return result;
  },

  // Avg closing rank by branch (for charts)
  averageClosingRankByBranch(data) {
    const valid = data.filter(i => i.closingRank > 0);
    const map = {};
    valid.forEach(item => {
      if (!map[item.branch]) map[item.branch] = { sum: 0, count: 0 };
      map[item.branch].sum += item.closingRank;
      map[item.branch].count += 1;
    });
    const result = {};
    Object.keys(map).forEach(key => result[key] = Math.round(map[key].sum / map[key].count));
    return result;
  },

  // Outliers (biggest rank gaps)
  outliers(data) {
    return [...data].filter(i => i.rankGap > 0).sort((a, b) => b.rankGap - a.rankGap).slice(0, 5);
  },

  branchDiversityByIIT(data) {
    return this.programsOfferedByIIT(data);
  }
};