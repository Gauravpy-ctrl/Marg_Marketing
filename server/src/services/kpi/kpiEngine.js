/**
 * @deprecated Use generateAnalytics() from services/analytics/analyticsEngine.js instead.
 * analyticsEngine is a strict superset: it returns the same totals plus
 * platformBreakdown and campaignBreakdown. This file is retained only
 * because testFullPipeline.js references it directly.
 */
exports.calculateKPIs = (data) => {
  const totalSpend = data.reduce(
    (sum, row) => sum + row.spend,
    0
  );

  const totalRevenue = data.reduce(
    (sum, row) => sum + row.revenue,
    0
  );

  const totalClicks = data.reduce(
    (sum, row) => sum + row.clicks,
    0
  );

  const totalImpressions = data.reduce(
    (sum, row) => sum + row.impressions,
    0
  );

  const totalConversions = data.reduce(
    (sum, row) => sum + row.conversions,
    0
  );

  return {
    total_spend:
      Number(totalSpend.toFixed(2)),

    total_revenue:
      Number(totalRevenue.toFixed(2)),

    total_clicks: totalClicks,

    total_impressions:
      totalImpressions,

    total_conversions:
      totalConversions,

    overall_ctr:
      totalImpressions > 0
        ? Number(
            (
              (totalClicks /
                totalImpressions) *
              100
            ).toFixed(2)
          )
        : 0,

    overall_roas:
      totalSpend > 0
        ? Number(
            (
              totalRevenue /
              totalSpend
            ).toFixed(2)
          )
        : 0,

    overall_cpc:
      totalClicks > 0
        ? Number(
            (
              totalSpend /
              totalClicks
            ).toFixed(2)
          )
        : 0,

    conversion_rate:
      totalClicks > 0
        ? Number(
            (
              (totalConversions /
                totalClicks) *
              100
            ).toFixed(2)
          )
        : 0,
  };
};