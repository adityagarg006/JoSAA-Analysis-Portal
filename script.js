const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
const tabLinks = document.querySelectorAll(".tab-link");
const tabSections = document.querySelectorAll(".tab-section");
const heroTabBtns = document.querySelectorAll(".hero-tab-btn");

const yearFilter = document.getElementById("yearFilter");
const iitFilter = document.getElementById("iitFilter");
const branchFilter = document.getElementById("branchFilter");
const searchInput = document.getElementById("searchInput");
const sortField = document.getElementById("sortField");
const sortOrder = document.getElementById("sortOrder");

const statsPreviewGrid = document.getElementById("statsPreviewGrid");
const insightGrid = document.getElementById("insightGrid");
const answerGrid = document.getElementById("answerGrid");
const iitChart = document.getElementById("iitChart");
const branchChart = document.getElementById("branchChart");
const yearTrendChart = document.getElementById("yearTrendChart");
const branchLeaderboard = document.getElementById("branchLeaderboard");
const diversityChart = document.getElementById("diversityChart");
const coverageChart = document.getElementById("coverageChart");
const competitiveLeaderboard = document.getElementById("competitiveLeaderboard");
const outlierLeaderboard = document.getElementById("outlierLeaderboard");
const dataTableBody = document.getElementById("dataTableBody");

const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const modalTitle = document.getElementById("modalTitle");
const modalGrid = document.getElementById("modalGrid");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

function openTab(tabName) {
  tabSections.forEach(section => section.classList.remove("active"));
  tabLinks.forEach(link => link.classList.remove("active"));

  const section = document.getElementById(`${tabName}-tab`);
  const link = document.querySelector(`.tab-link[data-tab="${tabName}"]`);

  if (section) section.classList.add("active");
  if (link) link.classList.add("active");

  if (navLinks) navLinks.classList.remove("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

tabLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    openTab(link.dataset.tab);
  });
});

heroTabBtns.forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();
    openTab(btn.dataset.tab);
  });
});

if (modalClose && modalOverlay) {
  modalClose.addEventListener("click", () => {
    modalOverlay.classList.remove("active");
  });

  modalOverlay.addEventListener("click", e => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove("active");
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      modalOverlay.classList.remove("active");
    }
  });
}

function populateFilters() {
  if (!yearFilter || !iitFilter || !branchFilter) return;

  yearFilter.innerHTML = `<option value="all">All</option>`;
  iitFilter.innerHTML = `<option value="all">All</option>`;
  branchFilter.innerHTML = `<option value="all">All</option>`;

  const years = analytics.uniqueValues(baseData, "year").sort((a, b) => a - b);
  const iits = analytics.uniqueValues(baseData, "iit").sort();
  const branches = analytics.uniqueValues(baseData, "branch").sort();

  years.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  });

  iits.forEach(iit => {
    const option = document.createElement("option");
    option.value = iit;
    option.textContent = iit;
    iitFilter.appendChild(option);
  });

  branches.forEach(branch => {
    const option = document.createElement("option");
    option.value = branch;
    option.textContent = branch;
    branchFilter.appendChild(option);
  });
}

function getFilteredData() {
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  return baseData.filter(item => {
    const yearMatch = !yearFilter || yearFilter.value === "all" || item.year.toString() === yearFilter.value;
    const iitMatch = !iitFilter || iitFilter.value === "all" || item.iit === iitFilter.value;
    const branchMatch = !branchFilter || branchFilter.value === "all" || item.branch === branchFilter.value;

    const searchMatch =
      query === "" ||
      item.iit.toLowerCase().includes(query) ||
      item.branch.toLowerCase().includes(query);

    return yearMatch && iitMatch && branchMatch && searchMatch;
  });
}

