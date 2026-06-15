"use strict";

/**
 * Functional test for marketingAI.js
 * 50 rows per platform (10 campaigns × 5 days)
 * Run: NODE_PATH=server/node_modules node _test_marketingAI.js
 *
 * Pre-computed expected values are asserted so any regression is caught.
 */

const { analyzeMarketingData } = require("./marketingAI");

// ─── Test data ─────────────────────────────────────────────────────────────────

const DATES = ["2024-05-01", "2024-05-02", "2024-05-03", "2024-05-04", "2024-05-05"];

//  Google Ads  —  column names used: "Campaign", "Cost", "Conversion Value",
//                 "Clicks", "Impressions", "Conversions", "CTR", "Day", "Country"
//  [name, dailySpend, dailyRevenue, dailyClicks, dailyImpressions, dailyConv]
const GOOGLE_CAMPAIGNS = [
  ["Brand - Exact Match",         820,  5084,  1120, 28000, 45],
  ["Shopping - Electronics",     1180,  5310,   890, 22000, 38],
  ["Smart Shopping",              760,  3648,   620, 18500, 26],
  ["RLSA - Cart Abandoners",      240,  1704,   180,  4800, 14],
  ["Performance Max - General",   920,  3036,   780, 21000, 32],
  ["Competitor Targeting",        440,  1232,   360,  9800, 15],
  ["Display Retargeting",         310,   651,   210,  7200,  8],
  ["GDN - Interest Targeting",    380,   494,   290,  8600, 11],
  ["YouTube Prospecting",         590,   649,   220,  9200,  9],
  ["Gmail Sponsorship",           175,    70,    95,  3100,  3],
];

const googleData = [];
for (const [name, spend, rev, clicks, impr, conv] of GOOGLE_CAMPAIGNS) {
  for (const date of DATES) {
    googleData.push({
      "Campaign":         name,
      "Cost":             spend,
      "Conversion Value": rev,
      "Clicks":           clicks,
      "Impressions":      impr,
      "Conversions":      conv,
      "CTR":              ((clicks / impr) * 100).toFixed(2) + "%",
      "Day":              date,
      "Country":          "United States",
    });
  }
}

//  Meta Ads  —  column names used: "Campaign Name", "Amount Spent",
//               "Purchase Value", "Link Clicks", "Impressions", "Results",
//               "Link CTR", "Publisher Platform", "Day", "Country"
//  [name, dailySpend, dailyRevenue, dailyClicks, dailyImpressions, dailyResults, platform]
const META_CAMPAIGNS = [
  ["Facebook Retargeting - Purchasers", 640,  3520,  480, 14000, 32, "facebook"],
  ["DPA - Dynamic Product Ads",         820,  3772,  560, 16000, 41, "facebook"],
  ["Instagram Stories - Prospecting",   510,  1530,  390, 13000, 18, "instagram"],
  ["Instagram Feed - New Collection",   380,   912,  310, 10500, 14, "instagram"],
  ["Facebook Feed - Lookalike 1%",      690,  1794,  520, 15500, 24, "facebook"],
  ["Facebook Carousel - Electronics",   450,   990,  340, 11200, 16, "facebook"],
  ["Audience Network Retargeting",      280,   588,  190,  7800,  9, "audience_network"],
  ["Facebook Lead Gen - B2B",           360,   360,  210,  6900,  8, "facebook"],
  ["Instagram Reels - Brand Awareness", 420,    84,  280, 18000,  4, "instagram"],
  ["Facebook Video Views",              195,    39,  110, 22000,  2, "facebook"],
];

const metaData = [];
for (const [name, spend, rev, clicks, impr, results, platform] of META_CAMPAIGNS) {
  for (const date of DATES) {
    metaData.push({
      "Campaign Name":      name,
      "Amount Spent":       spend,
      "Purchase Value":     rev,
      "Link Clicks":        clicks,
      "Impressions":        impr,
      "Results":            results,
      "Link CTR":           ((clicks / impr) * 100).toFixed(2) + "%",
      "Publisher Platform": platform,
      "Day":                date,
      "Country":            "United States",
    });
  }
}

// ─── Pre-computed expected values ──────────────────────────────────────────────
// Each daily value × 5 days. Arithmetic verified by hand.
//
// Google daily:  spend=5815  revenue=21878  clicks=4765  impr=132200  conv=201
// Meta daily:    spend=4745  revenue=13589  clicks=3390  impr=134900  conv=168
// Combined ×5:
const EXP = {
  totalSpend:       52800,    // (5815 + 4745) × 5
  totalRevenue:     177335,   // (21878 + 13589) × 5
  overallROAS:      177335 / 52800,   // 3.3585...
  totalClicks:      40775,    // (4765 + 3390) × 5
  totalImpressions: 1335500,  // (132200 + 134900) × 5
  totalConversions: 1845,     // (201 + 168) × 5
  overallCTR:       (40775 / 1335500) * 100,  // 3.053...%
  conversionRate:   (1845 / 40775) * 100,     // 4.525...%

  // Google sub-totals (used to verify platform breakdown)
  googleSpend:   29075,   // 5815 × 5
  googleRevenue: 109390,  // 21878 × 5
  googleROAS:    109390 / 29075,  // 3.762...

  // Meta sub-totals
  metaSpend:     23725,   // 4745 × 5
  metaRevenue:   67945,   // 13589 × 5
  metaROAS:      67945 / 23725,   // 2.864...
};

