import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Budget from "@/models/Budget"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    await connectDB()

    const budgets = await Budget.find({ tenantId: session.user.tenantId })

    const isMock = !process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY === "YOUR_GEMINI_API_KEY_HERE";

    const updates = budgets.map(async (budget) => {
      let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW"
      
      if (isMock) {
        const spentPercentage = (budget.spentAmount / budget.allocatedAmount) * 100
        if (spentPercentage > 100) riskLevel = "HIGH"
        else if (spentPercentage > 80) riskLevel = "MEDIUM"
        else riskLevel = "LOW"
      } else {
        const { predictBudgetRisk } = await import("@/lib/ai/gemini");
        const prediction = await predictBudgetRisk({
          department: budget.department,
          allocatedAmount: budget.allocatedAmount,
          spentAmount: budget.spentAmount,
          remainingAmount: budget.remainingAmount,
          year: budget.year
        });

        if (prediction) {
          riskLevel = prediction.riskLevel;
        }
      }

      budget.riskLevel = riskLevel
      
      // Create Notification if risk is detected
      if (riskLevel === "HIGH" || riskLevel === "MEDIUM") {
        const Notification = (await import("@/models/Notification")).default;
        await Notification.create({
          tenantId: budget.tenantId,
          userId: session.user.id,
          title: `แจ้งเตือนงบประมาณ: ${budget.department}`,
          message: riskLevel === "HIGH" 
            ? `ตรวจพบความเสี่ยงสูงในการเบิกจ่ายงบประมาณของ ${budget.department} (เกิน 100%)`
            : `ควรเฝ้าระวังการเบิกจ่ายงบประมาณของ ${budget.department} (เกิน 80%)`,
          type: riskLevel === "HIGH" ? "CRITICAL" : "WARNING",
          link: "/dashboard/budget"
        });
      }

      return budget.save()
    })

    await Promise.all(updates)

    return NextResponse.json({ 
      message: "Budget analysis completed", 
      count: budgets.length,
      mode: isMock ? "MOCK" : "REAL"
    })
  } catch (error) {
    console.error("Budget AI Analysis Error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
