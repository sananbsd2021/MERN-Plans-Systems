import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Employee from "@/models/Employee"
import Department from "@/models/Department"
import { z } from "zod"

const employeeUpdateSchema = z.object({
  employeeId: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  departmentId: z.string().optional().nullable().transform(val => 
    (val === "none" || val === "") ? undefined : val
  ),
  position: z.string().min(1).optional(),
  joinDate: z.string().pipe(z.coerce.date()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "LEAVE", "TERMINATED"]).optional(),
  salary: z.number().min(0).optional(),
  userId: z.string().optional().nullable().transform(val => 
    (val === "none" || val === "") ? undefined : val
  ),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const { id } = await params
  const employee = await Employee.findOne({ _id: id, tenantId: session.user.tenantId })
    .populate("departmentId", "name")
  
  if (!employee) return NextResponse.json({ message: "Employee not found" }, { status: 404 })
  
  return NextResponse.json(employee)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = employeeUpdateSchema.parse(body)
    
    await connectDB()
    const { id } = await params
    const employee = await Employee.findOneAndUpdate(
      { _id: id, tenantId: session.user.tenantId },
      validatedData,
      { new: true, runValidators: true }
    )
    
    if (!employee) return NextResponse.json({ message: "Employee not found" }, { status: 404 })
    
    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "UPDATE",
      resourceType: "Employee",
      resourceId: employee._id,
      details: JSON.stringify(validatedData)
    })

    return NextResponse.json(employee)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const { id } = await params
  const employee = await Employee.findOneAndDelete({ _id: id, tenantId: session.user.tenantId })
  
  if (!employee) return NextResponse.json({ message: "Employee not found" }, { status: 404 })
  
  const { logAction } = await import("@/lib/utils/audit")
  await logAction({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "DELETE",
    resourceType: "Employee",
    resourceId: employee._id,
    details: JSON.stringify({ name: `${employee.firstName} ${employee.lastName}`, employeeId: employee.employeeId })
  })

  return NextResponse.json({ message: "Employee deleted successfully" })
}
