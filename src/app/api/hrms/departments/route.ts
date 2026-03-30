import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Department from "@/models/Department"
import User from "@/models/User"
import { z } from "zod"

const departmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  managerId: z.string().optional().nullable().transform(val => 
    (val === "none" || val === "") ? undefined : val
  ),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const departments = await Department.find({ tenantId: session.user.tenantId })
    .populate("managerId", "name")
    .sort({ name: 1 })
  
  return NextResponse.json(departments)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = departmentSchema.parse(body)
    
    await connectDB()
    const department = await Department.create({
      ...validatedData,
      tenantId: session.user.tenantId,
    })

    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "CREATE",
      resourceType: "Department",
      resourceId: department._id,
      details: JSON.stringify(validatedData)
    })
    
    return NextResponse.json(department, { status: 201 })
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ message: "Department name already exists" }, { status: 400 })
    }
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
