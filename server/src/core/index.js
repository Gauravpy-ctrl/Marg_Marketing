/**
 * @module marketing-ai-core
 *
 * Public API of the Marketing AI processing pipeline.
 * Framework-agnostic — import from Express, a CLI script, an AI agent, or another service.
 *
 * Usage:
 *   const { analyzeMarketingData } = require('@marketing-ai/core');
 *   const result = await analyzeMarketingData({ googleData, metaData });
 *
 * Input:  { [platformKey]: UnifiedRow[] }  — pre-parsed CSV rows per platform
 * Output: { analytics, platformBreakdown, campaignBreakdown, insights }
 *
 * Requires env: OPENROUTER_API_KEY  (loaded by openRouterClient.js via dotenv)
 */

const { cleanGoogleAdsData } = require("../services/cleaners/googleAdsCleaner");
const { cleanMetaAdsData   } = require("../services/cleaners/metaAdsCleaner");
const { mergeDatasets       } = require("../services/merge/mergeEngine");
const { generateAnalytics   } = require("../services/analytics/analyticsEngine");
const { generateAIInsights  } = require("../services/ai/aiInsightGenerator");

// ─── Platform registry ────────────────────────────────────────────────────────
// Each entry maps an input key → its cleaner function.
// To add LinkedIn/Twitter/TikTok:
//   1. Create services/cleaners/<platform>Cleaner.js
//   2. Add one entry here — nothing else changes.

const PLATFORM_REGISTRY = [
  { key: "googleData", cleaner: cleanGoogleAdsData, required: true  },
  { key: "metaData",   cleaner: cleanMetaAdsData,   required: true  },
  // { key: "linkedinData", cleaner: cleanLinkedInAdsData, required: false },
  // { key: "twitterData",  cleaner: cleanTwitterAdsData,  required: false },
  // { key: "tiktokData",   cleaner: cleanTikTokAdsData,   required: false },
];

// ─── Pipeline ─────────────────────────────────────────────────────────────────

/**
 * Run the full marketing analytics pipeline.
 *
 * @param {Object} sources  - Plain object keyed by platform (e.g. { googleData, metaData })
 *                            Each value is an array of raw CSV row objects.
 * @returns {Promise<{analytics, platformBreakdown, campaignBreakdown, insights}>}
 */
async function analyzeMarketingData(sources = {}) {
  // Validate required platforms are present and non-empty
  const missing = PLATFORM_REGISTRY
    .filter((p) => p.required && !sources[p.key]?.length)
    .map((p) => p.key);

  if (missing.length) {
    throw new Error(`Missing required data: ${missing.join(", ")}`);
  }

  // Clean each platform's raw rows using its registered cleaner
  const cleanedDatasets = PLATFORM_REGISTRY
    .filter((p) => sources[p.key]?.length)
    .map((p) => p.cleaner(sources[p.key]));

  // Merge: pure concat — cleaners own the full UnifiedRow normalization
  const merged = mergeDatasets(...cleanedDatasets);

  // Analytics: totals + dynamic platformBreakdown + campaignBreakdown
  const raw = generateAnalytics(merged);

  const { platformBreakdown, campaignBreakdown, ...analytics } = raw;

  // AI insights: async, falls back gracefully if API key is absent
  const insights = await generateAIInsights(merged, raw);

  return {
    analytics,
    platformBreakdown,
    campaignBreakdown,
    insights,
  };
}

module.exports = { analyzeMarketingData, PLATFORM_REGISTRY };
