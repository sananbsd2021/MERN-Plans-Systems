import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import TaxAsset, { AssetType } from "@/models/TaxAsset"
import TaxPayer from "@/models/TaxPayer"
import { z } from "zod"

const taxAssetSchema = z.object({
  payerId: z.string().min(1),
  type: z.nativeEnum(AssetType),
  details: z.any().optional(),
  appraisedValue: z.number().min(0),
  location: z.object({
    type: z.literal("Point"),
    coordinates: z.array(z.number()).length(2),
  }).optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  const { searchParams } = new URL(req.url)
  const payerId = searchParams.get("payerId")
  
  await connectDB()
  const query: any = { tenantId: session.user.tenantId }
  if (payerId) query.payerId = payerId
  
  const assets = await TaxAsset.find(query)
    .populate("payerId", "name taxId")
    .sort({ createdAt: -1 })
  
  return NextResponse.json(assets)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await req.json()
    const validatedData = taxAssetSchema.parse(body)
    
    await connectDB()
    const asset = await TaxAsset.create({
      ...validatedData,
      tenantId: session.user.tenantId,
    })

    const { logAction } = await import("@/lib/utils/audit")
    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "CREATE",
      resourceType: "TaxAsset",
      resourceId: asset._id,
      details: JSON.stringify(validatedData)
    })
    
    return NextResponse.json(asset, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }
}
