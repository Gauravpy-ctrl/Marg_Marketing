const getValue = (row, possibleKeys) => {
  for (const key of possibleKeys) {
    if (
      row[key] !== undefined &&
      row[key] !== null &&
      row[key] !== ""
    ) {
      return row[key];
    }
  }

  return 0;
};

const mergeDatasets = (googleData, metaData) => {
  const normalizedGoogle = googleData.map((row) => ({
    platform: "Google",

    campaign: getValue(row, [
      "Campaign",
      "Campaign name",
      "campaign",
      "campaign_name",
    ]),

    spend: Number(
      getValue(row, [
        "Cost",
        "Spend",
        "Amount spent",
        "spend",
        "cost",
      ])
    ),

    revenue: Number(
      getValue(row, [
        "Revenue",
        "Purchase value",
        "Conversion value",
        "revenue",
      ])
    ),

    clicks: Number(
      getValue(row, [
        "Clicks",
        "Link clicks",
        "clicks",
      ])
    ),

    impressions: Number(
      getValue(row, [
        "Impressions",
        "impressions",
      ])
    ),

    conversions: Number(
      getValue(row, [
        "Conversions",
        "Purchases",
        "Results",
        "conversions",
      ])
    ),

    region: getValue(row, [
      "Region",
      "Country",
      "Location",
      "region",
    ]),
  }));

  const normalizedMeta = metaData.map((row) => ({
    platform: "Meta",

    campaign: getValue(row, [
      "Campaign name",
      "Campaign",
      "campaign",
    ]),

    spend: Number(
      getValue(row, [
        "Amount spent (INR)",
        "Amount spent",
        "Spend",
        "spend",
      ])
    ),

    revenue: Number(
      getValue(row, [
        "Purchase ROAS",
        "Website purchases conversion value",
        "Revenue",
      ])
    ),

    clicks: Number(
      getValue(row, [
        "Link clicks",
        "Clicks",
      ])
    ),

    impressions: Number(
      getValue(row, [
        "Impressions",
      ])
    ),

    conversions: Number(
      getValue(row, [
        "Purchases",
        "Results",
        "Conversions",
      ])
    ),

    region: getValue(row, [
      "Region",
      "Country",
      "Location",
    ]),
  }));

  return [
    ...normalizedGoogle,
    ...normalizedMeta,
  ];
};

module.exports = {
  mergeDatasets,
};