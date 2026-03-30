import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import KPI from "@/models/KPI"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    await connectDB()

    // Find all KPIs for the tenant
    const kpis = await KPI.find({ tenantId: session.user.tenantId })

    // AI Analysis
    const isMock = !process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY === "YOUR_GEMINI_API_KEY_HERE";
    
    if (isMock) {
      console.warn("Using Mock AI Analysis (Missing API Key)");
    }

    const updates = kpis.map(async (kpi) => {
      const percentage = (kpi.currentValue / kpi.targetValue) * 100

      let aiRiskLevel: "SAFE" | "WARNING" | "CRITICAL" = "SAFE"
      let aiRecommendation = "การดำเนินงานเป็นไปตามเป้าหมายที่วางไว้"

      if (isMock) {
        if (percentage < 50) {
          aiRiskLevel = "CRITICAL"
          aiRecommendation = "AI ตรวจพบความเสี่ยงขั้นวิกฤต: อัตราความสำเร็จต่ำกว่า 50% แนะนำให้ผู้บริหารทบทวนโครงการและพิจารณาอัดฉีดทรัพยากรเพิ่มเติมด่วน"
        } else if (percentage < 70) {
          aiRiskLevel = "WARNING"
          aiRecommendation = "AI แจ้งเตือน: อัตราความสำเร็จต่ำกว่าเกณฑ์ 70% ควรเร่งรัดการดำเนินงานและติดตามผลใกล้ชิด"
        } else if (percentage >= 100) {
          aiRiskLevel = "SAFE"
          aiRecommendation = "ทะลุเป้าหมาย: ผลการดำเนินงานยอดเยี่ยม แนะนำให้ถอดบทเรียนเพื่อเป็นแนวทางให้โครงการอื่น"
        }
      } else {
        const { analyzeKPI } = await import("@/lib/ai/gemini");
        const analysis = await analyzeKPI({
          name: kpi.name,
          targetValue: kpi.targetValue,
          currentValue: kpi.currentValue,
          unit: kpi.unit
        });

        if (analysis) {
          aiRiskLevel = analysis.riskLevel;
          aiRecommendation = analysis.recommendation;
        }
      }

      kpi.aiRiskLevel = aiRiskLevel
      kpi.aiRecommendation = aiRecommendation
      kpi.lastAnalyzedAt = new Date()
      
      // Create Notification if risk is detected
      if (aiRiskLevel === "CRITICAL" || aiRiskLevel === "WARNING") {
        const Notification = (await import("@/models/Notification")).default;
        await Notification.create({
          tenantId: kpi.tenantId,
          userId: session.user.id,
          title: `แจ้งเตือน KPI: ${kpi.name}`,
          message: aiRecommendation,
          type: aiRiskLevel === "CRITICAL" ? "CRITICAL" : "WARNING",
          link: "/dashboard/kpi"
        });
      }

      return kpi.save()
    })

    await Promise.all(updates)

    return NextResponse.json({ 
      message: "KPI list analyzed successfully", 
      count: kpis.length,
      mode: isMock ? "MOCK" : "REAL"
    })
  } catch (error) {
    console.error("AI Analysis Error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
