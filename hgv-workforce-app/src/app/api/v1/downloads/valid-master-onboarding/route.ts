import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "valid_master_onboarding.csv");
  const content = fs.readFileSync(filePath, "utf-8");

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="valid_master_onboarding.csv"',
    },
  });
}
