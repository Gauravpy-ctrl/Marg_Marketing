require("dotenv").config();

const {
  generateInsights,
} = require("./services/ai/insightGenerator");

const sampleAnalytics = {
  total_spend: 12000,

  total_revenue: 54000,

  overall_roas: 4.5,

  top_campaign: {
    name: "Summer Sale Campaign",
    roas: 7.2,
  },

  worst_campaign: {
    name: "Retargeting Test",
    cpa: 240,
  },

  platform_comparison: {
    google_roas: 5.1,
    meta_roas: 3.2,
  },
};

(async () => {
  try {
    const result =
      await generateInsights(
        sampleAnalytics
      );

    console.log(result);
  } catch (error) {
    console.error(error);
  }
})();