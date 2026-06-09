exports.buildInsightPrompt = (analyticsData) => {
  return `
You are an expert marketing strategist and data analyst.

Analyze the following marketing analytics data.

DATA:
${JSON.stringify(analyticsData, null, 2)}

Generate:

1. Executive Summary
2. Top Performing Campaigns
3. Worst Performing Campaigns
4. Budget Waste Analysis
5. Audience Insights
6. Platform Comparison
7. Optimization Recommendations
8. Scaling Opportunities
9. Future Predictions
10. Action Plan

Rules:
- Be concise
- Be data-driven
- Be executive-level
- Be dashboard-friendly
- Use bullet points where needed
`;
};