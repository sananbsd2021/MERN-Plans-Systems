import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import RevenueRecord from "@/models/RevenueRecord"
import TaxAssessment, { PaymentStatus } from "@/models/TaxAssessment"
import { z } from "zod"

const paymentSchema = z.object({
  assessmentId: z.string().min(1),
  payerId: z.string().min(1),
  amountPaid: z.number().min(0),
  paymentDate: z.string().pipe(z.coerce.date()),
  paymentMethod: z.string().min(1),
  receiptNumber: z.string().min(1),
  notes: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = paymentSchema.parse(body)
    
    await connectDB()
    
    // Create payment record
    const record = await RevenueRecord.create({
      ...validatedData,
      tenantId: session.user.tenantId,
      recordedBy: session.user.id,
    })

    // Update assessment status
    await TaxAssessment.findByIdAndUpdate(validatedData.assessmentId, {
      status: PaymentStatus.PAID
    })

    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "CREATE",
      resourceType: "RevenueRecord",
      resourceId: record._id,
      details: JSON.stringify(validatedData)
    })
    
    return NextResponse.json(record, { status: 201 })
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ message: "Receipt number already exists" }, { status: 400 })
    }
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
