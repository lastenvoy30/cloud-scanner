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

const PDFDocument = require("pdfkit");

router.get("/:id/pdf", async (req, res) => {
  try {
    const scan = await ScanResult.findById(req.params.id);
    if (!scan) return res.status(404).json({ error: "Scan not found" });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=perimeter-report-${scan._id}.pdf`
    );
    doc.pipe(res);

    const severityColors = {
      CRITICAL: "#d9364a",
      HIGH: "#c9711f",
      MEDIUM: "#a68b12",
      LOW: "#2f6fb5",
    };

    // Header
    doc
      .fontSize(22)
      .fillColor("#0a0f1c")
      .text("Perimeter — Cloud Security Report", { align: "left" });

    doc
      .fontSize(10)
      .fillColor("#666666")
      .text(`Generated: ${new Date(scan.timestamp).toLocaleString()}`);

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#dddddd").stroke();
    doc.moveDown(1);

    // Grade summary
    doc
      .fontSize(16)
      .fillColor("#000000")
      .text(`Security Grade: ${scan.grade}`, { continued: true })
      .fillColor("#666666")
      .fontSize(12)
      .text(`   (Score: ${scan.score} / 100)`);

    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .fillColor("#666666")
      .text(`${scan.findings.length} finding(s) detected across this scan.`);

    doc.moveDown(1.2);
    doc.fontSize(14).fillColor("#000000").text("Findings", { underline: true });
    doc.moveDown(0.6);

    if (scan.findings.length === 0) {
      doc.fontSize(10).fillColor("#333333").text("No issues found.");
    }

    scan.findings.forEach((f, i) => {
      doc
        .fontSize(11)
        .fillColor(severityColors[f.severity] || "#000000")
        .text(`${i + 1}. [${f.severity}] ${f.check}`);

      doc.fontSize(10).fillColor("#000000").text(f.description, {
        indent: 15,
      });

      doc
        .fontSize(9)
        .fillColor("#555555")
        .text(`Resource: ${f.resource}`, { indent: 15 });

      doc
        .fontSize(9)
        .fillColor("#333333")
        .text(`Remediation: ${f.remediation}`, { indent: 15 });

      doc.moveDown(0.8);
    });

    doc.end();
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;