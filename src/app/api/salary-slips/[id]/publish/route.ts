import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connect";
import SalarySlip from "@/models/SalarySlip";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN", "EXECUTIVE"].includes(session.user.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await params;
  const slip = await SalarySlip.findOneAndUpdate(
    { _id: id, tenantId: session.user.tenantId },
    { status: "PUBLISHED", publishedAt: new Date() },
    { new: true }
  );

  if (!slip) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json(slip);
}
