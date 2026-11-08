import { NextResponse } from "next/server";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    return NextResponse.json({
      user,
      permissions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
