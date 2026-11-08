import { NextResponse } from "next/server";

const CSV_CONTENT = `Employee ID,Employee Name,Assignment Status,HGV Role,HGV Department,Domain Lead,Reporting Manager,Business Unit,Practice,Sub Practice,Grade Level,Shift Type,Base Location,Fixed CTC,Variable Pay Mode,Variable Pay %,Custom Variable Pay,Joining Bonus
IN01806552,Radha Subramanian,Probation,Lead QA Engineer,Quality Assurance,Jeff Chu,Sue Pawa,Hospitality Tech,QA,Automation,L4,US_SHIFT,Hyderabad,2200000,FLAT_PERCENT,5.0,,0
IN01806553,Karthik Raman,Active,Principal Cloud Architect,Cloud Infrastructure,Sue Pawa,Jeff Chu,Infrastructure,DevOps & SRE,Platform,L6,GENERAL,Bangalore,3600000,CUSTOM_AMOUNT,,35000,0
INVALID_999999,Nonexistent Person,Onboarding,QA Lead,Quality Assurance,Sue Pawa,Jeff Chu,Hospitality Tech,QA,,L3,GENERAL,Hyderabad,1800000,FLAT_PERCENT,5.0,,0
IN01806558,Sunita Rao,MadeUpStatus,Senior Data Engineer,Data & Analytics,Jeff Chu,Jeff Chu,Hospitality Tech,Data Lake,,L3,GENERAL,Hyderabad,2100000,FLAT_PERCENT,5.0,,0
IN01806554,Ananya Deshmukh,Active,NOC Operations Lead,NOC Operations,Michael Chang,Michael Chang,Infrastructure,Core Networks,,L4,NON_EXISTENT_SHIFT,Hyderabad,2500000,FLAT_PERCENT,5.0,,0
`;

export async function GET() {
  return new Response(CSV_CONTENT, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="test_bulk_update.csv"',
    },
  });
}
