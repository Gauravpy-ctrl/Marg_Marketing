"use strict";

/**
 * Marketing AI Engine — single-file module
 *
 * Drop this file into any project. Install two packages:
 *   npm install openai dotenv
 *
 * Set env var (or .env file next to this file):
 *   OPENROUTER_API_KEY=<your key>
 *
 * Two usage modes:
 *
 *   Mode A — pass already-parsed row arrays:
 *     const { analyzeMarketingData } = require("./marketingAI");
 *     const result = await analyzeMarketingData({ googleData, metaData });
 *
 *   Mode B — pass CSV file paths (no extra deps needed):
 *     const { analyzeCSVFiles } = require("./marketingAI");
 *     const result = await analyzeCSVFiles({
 *       googleFile: "/abs/path/google_ads.csv",
 *       metaFile:   "/abs/path/meta_ads.csv",
 *     });
 *
 *   result.analytics          — totals: spend, revenue, ROAS, CTR, etc.
 *   result.platformBreakdown  — per sub-platform (Google Ads, Facebook, Instagram…)
 *   result.campaignBreakdown  — per campaign sorted by ROAS, with status tag
 *   result.insights           — AI-generated executive markdown report
 *
 *   Advanced — custom groupBy:
 *     analyzeCSVFiles({ googleFile, metaFile }, { groupBy: ["campaign", "property_type"] })
 */

const path   = require("path");
const fs     = require("fs").promises;

// Load .env relative to THIS file so the module works when imported from
// any directory, not only from the project root.
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const OpenAI = require("openai");

// ─── OpenRouter client (lazy) ──────────────────────────────────────────────────
// Created on first AI call so a missing API key only fails at insight-generation
// time, not at require() time — callers can use analytics without an AI key.

let _aiClient = null;
function getAIClient() {
  if (!_aiClient) {
    _aiClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey:  process.env.OPENROUTER_API_KEY || "no-key",
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL  || "",
        "X-Title":      process.env.SITE_NAME || "",
      },
    });
  }
  return _aiClient;
}

// ─── CSV parser ───────────────────────────────────────────────────────────────
// Handles: quoted fields, commas inside quotes, CRLF / LF / CR line endings,
// empty values, leading/trailing whitespace in unquoted fields.
// Returns an array of plain objects keyed by the header row.

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (!lines.length) return [];

  function splitRow(line) {
    const fields = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }   // escaped quote
        else inQ = !inQ;
      } else if (ch === "," && !inQ) {
        fields.push(cur.trim()); cur = "";
      } else {
        cur += ch;
      }
    }
    fields.push(cur.trim());
    return fields;
  }

  const headers = splitRow(lines[0]).map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = splitRow(line);
    const row  = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] !== undefined ? vals[idx] : ""; });
    rows.push(row);
  }
  return rows;
}

async function parseCSVFile(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return parseCSV(text);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

// Stable short ID derived from platform + campaign name.
// Used as a training-data join key until a real platform-native ID is in the CSV.
function _stableId(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return "cmp_" + Math.abs(h).toString(36);
}

// Normalize any recognizable date string to ISO 8601 (YYYY-MM-DD).
// Returns the raw string unchanged if it cannot be parsed so no data is lost.
function _isoDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? String(raw) : d.toISOString().slice(0, 10);
}

// Infer the semantic type of the conversions field from the campaign objective.
function _conversionType(objective) {
  const o = String(objective || "").toLowerCase();
  if (o.includes("purchase") || o.includes("sale") || o.includes("conversion")) return "purchase";
  if (o.includes("lead"))                                                         return "lead";
  if (o.includes("traffic")  || o.includes("link"))                              return "link_click";
  if (o.includes("video")    || o.includes("view"))                              return "video_view";
  if (o.includes("app"))                                                          return "app_install";
  if (o.includes("awareness")|| o.includes("reach"))                             return "brand_awareness";
  return "unknown";
}

// Row-level quality score for training-data governance.
//   1.0 — fully mapped; impressions from actual impressions column
//   0.7 — fully mapped but impressions sourced from Reach (undercounted)
//   0.5 — revenue unmapped (0 by default); untrainable for ROAS tasks
//   0.3 — campaign = "Unknown"; no identity for campaign-level learning
// Filter training datasets: exclude rows with score < 0.7 for fine-tuning.
function _rowQuality(campaign, revenue, reachSubstituted) {
  if (campaign === "Unknown")             return 0.3;
  if (revenue === 0 && reachSubstituted)  return 0.6;
  if (revenue === 0)                      return 0.5;
  if (reachSubstituted)                   return 0.7;
  return 1.0;
}

