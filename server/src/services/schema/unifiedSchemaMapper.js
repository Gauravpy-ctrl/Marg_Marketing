exports.mapToUnifiedSchema = (
  cleanedData
) => {
  return cleanedData.map((row) => ({
    campaign_name:
      row.campaign_name || "unknown",

    platform:
      row.platform || "unknown",

    date: row.date || null,

    spend: row.spend || 0,

    clicks: row.clicks || 0,

    impressions:
      row.impressions || 0,

    conversions:
      row.conversions || 0,

    revenue: row.revenue || 0,

    ctr: row.ctr || 0,

    cpc: row.cpc || 0,

    roas: row.roas || 0,

    device:
      row.device || "unknown",

    region:
      row.region || "unknown",
  }));
};