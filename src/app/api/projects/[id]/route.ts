import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Project from "@/models/Project"
import { z } from "zod"

const projectUpdateSchema = z.object({
  planId: z.string().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().pipe(z.coerce.date()).optional(),
  endDate: z.string().pipe(z.coerce.date()).optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"]).optional(),
  budgetAllocated: z.number().min(0).optional(),
  location: z.object({
    type: z.literal("Point"),
    coordinates: z.array(z.number()).length(2),
  }).optional().nullable(),
  pdfUrl: z.string().optional(),
})

export const GET = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const id = (await params).id;
  const project = await Project.findOne({ _id: id, tenantId: req.auth.user.tenantId }).populate('planId', 'title')
  
  if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 })
  
  return NextResponse.json(project)
})

export const PUT = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = projectUpdateSchema.parse(body)
    
    await connectDB()
    const id = (await params).id;
    
    // If location is explicitly passed as null, we want to $unset it.
    // Mongoose handles this automatically if we update it to undefined or omit it, but to clear it:
    let updateData: any = { ...validatedData }
    
    // Check if location is sent as null to remove it
    if (body.location === null) {
      updateData.$unset = { location: "" }
      delete updateData.location
    }
    
    const project = await Project.findOneAndUpdate(
      { _id: id, tenantId: req.auth.user.tenantId },
      updateData,
      { new: true, runValidators: true }
    )
    
    if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 })
    
    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: req.auth.user.tenantId,
      userId: req.auth.user.id,
      action: "UPDATE",
      resourceType: "Project",
      resourceId: project._id,
      details: JSON.stringify(validatedData)
    })

    return NextResponse.json(project)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
})

export const DELETE = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const id = (await params).id;
  
  const project = await Project.findOneAndDelete({ _id: id, tenantId: req.auth.user.tenantId })
  
  if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 })
  
  const { logAction } = await import("@/lib/utils/audit")
  await logAction({
    tenantId: req.auth.user.tenantId,
    userId: req.auth.user.id,
    action: "DELETE",
    resourceType: "Project",
    resourceId: project._id,
    details: JSON.stringify({ name: project.name })
  })

  return NextResponse.json({ message: "Project deleted successfully" })
})
