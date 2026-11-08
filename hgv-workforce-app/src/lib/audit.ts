import { prisma } from "./prisma";

export async function logAuditEvent({
  actorEmail,
  actorRole,
  action,
  entityType,
  entityId,
  description,
  beforeJson,
  afterJson,
}: {
  actorEmail: string;
  actorRole: string;
  action: "CREATE" | "UPDATE" | "DEACTIVATE" | "UPLOAD" | "CONFIG_CHANGE" | "LOGIN" | "EXPORT" | string;
  entityType: "EMPLOYEE" | "COMPENSATION" | "BILLING_CONFIG" | "UPLOAD" | "USER" | "DOCUMENT" | "SHIFT_TYPE" | "BATCH" | string;
  entityId?: string;
  description: string;
  beforeJson?: any;
  afterJson?: any;
}) {
  try {
    return await prisma.auditEvent.create({
      data: {
        actorEmail,
        actorRole,
        action,
        entityType,
        entityId,
        description,
        beforeJson: beforeJson ? JSON.stringify(beforeJson) : null,
        afterJson: afterJson ? JSON.stringify(afterJson) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}
