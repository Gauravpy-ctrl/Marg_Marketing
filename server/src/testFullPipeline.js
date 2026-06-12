/**
 * End-to-end pipeline test using the core module.
 * Run from server/: node src/testFullPipeline.js
 */
require("dotenv").config();

const { analyzeMarketingData } = require("./core");

// ── Sample data ───────────────────────────────────────────────────────────────

const googleRaw = [
  {
    "Campaign name": "Summer Sale",
    Cost: "1200", Clicks: "300", Impressions: "10000",
    Conversions: "20", "Conversion value": "7200",
    Day: "2026-06-01", Region: "California",
  },
  {
    "Campaign name": "Brand Campaign",
    Cost: "900", Clicks: "250", Impressions: "8500",
    Conversions: "15", "Conversion value": "5000",
    Day: "2026-06-01", Region: "Texas",
  },
];

const metaRaw = [
  {
    "Campaign Name": "Meta Retargeting",
    "Amount Spent": "1800", "Link Clicks": "250", Impressions: "15000",
    Purchases: "8", "Purchase Conversion Value": "3200",
    Day: "2026-06-01", "Publisher Platform": "facebook", Region: "Texas",
  },
  {
    "Campaign Name": "Lookalike Audience Campaign",
    "Amount Spent": "1500", "Link Clicks": "400", Impressions: "22000",
    Purchases: "18", "Purchase Conversion Value": "7600",
    Day: "2026-06-01", "Publisher Platform": "instagram", Region: "California",
  },
];

// ── Run ───────────────────────────────────────────────────────────────────────

(async () => {
  try {
    console.log("\n========= STARTING PIPELINE =========\n");

    const result = await analyzeMarketingData({
      googleData: googleRaw,
      metaData:   metaRaw,
    });

    console.log("\n========= ANALYTICS =========\n");
    console.log(result.analytics);

    console.log("\n========= PLATFORM BREAKDOWN =========\n");
    console.log(result.platformBreakdown);

    console.log("\n========= CAMPAIGN BREAKDOWN =========\n");
    console.log(result.campaignBreakdown);

    console.log("\n========= AI INSIGHTS (first 400 chars) =========\n");
    console.log(result.insights.slice(0, 400), "...");

    console.log("\n========= PIPELINE COMPLETED =========\n");
  } catch (error) {
    console.error("\n========= PIPELINE ERROR =========\n");
    console.error(error);
  }
})();
