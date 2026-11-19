import jsPDF from "jspdf";

export interface CertificatePdfData {
  certificateNumber: string;
  recipientName: string;
  recipientEmail: string;
  courseTitle: string;
  courseCategory?: string;
  issuedAt: string | Date;
  expiresAt: string | Date;
  scorePercent?: number;
  verificationHash: string;
  issuingAuthority?: string;
}

export function downloadCertificatePdf(data: CertificatePdfData) {
  // Landscape A4 certificate
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background / Border styling
  doc.setFillColor(250, 252, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Elegant Double Border
  doc.setDrawColor(24, 43, 73); // Navy #182B49
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  doc.setDrawColor(13, 148, 136); // Teal #0D9488
  doc.setLineWidth(0.8);
  doc.rect(14, 14, pageWidth - 28, pageHeight - 28);

  // Top Header Banner
  doc.setFillColor(24, 43, 73);
  doc.rect(15, 15, pageWidth - 30, 22, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("HGV GCC ENTERPRISE LEARNING & COMPLIANCE PLATFORM", pageWidth / 2, 27, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(153, 246, 228);
  doc.text("OFFICIAL STATUTORY COMPLIANCE CREDENTIAL", pageWidth / 2, 33, {
    align: "center",
  });

  // Certificate Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(24, 43, 73);
  doc.text("CERTIFICATE OF COMPLETION", pageWidth / 2, 56, { align: "center" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text("This is officially awarded and digitally certified to", pageWidth / 2, 66, {
    align: "center",
  });

  // Recipient Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(13, 148, 136);
  doc.text(data.recipientName.toUpperCase(), pageWidth / 2, 78, { align: "center" });

  // Recipient Email & Info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Corporate Identity: ${data.recipientEmail}`, pageWidth / 2, 85, {
    align: "center",
  });

  // Course Details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(
    "for successfully satisfying all mandatory curriculum requirements and passing the rigorous assessment for:",
    pageWidth / 2,
    97,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(24, 43, 73);
  doc.text(data.courseTitle, pageWidth / 2, 108, { align: "center" });

  // Score & Category
  if (data.scorePercent) {
    doc.setFont("helvetica", "semibold");
    doc.setFontSize(11);
    doc.setTextColor(13, 148, 136);
    doc.text(
      `Assessment Score: ${data.scorePercent}% • Category: ${data.courseCategory || "Mandatory Compliance"}`,
      pageWidth / 2,
      116,
      { align: "center" }
    );
  }

  // Two columns for Dates and Signatures
  const issueDateStr = new Date(data.issuedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const expiryDateStr = new Date(data.expiresAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Left Column: Validation Timestamps
  const colLeftX = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(24, 43, 73);
  doc.text("ISSUANCE & AUDIT DATES", colLeftX, 135);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Issued Date: ${issueDateStr}`, colLeftX, 142);
  doc.text(`Valid Until: ${expiryDateStr} (365-Day Cycle)`, colLeftX, 148);
  doc.text(`Certificate No: ${data.certificateNumber}`, colLeftX, 154);

  // Right Column: Signatures & Accreditations
  const colRightX = pageWidth - 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(24, 43, 73);
  doc.text("EXECUTIVE ENDORSEMENT", colRightX, 135, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Sarah Jenkins — Head of Learning & Compliance", colRightX, 142, { align: "right" });
  doc.text("Marcus Vance — Chief Information Security Officer (CISO)", colRightX, 148, { align: "right" });
  doc.text("Standard: SOC 2 Type II & ISO/IEC 27001:2022", colRightX, 154, { align: "right" });

  // Bottom Cryptographic Verification Bar
  doc.setFillColor(241, 245, 249);
  doc.rect(20, 168, pageWidth - 40, 22, "F");
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.rect(20, 168, pageWidth - 40, 22);

  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("CRYPTOGRAPHIC VERIFICATION PROOF (SHA-256 HASH):", 24, 175);

  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(data.verificationHash, 24, 182);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(13, 148, 136);
  doc.text(
    `Online Verification Portal: https://hgv.workforce/lms/verify/${data.certificateNumber}`,
    pageWidth - 24,
    182,
    { align: "right" }
  );

  // Trigger download in browser
  doc.save(`${data.certificateNumber}_${data.recipientName.replace(/\s+/g, "_")}.pdf`);
}
