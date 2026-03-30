import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import TaxAssessment, { PaymentStatus } from "@/models/TaxAssessment"
import TaxAsset from "@/models/TaxAsset"
import TaxPayer from "@/models/TaxPayer"
import { z } from "zod"

const assessmentSchema = z.object({
  assetId: z.string().min(1),
  payerId: z.string().min(1),
  year: z.number().min(2000),
  amountDue: z.number().min(0),
  dueDate: z.string().pipe(z.coerce.date()),
  notes: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  const { searchParams } = new URL(req.url)
  const assetId = searchParams.get("assetId")
  const year = searchParams.get("year")
  const status = searchParams.get("status")
  
  await connectDB()
  const query: any = { tenantId: session.user.tenantId }
  if (assetId) query.assetId = assetId
  if (year) query.year = parseInt(year)
  if (status && status !== "ALL") query.status = status
  
  const assessments = await TaxAssessment.find(query)
    .populate("assetId")
    .populate("payerId", "name taxId")
    .sort({ year: -1 })
  
  return NextResponse.json(assessments)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = assessmentSchema.parse(body)
    
    await connectDB()
    const assessment = await TaxAssessment.create({
      ...validatedData,
      tenantId: session.user.tenantId,
      status: PaymentStatus.PENDING,
    })

    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "CREATE",
      resourceType: "TaxAssessment",
      resourceId: assessment._id,
      details: JSON.stringify(validatedData)
    })
    
    return NextResponse.json(assessment, { status: 201 })
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ message: "Assessment for this year already exists" }, { status: 400 })
    }
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
