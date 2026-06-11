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

    const rawPublisher = (
      row["Publisher Platform"] ||
      row["publisher_platform"] ||
      row["Platform"] ||
      ""
    ).toLowerCase().trim();

    let sub_platform;
    if (rawPublisher.includes("instagram"))       sub_platform = "Instagram";
    else if (rawPublisher.includes("messenger"))  sub_platform = "Facebook";
    else if (rawPublisher.includes("facebook"))   sub_platform = "Facebook";
    else if (rawPublisher.includes("audience"))   sub_platform = "Audience Network";
    else                                          sub_platform = "Meta";

    return {
      platform: "Meta",
      sub_platform,

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