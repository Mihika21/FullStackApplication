import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const documents = await prisma.employeeDocument.findMany({
      where: { employeeId: id },
      orderBy: { createdAt: "desc" },
    });

    // Mask sensitive document numbers
    const masked = documents.map((doc) => {
      let maskedNum = doc.documentNumber || "";
      if (maskedNum.length > 4) {
        maskedNum = "•".repeat(maskedNum.length - 4) + maskedNum.slice(-4);
      }
      return {
        ...doc,
        documentNumber: maskedNum,
      };
    });

    return NextResponse.json(masked);
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
        { error: "Forbidden: You do not have permission to upload employee documents" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { documentType, documentNumber, fileName, fileSize, mimeType, status } = body;

    if (!documentType) {
      return NextResponse.json(
        { error: "Document Type is required" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, employeeName: true, employeeId: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const newDoc = await prisma.employeeDocument.create({
      data: {
        employeeId: id,
        documentType: documentType.trim(),
        documentNumber: (documentNumber || "").trim() || `DOC-${Date.now().toString().slice(-6)}`,
        fileName: fileName || null,
        fileSize: typeof fileSize === "number" ? fileSize : null,
        mimeType: mimeType || null,
        status: status || "Verified",
      },
    });

    // Audit log
    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "UPDATE",
      entityType: "DOCUMENT",
      entityId: newDoc.id,
      description: `Uploaded & verified document '${newDoc.documentType}' (${newDoc.fileName || "File"}) for ${employee.employeeName} (${employee.employeeId || id})`,
    });

    return NextResponse.json({
      success: true,
      document: newDoc,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
