import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Plan from "@/models/Plan"
import { z } from "zod"

const planSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().pipe(z.coerce.date()),
  endDate: z.string().pipe(z.coerce.date()),
  pdfUrl: z.string().optional(),
})

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const plans = await Plan.find({ tenantId: req.auth.user.tenantId }).sort({ createdAt: -1 })
  
  return NextResponse.json(plans)
})

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = planSchema.parse(body)
    
    await connectDB()
    const plan = await Plan.create({
      ...validatedData,
      tenantId: req.auth.user.tenantId,
      createdBy: req.auth.user.id,
    })

    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: req.auth.user.tenantId,
      userId: req.auth.user.id,
      action: "CREATE",
      resourceType: "Plan",
      resourceId: plan._id,
      details: JSON.stringify(validatedData)
    })
    
    return NextResponse.json(plan, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
})
