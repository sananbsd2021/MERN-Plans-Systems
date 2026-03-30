import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Plan from "@/models/Plan"
import { z } from "zod"

const planUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().pipe(z.coerce.date()).optional(),
  endDate: z.string().pipe(z.coerce.date()).optional(),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"]).optional(),
  version: z.number().optional(),
  pdfUrl: z.string().optional(),
})

export const GET = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  
  const id = (await params).id;
  const plan = await Plan.findOne({ _id: id, tenantId: req.auth.user.tenantId })
  if (!plan) return NextResponse.json({ message: "Plan not found" }, { status: 404 })
  
  // Also fetch projects for this plan
  const { default: Project } = await import("@/models/Project")
  const projects = await Project.find({ planId: id, tenantId: req.auth.user.tenantId })
  
  return NextResponse.json({
    ...plan.toObject(),
    projects
  })
})

export const PUT = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = planUpdateSchema.parse(body)
    
    await connectDB()
    const id = (await params).id;
    const plan = await Plan.findOneAndUpdate(
      { _id: id, tenantId: req.auth.user.tenantId },
      validatedData,
      { new: true, runValidators: true }
    )
    
    if (!plan) return NextResponse.json({ message: "Plan not found" }, { status: 404 })
    
    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: req.auth.user.tenantId,
      userId: req.auth.user.id,
      action: "UPDATE",
      resourceType: "Plan",
      resourceId: plan._id,
      details: JSON.stringify(validatedData)
    })

    return NextResponse.json(plan)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
})

export const DELETE = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const id = (await params).id;
  const plan = await Plan.findOneAndDelete({ _id: id, tenantId: req.auth.user.tenantId })
  
  if (!plan) return NextResponse.json({ message: "Plan not found" }, { status: 404 })
  
  const { logAction } = await import("@/lib/utils/audit")
  await logAction({
    tenantId: req.auth.user.tenantId,
    userId: req.auth.user.id,
    action: "DELETE",
    resourceType: "Plan",
    resourceId: plan._id,
    details: JSON.stringify({ title: plan.title })
  })

  return NextResponse.json({ message: "Plan deleted successfully" })
})
