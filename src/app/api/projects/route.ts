import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Project from "@/models/Project"
import Plan from "@/models/Plan"
import { z } from "zod"

const projectSchema = z.object({
  planId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().pipe(z.coerce.date()),
  endDate: z.string().pipe(z.coerce.date()),
  budgetAllocated: z.number().min(0),
  location: z.object({
    type: z.literal("Point"),
    coordinates: z.array(z.number()).length(2),
  }).optional(),
  pdfUrl: z.string().optional(),
})

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const projects = await Project.find({ tenantId: req.auth.user.tenantId }).populate('planId', 'title')
  
  return NextResponse.json(projects)
})

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = projectSchema.parse(body)
    
    await connectDB()
    const project = await Project.create({
      ...validatedData,
      tenantId: req.auth.user.tenantId,
      createdBy: req.auth.user.id,
    })

    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: req.auth.user.tenantId,
      userId: req.auth.user.id,
      action: "CREATE",
      resourceType: "Project",
      resourceId: project._id,
      details: JSON.stringify(validatedData)
    })
    
    return NextResponse.json(project, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
})
