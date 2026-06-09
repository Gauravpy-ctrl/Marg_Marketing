exports.generateAnalytics = (data) => {
  const totalSpend = data.reduce(
    (sum, row) => sum + (row.spend || 0),
    0
  );

  const totalRevenue = data.reduce(
    (sum, row) => sum + (row.revenue || 0),
    0
  );

  const totalClicks = data.reduce(
    (sum, row) => sum + (row.clicks || 0),
    0
  );

  const totalImpressions = data.reduce(
    (sum, row) => sum + (row.impressions || 0),
    0
  );

  const totalConversions = data.reduce(
    (sum, row) => sum + (row.conversions || 0),
    0
  );

  const ctr =
    totalImpressions > 0
      ? (totalClicks / totalImpressions) * 100
      : 0;

  const conversionRate =
    totalClicks > 0
      ? (totalConversions / totalClicks) * 100
      : 0;

  const roas =
    totalSpend > 0
      ? totalRevenue / totalSpend
      : 0;

  // PLATFORM BREAKDOWN
  const googleData = data.filter(
    (row) => row.platform === "Google"
  );

  const metaData = data.filter(
    (row) => row.platform === "Meta"
  );

  const googleRevenue = googleData.reduce(
    (sum, row) => sum + (row.revenue || 0),
    0
  );

  const googleSpend = googleData.reduce(
    (sum, row) => sum + (row.spend || 0),
    0
  );

  const metaRevenue = metaData.reduce(
    (sum, row) => sum + (row.revenue || 0),
    0
  );

  const metaSpend = metaData.reduce(
    (sum, row) => sum + (row.spend || 0),
    0
  );

  return {
    totalSpend,
    totalRevenue,
    totalClicks,
    totalImpressions,
    totalConversions,
    ctr,
    conversionRate,
    roas,

    platformBreakdown: {
      Google: {
        revenue: googleRevenue,
        spend: googleSpend,
        roas:
          googleSpend > 0
            ? googleRevenue / googleSpend
            : 0,
      },

      Meta: {
        revenue: metaRevenue,
        spend: metaSpend,
        roas:
          metaSpend > 0
            ? metaRevenue / metaSpend
            : 0,
      },
    },
  };
};