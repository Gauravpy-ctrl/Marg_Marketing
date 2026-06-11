const fmt  = (n) => Number(n || 0).toFixed(2);
const fmtK = (n) => {
  const v = Number(n || 0);
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

exports.buildInsightPrompt = (analyticsData) => {
  const {
    totalSpend, totalRevenue, overallROAS, overallCTR, conversionRate,
    platformBreakdown = {},
    campaignBreakdown = [],
  } = analyticsData;

  // Platform summary lines
  const platformLines = Object.entries(platformBreakdown)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .map(([name, p]) =>
      `  • ${name}: spend ${fmtK(p.spend)}, revenue ${fmtK(p.revenue)}, ` +
      `ROAS ${fmt(p.roas)}x, CTR ${fmt(p.ctr)}%, conversions ${p.conversions}`
    )
    .join("\n");

  // Top 5 campaigns
  const top5 = campaignBreakdown.slice(0, 5)
    .map((c, i) =>
      `  ${i + 1}. [${c.platform}] ${c.name} — ` +
      `ROAS ${fmt(c.roas)}x, spend ${fmtK(c.spend)}, revenue ${fmtK(c.revenue)}`
    )
    .join("\n");

  // Bottom 5 campaigns (worst ROAS with spend > 0)
  const bottom5 = [...campaignBreakdown]
    .reverse()
    .slice(0, 5)
    .map((c, i) =>
      `  ${i + 1}. [${c.platform}] ${c.name} — ` +
      `ROAS ${fmt(c.roas)}x, spend ${fmtK(c.spend)}, status: ${c.status}`
    )
    .join("\n");

  return `
You are an expert marketing strategist and data analyst.

Analyze the following marketing performance data and generate a structured executive report.

OVERALL PERFORMANCE
  Total Spend:      ${fmtK(totalSpend)}
  Total Revenue:    ${fmtK(totalRevenue)}
  Blended ROAS:     ${fmt(overallROAS)}x
  Overall CTR:      ${fmt(overallCTR)}%
  Conversion Rate:  ${fmt(conversionRate)}%

PLATFORM BREAKDOWN
${platformLines || "  No platform data available."}

TOP 5 CAMPAIGNS (by ROAS)
${top5 || "  No campaign data available."}

BOTTOM 5 CAMPAIGNS (by ROAS)
${bottom5 || "  No campaign data available."}

Generate the following sections. Be concise, data-driven, and executive-level.
Use bullet points. Reference specific platforms and campaign names where relevant.

1. Executive Summary
2. Platform Comparison
3. Top Performing Campaigns
4. Underperforming Campaigns
5. Budget Waste Analysis
6. Audience Insights
7. Scaling Opportunities
8. Optimization Recommendations
9. Future Predictions
10. Action Plan
`;
};
