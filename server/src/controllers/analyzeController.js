const fs = require("fs");
const csv = require("csv-parser");

const {
  cleanGoogleAdsData,
} = require("../services/cleaners/googleAdsCleaner");

const {
  cleanMetaAdsData,
} = require("../services/cleaners/metaAdsCleaner");

const {
  mergeDatasets,
} = require("../services/merge/mergeEngine");

const {
  generateAnalytics,
} = require("../services/analytics/analyticsEngine");

const {
  generateAIInsights,
} = require("../services/ai/aiInsightGenerator");


// ===============================
// CSV READER
// ===============================

const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
};


// ===============================
// CONTROLLER
// ===============================

exports.analyzeController = async (
  req,
  res
) => {
  try {
    console.log("FILES:", req.files);

    // ===========================
    // VALIDATION
    // ===========================

    if (
      !req.files ||
      !req.files.googleFile ||
      !req.files.metaFile
    ) {
      return res.status(400).json({
        error:
          "Google and Meta files required",
      });
    }

    // ===========================
    // FILE PATHS
    // ===========================

    const googlePath =
      req.files.googleFile[0].path;

    const metaPath =
      req.files.metaFile[0].path;

    console.log("Google:", googlePath);
    console.log("Meta:", metaPath);

    // ===========================
    // READ CSV
    // ===========================

    const googleRows =
      await readCSV(googlePath);

    const metaRows =
      await readCSV(metaPath);

    console.log(
      "Google Rows:",
      googleRows.length
    );

    console.log(
      "Meta Rows:",
      metaRows.length
    );

    // ===========================
    // CLEAN DATA
    // ===========================

    const cleanedGoogle =
      cleanGoogleAdsData(googleRows);

    const cleanedMeta =
      cleanMetaAdsData(metaRows);

    // ===========================
    // MERGE
    // ===========================

    const mergedData = mergeDatasets(
      cleanedGoogle,
      cleanedMeta
    );

    // ===========================
    // ANALYTICS
    // ===========================

    const kpis =
      generateAnalytics(mergedData);

    // ===========================
    // AI INSIGHTS
    // ===========================

    const insights =
      await generateAIInsights(
        mergedData,
        kpis
      );

    // ===========================
    // RESPONSE
    // ===========================

    return res.json({
      success: true,
      kpis,
      insights,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message,
    });
  }
};