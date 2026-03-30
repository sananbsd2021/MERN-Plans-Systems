import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import PerformanceKPI from "@/models/PerformanceKPI"
import Department from "@/models/Department"
import { z } from "zod"

const kpiUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  weight: z.number().min(0).max(100).optional(),
  targetScore: z.number().min(0).optional(),
  departmentId: z.string().optional().nullable().transform(val => 
    (val === "none" || val === "") ? undefined : val
  ),
  position: z.string().optional(),
})

export const GET = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  await connectDB()
  const { id } = await params
  const kpi = await PerformanceKPI.findOne({ _id: id, tenantId: req.auth.user.tenantId }).populate("departmentId", "name")
  if (!kpi) return NextResponse.json({ message: "KPI not found" }, { status: 404 })
  return NextResponse.json(kpi)
})

export const PUT = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await params
    const body = await req.json()
    const validatedData = kpiUpdateSchema.parse(body)
    await connectDB()
    
    // Process $unset for departmentId if null
    const updateData: any = { ...validatedData }
    if (body.departmentId === null) {
        updateData.$unset = { departmentId: "" }
        delete updateData.departmentId
    }

    const kpi = await PerformanceKPI.findOneAndUpdate(
      { _id: id, tenantId: req.auth.user.tenantId },
      updateData,
      { new: true }
    )
    if (!kpi) return NextResponse.json({ message: "KPI not found" }, { status: 404 })
    
    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: req.auth.user.tenantId,
      userId: req.auth.user.id,
      action: "UPDATE",
      resourceType: "PerformanceKPI",
      resourceId: kpi._id as string,
      details: JSON.stringify(validatedData)
    })
    
    return NextResponse.json(kpi)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
})

export const DELETE = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  await connectDB()
  const { id } = await params
  
  const kpi = await PerformanceKPI.findOneAndDelete({ _id: id, tenantId: req.auth.user.tenantId })
  if (!kpi) return NextResponse.json({ message: "KPI not found" }, { status: 404 })
  
  const { logAction } = await import("@/lib/utils/audit")
  await logAction({
      tenantId: req.auth.user.tenantId,
      userId: req.auth.user.id,
      action: "DELETE",
      resourceType: "PerformanceKPI",
      resourceId: kpi._id as string,
      details: JSON.stringify({ name: kpi.name })
  })

  return NextResponse.json({ message: "KPI deleted" })
})
