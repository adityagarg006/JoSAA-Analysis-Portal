window.analytics = {
  uniqueValues(data, key) {
    return [...new Set(data.map(item => item[key]))];
  },

  enrichData(data) {
    return data.map(item => ({
      ...item,
      rankGap: item.closingRank - item.openingRank
    }));
  },

  aggregateSum(data, keyField, valueField) {
    const map = {};
    data.forEach(item => {
      map[item[keyField]] = (map[item[keyField]] || 0) + item[valueField];
    });
    return map;
  },

  aggregateAverage(data, keyField, valueField) {
    const map = {};
    data.forEach(item => {
      if (!map[item[keyField]]) {
        map[item[keyField]] = { sum: 0, count: 0 };
      }
      map[item[keyField]].sum += item[valueField];
      map[item[keyField]].count += 1;
    });

    const result = {};
    Object.keys(map).forEach(key => {
      result[key] = Math.round(map[key].sum / map[key].count);
    });
    return result;
  },

  sortEntries(obj, limit = null, desc = true) {
    const entries = Object.entries(obj).sort((a, b) => desc ? b[1] - a[1] : a[1] - b[1]);
    return limit ? entries.slice(0, limit) : entries;
  },

  yearSeatTrend(data) {
    const map = {};
    data.forEach(item => {
      map[item.year] = (map[item.year] || 0) + item.seats;
    });
    return Object.entries(map).sort((a, b) => Number(a[0]) - Number(b[0]));
  },

  branchDiversityByIIT(data) {
    const map = {};
    data.forEach(item => {
      if (!map[item.iit]) map[item.iit] = new Set();
      map[item.iit].add(item.branch);
    });

    const result = {};
    Object.keys(map).forEach(key => {
      result[key] = map[key].size;
    });
    return result;
  },

  branchCoverageAcrossIITs(data) {
    const map = {};
    data.forEach(item => {
      if (!map[item.branch]) map[item.branch] = new Set();
      map[item.branch].add(item.iit);
    });

    const result = {};
    Object.keys(map).forEach(key => {
      result[key] = map[key].size;
    });
    return result;
  },

  mostCompetitive(data, limit = 5) {
    return [...data]
      .sort((a, b) => a.closingRank - b.closingRank)
      .slice(0, limit);
  },

  leastCompetitive(data, limit = 5) {
    return [...data]
      .sort((a, b) => b.closingRank - a.closingRank)
      .slice(0, limit);
  },

  averageClosingRank(data) {
    if (!data.length) return null;
    const sum = data.reduce((acc, item) => acc + item.closingRank, 0);
    return Math.round(sum / data.length);
  },

  averageOpeningRank(data) {
    if (!data.length) return null;
    const sum = data.reduce((acc, item) => acc + item.openingRank, 0);
    return Math.round(sum / data.length);
  },

  topBySeats(data, field) {
    const agg = this.aggregateSum(data, field, "seats");
    const sorted = this.sortEntries(agg, 1);
    return sorted.length ? sorted[0] : null;
  },

  largestYearlySeatShift(data) {
    const trend = this.yearSeatTrend(data);
    if (trend.length < 2) return null;

    let best = null;
    for (let i = 1; i < trend.length; i++) {
      const prev = trend[i - 1];
      const curr = trend[i];
      const delta = curr[1] - prev[1];
      if (!best || Math.abs(delta) > Math.abs(best.delta)) {
        best = {
          from: prev[0],
          to: curr[0],
          delta
        };
      }
    }
    return best;
  },

  branchPopularityTrend(data) {
    const branchYearRank = {};
    data.forEach(item => {
      if (!branchYearRank[item.branch]) branchYearRank[item.branch] = {};
      if (!branchYearRank[item.branch][item.year]) branchYearRank[item.branch][item.year] = [];
      branchYearRank[item.branch][item.year].push(item.closingRank);
    });

    const result = [];
    Object.keys(branchYearRank).forEach(branch => {
      const years = Object.keys(branchYearRank[branch]).map(Number).sort((a, b) => a - b);
      if (years.length >= 2) {
        const firstAvg = Math.round(branchYearRank[branch][years[0]].reduce((a, b) => a + b, 0) / branchYearRank[branch][years[0]].length);
        const lastAvg = Math.round(branchYearRank[branch][years[years.length - 1]].reduce((a, b) => a + b, 0) / branchYearRank[branch][years[years.length - 1]].length);
        result.push({
          branch,
          firstYear: years[0],
          lastYear: years[years.length - 1],
          firstAvg,
          lastAvg,
          delta: lastAvg - firstAvg
        });
      }
    });

    return result.sort((a, b) => a.delta - b.delta);
  },

  emergingBranches(data) {
    const names = ["Artificial Intelligence", "Data Science and Artificial Intelligence", "Mathematics and Computing"];
    return data.filter(item => names.includes(item.branch));
  },

  competitivenessByBranchAcrossIITs(data, selectedBranch) {
    const filtered = data.filter(item => item.branch === selectedBranch);
    const map = {};
    filtered.forEach(item => {
      if (!map[item.iit]) map[item.iit] = [];
      map[item.iit].push({ year: item.year, closingRank: item.closingRank });
    });

    const result = [];
    Object.keys(map).forEach(iit => {
      const rows = map[iit].sort((a, b) => a.year - b.year);
      if (rows.length >= 2) {
        result.push({
          iit,
          start: rows[0].closingRank,
          end: rows[rows.length - 1].closingRank,
          delta: rows[rows.length - 1].closingRank - rows[0].closingRank
        });
      }
    });

    return result.sort((a, b) => a.delta - b.delta);
  },

  outliers(data) {
    if (!data.length) return [];

    const seats = data.map(item => item.seats);
    const closing = data.map(item => item.closingRank);
    const gaps = data.map(item => item.rankGap);

    const avgSeats = seats.reduce((a, b) => a + b, 0) / seats.length;
    const avgClosing = closing.reduce((a, b) => a + b, 0) / closing.length;
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

    const result = [];

    data.forEach(item => {
      let score = 0;
      if (item.seats > avgSeats * 1.25) score += 1;
      if (item.closingRank < avgClosing * 0.45) score += 1;
      if (item.rankGap > avgGap * 1.35) score += 1;

      if (score >= 2) {
        result.push(item);
      }
    });

    return result
      .sort((a, b) => a.closingRank - b.closingRank)
      .slice(0, 5);
  },

  sortData(data, field, order) {
    const sorted = [...data].sort((a, b) => {
      const x = a[field];
      const y = b[field];

      if (typeof x === "string" && typeof y === "string") {
        return x.localeCompare(y);
      }

      return x - y;
    });

    return order === "desc" ? sorted.reverse() : sorted;
  }
};