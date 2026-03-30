import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import AssetMaintenance from "@/models/AssetMaintenance"
import Asset from "@/models/Asset"
import { z } from "zod"
import { logAction } from "@/lib/utils/audit"

const maintenanceSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  maintenanceDate: z.string().or(z.date()),
  cost: z.number().min(0),
  description: z.string().min(1, "Description is required"),
  provider: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const assetId = searchParams.get("assetId")

  await connectDB()
  const query: any = { tenantId: session.user.tenantId }
  if (assetId) query.assetId = assetId

  const records = await AssetMaintenance.find(query)
    .populate("assetId", "name assetCode")
    .sort({ maintenanceDate: -1 })

  return NextResponse.json(records)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const validatedData = maintenanceSchema.parse(body)

    await connectDB()
    const maintenance = await AssetMaintenance.create({
      ...validatedData,
      tenantId: session.user.tenantId,
      performedBy: session.user.id,
    })

    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "CREATE",
      resourceType: "AssetMaintenance",
      resourceId: maintenance._id as string,
      details: JSON.stringify({ assetId: maintenance.assetId, cost: maintenance.cost }),
    })

    return NextResponse.json(maintenance, { status: 201 })
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: err.message }, { status: 400 })
    }
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
