"use strict";

/**
 * Generates _report.html from marketingAI.js using the real uploaded CSVs.
 * Run: NODE_PATH=server/node_modules node _generate_report.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "server", ".env") });
const { analyzeMarketingData } = require("./marketingAI");
const fs   = require("fs");
const path = require("path");
const csv  = require("csv-parser");

// ─── Load real CSV files ───────────────────────────────────────────────────────

const UPLOADS = path.join(__dirname, "server", "src", "uploads");

function latestFile(prefix) {
  const files = fs.readdirSync(UPLOADS)
    .filter(f => f.includes(prefix) && f.endsWith(".csv"))
    .sort()
    .reverse();
  if (!files.length) throw new Error(`No ${prefix} file found in uploads/`);
  console.log(`  Using: ${files[0]}`);
  return path.join(UPLOADS, files[0]);
}

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", row => rows.push(row))
      .on("end",  ()  => resolve(rows))
      .on("error", reject);
  });
}

async function loadData() {
  console.log("\nLoading CSV files...");
  const googlePath = latestFile("google_ads");
  const metaPath   = latestFile("meta_ads");
  const [googleData, metaData] = await Promise.all([
    parseCSV(googlePath),
    parseCSV(metaPath),
  ]);
  console.log(`  Google rows: ${googleData.length.toLocaleString()}`);
  console.log(`  Meta rows:   ${metaData.length.toLocaleString()}`);
  return { googleData, metaData };
}

// ─── HTML generator ───────────────────────────────────────────────────────────

function toHTML({ analytics, platformBreakdown, campaignBreakdown, insights }, googleRows, metaRows) {
  const fmt2 = n => Number(n || 0).toFixed(2);
  const fmt1 = n => Number(n || 0).toFixed(1);
  const fmtN = n => Math.round(Number(n || 0)).toLocaleString();
  const fmtK = n => {
    const v = Number(n || 0);
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
  };

  const STATUS = {
    top:             { bg: "#dcfce7", text: "#15803d", bar: "#22c55e" },
    moderate:        { bg: "#dbeafe", text: "#1d4ed8", bar: "#3b82f6" },
    underperforming: { bg: "#fef9c3", text: "#a16207", bar: "#eab308" },
    waste:           { bg: "#fee2e2", text: "#b91c1c", bar: "#ef4444" },
  };
  const sc = s => (STATUS[s] || STATUS.waste);

  const PLATFORM_COLOR = {
    "Google Ads":       { icon: "🔵", accent: "#4285F4" },
    "Facebook":         { icon: "🟦", accent: "#1877F2" },
    "Instagram":        { icon: "🟣", accent: "#E1306C" },
    "Audience Network": { icon: "🟠", accent: "#FF7700" },
    "Meta":             { icon: "🟦", accent: "#1877F2" },
  };
  const pc = name => PLATFORM_COLOR[name] || { icon: "⚫", accent: "#64748b" };

  // ── KPI cards ──────────────────────────────────────────────────────────────
  const kpis = [
    { label: "Total Spend",       value: fmtK(analytics.totalSpend),       sub: fmtN(analytics.totalSpend) + " USD",  icon: "💸", color: "#6366f1" },
    { label: "Total Revenue",     value: fmtK(analytics.totalRevenue),     sub: fmtN(analytics.totalRevenue) + " USD", icon: "💰", color: "#10b981" },
    { label: "Blended ROAS",      value: fmt2(analytics.overallROAS) + "x", sub: "Return on Ad Spend",                 icon: "📈", color: "#3b82f6" },
    { label: "Overall CTR",       value: fmt2(analytics.overallCTR) + "%",  sub: fmtN(analytics.totalClicks) + " clicks", icon: "🖱️", color: "#f59e0b" },
    { label: "Conversion Rate",   value: fmt2(analytics.conversionRate) + "%", sub: fmtN(analytics.totalConversions) + " conversions", icon: "🎯", color: "#ec4899" },
    { label: "Total Impressions", value: fmtN(analytics.totalImpressions), sub: "across all platforms",               icon: "👁️", color: "#8b5cf6" },
  ];

  const kpiCardsHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-icon" style="background:${k.color}15;color:${k.color}">${k.icon}</div>
      <div class="kpi-body">
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-value" style="color:${k.color}">${k.value}</div>
        <div class="kpi-sub">${k.sub}</div>
      </div>
    </div>`).join("");

  // ── Platform cards ─────────────────────────────────────────────────────────
  const maxRoas = Math.max(...Object.values(platformBreakdown).map(p => p.roas), 1);

  const platformCardsHTML = Object.entries(platformBreakdown)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .map(([name, p]) => {
      const { icon, accent } = pc(name);
      const barW = Math.min(100, (p.roas / maxRoas) * 100).toFixed(1);
      return `
      <div class="platform-card" style="border-top:4px solid ${accent}">
        <div class="platform-header">
          <span class="platform-icon">${icon}</span>
          <span class="platform-name">${name}</span>
        </div>
        <div class="platform-grid">
          <div class="pstat"><div class="pstat-label">Spend</div><div class="pstat-val">${fmtK(p.spend)}</div></div>
          <div class="pstat"><div class="pstat-label">Revenue</div><div class="pstat-val" style="color:#10b981">${fmtK(p.revenue)}</div></div>
          <div class="pstat"><div class="pstat-label">ROAS</div><div class="pstat-val" style="color:${accent}">${fmt2(p.roas)}x</div></div>
          <div class="pstat"><div class="pstat-label">CTR</div><div class="pstat-val">${fmt2(p.ctr)}%</div></div>
          <div class="pstat"><div class="pstat-label">Conv.</div><div class="pstat-val">${fmtN(p.conversions)}</div></div>
          <div class="pstat"><div class="pstat-label">CPC</div><div class="pstat-val">$${fmt2(p.cpc)}</div></div>
        </div>
        <div class="roas-bar-track">
          <div class="roas-bar-fill" style="width:${barW}%;background:${accent}"></div>
        </div>
        <div class="roas-bar-label">ROAS vs best platform</div>
      </div>`;
    }).join("");

  // ── Campaign table ─────────────────────────────────────────────────────────
  const maxCampRoas = Math.max(...campaignBreakdown.map(c => c.roas), 1);

  const campaignRowsHTML = campaignBreakdown.map((c, i) => {
    const s = sc(c.status);
    const barW = Math.min(100, (c.roas / maxCampRoas) * 100).toFixed(1);
    return `
    <tr class="camp-row">
      <td class="td-rank">${i + 1}</td>
      <td class="td-name">${c.name}</td>
      <td class="td-platform">${c.platform}</td>
      <td><span class="badge" style="background:${s.bg};color:${s.text}">${c.status}</span></td>
      <td class="td-roas">
        <div class="roas-cell">
          <span style="font-weight:700;color:${s.text};min-width:42px;display:inline-block">${fmt2(c.roas)}x</span>
          <div class="inline-bar-track"><div class="inline-bar-fill" style="width:${barW}%;background:${s.bar}"></div></div>
        </div>
      </td>
      <td class="td-num">${fmtK(c.spend)}</td>
      <td class="td-num" style="color:#10b981;font-weight:600">${fmtK(c.revenue)}</td>
      <td class="td-num">${fmt2(c.ctr)}%</td>
      <td class="td-num">${fmtN(c.conversions)}</td>
    </tr>`;
  }).join("");

  // ── Status summary pills ───────────────────────────────────────────────────
  const counts = { top: 0, moderate: 0, underperforming: 0, waste: 0 };
  campaignBreakdown.forEach(c => counts[c.status] = (counts[c.status] || 0) + 1);
  const summaryPills = Object.entries(counts).map(([s, n]) => {
    const col = sc(s);
    return `<span class="summary-pill" style="background:${col.bg};color:${col.text}">${n} ${s}</span>`;
  }).join(" ");

  // ── AI insights → HTML ────────────────────────────────────────────────────
  const insightsHTML = insights
    .split("\n")
    .map(line => {
      const t = line.trim();
      if (!t) return '<div style="height:6px"></div>';
      if (t.match(/^#{1,3}\s/))
        return `<h3 class="insight-h">${t.replace(/^#+\s/, "")}</h3>`;
      if (t.match(/^\d+\.\s[A-Z]/))
        return `<h3 class="insight-h">${t}</h3>`;
      if (t.startsWith("•") || t.startsWith("-") || t.startsWith("*"))
        return `<div class="insight-bullet"><span class="bullet-dot">▸</span>${t.replace(/^[•\-\*]\s*/, "")}</div>`;
      return `<p class="insight-p">${t}</p>`;
    })
    .join("");

  // ── Final HTML ─────────────────────────────────────────────────────────────
  const now = new Date().toLocaleString("en-US", { month:"long", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Marketing AI Engine — Performance Report</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         background: #f1f5f9; color: #1e293b; font-size: 14px; line-height: 1.5; }

  /* ── Header ── */
  .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
            color: #fff; padding: 36px 48px; display: flex; align-items: center;
            justify-content: space-between; gap: 24px; flex-wrap: wrap; }
  .header-left h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
  .header-left p  { color: #94a3b8; font-size: 13px; margin-top: 4px; }
  .header-badge   { background: #1e40af; color: #bfdbfe; padding: 6px 14px;
                    border-radius: 999px; font-size: 12px; font-weight: 600; }

  /* ── Container ── */
  .container { max-width: 1400px; margin: 0 auto; padding: 32px 40px; }
  @media(max-width:768px){ .container{ padding: 20px 16px; } }

  /* ── Section ── */
  .section { margin-bottom: 40px; }
  .section-title { font-size: 16px; font-weight: 700; color: #0f172a;
                   margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .section-title::after { content:""; flex:1; height:1px; background:#e2e8f0; }

  /* ── KPI Cards ── */
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 16px; }
  .kpi-card { background: #fff; border-radius: 12px; padding: 20px;
              box-shadow: 0 1px 3px rgba(0,0,0,.07); border: 1px solid #e2e8f0;
              display: flex; align-items: flex-start; gap: 14px; }
  .kpi-icon { width: 42px; height: 42px; border-radius: 10px; display: flex;
              align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; font-weight: 600; }
  .kpi-value { font-size: 24px; font-weight: 800; margin: 2px 0; line-height: 1.1; }
  .kpi-sub   { font-size: 11px; color: #94a3b8; }

  /* ── Platform Cards ── */
  .platform-grid-wrap { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap: 16px; }
  .platform-card { background: #fff; border-radius: 12px; padding: 20px;
                   box-shadow: 0 1px 3px rgba(0,0,0,.07); border: 1px solid #e2e8f0; }
  .platform-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .platform-icon { font-size: 22px; }
  .platform-name { font-size: 15px; font-weight: 700; color: #0f172a; }
  .platform-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .pstat-label { font-size: 10px; text-transform: uppercase; letter-spacing:.05em; color: #94a3b8; }
  .pstat-val   { font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 2px; }
  .roas-bar-track { height: 6px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
  .roas-bar-fill  { height: 100%; border-radius: 999px; transition: width .3s; }
  .roas-bar-label { font-size: 10px; color: #cbd5e1; margin-top: 5px; }

  /* ── Campaign Table ── */
  .table-wrap { background: #fff; border-radius: 12px; overflow: hidden;
                box-shadow: 0 1px 3px rgba(0,0,0,.07); border: 1px solid #e2e8f0; }
  .table-header-bar { padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
                      display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 10px 14px; text-align: left; font-size: 10px; text-transform: uppercase;
       letter-spacing: .06em; color: #94a3b8; background: #f8fafc; font-weight: 600; white-space: nowrap; }
  .camp-row { border-bottom: 1px solid #f8fafc; transition: background .15s; }
  .camp-row:hover { background: #f8fafc !important; }
  .camp-row:nth-child(even) { background: #fcfcfd; }
  .td-rank   { padding: 11px 14px; color: #94a3b8; font-size: 13px; font-weight: 600; width: 36px; }
  .td-name   { padding: 11px 14px; font-weight: 600; color: #1e293b; max-width: 260px; }
  .td-platform { padding: 11px 14px; color: #64748b; font-size: 12px; white-space: nowrap; }
  .td-roas   { padding: 11px 14px; min-width: 160px; }
  .td-num    { padding: 11px 14px; text-align: right; white-space: nowrap; }
  .badge { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
           text-transform: capitalize; white-space: nowrap; }
  .roas-cell { display: flex; align-items: center; gap: 8px; }
  .inline-bar-track { flex: 1; height: 5px; background: #f1f5f9; border-radius: 999px; overflow: hidden; min-width: 60px; }
  .inline-bar-fill  { height: 100%; border-radius: 999px; }
  .summary-pill { display: inline-flex; align-items: center; padding: 4px 12px;
                  border-radius: 999px; font-size: 12px; font-weight: 700; }

  /* ── AI Insights ── */
  .insights-card { background: #fff; border-radius: 12px; padding: 32px 36px;
                   box-shadow: 0 1px 3px rgba(0,0,0,.07); border: 1px solid #e2e8f0; }
  .ai-badge { display: inline-flex; align-items: center; gap: 6px; background: #ede9fe;
              color: #6d28d9; padding: 4px 12px; border-radius: 999px; font-size: 12px;
              font-weight: 700; margin-bottom: 20px; }
  .insight-h  { font-size: 15px; font-weight: 700; color: #1e293b;
                margin: 20px 0 8px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9; }
  .insight-h:first-of-type { margin-top: 0; }
  .insight-bullet { display: flex; gap: 10px; padding: 4px 0; color: #334155; line-height: 1.6; }
  .bullet-dot { color: #6366f1; font-size: 10px; padding-top: 5px; flex-shrink: 0; }
  .insight-p  { color: #475569; line-height: 1.7; padding: 3px 0; }

  /* ── Footer ── */
  .footer { text-align: center; padding: 32px; color: #94a3b8; font-size: 12px; }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <h1>📊 Marketing AI Engine</h1>
    <p>Performance Report · Generated ${now} · ${(googleRows + metaRows).toLocaleString()} rows processed (${googleRows.toLocaleString()} Google + ${metaRows.toLocaleString()} Meta)</p>
  </div>
  <div>
    <span class="header-badge">🤖 AI-Powered Analysis</span>
  </div>
</div>

<div class="container">

  <!-- KPIs -->
  <div class="section">
    <div class="section-title">Overview</div>
    <div class="kpi-grid">${kpiCardsHTML}</div>
  </div>

  <!-- Platform Breakdown -->
  <div class="section">
    <div class="section-title">Platform Breakdown</div>
    <div class="platform-grid-wrap">${platformCardsHTML}</div>
  </div>

  <!-- Campaign Table -->
  <div class="section">
    <div class="section-title">Campaign Performance</div>
    <div class="table-wrap">
      <div class="table-header-bar">
        <span style="font-weight:700;color:#0f172a;margin-right:8px">${campaignBreakdown.length} Campaigns</span>
        ${summaryPills}
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Campaign</th>
              <th>Platform</th>
              <th>Status</th>
              <th>ROAS</th>
              <th style="text-align:right">Spend</th>
              <th style="text-align:right">Revenue</th>
              <th style="text-align:right">CTR</th>
              <th style="text-align:right">Conversions</th>
            </tr>
          </thead>
          <tbody>${campaignRowsHTML}</tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- AI Insights -->
  <div class="section">
    <div class="section-title">AI Insights</div>
    <div class="insights-card">
      <div class="ai-badge">✦ claude-3.5-haiku via OpenRouter</div>
      <div class="insights-body">${insightsHTML}</div>
    </div>
  </div>

</div>

<div class="footer">
  Generated by Marketing AI Engine · marketingAI.js · ${now}
</div>

</body>
</html>`;
}

// ─── Run ──────────────────────────────────────────────────────────────────────

(async () => {
  const { googleData, metaData } = await loadData();
  console.log("\nRunning analysis pipeline...");
  const result = await analyzeMarketingData({ googleData, metaData });

  const html = toHTML(result, googleData.length, metaData.length);
  const outPath = path.join(__dirname, "_report.html");
  fs.writeFileSync(outPath, html, "utf8");

  console.log(`Report written → ${outPath}`);
  console.log(`File size: ${(html.length / 1024).toFixed(1)} KB`);
})();
