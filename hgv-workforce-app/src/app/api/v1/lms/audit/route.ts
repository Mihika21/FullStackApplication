import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const targetEntity = searchParams.get("targetEntity");
    const actorEmail = searchParams.get("actorEmail");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (action) where.action = action;
    if (targetEntity) where.targetEntity = targetEntity;
    if (actorEmail) where.actorEmail = actorEmail;

    const auditLogs = await prisma.lmsAuditTrail.findMany({
      where,
      take: limit,
      orderBy: { timestamp: "desc" },
    });

    const totalCount = await prisma.lmsAuditTrail.count({ where });

    return NextResponse.json({
      auditLogs,
      totalCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
