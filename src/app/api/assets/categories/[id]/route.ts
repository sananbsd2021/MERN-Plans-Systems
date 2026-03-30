import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import AssetCategory from "@/models/AssetCategory"
import { logAction } from "@/lib/utils/audit"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    await connectDB()
    const category = await AssetCategory.findOneAndUpdate(
      { _id: id, tenantId: session.user.tenantId },
      { $set: body },
      { new: true }
    )

    if (!category) return NextResponse.json({ message: "Category not found" }, { status: 404 })

    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "UPDATE",
      resourceType: "AssetCategory",
      resourceId: category._id as string,
      details: JSON.stringify(body),
    })

    return NextResponse.json(category)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await connectDB()
    const category = await AssetCategory.findOneAndDelete({ _id: id, tenantId: session.user.tenantId })
    
    if (!category) return NextResponse.json({ message: "Category not found" }, { status: 404 })

    await logAction({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "DELETE",
      resourceType: "AssetCategory",
      resourceId: id,
      details: `Deleted category: ${category.name} (${category.code})`,
    })

    return NextResponse.json({ message: "Category deleted" })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
