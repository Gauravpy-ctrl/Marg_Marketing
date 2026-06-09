require("dotenv").config();

// ===============================
// CLEANERS
// ===============================

const {
  cleanGoogleAdsData,
} = require(
  "./services/cleaners/googleAdsCleaner"
);

const {
  cleanMetaAdsData,
} = require(
  "./services/cleaners/metaAdsCleaner"
);

// ===============================
// SCHEMA
// ===============================

const {
  mapToUnifiedSchema,
} = require(
  "./services/schema/unifiedSchemaMapper"
);

// ===============================
// MERGE ENGINE
// ===============================

const {
  mergeDatasets,
} = require(
  "./services/merge/mergeEngine"
);

// ===============================
// KPI ENGINE
// ===============================

const {
  calculateKPIs,
} = require(
  "./services/kpi/kpiEngine"
);

// ===============================
// ANALYTICS ENGINE
// ===============================

const {
  runAnalyticsEngine,
} = require(
  "./services/analytics/analyticsEngine"
);

// ===============================
// AI ENGINE
// ===============================

const {
  generateInsights,
} = require(
  "./services/ai/insightGenerator"
);

// ===============================
// SAMPLE GOOGLE ADS DATA
// ===============================

const googleRaw = [
  {
    "Campaign name": "Summer Sale",

    Cost: "1200",

    Clicks: "300",

    Impressions: "10000",

    Conversions: "20",

    "Conversion value": "7200",

    Day: "2026-06-01",

    Device: "Mobile",

    Region: "California",
  },

  {
    "Campaign name": "Brand Campaign",

    Cost: "900",

    Clicks: "250",

    Impressions: "8500",

    Conversions: "15",

    "Conversion value": "5000",

    Day: "2026-06-01",

    Device: "Desktop",

    Region: "Texas",
  },
];

// ===============================
// SAMPLE META ADS DATA
// ===============================

const metaRaw = [
  {
    "Campaign Name":
      "Meta Retargeting",

    "Amount Spent": "1800",

    "Link Clicks": "250",

    Impressions: "15000",

    Purchases: "8",

    "Purchase Conversion Value":
      "3200",

    Day: "2026-06-01",

    "Device Platform": "Desktop",

    Region: "Texas",
  },

  {
    "Campaign Name":
      "Lookalike Audience Campaign",

    "Amount Spent": "1500",

    "Link Clicks": "400",

    Impressions: "22000",

    Purchases: "18",

    "Purchase Conversion Value":
      "7600",

    Day: "2026-06-01",

    "Device Platform": "Mobile",

    Region: "California",
  },
];

// ===============================
// MAIN PIPELINE
// ===============================

(async () => {
  try {
    console.log(
      "\n========= STARTING PIPELINE =========\n"
    );

    // ===============================
    // CLEANING
    // ===============================

    const cleanedGoogle =
      cleanGoogleAdsData(
        googleRaw
      );

    const cleanedMeta =
      cleanMetaAdsData(metaRaw);

    console.log(
      "\n========= CLEANED GOOGLE =========\n"
    );

    console.log(cleanedGoogle);

    console.log(
      "\n========= CLEANED META =========\n"
    );

    console.log(cleanedMeta);

    // ===============================
    // UNIFIED SCHEMA
    // ===============================

    const unifiedGoogle =
      mapToUnifiedSchema(
        cleanedGoogle
      );

    const unifiedMeta =
      mapToUnifiedSchema(
        cleanedMeta
      );

    console.log(
      "\n========= UNIFIED DATA =========\n"
    );

    console.log(unifiedGoogle);

    console.log(unifiedMeta);

    // ===============================
    // MERGE DATASETS
    // ===============================

    const mergedData =
      mergeDatasets(
        unifiedGoogle,
        unifiedMeta
      );

    console.log(
      "\n========= MERGED DATA =========\n"
    );

    console.log(mergedData);

    // ===============================
    // KPI ENGINE
    // ===============================

    const kpis =
      calculateKPIs(mergedData);

    console.log(
      "\n========= KPI DATA =========\n"
    );

    console.log(kpis);

    // ===============================
    // ANALYTICS ENGINE
    // ===============================

    const analytics =
      runAnalyticsEngine(
        mergedData
      );

    console.log(
      "\n========= ANALYTICS =========\n"
    );

    console.log(analytics);

    // ===============================
    // AI INPUT
    // ===============================

    const aiInput = {
      ...kpis,

      ...analytics,
    };

    console.log(
      "\n========= AI INPUT =========\n"
    );

    console.log(aiInput);

    // ===============================
    // AI INSIGHTS
    // ===============================

    const insights =
      await generateInsights(
        aiInput
      );

    console.log(
      "\n========= AI INSIGHTS =========\n"
    );

    console.log(insights);

    console.log(
      "\n========= PIPELINE COMPLETED =========\n"
    );
  } catch (error) {
    console.error(
      "\n========= PIPELINE ERROR =========\n"
    );

    console.error(error);
  }
})();