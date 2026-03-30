import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Department from "@/models/Department"
import User from "@/models/User"
import { z } from "zod"

const departmentUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  managerId: z.string().optional().nullable().transform(val => 
    (val === "none" || val === "") ? undefined : val
  ),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const { id } = await params
  const department = await Department.findOne({ _id: id, tenantId: session.user.tenantId })
    .populate("managerId", "name")
  
  if (!department) return NextResponse.json({ message: "Department not found" }, { status: 404 })
  
  return NextResponse.json(department)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = departmentUpdateSchema.parse(body)
    
    await connectDB()
    const { id } = await params
    const department = await Department.findOneAndUpdate(
      { _id: id, tenantId: session.user.tenantId },
      validatedData,
      { new: true, runValidators: true }
    )
    
    if (!department) return NextResponse.json({ message: "Department not found" }, { status: 404 })
    
    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "UPDATE",
      resourceType: "Department",
      resourceId: department._id,
      details: JSON.stringify(validatedData)
    })

    return NextResponse.json(department)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const { id } = await params
  
  // Check if any employees are assigned to this department
  const { default: Employee } = await import("@/models/Employee")
  const employeeCount = await Employee.countDocuments({ departmentId: id, tenantId: session.user.tenantId })
  if (employeeCount > 0) {
    return NextResponse.json({ message: "Cannot delete department with assigned employees" }, { status: 400 })
  }

  const department = await Department.findOneAndDelete({ _id: id, tenantId: session.user.tenantId })
  if (!department) return NextResponse.json({ message: "Department not found" }, { status: 404 })
  
  const { logAction } = await import("@/lib/utils/audit")
  await logAction({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "DELETE",
    resourceType: "Department",
    resourceId: department._id,
    details: JSON.stringify({ name: department.name })
  })

  return NextResponse.json({ message: "Department deleted successfully" })
}
