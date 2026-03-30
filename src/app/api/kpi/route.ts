import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import KPI from "@/models/KPI"
import Project from "@/models/Project"
import { z } from "zod"

const kpiSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  name: z.string().min(1, "Name is required"),
  metric: z.string().min(1, "Metric is required"),
  targetValue: z.number().min(0),
  currentValue: z.number().min(0).optional(),
  unit: z.string().min(1, "Unit is required")
})

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const kpis = await KPI.find({ tenantId: req.auth.user.tenantId }).populate('projectId', 'name')
  
  return NextResponse.json(kpis)
})

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = kpiSchema.parse(body)
    
    await connectDB()
    const kpi = await KPI.create({
      ...validatedData,
      tenantId: req.auth.user.tenantId
    })
    
    return NextResponse.json(kpi)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
})
