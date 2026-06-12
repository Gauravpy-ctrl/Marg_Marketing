const fs  = require("fs");
const csv = require("csv-parser");

const { analyzeMarketingData } = require("../core");

// ─── CSV helper ───────────────────────────────────────────────────────────────

const readCSV = (filePath) =>
  new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data",  (row) => rows.push(row))
      .on("end",   ()    => resolve(rows))
      .on("error", reject);
  });

// ─── Controller ───────────────────────────────────────────────────────────────
// Pure HTTP adapter: parse uploaded CSVs → call pipeline → return JSON.
// All platform registry logic, cleaning, merging, and AI live in core/index.js.

exports.analyzeController = async (req, res) => {
  try {
    // Build sources map from uploaded files.
    // Convention: "googleFile" → "googleData", "metaFile" → "metaData", etc.
    const sources = {};
    for (const [fileKey, files] of Object.entries(req.files || {})) {
      sources[fileKey.replace("File", "Data")] = await readCSV(files[0].path);
    }

    const result = await analyzeMarketingData(sources);

    // Preserve existing response shape so the client needs no changes:
    // { success, kpis: { ...analytics, platformBreakdown, campaignBreakdown }, insights }
    return res.json({
      success: true,
      kpis: {
        ...result.analytics,
        platformBreakdown: result.platformBreakdown,
        campaignBreakdown: result.campaignBreakdown,
      },
      insights: result.insights,
    });

  } catch (error) {
    console.error("analyzeController error:", error);
    return res.status(400).json({ error: error.message });
  }
};
