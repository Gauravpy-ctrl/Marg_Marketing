const { generateCampaignBreakdown } = require("./campaignEngine");

exports.generateAnalytics = (data) => {

  // ── Totals ────────────────────────────────────────────────────────────────

  const totalSpend       = data.reduce((sum, row) => sum + (row.spend       || 0), 0);
  const totalRevenue     = data.reduce((sum, row) => sum + (row.revenue     || 0), 0);
  const totalClicks      = data.reduce((sum, row) => sum + (row.clicks      || 0), 0);
  const totalImpressions = data.reduce((sum, row) => sum + (row.impressions || 0), 0);
  const totalConversions = data.reduce((sum, row) => sum + (row.conversions || 0), 0);

  const overallCTR        = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const overallROAS       = totalSpend       > 0 ? totalRevenue / totalSpend              : 0;
  const conversionRate    = totalClicks      > 0 ? (totalConversions / totalClicks) * 100 : 0;

  // ── Dynamic platform breakdown ────────────────────────────────────────────
  // Groups by sub_platform (set by each cleaner). New platform cleaners
  // are automatically included here without any changes to this file.

  const platformMap = {};

  data.forEach((row) => {
    const key = row.sub_platform || row.platform || "Unknown";
    if (!platformMap[key]) {
      platformMap[key] = { spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0 };
    }
    const p = platformMap[key];
    p.spend       += row.spend       || 0;
    p.revenue     += row.revenue     || 0;
    p.clicks      += row.clicks      || 0;
    p.impressions += row.impressions || 0;
    p.conversions += row.conversions || 0;
  });

  const platformBreakdown = {};
  Object.entries(platformMap).forEach(([name, p]) => {
    platformBreakdown[name] = {
      ...p,
      roas:           p.spend       > 0 ? p.revenue / p.spend                : 0,
      ctr:            p.impressions > 0 ? (p.clicks / p.impressions) * 100   : 0,
      cpc:            p.clicks      > 0 ? p.spend / p.clicks                 : 0,
      conversionRate: p.clicks      > 0 ? (p.conversions / p.clicks) * 100   : 0,
    };
  });

  // ── Backward-compatible Google / Meta splits ──────────────────────────────
  // Derived from platformBreakdown so existing charts keep working unchanged.

  const sum = (keys, field) =>
    keys.reduce((acc, k) => acc + (platformBreakdown[k]?.[field] || 0), 0);

  const GOOGLE_KEYS = ["Google Ads", "Google"];
  const META_KEYS   = ["Facebook", "Instagram", "Meta", "Audience Network"];

  const googleRevenue = sum(GOOGLE_KEYS, "revenue");
  const metaRevenue   = sum(META_KEYS,   "revenue");
  const googleSpend   = sum(GOOGLE_KEYS, "spend");
  const metaSpend     = sum(META_KEYS,   "spend");

  // ── Campaign breakdown ────────────────────────────────────────────────────

  const campaignBreakdown = generateCampaignBreakdown(data);

  // ─────────────────────────────────────────────────────────────────────────

  return {
    // Totals
    totalSpend,
    totalRevenue,
    totalClicks,
    totalImpressions,
    totalConversions,

    // Blended rates
    overallCTR,
    overallROAS,
    conversionRate,

    // Backward-compatible platform split
    googleRevenue,
    metaRevenue,
    googleSpend,
    metaSpend,

    // New: full dynamic breakdowns
    platformBreakdown,
    campaignBreakdown,
  };
};
