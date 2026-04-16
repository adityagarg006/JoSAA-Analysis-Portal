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

let baseData = [];

if (window.analytics && window.josaaData) {
  baseData = analytics.enrichData(window.josaaData);
}

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

  const totalRecords = data.length;
  const totalSeats = data.reduce((sum, item) => sum + item.seats, 0);
  const avgClosing = analytics.averageClosingRank(data) ?? "-";
  const avgOpening = analytics.averageOpeningRank(data) ?? "-";

  statsPreviewGrid.innerHTML = `
    <div class="stats-preview-card">
      <h3>Total Records</h3>
      <h4>${totalRecords}</h4>
      <p>Visible IIT-branch records after current filters.</p>
    </div>
    <div class="stats-preview-card">
      <h3>Total Seat Intake</h3>
      <h4>${totalSeats}</h4>
      <p>Combined seat count across the current view.</p>
    </div>
    <div class="stats-preview-card">
      <h3>Average Opening Rank</h3>
      <h4>${avgOpening}</h4>
      <p>Mean opening rank for the filtered dataset.</p>
    </div>
    <div class="stats-preview-card">
      <h3>Average Closing Rank</h3>
      <h4>${avgClosing}</h4>
      <p>Mean closing rank for the filtered dataset.</p>
    </div>
  `;
}

function renderInsights(data) {
  if (!insightGrid) return;

  if (!data.length) {
    insightGrid.innerHTML = `
      <div class="insight-card"><h3>Top IIT</h3><h4>-</h4><p>No data available.</p></div>
      <div class="insight-card"><h3>Top Branch</h3><h4>-</h4><p>No data available.</p></div>
      <div class="insight-card"><h3>Most Competitive</h3><h4>-</h4><p>No data available.</p></div>
      <div class="insight-card"><h3>Largest Shift</h3><h4>-</h4><p>No data available.</p></div>
    `;
    return;
  }

  const topIIT = analytics.topBySeats(data, "iit");
  const topBranch = analytics.topBySeats(data, "branch");
  const competitive = analytics.mostCompetitive(data, 1)[0];
  const yearlyShift = analytics.largestYearlySeatShift(data);

  insightGrid.innerHTML = `
    <div class="insight-card">
      <h3>Top IIT by Seats</h3>
      <h4>${topIIT ? topIIT[0] : "-"}</h4>
      <p>${topIIT ? `${topIIT[1]} seats in the current view.` : "No data available."}</p>
    </div>
    <div class="insight-card">
      <h3>Top Branch by Seats</h3>
      <h4>${topBranch ? topBranch[0] : "-"}</h4>
      <p>${topBranch ? `${topBranch[1]} seats in the current view.` : "No data available."}</p>
    </div>
    <div class="insight-card">
      <h3>Most Competitive Program</h3>
      <h4>${competitive ? competitive.iit : "-"}</h4>
      <p>${competitive ? `${competitive.branch} closes at rank ${competitive.closingRank}.` : "No data available."}</p>
    </div>
    <div class="insight-card">
      <h3>Largest Year Shift</h3>
      <h4>${yearlyShift ? `${yearlyShift.from} → ${yearlyShift.to}` : "-"}</h4>
      <p>${yearlyShift ? `${yearlyShift.delta > 0 ? "+" : ""}${yearlyShift.delta} seat change.` : "No data available."}</p>
    </div>
  `;
}

