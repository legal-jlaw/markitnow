// lib/generatePDF.js
// Client-side PDF generation using jsPDF loaded from CDN
// Called from search.js Download PDF buttons

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function getJsPDF() {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  return window.jspdf.jsPDF;
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function addHeader(doc, mark, type, pageWidth) {
  // Gold bar
  doc.setFillColor(201, 168, 76);
  doc.rect(0, 0, pageWidth, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(10, 10, 10);
  doc.text("MarkItNow.ai", 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(type, pageWidth - 14, 12, { align: "right" });

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(17, 17, 17);
  doc.text(`Trademark Analysis: "${mark.toUpperCase()}"`, 14, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · markitnow.ai`, 14, 41);

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 45, pageWidth - 14, 45);

  return 52; // y position after header
}

function addFooter(doc, pageNum, pageCount, pageWidth, pageHeight) {
  doc.setFillColor(245, 245, 245);
  doc.rect(0, pageHeight - 16, pageWidth, 16, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("This report is AI-generated for informational purposes only and does not constitute legal advice.", 14, pageHeight - 5);
  doc.text(`Page ${pageNum} of ${pageCount}`, pageWidth - 14, pageHeight - 5, { align: "right" });
}

function riskColor(risk) {
  if (!risk) return [100, 100, 100];
  const r = risk.toUpperCase();
  if (r === "HIGH") return [192, 57, 43];
  if (r === "MEDIUM") return [230, 126, 34];
  return [45, 122, 79];
}

function scoreColor(score) {
  if (score >= 70) return [45, 122, 79];
  if (score >= 40) return [230, 126, 34];
  return [192, 57, 43];
}

function addText(doc, text, x, y, options = {}) {
  const { maxWidth = 182, fontSize = 10, color = [50, 50, 50], bold = false, lineHeight = 1.4 } = options;
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  doc.setFont("helvetica", bold ? "bold" : "normal");
  const lines = doc.splitTextToSize(String(text || ""), maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * fontSize * lineHeight * 0.35;
}

function checkPage(doc, y, margin, pageHeight, pageWidth, mark, type) {
  if (y > pageHeight - 30) {
    doc.addPage();
    const newY = addHeader(doc, mark, type, pageWidth);
    return newY;
  }
  return y;
}

// ── AI Analysis Report PDF ────────────────────────────────────────────────────

export async function generateReportPDF(mark, report, agentData) {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const type = "AI Analysis Report";

  let y = addHeader(doc, mark, type, pageWidth);

  // ── Risk Score Box ──────────────────────────────────────────────────────────
  const sc = report.clientConfidenceScore || 0;
  const risk = report.overallRiskLevel || "UNKNOWN";
  const [r, g, b] = scoreColor(sc);

  doc.setFillColor(r, g, b, 0.1);
  doc.setDrawColor(r, g, b);
  doc.roundedRect(margin, y, 55, 28, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(r, g, b);
  doc.text(String(sc), margin + 27.5, y + 17, { align: "center" });
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text("REGISTRABILITY SCORE", margin + 27.5, y + 23, { align: "center" });

  // Risk badge
  doc.setFillColor(r, g, b);
  doc.roundedRect(margin + 58, y, 35, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`${risk} RISK`, margin + 75.5, y + 7, { align: "center" });

  // Stats
  const totalFound = agentData?.retrieval?.totalFound || 0;
  const activeCount = agentData?.retrieval?.activeCount || 0;
  const highCount = agentData?.scoring?.highRiskCount || 0;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total conflicts found: ${totalFound}`, margin + 58, y + 18);
  doc.text(`Active marks: ${activeCount}`, margin + 58, y + 24);
  doc.text(`High-risk conflicts: ${highCount}`, margin + 58, y + 30);

  y += 36;

  // ── Executive Summary ───────────────────────────────────────────────────────
  doc.setFillColor(248, 250, 249);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 2, 2, 2, "F"); // will resize below

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text("BOTTOM LINE", margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(26, 46, 35);
  const summaryLines = doc.splitTextToSize(report.executiveSummary || "", pageWidth - margin * 2 - 8);
  const summaryH = summaryLines.length * 5 + 12;
  doc.setFillColor(248, 250, 249);
  doc.roundedRect(margin, y, pageWidth - margin * 2, summaryH, 2, 2, "F");
  doc.text(summaryLines, margin + 4, y + 10);
  y += summaryH + 6;

  // ── Why It Could Work ───────────────────────────────────────────────────────
  if (report.whyItCouldWork?.length > 0) {
    y = checkPage(doc, y, margin, pageHeight, pageWidth, mark, type);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text("Registration Arguments", margin, y);
    y += 6;

    for (const item of report.whyItCouldWork) {
      y = checkPage(doc, y, margin, pageHeight, pageWidth, mark, type);
      doc.setFillColor(240, 247, 242);
      doc.setDrawColor(45, 122, 79);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 2, 1, 1, "F");
      const lines = doc.splitTextToSize(item.reason || "", pageWidth - margin * 2 - 8);
      const exLines = doc.splitTextToSize(item.explanation || "", pageWidth - margin * 2 - 8);
      const boxH = (lines.length + exLines.length) * 4.5 + 10;
      doc.roundedRect(margin, y, pageWidth - margin * 2, boxH, 1, 1, "F");
      doc.line(margin, y + 2, margin, y + boxH - 2);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(17, 17, 17);
      doc.text(lines, margin + 4, y + 6);
      const textY = y + 6 + lines.length * 4.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(74, 112, 96);
      doc.text(exLines, margin + 4, textY);
      y += boxH + 4;
    }
    y += 4;
  }

  // ── Risk Factors ────────────────────────────────────────────────────────────
  if (report.whyItMightNotWork?.length > 0) {
    y = checkPage(doc, y, margin, pageHeight, pageWidth, mark, type);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text("Risk Factors", margin, y);
    y += 6;

    for (const item of report.whyItMightNotWork) {
      y = checkPage(doc, y, margin, pageHeight, pageWidth, mark, type);
      doc.setFillColor(253, 242, 241);
      doc.setDrawColor(192, 57, 43);
      const lines = doc.splitTextToSize(item.reason || "", pageWidth - margin * 2 - 8);
      const exLines = doc.splitTextToSize(item.explanation || "", pageWidth - margin * 2 - 8);
      const boxH = (lines.length + exLines.length) * 4.5 + 10;
      doc.roundedRect(margin, y, pageWidth - margin * 2, boxH, 1, 1, "F");
      doc.line(margin, y + 2, margin, y + boxH - 2);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(17, 17, 17);
      doc.text(lines, margin + 4, y + 6);
      const textY = y + 6 + lines.length * 4.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(74, 112, 96);
      doc.text(exLines, margin + 4, textY);
      y += boxH + 4;
    }
    y += 4;
  }

  // ── Conflict Snapshot ───────────────────────────────────────────────────────
  if (report.conflictSnapshot?.length > 0) {
    y = checkPage(doc, y, margin, pageHeight, pageWidth, mark, type);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text("Key Conflicts", margin, y);
    y += 7;

    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("MARK", margin + 2, y + 5);
    doc.text("OWNER", margin + 70, y + 5);
    doc.text("CLASS", margin + 130, y + 5);
    doc.text("RISK", margin + 155, y + 5);
    y += 9;

    for (const c of report.conflictSnapshot) {
      y = checkPage(doc, y, margin, pageHeight, pageWidth, mark, type);
      const [cr, cg, cb] = riskColor(c.risk);
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y, pageWidth - margin, y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(17, 17, 17);
      doc.text(doc.splitTextToSize(c.markName || "", 65)[0], margin + 2, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(doc.splitTextToSize(c.owner || "", 55)[0], margin + 70, y + 5);
      doc.text(String(c.class || ""), margin + 130, y + 5);

      doc.setFillColor(cr, cg, cb);
      doc.roundedRect(margin + 152, y + 1, 20, 6, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(c.risk || "", margin + 162, y + 5.5, { align: "center" });
      y += 10;
    }
    y += 6;
  }

  // ── Recommendation ──────────────────────────────────────────────────────────
  if (report.whatHappensNext) {
    y = checkPage(doc, y, margin, pageHeight, pageWidth, mark, type);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text("Recommendation", margin, y);
    y += 6;
    const recLines = doc.splitTextToSize(report.whatHappensNext, pageWidth - margin * 2 - 8);
    const recH = recLines.length * 5 + 10;
    doc.setFillColor(255, 253, 247);
    doc.setDrawColor(201, 168, 76);
    doc.roundedRect(margin, y, pageWidth - margin * 2, recH, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(recLines, margin + 4, y + 7);
    y += recH + 6;
  }

  // ── Disclaimer ──────────────────────────────────────────────────────────────
  y = checkPage(doc, y, margin, pageHeight, pageWidth, mark, type);
  doc.setFillColor(245, 245, 245);
  const discLines = doc.splitTextToSize("DISCLAIMER: This report is generated by artificial intelligence and is provided for informational purposes only. It does not constitute legal advice and does not create an attorney-client relationship. You should consult a licensed trademark attorney before making any filing decisions.", pageWidth - margin * 2 - 8);
  const discH = discLines.length * 4 + 10;
  doc.roundedRect(margin, y, pageWidth - margin * 2, discH, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(discLines, margin + 4, y + 6);

  // Add footers to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages, pageWidth, pageHeight);
  }

  doc.save(`MarkItNow-Analysis-${mark.replace(/\s+/g, "-").toUpperCase()}.pdf`);
}

// ── AI Legal Memo PDF ─────────────────────────────────────────────────────────

export async function generateMemoPDF(mark, memo) {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const type = "AI Legal Memo";

  let y = addHeader(doc, mark, type, pageWidth);

  // Cover info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`RE: Trademark Clearance Analysis — "${mark.toUpperCase()}"`, margin, y);
  doc.text(`Prepared by: MarkItNow.ai AI Analysis Engine`, margin, y + 5);
  doc.text(`Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, y + 10);
  y += 18;

  // Memo summary
  if (memo.memoSummary) {
    const sumLines = doc.splitTextToSize(memo.memoSummary, pageWidth - margin * 2 - 8);
    const sumH = sumLines.length * 5 + 12;
    doc.setFillColor(248, 250, 249);
    doc.setDrawColor(17, 17, 17);
    doc.roundedRect(margin, y, pageWidth - margin * 2, sumH, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text("EXECUTIVE SUMMARY", margin + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(26, 46, 35);
    doc.text(sumLines, margin + 4, y + 12);
    y += sumH + 8;
  }

  // DuPont Analysis
  if (memo.duPontAnalysis?.factors?.length > 0) {
    y = checkPage(doc, y, margin, pageHeight, pageWidth, mark, type);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(17, 17, 17);
    doc.text("DuPont Factor Analysis", margin, y);
    y += 5;

    if (memo.duPontAnalysis.overview) {
      const ovLines = doc.splitTextToSize(memo.duPontAnalysis.overview, pageWidth - margin * 2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(107, 138, 120);
      doc.text(ovLines, margin, y + 4);
      y += ovLines.length * 4 + 8;
    }

    for (const f of memo.duPontAnalysis.factors) {
      y = checkPage(doc, y, margin, pageHeight, pageWidth, mark, type);
      const [fr, fg, fb] = f.finding === "FAVORABLE" ? [45, 122, 79] : f.finding === "UNFAVORABLE" ? [192, 57, 43] : [100, 100, 100];
      const factorLines = doc.splitTextToSize(f.factor || "", pageWidth - margin * 2 - 40);
      const analysisLines = doc.splitTextToSize(f.analysis || "", pageWidth - margin * 2 - 8);
      const boxH = (factorLines.length + analysisLines.length) * 4.5 + 12;

      doc.setFillColor(248, 250, 249);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(margin, y, pageWidth - margin * 2, boxH, 1, 1, "FD");

      // Factor number circle
      doc.setFillColor(17, 17, 17);
      doc.circle(margin + 6, y + 6, 4, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(String(f.number || ""), margin + 6, y + 7.5, { align: "center" });

      // Factor name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(17, 17, 17);
      doc.text(factorLines, margin + 13, y + 7);

      // Finding badge
      doc.setFillColor(fr, fg, fb);
      doc.roundedRect(pageWidth - margin - 28, y + 2, 26, 6, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(f.finding || "", pageWidth - margin - 15, y + 6.5, { align: "center" });

      // Analysis text
      const factorTextH = factorLines.length * 4.5 + 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(74, 112, 96);
      doc.text(analysisLines, margin + 4, y + factorTextH);
      y += boxH + 3;
    }
    y += 4;
  }

  // Prosecution Strategy
  if (memo.prosecutionStrategy?.length > 0) {
    y = checkPage(doc, y, margin, pageHeight, pageWidth, mark, type);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(17, 17, 17);
    doc.text("Prosecution Strategy", margin, y);
    y += 7;

    for (let i = 0; i < memo.prosecutionStrategy.length; i++) {
      const s = memo.prosecutionStrategy[i];
      y = checkPage(doc, y, margin, pageHeight, pageWidth, mark, type);
      const actionLines = doc.splitTextToSize(s.action || "", pageWidth - margin * 2 - 8);
      const ratLines = doc.splitTextToSize(s.rationale || "", pageWidth - margin * 2 - 8);
      const boxH = (actionLines.length + ratLines.length) * 4.5 + 12;

      doc.setFillColor(240, 247, 242);
      doc.setDrawColor(45, 122, 79);
      doc.roundedRect(margin, y, pageWidth - margin * 2, boxH, 1, 1, "F");
      doc.line(margin, y + 2, margin, y + boxH - 2);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(17, 17, 17);
      doc.text(actionLines, margin + 4, y + 6);
      const actionH = actionLines.length * 4.5 + 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(74, 112, 96);
      doc.text(ratLines, margin + 4, y + actionH);
      if (s.citation) {
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.text(s.citation, margin + 4, y + actionH + ratLines.length * 4.5);
      }
      y += boxH + 4;
    }
    y += 4;
  }

  // Risk Matrix
  if (memo.riskMatrix?.length > 0) {
    y = checkPage(doc, y, margin, pageHeight, pageWidth, mark, type);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(17, 17, 17);
    doc.text("Risk Matrix", margin, y);
    y += 7;

    // Header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("RISK / MITIGATION", margin + 2, y + 5);
    doc.text("LIKELIHOOD", pageWidth - margin - 44, y + 5);
    doc.text("SEVERITY", pageWidth - margin - 18, y + 5);
    y += 9;

    for (const r of memo.riskMatrix) {
      y = checkPage(doc, y, margin, pageHeight, pageWidth, mark, type);
      const riskLines = doc.splitTextToSize(r.risk || "", 100);
      const mitLines = doc.splitTextToSize(r.mitigation || "", 100);
      const boxH = (riskLines.length + mitLines.length) * 4 + 10;

      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y, pageWidth - margin, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(17, 17, 17);
      doc.text(riskLines, margin + 2, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(107, 138, 120);
      doc.text(mitLines, margin + 2, y + 5 + riskLines.length * 4.2);

      const [lr, lg, lb] = riskColor(r.likelihood);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(lr, lg, lb);
      doc.text(r.likelihood || "", pageWidth - margin - 44, y + 5);

      const [sr, sg, sb] = riskColor(r.severity);
      doc.setTextColor(sr, sg, sb);
      doc.text(r.severity || "", pageWidth - margin - 18, y + 5);
      y += boxH;
    }
    y += 8;
  }

  // Disclaimer
  y = checkPage(doc, y, margin, pageHeight, pageWidth, mark, type);
  doc.setFillColor(245, 245, 245);
  const discLines = doc.splitTextToSize("DISCLAIMER: This memo is generated by artificial intelligence and is provided for informational purposes only. It does not constitute legal advice, does not create an attorney-client relationship, and should not be relied upon as a substitute for advice from a licensed trademark attorney. Case citations should be independently verified.", pageWidth - margin * 2 - 8);
  const discH = discLines.length * 4 + 10;
  doc.roundedRect(margin, y, pageWidth - margin * 2, discH, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(discLines, margin + 4, y + 6);

  // Footers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages, pageWidth, pageHeight);
  }

  doc.save(`MarkItNow-Legal-Memo-${mark.replace(/\s+/g, "-").toUpperCase()}.pdf`);
}
