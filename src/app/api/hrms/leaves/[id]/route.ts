import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import LeaveRequest, { LeaveStatus } from "@/models/LeaveRequest"
import Employee from "@/models/Employee"
import User from "@/models/User"
import { z } from "zod"

const leaveUpdateSchema = z.object({
  status: z.enum([LeaveStatus.APPROVED, LeaveStatus.REJECTED, LeaveStatus.CANCELLED]),
  comment: z.string().optional(),
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  // Only ADMIN, SUPER_ADMIN, or EXECUTIVE can approve leaves
  const allowedRoles = ["ADMIN", "SUPER_ADMIN", "EXECUTIVE"]
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 })
  }
  
  try {
    const body = await req.json()
    const validatedData = leaveUpdateSchema.parse(body)
    
    await connectDB()
    const { id } = await params
    const leave = await LeaveRequest.findOneAndUpdate(
      { _id: id, tenantId: session.user.tenantId },
      { 
        ...validatedData, 
        approvedBy: session.user.id 
      },
      { new: true, runValidators: true }
    )
    
    if (!leave) return NextResponse.json({ message: "Leave request not found" }, { status: 404 })
    
    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "UPDATE",
      resourceType: "LeaveRequest",
      resourceId: leave._id,
      details: JSON.stringify(validatedData)
    })

    return NextResponse.json(leave)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const { id } = await params
  const leave = await LeaveRequest.findOne({ _id: id, tenantId: session.user.tenantId })
    .populate("employeeId", "firstName lastName position")
    .populate("approvedBy", "name")
  
  if (!leave) return NextResponse.json({ message: "Leave request not found" }, { status: 404 })
  
  return NextResponse.json(leave)
}