function renderStats(data) {
  if (!statsPreviewGrid) return;

  if (!data.length) {
    statsPreviewGrid.innerHTML = `
      <div class="stats-preview-card"><h3>Total Records</h3><h4>-</h4><p>No data.</p></div>
      <div class="stats-preview-card"><h3>IITs Covered</h3><h4>-</h4><p>No data.</p></div>
      <div class="stats-preview-card"><h3>Avg Opening Rank</h3><h4>-</h4><p>No data.</p></div>
      <div class="stats-preview-card"><h3>Avg Closing Rank</h3><h4>-</h4><p>No data.</p></div>
    `;
    return;
  }

  const totalRecords = data.length;
  const iitCount = analytics.uniqueValues(data, "iit").length;
  const branchCount = analytics.uniqueValues(data, "branch").length;
  const avgClosing = analytics.averageClosingRank(data) ?? "-";
  const avgOpening = analytics.averageOpeningRank(data) ?? "-";

  statsPreviewGrid.innerHTML = `
    <div class="stats-preview-card">
      <h3>Total Records</h3>
      <h4>${totalRecords.toLocaleString()}</h4>
      <p>Admission entries in the current view.</p>
    </div>
    <div class="stats-preview-card">
      <h3>IITs & Branches</h3>
      <h4>${iitCount} IITs, ${branchCount} Branches</h4>
      <p>Unique institutions and programs tracked.</p>
    </div>
    <div class="stats-preview-card">
      <h3>Avg Opening Rank</h3>
      <h4>${avgOpening.toLocaleString()}</h4>
      <p>Average opening cutoff in this view.</p>
    </div>
    <div class="stats-preview-card">
      <h3>Avg Closing Rank</h3>
      <h4>${avgClosing.toLocaleString()}</h4>
      <p>Average closing cutoff in this view.</p>
    </div>
  `;
}

function renderInsights(data) {
  if (!insightGrid) return;

  if (!data.length) {
    insightGrid.innerHTML = `
      <div class="insight-card"><h3>Top Program</h3><h4>-</h4><p>No data.</p></div>
      <div class="insight-card"><h3>Most Diverse IIT</h3><h4>-</h4><p>No data.</p></div>
      <div class="insight-card"><h3>Easiest Entry</h3><h4>-</h4><p>No data.</p></div>
      <div class="insight-card"><h3>Round Advantage</h3><h4>-</h4><p>No data.</p></div>
    `;
    return;
  }

  const topProg = analytics.mostCompetitive(data, 1)[0];
  const diverse = analytics.sortEntries(analytics.programsOfferedByIIT(data), 1)[0];
  const easiest = analytics.leastCompetitive(data, 1)[0];
  const roundAdv = analytics.roundWaitingAdvantage(data);

  insightGrid.innerHTML = `
    <div class="insight-card">
      <h3>Hardest to Get In</h3>
      <h4>${topProg ? topProg.iit.replace("Indian Institute of Technology ", "IIT ") : "-"}</h4>
      <p>${topProg ? `${topProg.branch} — closes at rank ${topProg.closingRank}` : "No data."}</p>
    </div>
    <div class="insight-card">
      <h3>Most Diverse IIT</h3>
      <h4>${diverse ? diverse[0].replace("Indian Institute of Technology ", "IIT ") : "-"}</h4>
      <p>${diverse ? `Offers ${diverse[1]} different programs` : "No data."}</p>
    </div>
    <div class="insight-card">
      <h3>Easiest Entry Point</h3>
      <h4>${easiest ? easiest.iit.replace("Indian Institute of Technology ", "IIT ") : "-"}</h4>
      <p>${easiest ? `${easiest.branch} — rank ${easiest.closingRank} can get in` : "No data."}</p>
    </div>
    <div class="insight-card">
      <h3>Waiting for Later Rounds?</h3>
      <h4>${roundAdv ? (roundAdv.improvement > 0 ? "Yes, it helps!" : "Not much difference") : "-"}</h4>
      <p>${roundAdv ? `Cutoffs relax by ~${Math.abs(roundAdv.improvement)} ranks from Round ${roundAdv.firstRound} to ${roundAdv.lastRound}` : "No data."}</p>
    </div>
  `;
}

