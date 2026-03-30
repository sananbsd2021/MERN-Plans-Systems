import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import KPI from "@/models/KPI"
import Project from "@/models/Project"
import { z } from "zod"

const kpiUpdateSchema = z.object({
  projectId: z.string().min(1, "Project is required").optional(),
  name: z.string().min(1, "Name is required").optional(),
  metric: z.string().min(1, "Metric is required").optional(),
  targetValue: z.number().min(0).optional(),
  currentValue: z.number().min(0).optional(),
  unit: z.string().min(1, "Unit is required").optional()
})

export const GET = auth(async (req, { params }: { params: Promise<{ id: string }> }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  const { id } = await params
  await connectDB()
  const kpi = await KPI.findOne({ 
    _id: id, 
    tenantId: req.auth.user.tenantId 
  }).populate('projectId', 'name')
  
  if (!kpi) return NextResponse.json({ message: "KPI not found" }, { status: 404 })
  
  return NextResponse.json(kpi)
})

export const PUT = auth(async (req, { params }: { params: Promise<{ id: string }> }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const { id } = await params
    const body = await req.json()
    const validatedData = kpiUpdateSchema.parse(body)
    
    await connectDB()
    const kpi = await KPI.findOneAndUpdate(
      { _id: id, tenantId: req.auth.user.tenantId },
      { $set: validatedData },
      { new: true }
    )
    
    if (!kpi) return NextResponse.json({ message: "KPI not found" }, { status: 404 })
    
    return NextResponse.json(kpi)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
})

export const DELETE = auth(async (req, { params }: { params: Promise<{ id: string }> }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const { id } = await params
    await connectDB()
    const kpi = await KPI.findOneAndDelete({ 
      _id: id, 
      tenantId: req.auth.user.tenantId 
    })
    
    if (!kpi) return NextResponse.json({ message: "KPI not found" }, { status: 404 })
    
    return NextResponse.json({ message: "KPI deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
})
