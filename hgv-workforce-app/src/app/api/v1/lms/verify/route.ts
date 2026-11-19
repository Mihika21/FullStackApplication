import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeCertificateHash } from "@/lib/lms";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim();

    if (!query) {
      return NextResponse.json({ error: "Certificate number, UUID, or hash is required" }, { status: 400 });
    }

    const certificate = await prisma.lmsCertificate.findFirst({
      where: {
        OR: [
          { certificateNumber: query },
          { id: query },
          { verificationHash: query },
          { enrollmentId: query },
        ],
      },
      include: {
        course: true,
        enrollment: true,
      },
    });

    if (!certificate) {
      return NextResponse.json({
        verified: false,
        status: "NOT_FOUND",
        message: "No credential found matching the provided identification code.",
      });
    }

    // Verify cryptographic SHA-256 integrity
    const computedHash = computeCertificateHash(
      certificate.certificateNumber,
      certificate.userEmail,
      certificate.course.title,
      certificate.issuedAt
    );
    const isHashValid = computedHash === certificate.verificationHash;

    const now = new Date();
    const isExpired = new Date(certificate.expiresAt) < now;

    let verificationStatus = "VERIFIED_AUTHENTIC";
    let statusMessage = "This credential is valid, cryptographically verified, and officially on record.";

    if (isExpired) {
      verificationStatus = "EXPIRED";
      statusMessage = "This certification was officially awarded but has expired. Recertification is required.";
    } else if (!isHashValid) {
      verificationStatus = "INTEGRITY_COMPROMISED";
      statusMessage = "Warning: Cryptographic signature mismatch detected.";
    }

    return NextResponse.json({
      verified: isHashValid && !isExpired,
      status: verificationStatus,
      message: statusMessage,
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        recipientName: certificate.userName,
        recipientEmail: certificate.userEmail,
        courseTitle: certificate.course.title,
        courseCategory: certificate.course.category,
        isMandatory: certificate.course.isMandatory,
        issuedAt: certificate.issuedAt,
        expiresAt: certificate.expiresAt,
        scorePercent: certificate.scorePercent,
        verificationHash: certificate.verificationHash,
        issuingAuthority: "HGV GCC Enterprise Learning & Compliance Platform",
        accreditationStandard: "SOC 2 Type II & ISO/IEC 27001:2022 Statutory Compliance",
        qrPayload: certificate.qrPayload,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