function renderAnswerGrid(data) {
  if (!answerGrid) return;
  if (!data.length) { answerGrid.innerHTML = ""; return; }

  const roundAdv = analytics.roundWaitingAdvantage(data);
  const rising = analytics.risingBranches(data);
  const risingTop = rising.length ? rising[0] : null;
  const fallingTop = rising.length ? rising[rising.length - 1] : null;
  const oldNew = analytics.oldVsNewIITs(data);
  const cseCore = analytics.cseVsOtherBranch(data);
  const stability = analytics.cutoffStability(data);
  const risingIITs = analytics.fastestRisingIITs(data);
  const topRisingIIT = risingIITs.length ? risingIITs[0] : null;
  const brackets = analytics.safeOptionsAtRankBrackets(data);
  const top5 = analytics.mostCompetitive(data, 5);
  const coverageTop = analytics.sortEntries(analytics.branchCoverageAcrossIITs(data), 1)[0];

  const shortName = (name) => name ? name.replace("Indian Institute of Technology ", "IIT ") : "-";

  answerGrid.innerHTML = `
    <div class="answer-card">
      <h4>1. Should we wait for later rounds or lock our choice in Round 1?</h4>
      <p>${roundAdv ? `<strong>${roundAdv.improvement > 0 ? "Yes, waiting helps." : "Cutoffs barely change."}</strong> On average, closing ranks shift by <strong>${Math.abs(roundAdv.improvement)}</strong> positions from Round ${roundAdv.firstRound} (avg: ${roundAdv.avgR1}) to Round ${roundAdv.lastRound} (avg: ${roundAdv.avgLast}). ${roundAdv.improvement > 0 ? "Later rounds tend to relax, giving you more options." : "Locking early is equally safe."}` : "Not enough multi-round data to compare."}</p>
    </div>
    <div class="answer-card">
      <h4>2. Which branches are becoming harder to get into? (Rising in demand)</h4>
      <p>${risingTop ? `<strong>${risingTop.branch}</strong> has seen the sharpest increase in competition -- average closing rank dropped from <strong>${risingTop.firstAvg}</strong> (${risingTop.firstYear}) to <strong>${risingTop.lastAvg}</strong> (${risingTop.lastYear}). A lower closing rank means tougher competition.` : "Not enough historical data."}</p>
    </div>
    <div class="answer-card">
      <h4>3. Which branches are losing popularity? (Getting easier to get)</h4>
      <p>${fallingTop ? `<strong>${fallingTop.branch}</strong> has become significantly easier -- closing rank rose from <strong>${fallingTop.firstAvg}</strong> to <strong>${fallingTop.lastAvg}</strong>. This means fewer top-rankers are choosing this branch now.` : "Not enough data."}</p>
    </div>
    <div class="answer-card">
      <h4>4. Old IITs vs New IITs -- how big is the gap really?</h4>
      <p>${oldNew ? `The average closing rank at <strong>Old IITs</strong> (Bombay, Delhi, Madras, etc.) is <strong>${oldNew.avgOld}</strong>, while at <strong>Newer IITs</strong> it is <strong>${oldNew.avgNew}</strong>. That is a gap of <strong>${oldNew.gap}</strong> ranks. ${oldNew.gap > 3000 ? "The old IIT premium is still very significant." : "Newer IITs are rapidly closing the gap."}` : "Not enough data to compare."}</p>
    </div>
    <div class="answer-card">
      <h4>5. CSE at a new IIT vs Core branch at a top IIT -- what is the trade-off?</h4>
      <p>${cseCore.easiestCSE && cseCore.toughestCore ? `The easiest CSE seat available is at <strong>${shortName(cseCore.easiestCSE.iit)}</strong> (closing rank: ${cseCore.easiestCSE.closingRank}), while getting <strong>${cseCore.toughestCore.branch}</strong> at <strong>${shortName(cseCore.toughestCore.iit)}</strong> requires rank ${cseCore.toughestCore.closingRank}. ${cseCore.easiestCSE.closingRank > cseCore.toughestCore.closingRank ? "A core branch at a top IIT requires a significantly better rank." : "CSE, even at new IITs, is harder to get than core branches at top IITs."}` : "Not enough data in the current view."}</p>
    </div>
    <div class="answer-card">
      <h4>6. How reliable are last year's cutoffs? Can we trust them for planning?</h4>
      <p>${stability ? `Out of all tracked IIT-branch combinations, <strong>${stability.stablePercent}%</strong> have remained stable (less than 15% variation across years). ${stability.stablePercent > 70 ? "Yes, historical cutoffs are a fairly reliable predictor." : "Cutoffs can be unpredictable -- plan with a margin of safety."}${stability.topVolatile.length ? ` Most volatile: <strong>${shortName(stability.topVolatile[0].iit)}</strong> (${stability.topVolatile[0].branch}) with ${stability.topVolatile[0].deviation}% variation.` : ""}` : "Not enough multi-year data."}</p>
    </div>
    <div class="answer-card">
      <h4>7. Which newer IITs are improving the fastest in reputation?</h4>
      <p>${topRisingIIT ? `<strong>${shortName(topRisingIIT.iit)}</strong> has had the sharpest rise -- average closing rank tightened from <strong>${topRisingIIT.firstAvg}</strong> (${topRisingIIT.firstYear}) to <strong>${topRisingIIT.lastAvg}</strong> (${topRisingIIT.lastYear}). Tighter cutoffs indicate growing demand and prestige.` : "Not enough historical data."}</p>
    </div>
    <div class="answer-card">
      <h4>8. How many options does my child have at different rank levels?</h4>
      <p>${brackets.map(b => `<strong>${b.label}:</strong> ${b.count} programs available${b.sample.length ? ` (e.g., ${shortName(b.sample[0].iit)} - ${b.sample[0].branch})` : ""}`).join(" | ")}</p>
    </div>
    <div class="answer-card">
      <h4>9. What are the top 5 most sought-after programs in India?</h4>
      <p>${top5.length ? top5.map((p, i) => `<strong>${i+1}.</strong> ${shortName(p.iit)} - ${p.branch} (Rank ${p.closingRank})`).join("<br>") : "No data available."}</p>
    </div>
    <div class="answer-card">
      <h4>10. Which branches are offered at the most IITs nationwide?</h4>
      <p>${coverageTop ? `<strong>${coverageTop[0]}</strong> is the most universally available branch, offered at <strong>${coverageTop[1]}</strong> different IITs. This makes it one of the safest choices since more seats exist across the system.` : "No data."}</p>
    </div>
  `;
}

