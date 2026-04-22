import re

with open('script.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Chunk 1: renderStats
new_stats = """  const totalRecords = data.length;
  const totalRounds = window.analytics && data.length ? window.analytics.uniqueValues(data, "round").length : 0;
  const avgClosing = analytics.averageClosingRank(data) ?? "-";
  const avgOpening = analytics.averageOpeningRank(data) ?? "-";

  statsPreviewGrid.innerHTML = `
    <div class="stats-preview-card">
      <h3>Total Records</h3>
      <h4>${totalRecords}</h4>
      <p>Visible IIT-branch records after current filters.</p>
    </div>
    <div class="stats-preview-card">
      <h3>Unique Rounds Tracked</h3>
      <h4>${totalRounds}</h4>
      <p>Number of counseling rounds tracked in this view.</p>
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
  `;"""
text = re.sub(r'  const totalRecords = data.length;[\s\S]*?</div>\s*`;', new_stats, text, count=1)

# Chunk 2: renderInsights
new_insights = """function renderInsights(data) {
  if (!insightGrid) return;

  if (!data.length) {
    insightGrid.innerHTML = `
      <div class="insight-card"><h3>Most Accessible IIT</h3><h4>-</h4><p>No data available.</p></div>
      <div class="insight-card"><h3>Most Diverse IIT</h3><h4>-</h4><p>No data available.</p></div>
      <div class="insight-card"><h3>Most Competitive</h3><h4>-</h4><p>No data available.</p></div>
      <div class="insight-card"><h3>Toughest Branch</h3><h4>-</h4><p>No data available.</p></div>
    `;
    return;
  }

  const accessibleIIT = analytics.leastCompetitive(data, 1)[0];
  const diverseIIT = analytics.sortEntries(analytics.programsOfferedByIIT(data), 1)[0];
  const competitive = analytics.mostCompetitive(data, 1)[0];
  const toughestBranch = analytics.sortEntries(analytics.averageClosingRankByBranch(data), 1, false)[0];

  insightGrid.innerHTML = `
    <div class="insight-card">
      <h3>Most Accessible IIT</h3>
      <h4>${accessibleIIT ? accessibleIIT.iit : "-"}</h4>
      <p>${accessibleIIT ? `Closes at rank ${accessibleIIT.closingRank}.` : "No data available."}</p>
    </div>
    <div class="insight-card">
      <h3>Most Diverse IIT</h3>
      <h4>${diverseIIT ? diverseIIT[0] : "-"}</h4>
      <p>${diverseIIT ? `${diverseIIT[1]} distinct branches offered.` : "No data available."}</p>
    </div>
    <div class="insight-card">
      <h3>Toughest Single Rank</h3>
      <h4>${competitive ? competitive.iit : "-"}</h4>
      <p>${competitive ? `${competitive.branch} closes at rank ${competitive.closingRank}.` : "No data available."}</p>
    </div>
    <div class="insight-card">
      <h3>Toughest Branch (Avg)</h3>
      <h4>${toughestBranch ? toughestBranch[0] : "-"}</h4>
      <p>${toughestBranch ? `Average closing rank of ${toughestBranch[1]}.` : "No data available."}</p>
    </div>
  `;
}"""
text = re.sub(r'function renderInsights\(data\) \{[\s\S]*?</div>\s*`;\n\}', new_insights, text, count=1)

# Chunk 3: renderAnswerGrid
new_answer_grid = """function renderAnswerGrid(data) {
  if (!answerGrid) return;
  if (!data.length) { answerGrid.innerHTML = ""; return; }

  const popularity = analytics.branchPopularityTrend(data)[0];
  const hardest = analytics.mostCompetitive(data, 1)[0];
  const avgBranchOptions = analytics.sortEntries(analytics.averageClosingRankByBranch(data), 1, false);
  const avgBranch = avgBranchOptions.length > 0 ? avgBranchOptions[0] : null;
  const diversityOptions = analytics.sortEntries(analytics.programsOfferedByIIT(data), 1);
  const diversity = diversityOptions.length > 0 ? diversityOptions[0] : null;
  const outlier = analytics.outliers(data)[0];
  const accessible = analytics.leastCompetitive(data, 1)[0];
  const coverageOptions = analytics.sortEntries(analytics.branchCoverageAcrossIITs(data), 1);
  const coverage = coverageOptions.length > 0 ? coverageOptions[0] : null;
  const emerging = analytics.emergingBranches(data)[0];
  const avgClose = analytics.averageClosingRank(data);
  const trend = analytics.competitivenessTrendByYear(data);

  answerGrid.innerHTML = `
    <div class="answer-card">
      <h4>1. Which branches are getting more popular objectively?</h4>
      <p><strong>${popularity ? popularity.branch : "-"}</strong>${popularity ? ` shows the highest surge, with average closing rank dropping from ${popularity.firstAvg} down to ${popularity.lastAvg}.` : " No sufficient data."}</p>
    </div>
    <div class="answer-card">
      <h4>2. Which is the toughest IIT to crack overall?</h4>
      <p><strong>${hardest ? hardest.iit : "-"}</strong>${hardest ? ` holds the toughest cutoff at rank ${hardest.closingRank}.` : " No data."}</p>
    </div>
    <div class="answer-card">
      <h4>3. What is the most competitive program right now?</h4>
      <p><strong>${avgBranch ? avgBranch[0] : "-"}</strong>${avgBranch ? ` is the hardest branch on average with an overall closing rank of ${avgBranch[1]}.` : " No data."}</p>
    </div>
    <div class="answer-card">
      <h4>4. Which IIT offers the widest variety of engineering branches?</h4>
      <p><strong>${diversity ? diversity[0] : "-"}</strong>${diversity ? ` currently offers ${diversity[1]} distinct branches.` : " No data."}</p>
    </div>
    <div class="answer-card">
      <h4>5. Which branches have the widest variance in accepted students?</h4>
      <p><strong>${outlier ? outlier.branch : "-"}</strong>${outlier ? ` at ${outlier.iit} shows a massive opening/closing rank gap of ${outlier.rankGap}.` : " No data."}</p>
    </div>
    <div class="answer-card">
      <h4>6. How has the difficulty of admission changed from 2016 to 2024?</h4>
      <p>Overall, closing ranks started at <strong>${trend && trend.length ? trend[0][1] : "-"}</strong> and shifted to <strong>${trend && trend.length ? trend[trend.length-1][1] : "-"}</strong>.</p>
    </div>
    <div class="answer-card">
      <h4>7. Which IIT serves as the most accessible entry point?</h4>
      <p><strong>${accessible ? accessible.iit : "-"}</strong>${accessible ? ` offers the maximum entry latitude, closing at rank ${accessible.closingRank}.` : " No data."}</p>
    </div>
    <div class="answer-card">
      <h4>8. What branch is available across the maximum number of IITs?</h4>
      <p><strong>${coverage ? coverage[0] : "-"}</strong>${coverage ? ` is highly saturated, available at ${coverage[1]} different IITs.` : " No data."}</p>
    </div>
    <div class="answer-card">
      <h4>9. Which emerging disciplines are the toughest to secure?</h4>
      <p><strong>${emerging ? emerging.branch : "None found"}</strong>${emerging ? ` is highly competitive, closing at rank ${emerging.closingRank}.` : " No data in current view."}</p>
    </div>
    <div class="answer-card">
      <h4>10. What is the absolute average closing rank across the system?</h4>
      <p>The system average for this query sits at <strong>${avgClose ?? "0"}</strong>, dictating the typical entry benchmark.</p>
    </div>
  `;
}"""
text = re.sub(r'function renderAnswerGrid\(data\) \{[\s\S]*?</div>\s*`;\n\}', new_answer_grid, text, count=1)

# Chunk 4: renderYearTrend
text = text.replace('const trend = analytics.yearSeatTrend(data);', 'const trend = analytics.competitivenessTrendByYear(data);')

# Chunk 5: updateExploreSection
new_update_explore = """function updateExploreSection() {
  const filtered = getFilteredData();

  renderStats(filtered);
  renderInsights(filtered);
  renderAnswerGrid(filtered);

  buildBarChart(iitChart, analytics.programsOfferedByIIT(filtered));

  const sortedBranchCov = analytics.sortEntries(analytics.averageClosingRankByBranch(filtered), null, false); // sort asc
  buildBarChart(branchChart, analytics.sortEntries(Object.fromEntries(sortedBranchCov), 6, false));
  
  renderYearTrend(filtered);
  
  const sortedBranchDesc = analytics.sortEntries(analytics.averageClosingRankByBranch(filtered), null, true); // sort desc
  renderLeaderboard(branchLeaderboard, analytics.sortEntries(Object.fromEntries(sortedBranchDesc), 5, true), "score");
  
  buildBarChart(diversityChart, analytics.branchDiversityByIIT(filtered));
  buildBarChart(coverageChart, analytics.branchCoverageAcrossIITs(filtered));
  renderLeaderboard(competitiveLeaderboard, analytics.mostCompetitive(filtered, 5), "record");
  renderLeaderboard(outlierLeaderboard, analytics.outliers(filtered), "outlier");
  renderTable(filtered);
}"""
text = re.sub(r'function updateExploreSection\(\) \{[\s\S]*?renderTable\(filtered\);\n\}', new_update_explore, text, count=1)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patch applied to script.js")
