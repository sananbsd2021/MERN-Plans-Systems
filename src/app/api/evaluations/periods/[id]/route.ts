import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import EvaluationPeriod from "@/models/EvaluationPeriod"
import { z } from "zod"

const periodUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.string().pipe(z.coerce.date()).optional(),
  endDate: z.string().pipe(z.coerce.date()).optional(),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
})

export const GET = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  await connectDB()
  const { id } = await params
  const period = await EvaluationPeriod.findOne({ _id: id, tenantId: req.auth.user.tenantId })
  if (!period) return NextResponse.json({ message: "Period not found" }, { status: 404 })
  return NextResponse.json(period)
})

export const PUT = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await params
    const body = await req.json()
    const validatedData = periodUpdateSchema.parse(body)
    await connectDB()
    const period = await EvaluationPeriod.findOneAndUpdate(
      { _id: id, tenantId: req.auth.user.tenantId },
      validatedData,
      { new: true }
    )
    if (!period) return NextResponse.json({ message: "Period not found" }, { status: 404 })
    
    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: req.auth.user.tenantId,
      userId: req.auth.user.id,
      action: "UPDATE",
      resourceType: "EvaluationPeriod",
      resourceId: period._id as string,
      details: JSON.stringify(validatedData)
    })
    
    return NextResponse.json(period)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
})

export const DELETE = auth(async (req, { params }) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  await connectDB()
  const { id } = await params
  
  // NOTE: In a real environment, we should check if evaluations are tied to this period before deleting
  const period = await EvaluationPeriod.findOneAndDelete({ _id: id, tenantId: req.auth.user.tenantId })
  if (!period) return NextResponse.json({ message: "Period not found" }, { status: 404 })
  
  const { logAction } = await import("@/lib/utils/audit")
  await logAction({
      tenantId: req.auth.user.tenantId,
      userId: req.auth.user.id,
      action: "DELETE",
      resourceType: "EvaluationPeriod",
      resourceId: period._id as string,
      details: JSON.stringify({ name: period.name })
  })

  return NextResponse.json({ message: "Period deleted" })
})
