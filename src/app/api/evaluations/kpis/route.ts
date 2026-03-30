import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import PerformanceKPI from "@/models/PerformanceKPI"
import Department from "@/models/Department"
import { z } from "zod"

const kpiSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  weight: z.number().min(0).max(100),
  targetScore: z.number().min(0),
  departmentId: z.string().optional().nullable().transform(val => 
    (val === "none" || val === "") ? undefined : val
  ),
  position: z.string().optional(),
})

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  await connectDB()
  
  const { searchParams } = new URL(req.url)
  const departmentId = searchParams.get("departmentId")
  
  const query: any = { tenantId: req.auth.user.tenantId }
  if (departmentId) query.departmentId = departmentId
  
  const kpis = await PerformanceKPI.find(query).populate("departmentId", "name").sort({ createdAt: -1 })
  return NextResponse.json(kpis)
})

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  try {
    const body = await req.json()
    const validatedData = kpiSchema.parse(body)
    await connectDB()
    const kpi = await PerformanceKPI.create({ ...validatedData, tenantId: req.auth.user.tenantId })
    
    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: req.auth.user.tenantId,
      userId: req.auth.user.id,
      action: "CREATE",
      resourceType: "PerformanceKPI",
      resourceId: kpi._id as string,
      details: JSON.stringify(validatedData)
    })
    
    return NextResponse.json(kpi, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
})
