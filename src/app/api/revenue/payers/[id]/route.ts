import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import TaxPayer from "@/models/TaxPayer"
import { z } from "zod"

const taxPayerUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  taxId: z.string().min(1).optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const { id } = await params
  const payer = await TaxPayer.findOne({ _id: id, tenantId: session.user.tenantId })
  
  if (!payer) return NextResponse.json({ message: "Tax payer not found" }, { status: 404 })
  
  return NextResponse.json(payer)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = taxPayerUpdateSchema.parse(body)
    
    await connectDB()
    const { id } = await params
    const payer = await TaxPayer.findOneAndUpdate(
      { _id: id, tenantId: session.user.tenantId },
      validatedData,
      { new: true, runValidators: true }
    )
    
    if (!payer) return NextResponse.json({ message: "Tax payer not found" }, { status: 404 })
    
    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "UPDATE",
      resourceType: "TaxPayer",
      resourceId: payer._id,
      details: JSON.stringify(validatedData)
    })

    return NextResponse.json(payer)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const { id } = await params
  
  // Check if taxpayer has any assets assigned
  const { default: TaxAsset } = await import("@/models/TaxAsset")
  const assetCount = await TaxAsset.countDocuments({ payerId: id, tenantId: session.user.tenantId })
  if (assetCount > 0) {
    return NextResponse.json({ message: "Cannot delete taxpayer with assigned assets" }, { status: 400 })
  }

  const payer = await TaxPayer.findOneAndDelete({ _id: id, tenantId: session.user.tenantId })
  if (!payer) return NextResponse.json({ message: "Tax payer not found" }, { status: 404 })
  
  const { logAction } = await import("@/lib/utils/audit")
  await logAction({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "DELETE",
    resourceType: "TaxPayer",
    resourceId: payer._id,
    details: JSON.stringify({ name: payer.name, taxId: payer.taxId })
  })

  return NextResponse.json({ message: "Tax payer deleted successfully" })
}
