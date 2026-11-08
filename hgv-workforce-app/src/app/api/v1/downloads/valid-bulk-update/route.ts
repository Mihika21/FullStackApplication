import { NextResponse } from "next/server";

const CSV_CONTENT = `Employee ID,Employee Name,Assignment Status,HGV Role,HGV Department,Domain Lead,Reporting Manager,Business Unit,Practice,Sub Practice,Grade Level,Shift Type,Base Location,Fixed CTC,Variable Pay Mode,Variable Pay %,Custom Variable Pay,Joining Bonus
IN01806551,Nimmi K Cherian,Active,Senior QA Automation Engineer,Quality Assurance,Jeff Chu,Sue Pawa,Hospitality Tech,QA,Test Automation,L4,GENERAL,Hyderabad,1850000,FLAT_PERCENT,5.0,,0
IN01806552,Radha Subramanian,Active,Lead System Architect,Quality Assurance,Sue Pawa,Michael Chang,Hospitality Tech,Architecture,Enterprise Platform,L5,US_SHIFT,Hyderabad,2400000,FLAT_PERCENT,5.0,,0
IN01806553,Karthik Raman,Active,Senior Cloud Architect,Cloud Infrastructure,Sue Pawa,Jeff Chu,Infrastructure,DevOps & SRE,Platform Engineering,L6,GENERAL,Bangalore,3400000,CUSTOM_AMOUNT,,30000,0
IN01806554,Ananya Deshmukh,Active,NOC Tier-2 Lead,Operations,Michael Chang,Michael Chang,Infrastructure,Core Networks,Network Operations,L4,NOC_24X7,Hyderabad,2200000,FLAT_PERCENT,5.0,,0
IN01806558,Sunita Rao,On Leave,Senior Data Engineer,Data & Analytics,Jeff Chu,Jeff Chu,Hospitality Tech,Data Lake,Data Pipeline,L4,GENERAL,Hyderabad,2300000,FLAT_PERCENT,5.0,,0
`;

export async function GET() {
  return new Response(CSV_CONTENT, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="valid_bulk_update.csv"',
    },
  });
}
