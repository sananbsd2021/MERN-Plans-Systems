import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Disbursement from "@/models/Disbursement"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    await connectDB()
    const { id } = await params
    
    // Fetch all disbursements linked to this budget, sorted by date
    const history = await Disbursement.find({ 
        budgetId: id,
        status: { $in: ["APPROVED", "PENDING"] }
    }).sort({ disbursementDate: -1, createdAt: -1 })

    return NextResponse.json(history)
  } catch (error) {
    console.error("Fetch budget history error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
