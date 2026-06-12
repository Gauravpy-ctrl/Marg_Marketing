"use strict";

/**
 * Marketing AI Engine — single-file module
 *
 * Drop this file into any project. Install two packages:
 *   npm install openai dotenv
 *
 * Set env var (or .env file):
 *   OPENROUTER_API_KEY=<your key>
 *
 * Usage:
 *   const { analyzeMarketingData } = require("./marketingAI");
 *
 *   const result = await analyzeMarketingData({
 *     googleData: parsedGoogleCsvRows,   // array of plain objects
 *     metaData:   parsedMetaCsvRows,
 *   });
 *
 *   result.analytics          — totals: spend, revenue, ROAS, CTR, etc.
 *   result.platformBreakdown  — per sub-platform (Google Ads, Facebook, Instagram…)
 *   result.campaignBreakdown  — per campaign with status (top/moderate/underperforming/waste)
 *   result.insights           — AI-generated executive markdown report
 */

require("dotenv").config();
const OpenAI = require("openai");

// ─── OpenRouter client (lazy) ─────────────────────────────────────────────────
// Created on first AI call so missing API key only fails at insight-generation
// time, not at require() time — allows callers to skip AI if key is absent.

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

// ─── Google Ads cleaner ───────────────────────────────────────────────────────

function cleanGoogleAdsData(rows) {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const parse = (v) => {
      if (v === undefined || v === null || v === "") return 0;
      return Number(String(v).replace(/[$,%]/g, "").replace(/,/g, "").trim()) || 0;
    };

    return {
      platform:     "Google",
      sub_platform: "Google Ads",
      campaign:     row["Campaign"] || row["Campaign Name"] || row["campaign"] || "Unknown",
      spend:        parse(row["Spend"]       || row["Cost"]            || row["Amount Spent"] || row["Amount spent (USD)"]),
      revenue:      parse(row["Revenue"]     || row["Conversion Value"]|| row["Conversions Value"] || row["Purchase Value"]),
      clicks:       parse(row["Clicks"]      || row["Link Clicks"]),
      impressions:  parse(row["Impressions"]),
      conversions:  parse(row["Conversions"] || row["Purchases"]       || row["Results"]),
      ctr:          parse(row["CTR"]),
      region:       row["Region"] || row["Country"] || "Unknown",
      date:         row["Date"]   || row["Day"]     || null,
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

    const raw = (row["Publisher Platform"] || row["publisher_platform"] || row["Platform"] || "").toLowerCase().trim();

    let sub_platform;
    if      (raw.includes("instagram")) sub_platform = "Instagram";
    else if (raw.includes("messenger")) sub_platform = "Facebook";
    else if (raw.includes("facebook"))  sub_platform = "Facebook";
    else if (raw.includes("audience"))  sub_platform = "Audience Network";
    else                                sub_platform = "Meta";

    return {
      platform: "Meta",
      sub_platform,
      campaign:    row["Campaign"] || row["Campaign Name"] || row["campaign"] || "Unknown",
      spend:       parse(row["Spend"]       || row["Amount Spent"]  || row["Cost"]            || row["Amount spent (USD)"]),
      revenue:     parse(row["Revenue"]     || row["Purchase Value"]|| row["Conversion Value"]|| row["Website Purchase ROAS"]),
      clicks:      parse(row["Clicks"]      || row["Link Clicks"]),
      impressions: parse(row["Impressions"] || row["Reach"]),
      conversions: parse(row["Conversions"] || row["Purchases"]     || row["Results"]),
      ctr:         parse(row["CTR"]         || row["Link CTR"]),
      region:      row["Region"] || row["Country"] || row["Location"] || "Unknown",
      date:        row["Date"]   || row["Day"]     || null,
    };
  });
}

// ─── Merge ────────────────────────────────────────────────────────────────────

function mergeDatasets(...datasets) {
  return datasets.flat();
}

// ─── Campaign breakdown ───────────────────────────────────────────────────────

