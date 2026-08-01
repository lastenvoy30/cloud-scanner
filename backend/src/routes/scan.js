const express = require("express");
const router = express.Router();
const ScanResult = require("../models/ScanResult");
const checkS3PublicAccess = require("../checks/s3PublicAccess");
const checkOpenSecurityGroups = require("../checks/securityGroupOpenPorts");
const checkIamOverPrivileged = require("../checks/iamOverPrivileged");

function calculateGrade(findings) {
  const weights = { CRITICAL: 25, HIGH: 15, MEDIUM: 8, LOW: 3 };
  const deduction = findings.reduce(
    (sum, f) => sum + (weights[f.severity] || 0),
    0
  );
  const score = Math.max(0, 100 - deduction);
  const grade =
    score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
  return { score, grade };
}

router.post("/run", async (req, res) => {
  try {
    const [s3Findings, sgFindings, iamFindings] = await Promise.all([
      checkS3PublicAccess(),
      checkOpenSecurityGroups(),
      checkIamOverPrivileged(),
    ]);

    const findings = [...s3Findings, ...sgFindings, ...iamFindings];
    const { score, grade } = calculateGrade(findings);

    const result = await ScanResult.create({ findings, score, grade });
    res.json(result);
  } catch (err) {
    console.error("Scan failed:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/history", async (req, res) => {
  try {
    const results = await ScanResult.find().sort({ timestamp: -1 }).limit(20);
    res.json(results);
  } catch (err) {
    console.error("History fetch failed:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;