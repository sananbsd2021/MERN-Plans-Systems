import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import LeaveRequest, { LeaveStatus, LeaveType } from "@/models/LeaveRequest"
import Employee from "@/models/Employee"
import User from "@/models/User"
import { z } from "zod"

const leaveRequestSchema = z.object({
  employeeId: z.string().min(1),
  leaveType: z.enum(Object.values(LeaveType) as [string, ...string[]]),
  startDate: z.string().pipe(z.coerce.date()),
  endDate: z.string().pipe(z.coerce.date()),
  reason: z.string().min(1),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get("employeeId")
  const status = searchParams.get("status")
  
  await connectDB()
  const query: any = { tenantId: session.user.tenantId }
  
  if (employeeId) query.employeeId = employeeId
  if (status) query.status = status
  
  const leaves = await LeaveRequest.find(query)
    .populate("employeeId", "firstName lastName position")
    .populate("approvedBy", "name")
    .sort({ createdAt: -1 })
  
  return NextResponse.json(leaves)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = leaveRequestSchema.parse(body)
    
    await connectDB()
    const leave = await LeaveRequest.create({
      ...validatedData,
      tenantId: session.user.tenantId,
      status: LeaveStatus.PENDING,
    })

    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "CREATE",
      resourceType: "LeaveRequest",
      resourceId: leave._id,
      details: JSON.stringify(validatedData)
    })
    
    return NextResponse.json(leave, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
