"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "server", ".env") });

const fs   = require("fs");
const path = require("path");
const csv  = require("csv-parser");

const { analyzeMarketingData } = require("./marketingAI");

const GOOGLE_CSV = path.join(__dirname, "google_ads_realestate.csv");
const META_CSV   = path.join(__dirname, "meta_ads_realestate.csv");

// ── CSV loader ────────────────────────────────────────────────────────────────

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", r  => rows.push(r))
      .on("end",  ()  => resolve(rows))
      .on("error", reject);
  });
}

// ── Formatting helpers ────────────────────────────────────────────────────────

const fmt   = (n) => Number(n || 0).toFixed(2);
const fmtN  = (n) => Number(n || 0).toLocaleString("en-IN");
const fmtM  = (n) => {
  const v = Number(n || 0);
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)}L`;
  if (v >= 1e3) return `₹${(v / 1e3).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
};

const STATUS_COLOR = { top: "#10b981", moderate: "#3b82f6", underperforming: "#f59e0b", waste: "#ef4444" };
const STATUS_BG    = { top: "#d1fae5", moderate: "#dbeafe", underperforming: "#fef3c7", waste: "#fee2e2" };

function roasBar(roas) {
  const pct   = Math.min((roas / 8) * 100, 100);
  const color = roas >= 4 ? "#10b981" : roas >= 2 ? "#3b82f6" : roas >= 1 ? "#f59e0b" : "#ef4444";
  return `<div style="display:flex;align-items:center;gap:6px;min-width:140px">
    <div style="flex:1;background:#e5e7eb;border-radius:4px;height:7px">
      <div style="width:${pct}%;background:${color};border-radius:4px;height:7px"></div>
    </div>
    <span style="font-weight:700;color:${color};font-size:12px;white-space:nowrap">${fmt(roas)}x</span>
  </div>`;
}

function badge(status) {
  return `<span style="padding:2px 9px;border-radius:10px;font-size:10px;font-weight:700;
    background:${STATUS_BG[status]};color:${STATUS_COLOR[status]};text-transform:uppercase;letter-spacing:.4px">
    ${status}</span>`;
}

const PLATFORM_COLORS = {
  "Google Ads": "#4285f4", Facebook: "#1877f2", Instagram: "#e1306c",
  "Audience Network": "#f59e0b", Meta: "#0082fb", Google: "#34a853",
};
function platDot(p) {
  const c = PLATFORM_COLORS[p] || "#6b7280";
  return `<span style="display:inline-flex;align-items:center;gap:5px;white-space:nowrap">
    <span style="width:8px;height:8px;border-radius:50%;background:${c};flex-shrink:0"></span>${p}
  </span>`;
}

// ── Table builder (shared across all group-by views) ─────────────────────────

function buildTable(camps, extraCols = []) {
  const thStyle = `padding:10px 12px;text-align:left;font-size:10px;color:#6b7280;
    text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;border-bottom:2px solid #e5e7eb`;
  const tdStyle = `padding:10px 12px;font-size:12px;border-bottom:1px solid #f3f4f6`;

  const extraHeaders = extraCols.map(c =>
    `<th style="${thStyle}">${c.label}</th>`).join("");

  const rows = camps.map((c, i) => {
    const extraTds = extraCols.map(col => {
      const val = c[col.field] || "—";
      return `<td style="${tdStyle};color:#374151">${val}</td>`;
    }).join("");
    return `
    <tr style="${i % 2 === 0 ? "background:#fafafa" : "background:#fff"}">
      <td style="${tdStyle};color:#9ca3af;font-weight:600">${i + 1}</td>
      <td style="${tdStyle};font-weight:600;color:#111;max-width:220px">${c.name}</td>
      <td style="${tdStyle}">${platDot(c.platform)}</td>
      ${extraTds}
      <td style="${tdStyle};text-align:right;font-weight:700">${fmtM(c.spend)}</td>
      <td style="${tdStyle};text-align:right;font-weight:700;color:#10b981">${fmtM(c.revenue)}</td>
      <td style="${tdStyle}">${roasBar(c.roas)}</td>
      <td style="${tdStyle};text-align:right">${fmt(c.ctr)}%</td>
      <td style="${tdStyle};text-align:right">${fmtN(c.clicks)}</td>
      <td style="${tdStyle};text-align:right">${fmtN(c.impressions)}</td>
      <td style="${tdStyle};text-align:right">${fmtN(c.conversions)}</td>
      <td style="${tdStyle}">${badge(c.status)}</td>
    </tr>`;
  }).join("");

  return `
  <div style="overflow-x:auto">
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="background:#f8fafc">
        <th style="${thStyle}">#</th>
        <th style="${thStyle}">Campaign</th>
        <th style="${thStyle}">Platform</th>
        ${extraHeaders}
        <th style="${thStyle};text-align:right">Spend</th>
        <th style="${thStyle};text-align:right">Revenue</th>
        <th style="${thStyle}">ROAS</th>
        <th style="${thStyle};text-align:right">CTR</th>
        <th style="${thStyle};text-align:right">Clicks</th>
        <th style="${thStyle};text-align:right">Impressions</th>
        <th style="${thStyle};text-align:right">Conv.</th>
        <th style="${thStyle}">Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  </div>`;
}

