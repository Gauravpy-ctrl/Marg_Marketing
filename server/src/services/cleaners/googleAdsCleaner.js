exports.cleanGoogleAdsData = (rows) => {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const parseNumber = (value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return 0;
      }

      return Number(
        String(value)
          .replace(/[$,%]/g, "")
          .replace(/,/g, "")
          .trim()
      ) || 0;
    };

    return {
      platform: "Google",
      sub_platform: "Google Ads",

      campaign:
        row["Campaign"] ||
        row["Campaign Name"] ||
        row["campaign"] ||
        "Unknown",

      spend: parseNumber(
        row["Spend"] ||
          row["Cost"] ||
          row["Amount Spent"] ||
          row["Amount spent (USD)"]
      ),

      revenue: parseNumber(
        row["Revenue"] ||
          row["Conversion Value"] ||
          row["Conversions Value"] ||
          row["Purchase Value"]
      ),

      clicks: parseNumber(
        row["Clicks"] ||
          row["Link Clicks"]
      ),

      impressions: parseNumber(
        row["Impressions"]
      ),

      conversions: parseNumber(
        row["Conversions"] ||
          row["Purchases"] ||
          row["Results"]
      ),

      ctr: parseNumber(
        row["CTR"]
      ),

      region:
        row["Region"] ||
        row["Country"] ||
        "Unknown",

      date:
        row["Date"] ||
        row["Day"] ||
        null,
    };
  });
};