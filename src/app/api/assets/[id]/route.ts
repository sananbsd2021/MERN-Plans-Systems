import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Asset from "@/models/Asset"
import AssetMaintenance from "@/models/AssetMaintenance"
import AssetTransfer from "@/models/AssetTransfer"
import { logAction } from "@/lib/utils/audit"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  await connectDB()
  const asset = await Asset.findOne({ _id: id, tenantId: session.user.tenantId })
    .populate("categoryId")
    .populate("departmentId")
  
  if (!asset) return NextResponse.json({ message: "Asset not found" }, { status: 404 })
  return NextResponse.json(asset)
}

export async function PUT(req: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  try {
    const body = await req.json()
    await connectDB()
    const asset = await Asset.findOneAndUpdate(
      { _id: id, tenantId: session.user.tenantId },
      { $set: body },
      { new: true }
    )

    if (!asset) return NextResponse.json({ message: "Asset not found" }, { status: 404 })

    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "UPDATE",
      resourceType: "Asset",
      resourceId: asset._id as string,
      details: JSON.stringify(body),
    })

    return NextResponse.json(asset)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  await connectDB()

  // Prevent deletion if there are related records
  const [maintenanceCount, transferCount] = await Promise.all([
    AssetMaintenance.countDocuments({ assetId: id }),
    AssetTransfer.countDocuments({ assetId: id })
  ])

  if (maintenanceCount > 0 || transferCount > 0) {
    return NextResponse.json({ 
      message: "Cannot delete asset with maintenance or transfer history" 
    }, { status: 400 })
  }

  const asset = await Asset.findOneAndDelete({ _id: id, tenantId: session.user.tenantId })
  if (!asset) return NextResponse.json({ message: "Asset not found" }, { status: 404 })

  await logAction({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "DELETE",
    resourceType: "Asset",
    resourceId: asset._id as string,
    details: JSON.stringify({ name: asset.name, assetCode: asset.assetCode }),
  })

  return NextResponse.json({ message: "Asset deleted" })
}