// ── Status summary strip ──────────────────────────────────────────────────────

function statusStrip(camps) {
  const counts = { top: 0, moderate: 0, underperforming: 0, waste: 0 };
  camps.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });
  return Object.entries(counts).map(([s, n]) =>
    `<div style="text-align:center;background:${STATUS_BG[s]};border-radius:10px;padding:10px 20px">
      <div style="font-size:22px;font-weight:800;color:${STATUS_COLOR[s]}">${n}</div>
      <div style="font-size:10px;color:${STATUS_COLOR[s]};text-transform:uppercase;letter-spacing:.5px;margin-top:2px">${s}</div>
    </div>`).join("");
}

// ── Tab section ───────────────────────────────────────────────────────────────

let _tabIndex = 0;
function tabSection(id, label, icon, camps, extraCols, description) {
  const idx = _tabIndex++;
  return {
    tab: `<button onclick="showTab('${id}')" id="tab-${id}"
        style="padding:10px 20px;border:none;background:${idx === 0 ? "#1e293b" : "#f1f5f9"};
          color:${idx === 0 ? "#fff" : "#6b7280"};border-radius:8px;font-size:13px;font-weight:600;
          cursor:pointer;white-space:nowrap;transition:all .2s">${icon} ${label}
        <span style="margin-left:6px;padding:2px 7px;border-radius:10px;font-size:10px;
          background:rgba(255,255,255,.2);font-weight:700">${camps.length}</span>
      </button>`,
    panel: `<div id="panel-${id}" style="display:${idx === 0 ? "block" : "none"}">
      <p style="font-size:13px;color:#6b7280;margin-bottom:14px">${description}</p>
      <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">${statusStrip(camps)}</div>
      ${buildTable(camps, extraCols)}
    </div>`,
  };
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function kpiCard(label, value, color, sub = "") {
  return `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px">
    <div style="font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${label}</div>
    <div style="font-size:24px;font-weight:800;color:${color}">${value}</div>
    ${sub ? `<div style="font-size:11px;color:#9ca3af;margin-top:4px">${sub}</div>` : ""}
  </div>`;
}

// ── Platform summary cards ────────────────────────────────────────────────────

function platformSummaryCards(pb) {
  return Object.entries(pb)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .map(([plat, p]) => {
      const c = PLATFORM_COLORS[plat] || "#6b7280";
      return `
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:18px;flex:1;min-width:190px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
          <span style="width:10px;height:10px;border-radius:50%;background:${c}"></span>
          <span style="font-weight:700;color:#111;font-size:14px">${plat}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:10px">
          <div><div style="color:#9ca3af;font-size:10px;margin-bottom:2px">SPEND</div><div style="font-weight:700">${fmtM(p.spend)}</div></div>
          <div><div style="color:#9ca3af;font-size:10px;margin-bottom:2px">REVENUE</div><div style="font-weight:700;color:#10b981">${fmtM(p.revenue)}</div></div>
          <div><div style="color:#9ca3af;font-size:10px;margin-bottom:2px">CTR</div><div style="font-weight:700">${fmt(p.ctr)}%</div></div>
          <div><div style="color:#9ca3af;font-size:10px;margin-bottom:2px">CONV.</div><div style="font-weight:700">${fmtN(p.conversions)}</div></div>
        </div>
        ${roasBar(p.roas)}
      </div>`;
    }).join("");
}

// ── Main HTML builder ─────────────────────────────────────────────────────────

function buildHTML(views, analytics, platformBreakdown, rowCounts) {
  _tabIndex = 0; // reset

  const sections = [
    tabSection(
      "by-platform", "By Campaign + Platform", "📊",
      views.byPlatform.campaignBreakdown,
      [],
      `Default view: each row = one unique (Campaign, Sub-Platform) pair. Total unique groups: <strong>${views.byPlatform.campaignBreakdown.length}</strong>.`
    ),
    tabSection(
      "by-objective", "By Campaign + Objective", "🎯",
      views.byObjective.campaignBreakdown,
      [{ field: "objective", label: "Objective" }],
      `Groups campaigns by their declared marketing objective. Total unique groups: <strong>${views.byObjective.campaignBreakdown.length}</strong>.`
    ),
    tabSection(
      "by-property", "By Campaign + Property Type", "🏠",
      views.byProperty.campaignBreakdown,
      [{ field: "property_type", label: "Property Type" }],
      `Real-estate dimension: each campaign × property type (Luxury, Affordable, Rental, etc.). Total groups: <strong>${views.byProperty.campaignBreakdown.length}</strong>.`
    ),
    tabSection(
      "by-tier", "By Campaign + City Tier", "🌆",
      views.byTier.campaignBreakdown,
      [{ field: "city_tier", label: "City Tier" }],
      `Geographic segmentation: Tier 1 (Delhi, Mumbai) vs Tier 2/3 markets. Total groups: <strong>${views.byTier.campaignBreakdown.length}</strong>.`
    ),
  ];

  const tabs   = sections.map(s => s.tab).join("");
  const panels = sections.map(s => s.panel).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Campaign Group-By Report — Full Dataset</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f1f5f9; color: #111827; }
</style>
</head>
<body>
<div style="max-width:1440px;margin:0 auto;padding:28px 16px">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px;padding:28px 32px;margin-bottom:24px;color:#fff">
    <h1 style="font-size:24px;font-weight:800;letter-spacing:-.5px;margin-bottom:6px">
      Campaign Group-By Analysis
    </h1>
    <p style="color:#94a3b8;font-size:13px">
      <strong style="color:#e2e8f0">${fmtN(rowCounts.google)}</strong> Google rows +
      <strong style="color:#e2e8f0">${fmtN(rowCounts.meta)}</strong> Meta rows — full dataset ·
      Generated ${new Date().toLocaleString("en-IN")}
    </p>
  </div>

  <!-- KPI Strip -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px">
    ${kpiCard("Total Spend",    fmtM(analytics.totalSpend),       "#374151")}
    ${kpiCard("Total Revenue",  fmtM(analytics.totalRevenue),     "#10b981")}
    ${kpiCard("Blended ROAS",   fmt(analytics.overallROAS)+"x",   "#3b82f6")}
    ${kpiCard("Overall CTR",    fmt(analytics.overallCTR)+"%",    "#8b5cf6")}
    ${kpiCard("Total Clicks",   fmtN(analytics.totalClicks),      "#f59e0b")}
    ${kpiCard("Impressions",    fmtN(analytics.totalImpressions), "#06b6d4")}
    ${kpiCard("Conversions",    fmtN(analytics.totalConversions), "#ec4899")}
    ${kpiCard("Conv. Rate",     fmt(analytics.conversionRate)+"%","#84cc16")}
  </div>

  <!-- Platform Summary -->
  <div style="margin-bottom:24px">
    <h2 style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:12px">Platform Breakdown</h2>
    <div style="display:flex;gap:12px;flex-wrap:wrap">${platformSummaryCards(platformBreakdown)}</div>
  </div>

  <!-- Group-By Tabs -->
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;margin-bottom:24px">
    <div style="padding:16px 20px;border-bottom:1px solid #e5e7eb;display:flex;gap:8px;flex-wrap:wrap;background:#f8fafc">
      ${tabs}
    </div>
    <div style="padding:20px 0 0">
      <div style="padding:0 20px 20px">
        ${panels}
      </div>
    </div>
  </div>

  <!-- Group-By Explanation -->
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:24px">
    <h2 style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:16px">How Group-By Works in marketingAI.js</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px">
      ${[
        ["Key Construction", "Each row is assigned a composite key from the groupBy fields.<br><code style='font-size:11px;background:#f1f5f9;padding:2px 6px;border-radius:4px'>key = field1 + \"\\x00\" + field2</code><br>Rows sharing the same key are aggregated together."],
        ["Aggregation", "Spend, Revenue, Clicks, Impressions, and Conversions are <strong>summed</strong> across all rows with the same key. Ratios (ROAS, CTR, CPC) are computed from the aggregated totals."],
        ["Backward Compatible", "Default <code style='font-size:11px;background:#f1f5f9;padding:2px 6px;border-radius:4px'>groupBy: [\"campaign\",\"platform\"]</code> produces the same output as the original pipeline. Existing callers need no changes."],
        ["Calling the API", "<code style='font-size:11px;background:#f1f5f9;padding:2px 6px;border-radius:4px'>analyzeMarketingData(sources, { groupBy: [\"campaign\",\"objective\"] })</code><br>Pass any UnifiedRow field as a groupBy dimension."],
      ].map(([title, body]) => `
      <div style="background:#f8fafc;border-radius:10px;padding:16px">
        <div style="font-weight:700;color:#1e293b;margin-bottom:8px;font-size:13px">${title}</div>
        <div style="font-size:12px;color:#6b7280;line-height:1.6">${body}</div>
      </div>`).join("")}
    </div>
  </div>

</div>

<script>
function showTab(id) {
  document.querySelectorAll('[id^="panel-"]').forEach(p => p.style.display = "none");
  document.querySelectorAll('[id^="tab-"]').forEach(t => {
    t.style.background = "#f1f5f9";
    t.style.color = "#6b7280";
  });
  document.getElementById("panel-" + id).style.display = "block";
  const btn = document.getElementById("tab-" + id);
  btn.style.background = "#1e293b";
  btn.style.color = "#fff";
}
</script>
</body>
</html>`;
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  console.log("Reading CSVs...");
  const [googleRows, metaRows] = await Promise.all([
    parseCSV(GOOGLE_CSV),
    parseCSV(META_CSV),
  ]);
  console.log(`Loaded: Google=${googleRows.length.toLocaleString()}  Meta=${metaRows.length.toLocaleString()}`);

  const sources = { googleData: googleRows, metaData: metaRows };

  console.log("Running 4 group-by views in parallel...");
  const [byPlatform, byObjective, byProperty, byTier] = await Promise.all([
    analyzeMarketingData(sources, { groupBy: ["campaign", "platform"] }),
    analyzeMarketingData(sources, { groupBy: ["campaign", "objective"] }),
    analyzeMarketingData(sources, { groupBy: ["campaign", "property_type"] }),
    analyzeMarketingData(sources, { groupBy: ["campaign", "city_tier"] }),
  ]);

  console.log(`Groups — by platform: ${byPlatform.campaignBreakdown.length}  by objective: ${byObjective.campaignBreakdown.length}  by property: ${byProperty.campaignBreakdown.length}  by tier: ${byTier.campaignBreakdown.length}`);

  const html = buildHTML(
    { byPlatform, byObjective, byProperty, byTier },
    byPlatform.analytics,
    byPlatform.platformBreakdown,
    { google: googleRows.length, meta: metaRows.length }
  );

  const out = path.join(__dirname, "_report_groupby_full.html");
  fs.writeFileSync(out, html, "utf8");
  console.log(`\nReport: ${out}  (${(html.length / 1024).toFixed(1)} KB)`);
}

main().catch(err => { console.error(err); process.exit(1); });