function buildBarChart(container, obj, limit = 6) {
  if (!container) return;
  container.innerHTML = "";
  const entries = analytics.sortEntries(obj, limit);
  if (!entries.length) {
    container.innerHTML = `<p style="color:#5f5a55;">No data available for current filters.</p>`;
    return;
  }
  const maxValue = Math.max(...entries.map(entry => entry[1]));
  entries.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    const shortLabel = label.replace("Indian Institute of Technology ", "IIT ");
    row.innerHTML = `
      <div class="bar-label">${shortLabel}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(value / maxValue) * 100}%"></div>
      </div>
      <div class="bar-value">${value}</div>
    `;
    container.appendChild(row);
  });
}

function renderYearTrend(data) {
  if (!yearTrendChart) return;
  yearTrendChart.innerHTML = "";
  const trend = analytics.competitivenessTrendByYear(data);
  if (!trend.length) {
    yearTrendChart.innerHTML = `<p style="color:#5f5a55;">No data available for current filters.</p>`;
    return;
  }
  const maxValue = Math.max(...trend.map(entry => entry[1]));
  trend.forEach(([year, value]) => {
    const item = document.createElement("div");
    item.className = "line-bar-item";
    item.innerHTML = `
      <div class="line-bar-value">${value}</div>
      <div class="line-bar-track">
        <div class="line-bar-fill" style="height:${(value / maxValue) * 100}%"></div>
      </div>
      <div class="line-bar-label">${year}</div>
    `;
    yearTrendChart.appendChild(item);
  });
}

function renderLeaderboard(container, rows, type = "simple") {
  if (!container) return;
  container.innerHTML = "";
  if (!rows.length) {
    container.innerHTML = `<p style="color:#5f5a55;">No data available for current filters.</p>`;
    return;
  }
  rows.forEach((row, index) => {
    const item = document.createElement("div");
    item.className = "leaderboard-item";
    if (type === "record") {
      item.innerHTML = `
        <div class="leaderboard-rank">${index + 1}</div>
        <div class="leaderboard-name">${row.iit.replace("Indian Institute of Technology ", "IIT ")} - ${row.branch}</div>
        <div class="leaderboard-score">Rank ${row.closingRank}</div>
      `;
    } else if (type === "outlier") {
      item.innerHTML = `
        <div class="leaderboard-rank">${index + 1}</div>
        <div class="leaderboard-name">${row.iit.replace("Indian Institute of Technology ", "IIT ")} - ${row.branch}</div>
        <div class="leaderboard-score">Gap: ${row.rankGap}</div>
      `;
    } else {
      const shortLabel = typeof row[0] === "string" ? row[0].replace("Indian Institute of Technology ", "IIT ") : row[0];
      item.innerHTML = `
        <div class="leaderboard-rank">${index + 1}</div>
        <div class="leaderboard-name">${shortLabel}</div>
        <div class="leaderboard-score">${row[1]}</div>
      `;
    }
    container.appendChild(item);
  });
}

