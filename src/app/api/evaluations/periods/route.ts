import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import EvaluationPeriod from "@/models/EvaluationPeriod"
import { z } from "zod"

const periodSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().pipe(z.coerce.date()),
  endDate: z.string().pipe(z.coerce.date()),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
})

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  await connectDB()
  const periods = await EvaluationPeriod.find({ tenantId: req.auth.user.tenantId }).sort({ startDate: -1 })
  return NextResponse.json(periods)
})

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  try {
    const body = await req.json()
    const validatedData = periodSchema.parse(body)
    await connectDB()
    const period = await EvaluationPeriod.create({ ...validatedData, tenantId: req.auth.user.tenantId })
    
    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: req.auth.user.tenantId,
      userId: req.auth.user.id,
      action: "CREATE",
      resourceType: "EvaluationPeriod",
      resourceId: period._id as string,
      details: JSON.stringify(validatedData)
    })
    
    return NextResponse.json(period, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
})
