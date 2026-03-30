import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import AssetTransfer from "@/models/AssetTransfer"
import Asset from "@/models/Asset"
import Department from "@/models/Department"
import { z } from "zod"
import { logAction } from "@/lib/utils/audit"

const transferSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  fromDepartmentId: z.string().min(1, "Current department is required"),
  toDepartmentId: z.string().min(1, "Destination department is required"),
  transferDate: z.string().or(z.date()),
  reason: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const assetId = searchParams.get("assetId")

  await connectDB()
  const query: any = { tenantId: session.user.tenantId }
  if (assetId) query.assetId = assetId

  const transfers = await AssetTransfer.find(query)
    .populate("assetId", "name assetCode")
    .populate("fromDepartmentId", "name")
    .populate("toDepartmentId", "name")
    .sort({ transferDate: -1 })

  return NextResponse.json(transfers)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const validatedData = transferSchema.parse(body)

    await connectDB()
    
    // Create the transfer record
    const transfer = await AssetTransfer.create({
      ...validatedData,
      tenantId: session.user.tenantId,
      authorizedBy: session.user.id,
    })

    // Update the asset's current department
    await Asset.findOneAndUpdate(
      { _id: validatedData.assetId, tenantId: session.user.tenantId },
      { $set: { departmentId: validatedData.toDepartmentId } }
    )

    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "CREATE",
      resourceType: "AssetTransfer",
      resourceId: transfer._id as string,
      details: JSON.stringify({ assetId: transfer.assetId, toDepartmentId: transfer.toDepartmentId }),
    })

    return NextResponse.json(transfer, { status: 201 })
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.message }, { status: 400 })
    }
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