function openDetailsModal(item) {
  if (!modalTitle || !modalGrid || !modalOverlay) return;
  const shortIIT = item.iit.replace("Indian Institute of Technology ", "IIT ");
  modalTitle.textContent = `${shortIIT} - ${item.branch}`;
  modalGrid.innerHTML = `
    <div class="modal-item"><h4>Year</h4><p>${item.year}</p></div>
    <div class="modal-item"><h4>Round</h4><p>${item.round}</p></div>
    <div class="modal-item"><h4>IIT</h4><p>${shortIIT}</p></div>
    <div class="modal-item"><h4>Branch</h4><p>${item.branch}</p></div>
    <div class="modal-item"><h4>Opening Rank</h4><p>${item.openingRank}</p></div>
    <div class="modal-item"><h4>Closing Rank</h4><p>${item.closingRank}</p></div>
    <div class="modal-item"><h4>Rank Gap</h4><p>${item.rankGap}</p></div>
    <div class="modal-item"><h4>Verdict</h4><p>${item.closingRank < 500 ? "Elite tier - extremely competitive" : item.closingRank < 2000 ? "Premium tier - strong demand" : item.closingRank < 8000 ? "Competitive - good option" : "Accessible - safe backup choice"}</p></div>
  `;
  modalOverlay.classList.add("active");
}

function renderTable(data) {
  if (!dataTableBody) return;
  dataTableBody.innerHTML = "";
  if (!data.length) {
    dataTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No matching data found.</td></tr>`;
    return;
  }
  const field = sortField ? sortField.value : "year";
  const order = sortOrder ? sortOrder.value : "asc";
  const sorted = analytics.sortData(data, field, order);
  sorted.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.year}</td>
      <td>${item.iit.replace("Indian Institute of Technology ", "IIT ")}</td>
      <td>${item.branch}</td>
      <td>${item.round}</td>
      <td>${item.openingRank}</td>
      <td>${item.closingRank}</td>
      <td>${item.rankGap}</td>
    `;
    row.addEventListener("click", () => openDetailsModal(item));
    dataTableBody.appendChild(row);
  });
}

function updateExploreSection() {
  const filtered = getFilteredData();
  renderStats(filtered);
  renderInsights(filtered);
  renderAnswerGrid(filtered);

  buildBarChart(iitChart, analytics.programsOfferedByIIT(filtered));
  buildBarChart(branchChart, analytics.averageClosingRankByBranch(filtered), 6);
  renderYearTrend(filtered);

  const accessibleBranches = analytics.sortEntries(analytics.averageClosingRankByBranch(filtered), 5, true);
  renderLeaderboard(branchLeaderboard, accessibleBranches);
  
  buildBarChart(diversityChart, analytics.branchDiversityByIIT(filtered));
  buildBarChart(coverageChart, analytics.branchCoverageAcrossIITs(filtered));
  renderLeaderboard(competitiveLeaderboard, analytics.mostCompetitive(filtered, 5), "record");
  renderLeaderboard(outlierLeaderboard, analytics.outliers(filtered), "outlier");
  renderTable(filtered);
}

[yearFilter, iitFilter, branchFilter, sortField, sortOrder].forEach(el => {
  if (el) el.addEventListener("change", updateExploreSection);
});

if (searchInput) {
  searchInput.addEventListener("input", updateExploreSection);
}

let baseData = [];

document.addEventListener("DOMContentLoaded", async () => {
    const loadingOverlay = document.getElementById("db-loading-overlay");
    if (loadingOverlay) loadingOverlay.style.display = "block";

    try {
        const response = await fetch('http://localhost/JOSAA-Analysis-Portal/api.php');
        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }
        
        baseData = await response.json();
        
        if (window.analytics && baseData.length > 0) {
            baseData = analytics.enrichData(baseData);
            populateFilters();
            updateExploreSection();
        }
    } catch (e) {
        console.error("Failed to load JOSAA data from backend API:", e);
        if (loadingOverlay) {
            loadingOverlay.innerHTML = `<h3 style="color:red;">Database Connection Failed</h3><p>${e.message}</p>`;
        }
    } finally {
        if (loadingOverlay && baseData.length > 0) {
            loadingOverlay.style.display = "none";
        }
    }
});