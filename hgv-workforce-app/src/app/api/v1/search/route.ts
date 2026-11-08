import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json({ employees: [], departments: [], domainLeads: [] });
    }

    const q = query.trim();

    const [employees, domainLeads] = await Promise.all([
      prisma.employee.findMany({
        where: {
          OR: [
            { employeeName: { contains: q } },
            { employeeId: { contains: q } },
            { oraclePersonNumber: { contains: q } },
            { hgvRole: { contains: q } },
            { hgvDepartment: { contains: q } },
            { project: { contains: q } },
          ],
        },
        include: { domainLead: true },
        take: 10,
      }),
      prisma.domainLead.findMany({
        where: { name: { contains: q } },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      employees,
      domainLeads,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
