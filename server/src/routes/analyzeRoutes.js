const express = require("express");
const router = express.Router();

const multer = require("multer");

const {
  analyzeController,
} = require("../controllers/analyzeController");

const upload = multer({
  dest: "uploads/",
});

router.post(
  "/",
  upload.fields([
    {
      name: "googleFile",
      maxCount: 1,
    },
    {
      name: "metaFile",
      maxCount: 1,
    },
  ]),
  analyzeController
);

module.exports = router;