// ─── Assertion helpers ────────────────────────────────────────────────────────

let _pass = 0, _fail = 0;

function check(label, got, expected, tol = 0.01) {
  const ok = Math.abs(got - expected) <= tol;
  const symbol = ok ? "✓" : "✗";
  const gotStr = typeof got === "number" ? got.toFixed(4) : got;
  const expStr = typeof expected === "number" ? expected.toFixed(4) : expected;
  console.log(`  ${symbol} ${label.padEnd(40)} got ${gotStr}  (expected ${expStr})`);
  if (ok) _pass++; else _fail++;
  return ok;
}

function header(title) {
  console.log(`\n── ${title} ${"─".repeat(60 - title.length - 4)}`);
}

// ─── Run ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log("=".repeat(64));
  console.log("  marketingAI.js — Functional Test");
  console.log("=".repeat(64));
  console.log(`\nInput rows:  Google=${googleData.length}  Meta=${metaData.length}`);

  let result;
  try {
    result = await analyzeMarketingData({ googleData, metaData });
  } catch (err) {
    console.error("\nFATAL — analyzeMarketingData threw:", err.message);
    process.exit(1);
  }

  const { analytics, platformBreakdown, campaignBreakdown, insights } = result;

  // ── 1. Overall analytics ──────────────────────────────────────────────────
  header("Overall Analytics");
  check("totalSpend",       analytics.totalSpend,       EXP.totalSpend);
  check("totalRevenue",     analytics.totalRevenue,     EXP.totalRevenue);
  check("overallROAS",      analytics.overallROAS,      EXP.overallROAS,      0.0001);
  check("totalClicks",      analytics.totalClicks,      EXP.totalClicks);
  check("totalImpressions", analytics.totalImpressions, EXP.totalImpressions);
  check("totalConversions", analytics.totalConversions, EXP.totalConversions);
  check("overallCTR",       analytics.overallCTR,       EXP.overallCTR,       0.0001);
  check("conversionRate",   analytics.conversionRate,   EXP.conversionRate,   0.0001);

  // ── 2. Platform breakdown ─────────────────────────────────────────────────
  header("Platform Breakdown — Sub-platform Detection");
  const pb = platformBreakdown;
  const platforms = Object.keys(pb);
  console.log("  Detected sub-platforms:", platforms.join(", "));

  // Sub-platform detection
  const hasFacebook   = "Facebook"         in pb;
  const hasInstagram  = "Instagram"        in pb;
  const hasAudience   = "Audience Network" in pb;
  const hasGoogleAds  = "Google Ads"       in pb;
  check("'Google Ads' sub-platform present",    hasGoogleAds  ? 1 : 0, 1, 0);
  check("'Facebook' sub-platform present",      hasFacebook   ? 1 : 0, 1, 0);
  check("'Instagram' sub-platform present",     hasInstagram  ? 1 : 0, 1, 0);
  check("'Audience Network' sub-platform present", hasAudience ? 1 : 0, 1, 0);

  // Google Ads sub-totals
  if (hasGoogleAds) {
    header("Platform — Google Ads Sub-totals");
    check("Google Ads spend",   pb["Google Ads"].spend,   EXP.googleSpend);
    check("Google Ads revenue", pb["Google Ads"].revenue, EXP.googleRevenue);
    check("Google Ads ROAS",    pb["Google Ads"].roas,    EXP.googleROAS,    0.0001);
  }

  // Meta sub-total (Facebook + Instagram + Audience Network combined)
  if (hasFacebook && hasInstagram && hasAudience) {
    header("Platform — Meta Combined Sub-totals");
    const derivedMetaSpend   = (pb["Facebook"]?.spend   || 0) + (pb["Instagram"]?.spend   || 0) + (pb["Audience Network"]?.spend   || 0);
    const derivedMetaRevenue = (pb["Facebook"]?.revenue || 0) + (pb["Instagram"]?.revenue || 0) + (pb["Audience Network"]?.revenue || 0);
    check("Meta combined spend",   derivedMetaSpend,   EXP.metaSpend);
    check("Meta combined revenue", derivedMetaRevenue, EXP.metaRevenue);
  }

  // ── 3. Campaign breakdown — count and status ──────────────────────────────
  header(`Campaign Breakdown  (${campaignBreakdown.length} campaigns found)`);

  check("Campaign count", campaignBreakdown.length, 20, 0); // 10 Google + 10 Meta

  // Print all 20 campaigns
  console.log();
  campaignBreakdown.forEach((c, i) => {
    const tag = c.status.padEnd(14);
    console.log(`  ${String(i + 1).padStart(2)}. [${tag}] ROAS ${c.roas.toFixed(2)}x  spend $${c.spend.toLocaleString().padStart(7)}  [${c.platform}] ${c.name}`);
  });

  // Status assertions for known campaigns
  header("Campaign Status Assertions");
  const findCampaign = (name, platform) =>
    campaignBreakdown.find(c => c.name === name && c.platform === platform);

  const statusTests = [
    // Google top (ROAS ≥ 4)
    ["Brand - Exact Match",                  "Google Ads", "top"],           // ROAS 6.2
    ["Shopping - Electronics",               "Google Ads", "top"],           // ROAS 4.5
    ["Smart Shopping",                       "Google Ads", "top"],           // ROAS 4.8
    ["RLSA - Cart Abandoners",               "Google Ads", "top"],           // ROAS 7.1
    // Google moderate (ROAS 2–4)
    ["Performance Max - General",            "Google Ads", "moderate"],      // ROAS 3.3
    ["Competitor Targeting",                 "Google Ads", "moderate"],      // ROAS 2.8
    ["Display Retargeting",                  "Google Ads", "moderate"],      // ROAS 2.1
    // Google underperforming (ROAS 1–2)
    ["GDN - Interest Targeting",             "Google Ads", "underperforming"], // ROAS 1.3
    ["YouTube Prospecting",                  "Google Ads", "underperforming"], // ROAS 1.1
    // Google waste (ROAS < 1)
    ["Gmail Sponsorship",                    "Google Ads", "waste"],         // ROAS 0.4
    // Meta top
    ["Facebook Retargeting - Purchasers",    "Facebook",   "top"],           // ROAS 5.5
    ["DPA - Dynamic Product Ads",            "Facebook",   "top"],           // ROAS 4.6
    // Meta moderate
    ["Instagram Stories - Prospecting",      "Instagram",  "moderate"],      // ROAS 3.0
    ["Facebook Feed - Lookalike 1%",         "Facebook",   "moderate"],      // ROAS 2.6
    // Meta underperforming
    ["Facebook Lead Gen - B2B",              "Facebook",   "underperforming"], // ROAS 1.0
    // Meta waste
    ["Instagram Reels - Brand Awareness",    "Instagram",  "waste"],         // ROAS 0.2
    ["Facebook Video Views",                 "Facebook",   "waste"],         // ROAS 0.2
  ];

  for (const [name, platform, expectedStatus] of statusTests) {
    const c = findCampaign(name, platform);
    if (!c) {
      console.log(`  ✗ NOT FOUND: "${name}" [${platform}]`);
      _fail++; continue;
    }
    const ok = c.status === expectedStatus;
    if (ok) _pass++; else _fail++;
    console.log(`  ${ok ? "✓" : "✗"} ${`[${c.status}]`.padEnd(16)} ROAS ${c.roas.toFixed(2)}x  "${name}" [${platform}]`);
  }

  // Verify sort order (descending ROAS)
  header("Campaign Sort Order");
  let sortOk = true;
  for (let i = 1; i < campaignBreakdown.length; i++) {
    if (campaignBreakdown[i].roas > campaignBreakdown[i - 1].roas) {
      console.log(`  ✗ Sort broken at index ${i}: ${campaignBreakdown[i].roas} > ${campaignBreakdown[i - 1].roas}`);
      sortOk = false; _fail++; break;
    }
  }
  if (sortOk) { console.log("  ✓ campaignBreakdown sorted descending by ROAS"); _pass++; }

  // ── 4. AI insights ────────────────────────────────────────────────────────
  header("AI Insights");
  const isFallback = insights.includes("Google Ads is significantly outperforming");
  const hasContent = insights.length > 50;
  check("insights has content (>50 chars)", hasContent ? 1 : 0, 1, 0);
  console.log(`  Source: ${isFallback ? "FALLBACK (no live API call)" : "Live AI response"}`);
  console.log(`  Length: ${insights.length} chars`);
  console.log(`  Preview: ${insights.slice(0, 200).replace(/\n/g, " ")}...`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(64));
  console.log(`  RESULT: ${_pass} passed, ${_fail} failed`);
  if (_fail === 0) {
    console.log("  ALL CHECKS PASSED ✓");
  } else {
    console.log("  SOME CHECKS FAILED ✗  — see ✗ lines above");
  }
  console.log("=".repeat(64));

  process.exit(_fail > 0 ? 1 : 0);
}

run();
