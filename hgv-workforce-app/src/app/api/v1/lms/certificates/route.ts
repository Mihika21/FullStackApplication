import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope"); // "mine" or "all"
    const userEmail = searchParams.get("userEmail");

    const where: any = {};

    if (scope === "mine" || (!userEmail && user.roleCode === "HR_TEAM_MEMBER" && scope !== "all")) {
      where.userEmail = user.email;
    } else if (userEmail) {
      where.userEmail = userEmail;
    }

    const certificates = await prisma.lmsCertificate.findMany({
      where,
      include: {
        course: true,
        enrollment: true,
      },
      orderBy: { issuedAt: "desc" },
    });

    return NextResponse.json({ certificates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