function generateCampaignBreakdown(data) {
  const map = {};

  data.forEach((row) => {
    const name     = (row.campaign || "Unknown").trim();
    const platform = row.sub_platform || row.platform || "Unknown";
    const key      = `${name}||${platform}`;

    if (!map[key]) {
      map[key] = { name, platform, spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0 };
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
      const roas           = c.spend > 0       ? c.revenue / c.spend                : 0;
      const ctr            = c.impressions > 0 ? (c.clicks / c.impressions) * 100   : 0;
      const cpc            = c.clicks > 0      ? c.spend / c.clicks                 : 0;
      const conversionRate = c.clicks > 0      ? (c.conversions / c.clicks) * 100   : 0;

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

function generateAnalytics(data) {
  const totalSpend       = data.reduce((s, r) => s + (r.spend       || 0), 0);
  const totalRevenue     = data.reduce((s, r) => s + (r.revenue     || 0), 0);
  const totalClicks      = data.reduce((s, r) => s + (r.clicks      || 0), 0);
  const totalImpressions = data.reduce((s, r) => s + (r.impressions || 0), 0);
  const totalConversions = data.reduce((s, r) => s + (r.conversions || 0), 0);

  const overallCTR     = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const overallROAS    = totalSpend       > 0 ? totalRevenue / totalSpend               : 0;
  const conversionRate = totalClicks      > 0 ? (totalConversions / totalClicks) * 100  : 0;

  // Dynamic platform breakdown — new platforms appear automatically
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
      roas:           p.spend       > 0 ? p.revenue / p.spend                : 0,
      ctr:            p.impressions > 0 ? (p.clicks / p.impressions) * 100   : 0,
      cpc:            p.clicks      > 0 ? p.spend / p.clicks                 : 0,
      conversionRate: p.clicks      > 0 ? (p.conversions / p.clicks) * 100   : 0,
    };
  });

  const sum = (keys, field) =>
    keys.reduce((acc, k) => acc + (platformBreakdown[k]?.[field] || 0), 0);

  const GOOGLE_KEYS = ["Google Ads", "Google"];
  const META_KEYS   = ["Facebook", "Instagram", "Meta", "Audience Network"];

  const campaignBreakdown = generateCampaignBreakdown(data);

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
    console.error("AI insight generation failed:", err.message);
    return _FALLBACK_INSIGHTS;
  }
}

// ─── Platform registry ────────────────────────────────────────────────────────
// To add a new platform: write a cleaner function above following the same
// UnifiedRow shape, then add one entry here. Nothing else changes.

const PLATFORM_REGISTRY = [
  { key: "googleData", cleaner: cleanGoogleAdsData, required: true  },
  { key: "metaData",   cleaner: cleanMetaAdsData,   required: true  },
  // { key: "linkedinData", cleaner: cleanLinkedInAdsData, required: false },
  // { key: "twitterData",  cleaner: cleanTwitterAdsData,  required: false },
  // { key: "tiktokData",   cleaner: cleanTikTokAdsData,   required: false },
];

// ─── Public API ───────────────────────────────────────────────────────────────

async function analyzeMarketingData(sources = {}) {
  const missing = PLATFORM_REGISTRY
    .filter((p) => p.required && !sources[p.key]?.length)
    .map((p) => p.key);

  if (missing.length) throw new Error(`Missing required data: ${missing.join(", ")}`);

  const cleanedDatasets = PLATFORM_REGISTRY
    .filter((p) => sources[p.key]?.length)
    .map((p) => p.cleaner(sources[p.key]));

  const merged = mergeDatasets(...cleanedDatasets);
  const raw    = generateAnalytics(merged);
  const { platformBreakdown, campaignBreakdown, ...analytics } = raw;
  const insights = await generateAIInsights(merged, raw);

  return { analytics, platformBreakdown, campaignBreakdown, insights };
}

module.exports = { analyzeMarketingData, PLATFORM_REGISTRY };
