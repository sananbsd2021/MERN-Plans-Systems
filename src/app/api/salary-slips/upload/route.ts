import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connect";
import SalarySlip from "@/models/SalarySlip";
import Employee from "@/models/Employee";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN", "EXECUTIVE"].includes(session.user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const month = parseInt(formData.get("month") as string);
    const year = parseInt(formData.get("year") as string);

    if (!file || isNaN(month) || isNaN(year)) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    await connectDB();

    const results = [];
    const errors = [];

    for (const row of data) {
      try {
        // Find employee by employeeId (รหัสพนักงาน)
        const employeeIdKey = Object.keys(row).find(k => k.includes("รหัสพนักงาน") || k.toLowerCase().includes("employeeid"));
        if (!employeeIdKey) {
          errors.push(`ไม่พบหลักฐานรหัสพนักงานในแถว: ${JSON.stringify(row)}`);
          continue;
        }

        const employeeId = row[employeeIdKey].toString();
        const employee = await Employee.findOne({ tenantId: session.user.tenantId, employeeId });

        if (!employee) {
          errors.push(`ไม่พบข้อมูลพนักงานรหัส: ${employeeId}`);
          continue;
        }

        const earnings = [];
        const deductions = [];
        let netSalary = 0;

        // Map columns to earnings/deductions
        // Standard Thai salary slip keys
        const earningKeys = ["เงินเดือน", "ค่าตอบแทน", "โอที", "โบนัส", "เบี้ยเลี้ยง", "Salary", "Bonus", "OT"];
        const deductionKeys = ["ภาษี", "ประกันสังคม", "กองทุน", "หัก", "Tax", "Social Security", "SSO", "Provident"];

        for (const [key, value] of Object.entries(row)) {
          if (typeof value !== "number" || key === employeeIdKey) continue;

          const isEarning = earningKeys.some(k => key.includes(k));
          const isDeduction = deductionKeys.some(k => key.includes(k));

          if (isEarning) {
            earnings.push({ name: key, amount: value, type: "EARNING" as const });
            netSalary += value;
          } else if (isDeduction) {
            deductions.push({ name: key, amount: value, type: "DEDUCTION" as const });
            netSalary -= value;
          }
        }

        const slipData = {
          tenantId: session.user.tenantId,
          employeeId: employee._id,
          month,
          year,
          items: [...earnings, ...deductions],
          netSalary,
          status: "DRAFT",
        };

        // Update or create slip
        await SalarySlip.findOneAndUpdate(
          { tenantId: session.user.tenantId, employeeId: employee._id, month, year },
          slipData,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        results.push({ employeeId, name: `${employee.firstName} ${employee.lastName}`, netSalary });
      } catch (err: any) {
        errors.push(`Error processing row: ${err.message}`);
      }
    }

    return NextResponse.json({
      message: `นำเข้าข้อมูลสำเร็จ ${results.length} รายการ`,
      results,
      errors
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
