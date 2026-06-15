"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "server", ".env") });

const fs   = require("fs");
const path = require("path");
const csv  = require("csv-parser");

const { analyzeMarketingData } = require("./marketingAI");

const UPLOADS = path.join(__dirname, "server", "src", "uploads");

function latestFile(prefix) {
  const files = fs.readdirSync(UPLOADS)
    .filter(f => f.includes(prefix) && f.endsWith(".csv"))
    .sort().reverse();
  if (!files.length) throw new Error(`No ${prefix} file found`);
  return path.join(UPLOADS, files[0]);
}

function parseCSV(filePath, maxRows = 50) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const stream = fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", row => {
        if (rows.length < maxRows) rows.push(row);
        else stream.destroy();
      })
      .on("close", () => resolve(rows))
      .on("end",   () => resolve(rows))
      .on("error", err => { if (err.code === "ERR_STREAM_DESTROYED") resolve(rows); else reject(err); });
  });
}

function fmt(n)  { return Number(n || 0).toFixed(2); }
function fmtN(n) { return Number(n || 0).toLocaleString("en-IN"); }
function fmtM(n) {
  const v = Number(n || 0);
  if (v >= 1e7) return `₹${(v/1e7).toFixed(2)}Cr`;
  if (v >= 1e5) return `₹${(v/1e5).toFixed(2)}L`;
  if (v >= 1e3) return `₹${(v/1e3).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
}

const STATUS_COLOR = {
  top:             "#10b981",
  moderate:        "#3b82f6",
  underperforming: "#f59e0b",
  waste:           "#ef4444",
};
const STATUS_BG = {
  top:             "#d1fae5",
  moderate:        "#dbeafe",
  underperforming: "#fef3c7",
  waste:           "#fee2e2",
};

function roasBar(roas) {
  const pct = Math.min((roas / 8) * 100, 100);
  const color = roas >= 4 ? "#10b981" : roas >= 2 ? "#3b82f6" : roas >= 1 ? "#f59e0b" : "#ef4444";
  return `<div style="display:flex;align-items:center;gap:6px">
    <div style="flex:1;background:#e5e7eb;border-radius:4px;height:8px">
      <div style="width:${pct}%;background:${color};border-radius:4px;height:8px"></div>
    </div>
    <span style="font-weight:600;color:${color};min-width:48px">${fmt(roas)}x</span>
  </div>`;
}

function badge(status) {
  return `<span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;
    background:${STATUS_BG[status]};color:${STATUS_COLOR[status]};text-transform:uppercase;letter-spacing:.5px">
    ${status}</span>`;
}

function platformDot(platform) {
  const colors = {
    "Google Ads":        "#4285f4",
    "Facebook":          "#1877f2",
    "Instagram":         "#e1306c",
    "Audience Network":  "#f59e0b",
    "Meta":              "#0082fb",
  };
  const c = colors[platform] || "#6b7280";
  return `<span style="display:inline-flex;align-items:center;gap:5px">
    <span style="width:9px;height:9px;border-radius:50%;background:${c};display:inline-block"></span>
    ${platform}
  </span>`;
}

function toHTML({ analytics, platformBreakdown, campaignBreakdown }, googleRows, metaRows) {
  const camps = campaignBreakdown;

  // Group-by summary per platform
  const platformGroups = {};
  camps.forEach(c => {
    if (!platformGroups[c.platform]) platformGroups[c.platform] = [];
    platformGroups[c.platform].push(c);
  });

  // Status summary counts
  const statusCounts = { top: 0, moderate: 0, underperforming: 0, waste: 0 };
  camps.forEach(c => { if (statusCounts[c.status] !== undefined) statusCounts[c.status]++; });

  const platformCards = Object.entries(platformGroups).map(([plat, cs]) => {
    const totalSpend   = cs.reduce((a, c) => a + c.spend, 0);
    const totalRevenue = cs.reduce((a, c) => a + c.revenue, 0);
    const avgROAS      = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const colors = { "Google Ads": "#4285f4", "Facebook": "#1877f2", "Instagram": "#e1306c", "Audience Network": "#f59e0b", "Meta": "#0082fb" };
    const c = colors[plat] || "#6b7280";
    return `
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;flex:1;min-width:200px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <span style="width:12px;height:12px;border-radius:50%;background:${c}"></span>
        <span style="font-weight:700;color:#111">${plat}</span>
        <span style="margin-left:auto;font-size:12px;color:#6b7280">${cs.length} campaigns</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
        <div><div style="color:#6b7280;font-size:11px;margin-bottom:2px">SPEND</div><div style="font-weight:700;color:#111">${fmtM(totalSpend)}</div></div>
        <div><div style="color:#6b7280;font-size:11px;margin-bottom:2px">REVENUE</div><div style="font-weight:700;color:#111">${fmtM(totalRevenue)}</div></div>
        <div style="grid-column:1/-1"><div style="color:#6b7280;font-size:11px;margin-bottom:4px">ROAS</div>${roasBar(avgROAS)}</div>
      </div>
      <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">
        ${cs.map(cc => `<span style="font-size:10px;background:${STATUS_BG[cc.status]};color:${STATUS_COLOR[cc.status]};
          padding:2px 7px;border-radius:8px;font-weight:600">${cc.name.length > 22 ? cc.name.slice(0,22)+"…" : cc.name}</span>`).join("")}
      </div>
    </div>`;
  }).join("");

  const tableRows = camps.map((c, i) => `
    <tr style="border-bottom:1px solid #f3f4f6;${i % 2 === 0 ? "background:#fafafa" : ""}">
      <td style="padding:12px 14px;font-weight:600;color:#374151;font-size:13px">${i + 1}</td>
      <td style="padding:12px 14px;font-size:13px">${c.name}</td>
      <td style="padding:12px 14px">${platformDot(c.platform)}</td>
      <td style="padding:12px 14px;text-align:right;font-weight:600">${fmtM(c.spend)}</td>
      <td style="padding:12px 14px;text-align:right;font-weight:600;color:#10b981">${fmtM(c.revenue)}</td>
      <td style="padding:12px 14px;min-width:160px">${roasBar(c.roas)}</td>
      <td style="padding:12px 14px;text-align:right;font-size:13px">${fmt(c.ctr)}%</td>
      <td style="padding:12px 14px;text-align:right;font-size:13px">${fmtN(c.clicks)}</td>
      <td style="padding:12px 14px;text-align:right;font-size:13px">${fmtN(c.impressions)}</td>
      <td style="padding:12px 14px;text-align:right;font-size:13px">${fmtN(c.conversions)}</td>
      <td style="padding:12px 14px;text-align:right;font-size:13px">${fmt(c.conversionRate)}%</td>
      <td style="padding:12px 14px">${badge(c.status)}</td>
    </tr>`).join("");

  // Raw rows preview — first 5 from each
  function rawTable(rows, title, color) {
    if (!rows.length) return "";
    const cols = Object.keys(rows[0]).slice(0, 10);
    return `
    <div style="margin-bottom:32px">
      <h3 style="font-size:15px;font-weight:700;color:${color};margin:0 0 10px">${title} — First 5 rows (showing 10 of ${Object.keys(rows[0]).length} columns)</h3>
      <div style="overflow-x:auto;border-radius:10px;border:1px solid #e5e7eb">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:${color}15">
              ${cols.map(c => `<th style="padding:9px 12px;text-align:left;font-weight:700;color:${color};white-space:nowrap;border-bottom:1px solid #e5e7eb">${c}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.slice(0, 5).map((r, i) => `
              <tr style="${i % 2 === 0 ? "background:#fafafa" : ""}">
                ${cols.map(c => `<td style="padding:8px 12px;color:#374151;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis">${r[c] ?? ""}</td>`).join("")}
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Campaign Group-By Report — 50 Rows</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f1f5f9; color: #111827; }
  table { border-collapse: collapse; }
  th { font-weight: 700; }
</style>
</head>
<body>
<div style="max-width:1400px;margin:0 auto;padding:32px 20px">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px;padding:32px;margin-bottom:28px;color:#fff">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
      <div>
        <h1 style="font-size:26px;font-weight:800;letter-spacing:-.5px">Campaign Group-By Analysis</h1>
        <p style="color:#94a3b8;margin-top:6px;font-size:14px">
          Input: <strong style="color:#e2e8f0">50 rows Google</strong> + <strong style="color:#e2e8f0">50 rows Meta</strong>
          &nbsp;·&nbsp; Campaigns found: <strong style="color:#e2e8f0">${camps.length}</strong>
          &nbsp;·&nbsp; Generated: ${new Date().toLocaleString("en-IN")}
        </p>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        ${Object.entries(statusCounts).map(([s, n]) =>
          `<div style="text-align:center;background:rgba(255,255,255,.08);border-radius:10px;padding:10px 18px">
            <div style="font-size:22px;font-weight:800;color:${STATUS_COLOR[s]}">${n}</div>
            <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px">${s}</div>
          </div>`).join("")}
      </div>
    </div>
  </div>

  <!-- KPI Strip -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:28px">
    ${[
      ["Total Spend",       fmtM(analytics.totalSpend),       "#6b7280"],
      ["Total Revenue",     fmtM(analytics.totalRevenue),     "#10b981"],
      ["Blended ROAS",      fmt(analytics.overallROAS)+"x",   "#3b82f6"],
      ["Total Clicks",      fmtN(analytics.totalClicks),      "#8b5cf6"],
      ["Impressions",       fmtN(analytics.totalImpressions), "#f59e0b"],
      ["Conversions",       fmtN(analytics.totalConversions), "#ec4899"],
      ["Overall CTR",       fmt(analytics.overallCTR)+"%",    "#06b6d4"],
      ["Conv. Rate",        fmt(analytics.conversionRate)+"%","#84cc16"],
    ].map(([label, val, color]) => `
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:18px">
      <div style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${label}</div>
      <div style="font-size:22px;font-weight:800;color:${color}">${val}</div>
    </div>`).join("")}
  </div>

  <!-- Platform Group-By Cards -->
  <div style="margin-bottom:28px">
    <h2 style="font-size:17px;font-weight:700;color:#1e293b;margin-bottom:14px">Group By Platform</h2>
    <div style="display:flex;gap:14px;flex-wrap:wrap">${platformCards}</div>
  </div>

  <!-- Campaign Group-By Table -->
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;margin-bottom:32px;overflow:hidden">
    <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between">
      <h2 style="font-size:17px;font-weight:700;color:#1e293b">All Campaigns — Grouped &amp; Sorted by ROAS</h2>
      <span style="font-size:13px;color:#6b7280">${camps.length} unique campaigns from 50+50 rows</span>
    </div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8fafc;border-bottom:2px solid #e5e7eb">
            <th style="padding:12px 14px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">#</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Campaign Name</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Platform</th>
            <th style="padding:12px 14px;text-align:right;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Spend</th>
            <th style="padding:12px 14px;text-align:right;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Revenue</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">ROAS</th>
            <th style="padding:12px 14px;text-align:right;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">CTR</th>
            <th style="padding:12px 14px;text-align:right;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Clicks</th>
            <th style="padding:12px 14px;text-align:right;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Impressions</th>
            <th style="padding:12px 14px;text-align:right;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Conversions</th>
            <th style="padding:12px 14px;text-align:right;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Conv. Rate</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Status</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  </div>

  <!-- Raw Input Preview -->
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:24px;margin-bottom:32px">
    <h2 style="font-size:17px;font-weight:700;color:#1e293b;margin-bottom:20px">Raw Input Preview (first 5 of 50 rows per platform)</h2>
    ${rawTable(googleRows, "Google Ads CSV", "#4285f4")}
    ${rawTable(metaRows,   "Meta Ads CSV",   "#1877f2")}
  </div>

  <!-- How Group-By Works -->
  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:24px">
    <h2 style="font-size:17px;font-weight:700;color:#1e293b;margin-bottom:14px">How Campaign Group-By Works</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;font-size:13px;color:#374151">
      <div style="background:#f8fafc;border-radius:10px;padding:16px">
        <div style="font-weight:700;color:#1e293b;margin-bottom:8px">1. Key Construction</div>
        <code style="font-size:12px;color:#6366f1;background:#eef2ff;padding:4px 8px;border-radius:6px;display:block">
          key = campaign_name + "||" + sub_platform
        </code>
        <p style="margin-top:8px;color:#6b7280">Each unique (campaign, platform) pair becomes one row in the output, regardless of how many CSV rows share that identity.</p>
      </div>
      <div style="background:#f8fafc;border-radius:10px;padding:16px">
        <div style="font-weight:700;color:#1e293b;margin-bottom:8px">2. Aggregation</div>
        <p style="color:#6b7280">Spend, Revenue, Clicks, Impressions, Conversions are <strong>summed</strong> across all rows with the same key. Each 50-row input may contain the same campaign across multiple dates, locations, or ad sets.</p>
      </div>
      <div style="background:#f8fafc;border-radius:10px;padding:16px">
        <div style="font-weight:700;color:#1e293b;margin-bottom:8px">3. Derived Metrics</div>
        <p style="color:#6b7280">ROAS = Revenue ÷ Spend &nbsp;|&nbsp; CTR = Clicks ÷ Impressions × 100 &nbsp;|&nbsp; Conv. Rate = Conversions ÷ Clicks × 100. Computed from aggregated totals, not averaged from row-level values.</p>
      </div>
      <div style="background:#f8fafc;border-radius:10px;padding:16px">
        <div style="font-weight:700;color:#1e293b;margin-bottom:8px">4. Status Classification</div>
        <div style="display:flex;flex-direction:column;gap:5px;margin-top:6px">
          ${[["top","ROAS ≥ 4x"],["moderate","ROAS 2x–4x"],["underperforming","ROAS 1x–2x"],["waste","ROAS < 1x"]]
            .map(([s,r]) => `<span style="display:flex;align-items:center;gap:8px">
              ${badge(s)}
              <span style="color:#6b7280">${r}</span>
            </span>`).join("")}
        </div>
      </div>
    </div>
  </div>

</div>
</body>
</html>`;
}

async function main() {
  const gPath = latestFile("google_ads");
  const mPath = latestFile("meta_ads");
  console.log("Google CSV:", path.basename(gPath));
  console.log("Meta   CSV:", path.basename(mPath));

  console.log("Reading first 50 rows from each...");
  const [googleRows, metaRows] = await Promise.all([
    parseCSV(gPath, 50),
    parseCSV(mPath, 50),
  ]);
  console.log(`Loaded: Google=${googleRows.length}  Meta=${metaRows.length}`);

  console.log("Running pipeline...");
  const result = await analyzeMarketingData({ googleData: googleRows, metaData: metaRows });

  console.log(`Campaigns grouped: ${result.campaignBreakdown.length}`);

  const html = toHTML(result, googleRows, metaRows);
  const outPath = path.join(__dirname, "_campaign_groupby_50rows.html");
  fs.writeFileSync(outPath, html);
  console.log(`\nReport written: ${outPath}  (${(html.length / 1024).toFixed(1)} KB)`);
}

main().catch(err => { console.error(err); process.exit(1); });
