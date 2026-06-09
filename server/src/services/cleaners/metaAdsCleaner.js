exports.cleanMetaAdsData = (rows) => {
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
      platform: "Meta",

      campaign:
        row["Campaign"] ||
        row["Campaign Name"] ||
        row["campaign"] ||
        "Unknown",

      spend: parseNumber(
        row["Spend"] ||
          row["Amount Spent"] ||
          row["Cost"] ||
          row["Amount spent (USD)"]
      ),

      revenue: parseNumber(
        row["Revenue"] ||
          row["Purchase Value"] ||
          row["Conversion Value"] ||
          row["Website Purchase ROAS"]
      ),

      clicks: parseNumber(
        row["Clicks"] ||
          row["Link Clicks"]
      ),

      impressions: parseNumber(
        row["Impressions"] ||
          row["Reach"]
      ),

      conversions: parseNumber(
        row["Conversions"] ||
          row["Purchases"] ||
          row["Results"]
      ),

      ctr: parseNumber(
        row["CTR"] ||
          row["Link CTR"]
      ),

      region:
        row["Region"] ||
        row["Country"] ||
        row["Location"] ||
        "Unknown",

      date:
        row["Date"] ||
        row["Day"] ||
        null,
    };
  });
};