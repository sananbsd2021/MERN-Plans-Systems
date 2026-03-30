import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import TaxAssessment, { PaymentStatus } from "@/models/TaxAssessment"
import RevenueRecord from "@/models/RevenueRecord"
import TaxAsset from "@/models/TaxAsset"
import TaxPayer from "@/models/TaxPayer"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  await connectDB()
  const tenantId = session.user.tenantId
  const currentYear = new Date().getFullYear()

  const [
    totalExpected,
    totalCollected,
    payerCount,
    assetCount,
    recentPayments
  ] = await Promise.all([
    TaxAssessment.aggregate([
      { $match: { tenantId, year: currentYear } },
      { $group: { _id: null, total: { $sum: "$amountDue" } } }
    ]),
    RevenueRecord.aggregate([
      { $match: { tenantId, paymentDate: { $gte: new Date(`${currentYear}-01-01`) } } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } }
    ]),
    TaxPayer.countDocuments({ tenantId }),
    TaxAsset.countDocuments({ tenantId }),
    RevenueRecord.find({ tenantId })
      .sort({ paymentDate: -1 })
      .limit(5)
      .populate("payerId", "name")
      .populate("assessmentId", "yearAmountDue")
  ])

  return NextResponse.json({
    summary: {
      totalExpected: totalExpected[0]?.total || 0,
      totalCollected: totalCollected[0]?.total || 0,
      payerCount,
      assetCount,
    },
    recentPayments
  })
}
