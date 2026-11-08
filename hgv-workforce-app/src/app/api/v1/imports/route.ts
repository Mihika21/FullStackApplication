import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canUploadCsv) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view import batches" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";

    const where: any = {};
    if (type) where.uploadType = type;

    const batches = await prisma.importBatch.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        _count: {
          select: { rowErrors: true },
        },
      },
    });

    return NextResponse.json(batches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
