const express = require("express");
const cors = require("cors");
require("dotenv").config();

const analyzeRoutes = require("./routes/analyzeRoutes");

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/analyze", analyzeRoutes);

app.get("/", (req, res) => {
  res.send("AI Marketing Server Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});