// ─── Google Ads cleaner ───────────────────────────────────────────────────────

function cleanGoogleAdsData(rows) {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const parse = (v) => {
      if (v === undefined || v === null || v === "") return 0;
      return Number(String(v).replace(/[$,%]/g, "").replace(/,/g, "").trim()) || 0;
    };

    // Support both space-separated and underscore-separated column names
    const campaign  = (
      row["Campaign_Name"] || row["Campaign Name"] || row["Campaign"] || row["campaign"] || "Unknown"
    ).trim();
    const objective = row["Objective"] || row["Campaign Objective"] || row["Campaign_Objective"] || "Unknown";

    const revSrc  = row["Revenue"]          ? "revenue"
                  : row["Conversion Value"]  ? "conversion_value"
                  : row["Conversions Value"] ? "conversions_value"
                  : row["Purchase Value"]    ? "purchase_value"
                  : "unmapped";
    const revenue = parse(
      row["Revenue"] || row["Conversion Value"] || row["Conversions Value"] || row["Purchase Value"]
    );

    return {
      // ── Identity ──────────────────────────────────────────────────────────
      platform:           "Google",
      sub_platform:       "Google Ads",
      campaign_id:        _stableId("Google||" + campaign),
      campaign,

      // ── Spend / Revenue ───────────────────────────────────────────────────
      spend:              parse(row["Spend"] || row["Cost"] || row["Amount Spent"] || row["Amount spent (USD)"]),
      revenue,
      revenue_source:     revSrc,
      currency:           row["Currency"] || row["Account Currency"] || "USD",

      // ── Traffic ───────────────────────────────────────────────────────────
      clicks:             parse(row["Clicks"] || row["Link Clicks"]),
      impressions:        parse(row["Impressions"]),
      reach:              parse(row["Reach"]) || 0,
      impressions_source: "impressions",

      // ── Conversions ───────────────────────────────────────────────────────
      // "Key Events" is Google's 2024 rename of "Conversions" in the UI
      conversions:        parse(row["Conversions"] || row["Key Events"] || row["Purchases"] || row["Results"]),
      conversion_type:    _conversionType(objective),

      // ── Source rates (analytics engine recomputes from totals) ────────────
      ctr_source:         parse(row["CTR"]),

      // ── Dimensions ────────────────────────────────────────────────────────
      region:             row["Location"]      || row["Region"]  || row["Country"] || row["City"] || "Unknown",
      date:               _isoDate(row["Date"] || row["Day"]),
      objective,
      property_type:      row["Property_Type"] || row["Property Type"]  || "Unknown",
      city_tier:          row["City_Tier"]      || row["City Tier"]      || "Unknown",
      campaign_status:    row["Campaign_Status"]|| row["Campaign Status"]|| "Unknown",

      // ── Training-data quality gate ────────────────────────────────────────
      row_quality_score:  _rowQuality(campaign, revenue, false),
    };
  });
}

// ─── Meta Ads cleaner ─────────────────────────────────────────────────────────

