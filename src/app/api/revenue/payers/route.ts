import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import TaxPayer from "@/models/TaxPayer"
import { z } from "zod"

const taxPayerSchema = z.object({
  name: z.string().min(1),
  taxId: z.string().min(1),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const payers = await TaxPayer.find({ tenantId: session.user.tenantId }).sort({ name: 1 })
  
  return NextResponse.json(payers)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = taxPayerSchema.parse(body)
    
    await connectDB()
    const payer = await TaxPayer.create({
      ...validatedData,
      tenantId: session.user.tenantId,
    })

    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "CREATE",
      resourceType: "TaxPayer",
      resourceId: payer._id,
      details: JSON.stringify(validatedData)
    })
    
    return NextResponse.json(payer, { status: 201 })
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ message: "Tax ID already exists" }, { status: 400 })
    }
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
