const mongoose = require("mongoose");

const ScanResultSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  findings: [Object],
  score: Number,
  grade: String,
});

module.exports = mongoose.model("ScanResult", ScanResultSchema);