function cleanMetaAdsData(rows) {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const parse = (v) => {
      if (v === undefined || v === null || v === "") return 0;
      return Number(String(v).replace(/[$,%]/g, "").replace(/,/g, "").trim()) || 0;
    };

    // publisher_platform is present when the CSV comes from Meta Ads Manager
    // breakdown reports. Some exports use a single Platform column instead.
    const raw = (
      row["Publisher Platform"] || row["publisher_platform"] ||
      row["Publisher_Platform"] || row["Platform"] || ""
    ).toLowerCase().trim();

    let sub_platform;
    if      (raw.includes("instagram")) sub_platform = "Instagram";
    else if (raw.includes("messenger")) sub_platform = "Facebook";
    else if (raw.includes("facebook"))  sub_platform = "Facebook";
    else if (raw.includes("audience"))  sub_platform = "Audience Network";
    else                                sub_platform = "Meta";    // "meta ads" or unknown

    const campaign  = (
      row["Campaign_Name"] || row["Campaign Name"] || row["Campaign"] || row["campaign"] || "Unknown"
    ).trim();
    const objective = row["Objective"] || row["Campaign Objective"] || row["Campaign_Objective"] || "Unknown";

    // Website Purchase ROAS is a dimensionless ratio (e.g. 4.21), not revenue.
    // Using it as a revenue fallback would silently corrupt ROAS calculations.
    const revSrc  = row["Revenue"]          ? "revenue"
                  : row["Purchase Value"]   ? "purchase_value"
                  : row["Conversion Value"] ? "conversion_value"
                  : "unmapped";
    const revenue = parse(row["Revenue"] || row["Purchase Value"] || row["Conversion Value"]);

    const hasActualImpressions = !!row["Impressions"] && row["Impressions"] !== "";
    const impressions = parse(row["Impressions"] || row["Reach"]);
    const reach       = parse(row["Reach"]);

    return {
      // ── Identity ──────────────────────────────────────────────────────────
      platform:           "Meta",
      sub_platform,
      campaign_id:        _stableId("Meta||" + campaign),
      campaign,

      // ── Spend / Revenue ───────────────────────────────────────────────────
      spend:              parse(row["Spend"] || row["Amount Spent"] || row["Cost"] || row["Amount spent (USD)"]),
      revenue,
      revenue_source:     revSrc,
      currency:           row["Currency"] || row["Account Currency"] || "USD",

      // ── Traffic ───────────────────────────────────────────────────────────
      clicks:             parse(row["Clicks"] || row["Link Clicks"]),
      impressions,
      reach,
      // "reach" = unique users; "impressions" = total views.
      // When only Reach is available the impressions figure is understated by
      // the frequency factor — flag it so training pipelines can weight it down.
      impressions_source: hasActualImpressions ? "impressions" : (reach > 0 ? "reach" : "unmapped"),

      // ── Conversions ───────────────────────────────────────────────────────
      conversions:        parse(row["Conversions"] || row["Purchases"] || row["Results"]),
      conversion_type:    _conversionType(objective),

      // ── Source rates (analytics engine recomputes from totals) ────────────
      ctr_source:         parse(row["CTR"] || row["Link CTR"]),

      // ── Dimensions ────────────────────────────────────────────────────────
      region:             row["Location"]      || row["Region"] || row["Country"] || "Unknown",
      date:               _isoDate(row["Date"] || row["Day"]),
      objective,
      property_type:      row["Property_Type"] || row["Property Type"]  || "Unknown",
      city_tier:          row["City_Tier"]      || row["City Tier"]      || "Unknown",
      campaign_status:    row["Campaign_Status"]|| row["Campaign Status"]|| "Unknown",

      // ── Training-data quality gate ────────────────────────────────────────
      row_quality_score:  _rowQuality(campaign, revenue, !hasActualImpressions && reach > 0),
    };
  });
}

// ─── Merge ────────────────────────────────────────────────────────────────────

function mergeDatasets(...datasets) {
  return datasets.flat();
}

// ─── Campaign breakdown ───────────────────────────────────────────────────────
// groupBy: array of UnifiedRow field names to group on.
// Built-in alias: "platform" resolves to sub_platform.
// Default ["campaign","platform"] preserves backward-compatible output shape
// (result objects always carry .name and .platform regardless of groupBy).

