const fs  = require("fs");
const csv = require("csv-parser");

const { cleanGoogleAdsData } = require("../services/cleaners/googleAdsCleaner");
const { cleanMetaAdsData    } = require("../services/cleaners/metaAdsCleaner");
const { mergeDatasets        } = require("../services/merge/mergeEngine");
const { generateAnalytics    } = require("../services/analytics/analyticsEngine");
const { generateAIInsights   } = require("../services/ai/aiInsightGenerator");

// ─── Platform registry ────────────────────────────────────────────────────────
// To add a new platform (Phase 6): create its cleaner, then add one entry here.
// Nothing else in the pipeline needs to change.
const PLATFORM_REGISTRY = [
  { fileKey: "googleFile", cleaner: cleanGoogleAdsData, required: true  },
  { fileKey: "metaFile",   cleaner: cleanMetaAdsData,   required: true  },
  // { fileKey: "twitterFile",  cleaner: cleanTwitterAdsData,  required: false },
  // { fileKey: "linkedinFile", cleaner: cleanLinkedInAdsData, required: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const readCSV = (filePath) =>
  new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end",  ()    => resolve(rows))
      .on("error", reject);
  });

// ─── Controller ───────────────────────────────────────────────────────────────

exports.analyzeController = async (req, res) => {
  try {
    console.log("FILES:", req.files);

    // Validate required files
    const missing = PLATFORM_REGISTRY
      .filter((p) => p.required && !req.files?.[p.fileKey])
      .map((p) => p.fileKey);

    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required files: ${missing.join(", ")}`,
      });
    }

    // Read, clean, and collect all platform datasets in registry order
    const cleanedDatasets = await Promise.all(
      PLATFORM_REGISTRY
        .filter((p) => req.files?.[p.fileKey])
        .map(async ({ fileKey, cleaner }) => {
          const path = req.files[fileKey][0].path;
          console.log(`Reading ${fileKey}:`, path);
          const rows = await readCSV(path);
          console.log(`${fileKey} rows:`, rows.length);
          return cleaner(rows);
        })
    );

    // Merge all cleaned datasets into one unified array
    // mergeDatasets accepts (googleData, metaData) — pass them positionally
    // for backward compatibility; future platforms are appended via concat.
    const [cleanedGoogle, cleanedMeta, ...extras] = cleanedDatasets;
    const mergedData = [
      ...mergeDatasets(cleanedGoogle, cleanedMeta),
      ...extras.flat(),
    ];

    // Analytics (includes platformBreakdown and campaignBreakdown)
    const kpis = generateAnalytics(mergedData);

    // AI insights (uses enriched prompt with platform + campaign context)
    const insights = await generateAIInsights(mergedData, kpis);

    return res.json({ success: true, kpis, insights });

  } catch (error) {
    console.error("analyzeController error:", error);
    return res.status(500).json({ error: error.message });
  }
};