function renderAnswerGrid(data) {
  if (!answerGrid) return;

  if (!data.length) {
    answerGrid.innerHTML = "";
    return;
  }

  const topIIT = analytics.topBySeats(data, "iit");
  const topBranch = analytics.topBySeats(data, "branch");
  const competitive = analytics.mostCompetitive(data, 1)[0];
  const leastCompetitive = analytics.leastCompetitive(data, 1)[0];
  const diversity = analytics.sortEntries(analytics.branchDiversityByIIT(data), 1)[0];
  const coverage = analytics.sortEntries(analytics.branchCoverageAcrossIITs(data), 1)[0];
  const yearlyShift = analytics.largestYearlySeatShift(data);
  const popularity = analytics.branchPopularityTrend(data)[0];
  const outlier = analytics.outliers(data)[0];
  const branchFocus = branchFilter && branchFilter.value !== "all" ? branchFilter.value : "Computer Science and Engineering";
  const competitiveness = analytics.competitivenessByBranchAcrossIITs(baseData, branchFocus)[0];

  answerGrid.innerHTML = `
    <div class="answer-card">
      <h4>1. Which branches are getting more popular over the years?</h4>
      <p><strong>${popularity ? popularity.branch : "-"}</strong>${popularity ? ` shows stronger competitiveness with average closing rank moving from ${popularity.firstAvg} to ${popularity.lastAvg}.` : " No data available."}</p>
    </div>
    <div class="answer-card">
      <h4>2. Which IIT has the highest total seat intake in the current view?</h4>
      <p><strong>${topIIT ? topIIT[0] : "-"}</strong>${topIIT ? ` leads with ${topIIT[1]} seats.` : " No data available."}</p>
    </div>
    <div class="answer-card">
      <h4>3. Which branch has the highest total seat intake?</h4>
      <p><strong>${topBranch ? topBranch[0] : "-"}</strong>${topBranch ? ` leads with ${topBranch[1]} seats.` : " No data available."}</p>
    </div>
    <div class="answer-card">
      <h4>4. How does seat intake for a selected IIT change over time?</h4>
      <p>The year-wise trend chart and sortable table display this directly for <strong>${iitFilter && iitFilter.value !== "all" ? iitFilter.value : "all visible IITs"}</strong>.</p>
    </div>
    <div class="answer-card">
      <h4>5. How does seat intake for a selected branch change over time?</h4>
      <p>The year-wise trend chart and leaderboard reveal this for <strong>${branchFilter && branchFilter.value !== "all" ? branchFilter.value : "all visible branches"}</strong>.</p>
    </div>
    <div class="answer-card">
      <h4>6. Which IIT-branch combination has the lowest closing rank?</h4>
      <p><strong>${competitive ? `${competitive.iit} • ${competitive.branch}` : "-"}</strong>${competitive ? ` closes at rank ${competitive.closingRank}.` : " No data available."}</p>
    </div>
    <div class="answer-card">
      <h4>7. Which IIT-branch combination has the highest closing rank?</h4>
      <p><strong>${leastCompetitive ? `${leastCompetitive.iit} • ${leastCompetitive.branch}` : "-"}</strong>${leastCompetitive ? ` closes at rank ${leastCompetitive.closingRank}.` : " No data available."}</p>
    </div>
    <div class="answer-card">
      <h4>8. How do opening and closing ranks differ for the same branch across IITs?</h4>
      <p>Use the table, sort by rank gap, and filter to a specific branch to compare cross-IIT movement clearly.</p>
    </div>
    <div class="answer-card">
      <h4>9. Which year shows the biggest visible change in total seat intake?</h4>
      <p><strong>${yearlyShift ? `${yearlyShift.from} → ${yearlyShift.to}` : "-"}</strong>${yearlyShift ? ` shows the biggest shift with ${yearlyShift.delta > 0 ? "+" : ""}${yearlyShift.delta} seats.` : " No data available."}</p>
    </div>
    <div class="answer-card">
      <h4>10. Which emerging branches appear to be growing?</h4>
      <p><strong>Artificial Intelligence, Data Science and Artificial Intelligence, and Mathematics and Computing</strong> can be tracked directly through filters and the trend view.</p>
    </div>
    <div class="answer-card">
      <h4>11. Which IIT offers the widest variety of visible branches?</h4>
      <p><strong>${diversity ? diversity[0] : "-"}</strong>${diversity ? ` appears with ${diversity[1]} distinct branches.` : " No data available."}</p>
    </div>
    <div class="answer-card">
      <h4>12. Which branch appears in the maximum number of IITs?</h4>
      <p><strong>${coverage ? coverage[0] : "-"}</strong>${coverage ? ` appears across ${coverage[1]} IITs.` : " No data available."}</p>
    </div>
    <div class="answer-card">
      <h4>13. Which IIT has become more competitive over time for a selected branch?</h4>
      <p><strong>${competitiveness ? competitiveness.iit : "-"}</strong>${competitiveness ? ` shows the strongest improvement for ${branchFocus}, with closing rank moving from ${competitiveness.start} to ${competitiveness.end}.` : " No data available."}</p>
    </div>
    <div class="answer-card">
      <h4>14. What is the average closing rank for the selected view?</h4>
      <p><strong>${analytics.averageClosingRank(data) ?? "-"}</strong> is the current average closing rank.</p>
    </div>
    <div class="answer-card">
      <h4>15. Which records stand out as unusual or outliers?</h4>
      <p><strong>${outlier ? `${outlier.iit} • ${outlier.branch}` : "-"}</strong>${outlier ? ` stands out with ${outlier.seats} seats, rank gap ${outlier.rankGap}, and closing rank ${outlier.closingRank}.` : " No data available."}</p>
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
    row.innerHTML = `
      <div class="bar-label">${label}</div>
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

  const trend = analytics.yearSeatTrend(data);
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
        <div class="leaderboard-name">${row.iit} • ${row.branch}</div>
        <div class="leaderboard-score">${row.closingRank}</div>
      `;
    } else if (type === "outlier") {
      item.innerHTML = `
        <div class="leaderboard-rank">${index + 1}</div>
        <div class="leaderboard-name">${row.iit} • ${row.branch}</div>
        <div class="leaderboard-score">${row.rankGap}</div>
      `;
    } else {
      item.innerHTML = `
        <div class="leaderboard-rank">${index + 1}</div>
        <div class="leaderboard-name">${row[0]}</div>
        <div class="leaderboard-score">${row[1]}</div>
      `;
    }

    container.appendChild(item);
  });
}

function openDetailsModal(item) {
  if (!modalTitle || !modalGrid || !modalOverlay) return;

  modalTitle.textContent = `${item.iit} • ${item.branch}`;
  modalGrid.innerHTML = `
    <div class="modal-item">
      <h4>Year</h4>
      <p>${item.year}</p>
    </div>
    <div class="modal-item">
      <h4>IIT</h4>
      <p>${item.iit}</p>
    </div>
    <div class="modal-item">
      <h4>Branch</h4>
      <p>${item.branch}</p>
    </div>
    <div class="modal-item">
      <h4>Seat Intake</h4>
      <p>${item.seats}</p>
    </div>
    <div class="modal-item">
      <h4>Opening Rank</h4>
      <p>${item.openingRank}</p>
    </div>
    <div class="modal-item">
      <h4>Closing Rank</h4>
      <p>${item.closingRank}</p>
    </div>
    <div class="modal-item">
      <h4>Rank Gap</h4>
      <p>${item.rankGap}</p>
    </div>
    <div class="modal-item">
      <h4>Competitiveness View</h4>
      <p>${item.closingRank < 200 ? "Highly competitive" : item.closingRank < 700 ? "Strong demand" : "Moderate demand"}</p>
    </div>
  `;
  modalOverlay.classList.add("active");
}

function renderTable(data) {
  if (!dataTableBody) return;

  dataTableBody.innerHTML = "";

  if (!data.length) {
    dataTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;">No matching data found.</td>
      </tr>
    `;
    return;
  }

  const field = sortField ? sortField.value : "year";
  const order = sortOrder ? sortOrder.value : "asc";
  const sorted = analytics.sortData(data, field, order);

  sorted.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.year}</td>
      <td>${item.iit}</td>
      <td>${item.branch}</td>
      <td>${item.seats}</td>
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

  buildBarChart(iitChart, analytics.aggregateSum(filtered, "iit", "seats"));
  buildBarChart(branchChart, analytics.aggregateSum(filtered, "branch", "seats"));
  renderYearTrend(filtered);
  renderLeaderboard(branchLeaderboard, analytics.sortEntries(analytics.aggregateSum(filtered, "branch", "seats"), 5));
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

if (window.analytics && window.josaaData) {
  populateFilters();
  updateExploreSection();
}