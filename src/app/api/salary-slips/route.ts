import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connect";
import SalarySlip from "@/models/SalarySlip";
import Employee from "@/models/Employee";
import { z } from "zod";

const salaryItemSchema = z.object({
  name: z.string(),
  amount: z.number(),
  type: z.enum(["EARNING", "DEDUCTION"]),
});

const salarySlipSchema = z.object({
  employeeId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number(),
  items: z.array(salaryItemSchema),
  netSalary: z.number(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  await connectDB();

  const query: any = { tenantId: session.user.tenantId };
  if (employeeId) query.employeeId = employeeId;
  if (month) query.month = parseInt(month);
  if (year) query.year = parseInt(year);

  // If the user is an officer, they can only see their own slips
  if (session.user.role === "OFFICER") {
    const employee = await Employee.findOne({ userId: session.user.id });
    if (!employee) return NextResponse.json([], { status: 200 });
    query.employeeId = employee._id;
    query.status = "PUBLISHED"; // Officers only see published slips
  }

  const slips = await SalarySlip.find(query)
    .populate("employeeId", "firstName lastName position employeeId")
    .sort({ year: -1, month: -1 });

  return NextResponse.json(slips);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN", "EXECUTIVE"].includes(session.user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = salarySlipSchema.parse(body);

    await connectDB();
    
    // Check if slip already exists for the same employee, month, and year
    const existing = await SalarySlip.findOne({
      tenantId: session.user.tenantId,
      employeeId: validatedData.employeeId,
      month: validatedData.month,
      year: validatedData.year,
    });

    let slip;
    if (existing) {
      slip = await SalarySlip.findByIdAndUpdate(existing._id, validatedData, { new: true });
    } else {
      slip = await SalarySlip.create({
        ...validatedData,
        tenantId: session.user.tenantId,
      });
    }

    return NextResponse.json(slip, { status: existing ? 200 : 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
