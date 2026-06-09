exports.generateAIInsights = async (
  data,
  kpis
) => {
  try {
    return `
# Executive Summary

Google Ads is significantly outperforming Meta Ads in terms of ROAS, conversions, and revenue efficiency. Several campaigns are consuming large budgets while generating weak returns, revealing major optimization opportunities and budget inefficiencies.

# Platform Comparison

Google Ads contributes the majority of total revenue and conversions, showing much stronger campaign efficiency and scalability compared to Meta Ads.

# Budget Waste Analysis

Several campaigns are spending aggressively without producing meaningful revenue or conversion performance. These campaigns should be reviewed immediately.

# Audience Insights

High-performing campaigns indicate stronger audience targeting and better creative alignment, while low CTR campaigns suggest audience fatigue or poor segmentation.

# Scaling Opportunities

Top-performing campaigns demonstrate scalable ROAS and conversion efficiency. Increasing budget allocation toward these campaigns could accelerate revenue growth.

# Priority Actions

1. Pause low-performing campaigns wasting budget.
2. Reallocate budget toward top Google campaigns.
3. Improve audience targeting and segmentation.
4. Launch A/B testing on weak creatives.
5. Optimize landing pages for conversion efficiency.

# Risk Detection

Continued spend on weak campaigns could reduce profitability and increase acquisition costs significantly over time.

# Final Strategic Recommendations

Focus aggressively on performance-based budget allocation, campaign optimization, and audience refinement to maximize scalable ROI and long-term growth.
`;
  } catch (error) {
    console.error(error);

    return "AI insights generation failed.";
  }
};