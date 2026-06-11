// Computes per-campaign metrics from the merged dataset.
// Groups dynamically by (campaign name × sub_platform) — no platform names
// are hard-coded here. Adding a new platform cleaner in the future requires
// no changes to this file.

const generateCampaignBreakdown = (data) => {
  const map = {};

  data.forEach((row) => {
    const name     = (row.campaign || "Unknown").trim();
    const platform = row.sub_platform || row.platform || "Unknown";
    const key      = `${name}||${platform}`;

    if (!map[key]) {
      map[key] = {
        name,
        platform,
        spend:       0,
        revenue:     0,
        clicks:      0,
        impressions: 0,
        conversions: 0,
      };
    }

    const c = map[key];
    c.spend       += row.spend       || 0;
    c.revenue     += row.revenue     || 0;
    c.clicks      += row.clicks      || 0;
    c.impressions += row.impressions || 0;
    c.conversions += row.conversions || 0;
  });

  return Object.values(map)
    .filter((c) => c.spend > 0 || c.revenue > 0)
    .map((c) => {
      const roas           = c.spend > 0       ? c.revenue / c.spend           : 0;
      const ctr            = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
      const cpc            = c.clicks > 0      ? c.spend / c.clicks            : 0;
      const conversionRate = c.clicks > 0      ? (c.conversions / c.clicks) * 100 : 0;

      let status;
      if      (roas >= 4) status = "top";
      else if (roas >= 2) status = "moderate";
      else if (roas >= 1) status = "underperforming";
      else                status = "waste";

      return { ...c, roas, ctr, cpc, conversionRate, status };
    })
    .sort((a, b) => b.roas - a.roas);
};

module.exports = { generateCampaignBreakdown };
