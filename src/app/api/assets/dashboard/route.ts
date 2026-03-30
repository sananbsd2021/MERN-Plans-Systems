import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Asset from "@/models/Asset"
import AssetMaintenance from "@/models/AssetMaintenance"
import mongoose from "mongoose"

export async function GET() {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  await connectDB()
  const tenantId = new mongoose.Types.ObjectId(session.user.tenantId)

  try {
    const [stats, recentMaintenance, categories] = await Promise.all([
      Asset.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            totalValue: { $sum: "$purchasePrice" },
            brokenCount: {
              $sum: { $cond: [{ $eq: ["$status", "BROKEN"] }, 1, 0] }
            },
            activeCount: {
              $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] }
            }
          }
        }
      ]),
      AssetMaintenance.find({ tenantId })
        .populate("assetId", "name assetCode")
        .sort({ maintenanceDate: -1 })
        .limit(5),
      Asset.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ])
    ])

    const summary = stats[0] || { totalCount: 0, totalValue: 0, brokenCount: 0, activeCount: 0 }

    return NextResponse.json({
      summary,
      recentMaintenance,
      statusDistribution: categories
    })
  } catch (err: unknown) {
    return NextResponse.json({ message: err instanceof Error ? err.message : "An unexpected error occurred" }, { status: 500 })
  }
}
