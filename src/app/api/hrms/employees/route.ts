import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Employee from "@/models/Employee"
import Department from "@/models/Department"
import { z } from "zod"

const employeeSchema = z.object({
  employeeId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  departmentId: z.string().min(1).transform(val => (val === "none" || val === "") ? undefined : val),
  position: z.string().min(1),
  joinDate: z.string().pipe(z.coerce.date()),
  status: z.enum(["ACTIVE", "INACTIVE", "LEAVE", "TERMINATED"]),
  salary: z.number().min(0),
  userId: z.string().optional().nullable().transform(val => 
    (val === "none" || val === "") ? undefined : val
  ),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const employees = await Employee.find({ tenantId: session.user.tenantId })
    .populate("departmentId", "name")
    .sort({ createdAt: -1 })
  
  return NextResponse.json(employees)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = employeeSchema.parse(body)
    
    await connectDB()
    const employee = await Employee.create({
      ...validatedData,
      tenantId: session.user.tenantId,
    })

    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "CREATE",
      resourceType: "Employee",
      resourceId: employee._id,
      details: JSON.stringify(validatedData)
    })
    
    return NextResponse.json(employee, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
