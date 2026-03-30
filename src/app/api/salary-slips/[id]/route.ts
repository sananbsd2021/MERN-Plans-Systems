import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connect";
import SalarySlip from "@/models/SalarySlip";
import { z } from "zod";

const salaryItemSchema = z.object({
  name: z.string(),
  amount: z.number(),
  type: z.enum(["EARNING", "DEDUCTION"]),
});

const salarySlipUpdateSchema = z.object({
  month: z.number().min(1).max(12).optional(),
  year: z.number().optional(),
  items: z.array(salaryItemSchema).optional(),
  netSalary: z.number().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const slip = await SalarySlip.findOne({
    _id: id,
    tenantId: session.user.tenantId,
  }).populate("employeeId", "firstName lastName position employeeId");

  if (!slip) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json(slip);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN", "EXECUTIVE"].includes(session.user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = salarySlipUpdateSchema.parse(body);

    await connectDB();
    const { id } = await params;
    const slip = await SalarySlip.findOneAndUpdate(
      { _id: id, tenantId: session.user.tenantId },
      validatedData,
      { new: true }
    );

    if (!slip) return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json(slip);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN", "EXECUTIVE"].includes(session.user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await params;
  const slip = await SalarySlip.findOneAndDelete({
    _id: id,
    tenantId: session.user.tenantId,
  });

  if (!slip) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json({ message: "Deleted successfully" });
}