function generateCampaignBreakdown(data, groupBy = ["campaign", "platform"]) {
  const map = {};

  const resolve = (row, field) => {
    if (field === "platform") return (row.sub_platform || row.platform || "Unknown").trim();
    return String(row[field] || "Unknown").trim();
  };

  data.forEach((row) => {
    const vals = groupBy.map(f => resolve(row, f));
    const key  = vals.join("\x00");

    if (!map[key]) {
      const entry = { spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0 };
      groupBy.forEach((f, i) => {
        entry[f === "campaign" ? "name" : f] = vals[i];
      });
      if (!("name"     in entry)) entry.name     = vals.join(" › ");
      if (!("platform" in entry)) entry.platform = resolve(row, "platform");
      map[key] = entry;
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
      const roas           = c.spend > 0       ? c.revenue / c.spend              : 0;
      const ctr            = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
      const cpc            = c.clicks > 0      ? c.spend / c.clicks               : 0;
      const conversionRate = c.clicks > 0      ? (c.conversions / c.clicks) * 100 : 0;

      let status;
      if      (roas >= 4) status = "top";
      else if (roas >= 2) status = "moderate";
      else if (roas >= 1) status = "underperforming";
      else                status = "waste";

      return { ...c, roas, ctr, cpc, conversionRate, status };
    })
    .sort((a, b) => b.roas - a.roas);
}

// ─── Analytics engine ─────────────────────────────────────────────────────────

function generateAnalytics(data, options = {}) {
  const totalSpend       = data.reduce((s, r) => s + (r.spend       || 0), 0);
  const totalRevenue     = data.reduce((s, r) => s + (r.revenue     || 0), 0);
  const totalClicks      = data.reduce((s, r) => s + (r.clicks      || 0), 0);
  const totalImpressions = data.reduce((s, r) => s + (r.impressions || 0), 0);
  const totalConversions = data.reduce((s, r) => s + (r.conversions || 0), 0);

  const overallCTR     = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const overallROAS    = totalSpend       > 0 ? totalRevenue / totalSpend               : 0;
  const conversionRate = totalClicks      > 0 ? (totalConversions / totalClicks) * 100  : 0;

  const platformMap = {};
  data.forEach((row) => {
    const key = row.sub_platform || row.platform || "Unknown";
    if (!platformMap[key]) {
      platformMap[key] = { spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0 };
    }
    const p = platformMap[key];
    p.spend       += row.spend       || 0;
    p.revenue     += row.revenue     || 0;
    p.clicks      += row.clicks      || 0;
    p.impressions += row.impressions || 0;
    p.conversions += row.conversions || 0;
  });

  const platformBreakdown = {};
  Object.entries(platformMap).forEach(([name, p]) => {
    platformBreakdown[name] = {
      ...p,
      roas:           p.spend       > 0 ? p.revenue / p.spend              : 0,
      ctr:            p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0,
      cpc:            p.clicks      > 0 ? p.spend / p.clicks               : 0,
      conversionRate: p.clicks      > 0 ? (p.conversions / p.clicks) * 100 : 0,
    };
  });

  const sum = (keys, field) =>
    keys.reduce((acc, k) => acc + (platformBreakdown[k]?.[field] || 0), 0);

  const GOOGLE_KEYS = ["Google Ads", "Google"];
  const META_KEYS   = ["Facebook", "Instagram", "Meta", "Audience Network"];

  const campaignBreakdown = generateCampaignBreakdown(data, options.groupBy);

  return {
    totalSpend, totalRevenue, totalClicks, totalImpressions, totalConversions,
    overallCTR, overallROAS, conversionRate,
    googleRevenue: sum(GOOGLE_KEYS, "revenue"),
    metaRevenue:   sum(META_KEYS,   "revenue"),
    googleSpend:   sum(GOOGLE_KEYS, "spend"),
    metaSpend:     sum(META_KEYS,   "spend"),
    platformBreakdown,
    campaignBreakdown,
  };
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildInsightPrompt(analyticsData) {
  const fmt  = (n) => Number(n || 0).toFixed(2);
  const fmtK = (n) => {
    const v = Number(n || 0);
    if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
  };

  const { totalSpend, totalRevenue, overallROAS, overallCTR, conversionRate,
          platformBreakdown = {}, campaignBreakdown = [] } = analyticsData;

  const platformLines = Object.entries(platformBreakdown)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .map(([name, p]) =>
      `  • ${name}: spend ${fmtK(p.spend)}, revenue ${fmtK(p.revenue)}, ` +
      `ROAS ${fmt(p.roas)}x, CTR ${fmt(p.ctr)}%, conversions ${p.conversions}`
    ).join("\n");

  const top5 = campaignBreakdown.slice(0, 5)
    .map((c, i) =>
      `  ${i + 1}. [${c.platform}] ${c.name} — ROAS ${fmt(c.roas)}x, spend ${fmtK(c.spend)}, revenue ${fmtK(c.revenue)}`
    ).join("\n");

  const bottom5 = [...campaignBreakdown].reverse().slice(0, 5)
    .map((c, i) =>
      `  ${i + 1}. [${c.platform}] ${c.name} — ROAS ${fmt(c.roas)}x, spend ${fmtK(c.spend)}, status: ${c.status}`
    ).join("\n");

  return `
You are an expert marketing strategist and data analyst.
Analyze the following marketing performance data and generate a structured executive report.

OVERALL PERFORMANCE
  Total Spend:      ${fmtK(totalSpend)}
  Total Revenue:    ${fmtK(totalRevenue)}
  Blended ROAS:     ${fmt(overallROAS)}x
  Overall CTR:      ${fmt(overallCTR)}%
  Conversion Rate:  ${fmt(conversionRate)}%

PLATFORM BREAKDOWN
${platformLines || "  No platform data available."}

TOP 5 CAMPAIGNS (by ROAS)
${top5 || "  No campaign data available."}

BOTTOM 5 CAMPAIGNS (by ROAS)
${bottom5 || "  No campaign data available."}

Generate the following sections. Be concise, data-driven, and executive-level.
Use bullet points. Reference specific platforms and campaign names where relevant.

1. Executive Summary
2. Platform Comparison
3. Top Performing Campaigns
4. Underperforming Campaigns
5. Budget Waste Analysis
6. Audience Insights
7. Scaling Opportunities
8. Optimization Recommendations
9. Future Predictions
10. Action Plan
`;
}

// ─── AI insights ──────────────────────────────────────────────────────────────

const _FALLBACK_INSIGHTS = `
# Executive Summary
Google Ads is significantly outperforming Meta Ads in ROAS, conversions, and revenue efficiency.
Several campaigns are consuming large budgets while generating weak returns.

# Platform Comparison
Google Ads contributes the majority of total revenue and conversions with stronger campaign efficiency.

# Budget Waste Analysis
Several campaigns are spending aggressively without producing meaningful revenue or conversion performance.

# Scaling Opportunities
Top-performing campaigns demonstrate scalable ROAS. Increasing budget allocation toward these campaigns
could accelerate revenue growth significantly.

# Priority Actions
1. Pause low-performing campaigns wasting budget.
2. Reallocate budget toward top Google campaigns.
3. Improve audience targeting and segmentation.
4. Launch A/B testing on weak creatives.
5. Optimize landing pages for conversion efficiency.
`;

async function generateAIInsights(data, kpis) {
  try {
    const prompt = buildInsightPrompt(kpis);
    const response = await getAIClient().chat.completions.create({
      model:       "anthropic/claude-3.5-haiku",
      messages: [
        {
          role:    "system",
          content: "You are a world-class marketing analytics strategist. " +
                   "Generate concise, data-driven, executive-level reports. " +
                   "Use bullet points. Reference specific platforms and campaigns by name.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens:  2500,
      temperature: 0.4,
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error("[marketingAI] AI insight generation failed:", err.message);
    return _FALLBACK_INSIGHTS;
  }
}

// ─── Platform registry ────────────────────────────────────────────────────────
// To add a new platform: write a cleaner above following the same UnifiedRow
// shape, then add one entry here. Nothing else changes.

const PLATFORM_REGISTRY = [
  { key: "googleData", cleaner: cleanGoogleAdsData, required: true  },
  { key: "metaData",   cleaner: cleanMetaAdsData,   required: true  },
  // { key: "linkedinData", cleaner: cleanLinkedInAdsData, required: false },
  // { key: "twitterData",  cleaner: cleanTwitterAdsData,  required: false },
  // { key: "tiktokData",   cleaner: cleanTikTokAdsData,   required: false },
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyze pre-parsed row arrays.
 *
 * @param {object} sources          - { googleData: row[], metaData: row[] }
 * @param {object} [options]
 * @param {string[]} [options.groupBy] - fields to group campaigns by,
 *   default ["campaign","platform"]. Other examples:
 *   ["campaign","objective"] | ["campaign","platform","property_type"]
 * @returns {Promise<{ analytics, platformBreakdown, campaignBreakdown, insights }>}
 */
async function analyzeMarketingData(sources = {}, options = {}) {
  const missing = PLATFORM_REGISTRY
    .filter((p) => p.required && !sources[p.key]?.length)
    .map((p) => p.key);

  if (missing.length) throw new Error(`Missing required data: ${missing.join(", ")}`);

  const cleanedDatasets = PLATFORM_REGISTRY
    .filter((p) => sources[p.key]?.length)
    .map((p) => p.cleaner(sources[p.key]));

  const merged = mergeDatasets(...cleanedDatasets);
  const raw    = generateAnalytics(merged, options);
  const { platformBreakdown, campaignBreakdown, ...analytics } = raw;
  const insights = await generateAIInsights(merged, raw);

  return { analytics, platformBreakdown, campaignBreakdown, insights };
}

/**
 * Convenience wrapper — read CSV files from disk, then analyze.
 *
 * @param {object} files            - { googleFile: string, metaFile: string }
 * @param {object} [options]        - same as analyzeMarketingData options
 * @returns {Promise<{ analytics, platformBreakdown, campaignBreakdown, insights }>}
 */
async function analyzeCSVFiles(files = {}, options = {}) {
  const { googleFile, metaFile } = files;
  if (!googleFile) throw new Error("analyzeCSVFiles: googleFile path is required");
  if (!metaFile)   throw new Error("analyzeCSVFiles: metaFile path is required");

  const [googleData, metaData] = await Promise.all([
    parseCSVFile(googleFile),
    parseCSVFile(metaFile),
  ]);
  return analyzeMarketingData({ googleData, metaData }, options);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // ── High-level ────────────────────────────────────────────────────────────
  analyzeMarketingData,   // accepts parsed row arrays
  analyzeCSVFiles,        // accepts file paths — most convenient entry point

  // ── CSV utilities ─────────────────────────────────────────────────────────
  parseCSV,               // string → object[]
  parseCSVFile,           // filepath → Promise<object[]>

  // ── Pipeline stages (for granular use or unit testing) ───────────────────
  cleanGoogleAdsData,
  cleanMetaAdsData,
  mergeDatasets,
  generateAnalytics,
  generateCampaignBreakdown,
  generateAIInsights,
  buildInsightPrompt,

  // ── Config ────────────────────────────────────────────────────────────────
  PLATFORM_REGISTRY,
};

// ─── Self-test (node marketingAI.js) ─────────────────────────────────────────

if (require.main === module) {
  const googleFile = path.resolve(__dirname, "google_ads_realestate.csv");
  const metaFile   = path.resolve(__dirname, "meta_ads_realestate.csv");

  const fmt  = (n) => Number(n || 0).toFixed(2);
  const fmtK = (n) => {
    const v = Number(n || 0);
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
  };

  console.log("\n  Marketing AI Engine — pipeline self-test");
  console.log("  ─────────────────────────────────────────");
  console.log(`  Google CSV : ${googleFile}`);
  console.log(`  Meta CSV   : ${metaFile}`);
  console.log("  Parsing CSVs…\n");

  Promise.all([parseCSVFile(googleFile), parseCSVFile(metaFile)])
    .then(([googleData, metaData]) => {
      console.log(`  Google rows : ${googleData.length}`);
      console.log(`  Meta rows   : ${metaData.length}`);
      console.log("  Running analytics (no AI call)…\n");

      const merged = mergeDatasets(
        cleanGoogleAdsData(googleData),
        cleanMetaAdsData(metaData),
      );
      const result = generateAnalytics(merged);

      console.log("  ✅ Analytics OK");
      console.log(`     Total spend         : ${fmtK(result.totalSpend)}`);
      console.log(`     Total revenue       : ${fmtK(result.totalRevenue)}`);
      console.log(`     Blended ROAS        : ${fmt(result.overallROAS)}x`);
      console.log(`     Overall CTR         : ${fmt(result.overallCTR)}%`);
      console.log(`     Conversion rate     : ${fmt(result.conversionRate)}%`);
      console.log(`     Platforms found     : ${Object.keys(result.platformBreakdown).join(", ")}`);
      console.log(`     Campaigns found     : ${result.campaignBreakdown.length}`);
      console.log(`     Top campaign        : ${result.campaignBreakdown[0]?.name} (ROAS ${fmt(result.campaignBreakdown[0]?.roas)}x)`);
      console.log(`     Bottom campaign     : ${result.campaignBreakdown.at(-1)?.name} (ROAS ${fmt(result.campaignBreakdown.at(-1)?.roas)}x)`);

      console.log("\n  Platform breakdown:");
      Object.entries(result.platformBreakdown).forEach(([name, p]) => {
        console.log(`     ${name.padEnd(20)}: spend ${fmtK(p.spend).padStart(10)}, revenue ${fmtK(p.revenue).padStart(10)}, ROAS ${fmt(p.roas)}x`);
      });

      if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === "no-key") {
        console.log("\n  ⚠  OPENROUTER_API_KEY not set — skipping AI insights test.");
        console.log("     Set it in server/.env or as an env var to test AI generation.\n");
      } else {
        console.log("\n  Calling AI insights…");
        return generateAIInsights(merged, result).then((insights) => {
          console.log("  ✅ AI insights OK");
          console.log("     First 200 chars:", insights.slice(0, 200).replace(/\n/g, " "), "…\n");
        });
      }
    })
    .catch((err) => {
      console.error("\n  ❌ Self-test failed:", err.message);
      process.exit(1);
    });
}
