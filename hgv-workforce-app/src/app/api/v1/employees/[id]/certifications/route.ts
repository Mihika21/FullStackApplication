import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

function computeCertificationStatus(expiryDate: Date | null): string {
  if (!expiryDate) return "No expiry";
  const now = new Date();
  if (expiryDate < now) return "Expired";
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  if (expiryDate <= ninetyDaysFromNow) return "Expiring soon";
  return "Valid";
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const certs = await prisma.employeeCertification.findMany({
      where: { employeeId: id },
      orderBy: { createdAt: "desc" },
    });

    const enriched = certs.map((c) => ({
      ...c,
      status: computeCertificationStatus(c.expiryDate),
    }));

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canEditWorkforce) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to add certifications" },
        { status: 403 }
      );
    }

    const { id: employeeId } = params;
    const body = await request.json();
    const {
      name,
      certificationId,
      issuingBody,
      issueDate,
      expiryDate,
      credentialUrl,
      fileName,
      fileSize,
      mimeType,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Certification name is required" }, { status: 400 });
    }

    // BRD Rule: Mandatory certification ID
    if (!certificationId || !certificationId.trim()) {
      return NextResponse.json(
        { error: "Certification ID / Credential ID is mandatory" },
        { status: 400 }
      );
    }

    if (!issuingBody || !issuingBody.trim()) {
      return NextResponse.json({ error: "Issuing body is required" }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, employeeName: true, employeeId: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const expDate = expiryDate ? new Date(expiryDate) : null;
    const issDate = issueDate ? new Date(issueDate) : null;
    const computedStatus = computeCertificationStatus(expDate);

    const cert = await prisma.employeeCertification.upsert({
      where: {
        employeeId_certificationId: {
          employeeId,
          certificationId: certificationId.trim(),
        },
      },
      update: {
        name: name.trim(),
        issuingBody: issuingBody.trim(),
        issueDate: issDate,
        expiryDate: expDate,
        credentialUrl: credentialUrl?.trim() || null,
        fileName: fileName || null,
        fileSize: typeof fileSize === "number" ? fileSize : null,
        mimeType: mimeType || null,
        status: computedStatus,
        verified: true,
      },
      create: {
        employeeId,
        name: name.trim(),
        certificationId: certificationId.trim(),
        issuingBody: issuingBody.trim(),
        issueDate: issDate,
        expiryDate: expDate,
        credentialUrl: credentialUrl?.trim() || null,
        fileName: fileName || null,
        fileSize: typeof fileSize === "number" ? fileSize : null,
        mimeType: mimeType || null,
        status: computedStatus,
        verified: true,
      },
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "CREATE",
      entityType: "CERTIFICATION",
      entityId: cert.id,
      description: `Added certification '${cert.name}' (ID: ${cert.certificationId}) for ${employee.employeeName}`,
      afterJson: cert,
    });

    return NextResponse.json({ success: true, certification: cert }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canEditWorkforce) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete certifications" },
        { status: 403 }
      );
    }

    const { id: employeeId } = params;
    const { searchParams } = new URL(request.url);
    const certId = searchParams.get("certId");

    if (!certId) {
      return NextResponse.json({ error: "Certification ID is required" }, { status: 400 });
    }

    const existing = await prisma.employeeCertification.findUnique({
      where: { id: certId },
      include: { employee: true },
    });

    if (!existing || existing.employeeId !== employeeId) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    await prisma.employeeCertification.delete({
      where: { id: certId },
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "UPDATE",
      entityType: "CERTIFICATION",
      entityId: existing.id,
      description: `Deleted certification '${existing.name}' from ${existing.employee.employeeName}`,
      beforeJson: existing,
    });

    return NextResponse.json({ success: true, message: "Certification deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
