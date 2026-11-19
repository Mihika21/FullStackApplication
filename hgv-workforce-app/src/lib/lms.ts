import { prisma } from "./prisma";
import crypto from "crypto";

export function computeCertificateHash(
  certificateNumber: string,
  userEmail: string,
  courseTitle: string,
  issuedAt: Date | string
): string {
  const payload = `${certificateNumber}|${userEmail.toLowerCase().trim()}|${courseTitle.trim()}|${new Date(issuedAt).toISOString()}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export function generateCertificateNumber(courseSlug: string): string {
  const prefix = courseSlug.toUpperCase().slice(0, 5).replace(/[^A-Z]/g, "X");
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `CERT-${year}-${prefix}-${randomDigits}`;
}

export async function logLmsAudit(params: {
  actorEmail: string;
  actorRole: string;
  action: string;
  targetEntity: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}) {
  try {
    return await prisma.lmsAuditTrail.create({
      data: {
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: params.action,
        targetEntity: params.targetEntity,
        entityId: params.entityId,
        detailsJson: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || "127.0.0.1",
      },
    });
  } catch (error) {
    console.error("Failed to write LMS audit log:", error);
  }
}
