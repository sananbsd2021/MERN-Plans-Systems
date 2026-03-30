import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export const kpiAnalyzerModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function analyzeKPI(kpiData: any) {
  const prompt = `
    You are an expert Policy Analyst for a Thai Local Administrative Organization (อบต.).
    Analyze the following KPI data and provide professional recommendations in Thai.
    
    KPI Name: ${kpiData.name}
    Target: ${kpiData.targetValue} ${kpiData.unit}
    Current: ${kpiData.currentValue} ${kpiData.unit}
    Achievement: ${((kpiData.currentValue / kpiData.targetValue) * 100).toFixed(2)}%
    
    Required Output (Thai):
    1. Risk Level: SAFE, WARNING, or CRITICAL
    2. Recommendation: A concise, professional advice for the executive (max 100 words).
    
    Output Format (JSON):
    {
      "riskLevel": "...",
      "recommendation": "..."
    }
  `;

  try {
    const result = await kpiAnalyzerModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Extract JSON from markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid AI response format");
  } catch (error) {
    console.error("Gemini KPI Analysis Error:", error);
    return null;
  }
}

export async function predictBudgetRisk(budgetData: any) {
  const prompt = `
    You are an expert Financial Auditor for a Thai Local Administrative Organization (อบต.).
    Predict the budget risk for the following:
    
    Project/Department: ${budgetData.department}
    Allocated: ${budgetData.allocatedAmount} THB
    Spent: ${budgetData.spentAmount} THB
    Remaining: ${budgetData.remainingAmount} THB
    Year: ${budgetData.year}
    
    Required Output (Thai):
    1. Risk Level: LOW, MEDIUM, or HIGH
    2. Recommendation: What should be done? (max 100 words).
    
    Output Format (JSON):
    {
      "riskLevel": "...",
      "recommendation": "..."
    }
  `;

  try {
    const result = await kpiAnalyzerModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid AI response format");
  } catch (error) {
    console.error("Gemini Budget Analysis Error:", error);
    return null;
  }
}

export async function analyzeExecutiveInsights(contextData: any) {
  const prompt = `
    คุณคือที่ปรึกษายุทธศาสตร์ระดับสูงสำหรับองค์กรปกครองส่วนท้องถิ่น (อบต.) 
    ข้อมูลภาพรวมขององค์กรคือ:
    ${JSON.stringify(contextData, null, 2)}

    งานของคุณคือ:
    1. ให้บทสรุปสถานะปัจจุบันขององค์กร (Executive Summary)
    2. กำหนด 3 เป้าหมายเชิงกลยุทธ์ที่เร่งด่วนที่สุด (Strategic Priorities)
    3. วิเคราะห์ความเสี่ยงเชิงโครงสร้าง (Structural Risks)
    4. ให้คำแนะนำสำหรับการวางแผนปีงบประมาณถัดไป

    กรุณาตอบเป็น JSON ในรูปแบบดังนี้:
    {
      "executiveSummary": "บทสรุปสั้นๆ แต่ทรงพลัง",
      "strategicPriorities": [
        { "title": "ชื่อเป้าหมาย", "description": "รายละเอียดและเหตุผล" }
      ],
      "structuralRisks": ["ความเสี่ยงที่ 1", "ความเสี่ยงที่ 2"],
      "futurePlanning": "คำแนะนำสำหรับการวางแผนปีหน้า",
      "score": "คะแนนประสิทธิภาพองค์กรโดยรวม (0-100)"
    }

    ให้ตอบเป็นภาษาไทยเท่านั้น และต้องเป็น JSON ที่ valid
  `;

  try {
    const result = await kpiAnalyzerModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid AI response format");
  } catch (error) {
    console.error("Gemini Executive Insights Error:", error);
    return null;
  }
}

export async function analyzeTrend(targetName: string, contextData: string) {
  const prompt = `
    คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์นโยบายและแผนงานภาครัฐ (อบต.) 
    ข้อมูลชุดนี้คือข้อมูล ${targetName} ขององค์กร:
    ${contextData}

    งานของคุณคือ:
    1. วิเคราะห์แนวโน้ม (Trend) จากข้อมูลย้อนหลัง
    2. พยากรณ์ (Forecast) สิ่งที่จะเกิดขึ้นในอนาคต (งวดหน้า หรือ ปีหน้า)
    3. ให้คำแนะนำเชิงกลยุทธ์เพื่อพัฒนาประสิทธิภาพ

    กรุณาตอบเป็น JSON ในรูปแบบดังนี้:
    {
      "trendSummary": "สรุปแนวโน้มสั้นๆ",
      "forecastValue": "ค่าที่คาดการณ์ (เช่น งบประมาณที่ต้องใช้เพิ่ม หรือ ระดับ KPI ที่คาดว่าจะถึง)",
      "confidence": "ระดับความเชื่อมั่น (0-100)",
      "recommendations": ["คำแนะนำที่ 1", "คำแนะนำที่ 2"],
      "risks": ["ความเสี่ยงที่ 1", "ความเสี่ยงที่ 2"]
    }

    ให้ตอบเป็นภาษาไทยเท่านั้น และต้องเป็น JSON ที่ valid
  `;

  try {
    const result = await kpiAnalyzerModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid AI response format");
  } catch (error) {
    console.error("Gemini Trend Analysis Error:", error);
    return null;
  }
}

export async function analyzeEvaluationResults(evaluationData: any) {
  const prompt = `
    คุณคือผู้เชี่ยวชาญด้านบริหารทรัพยากรบุคคล (HR Expert) ของหน่วยงานภาครัฐ (อบต./เทศบาล)
    กรุณาวิเคราะห์ผลการประเมินการปฏิบัติงานของพนักงาน ดังนี้:
    
    ข้อมูลผู้ถูกประเมิน: ${evaluationData.employeeName} (${evaluationData.position})
    ผลประเมินรายตัวชี้วัด:
    ${JSON.stringify(evaluationData.kpis, null, 2)}
    
    คะแนนรวม: ${evaluationData.totalScore}
    
    งานของคุณคือ:
    1. เขียน 'feedback' เชิงสร้างสรรค์ (Constructive Feedback) เพื่อให้พนักงานนำไปพัฒนาต่อ
    2. วิเคราะห์ 'biasDetection' (ความลำเอียง) ประเมินว่าหัวหน้าให้คะแนนสูงหรือต่ำเกินจริงโดยไม่มีเหตุผลหรือไม่ (เทียบจาก comment และคะแนน)
    3. กำหนด 'sentiment' (POSITIVE, NEUTRAL, NEEDS_IMPROVEMENT)
    
    ตอบเป็น JSON ในรูปแบบดังนี้:
    {
      "feedback": "คำแนะนำแบบมืออาชีพ สุภาพ ชัดเจน (ประมาณ 3-4 ประโยค)",
      "biasDetection": "บทวิเคราะห์ว่าพบความลำเอียงหรือไม่ (เช่น 'คะแนนสอดคล้องกับผลงาน' หรือ 'ข้อควรระวัง: คะแนนสูงกว่าค่าเฉลี่ยแตะเต็มโดยไม่มี comment สนับสนุน')",
      "sentiment": "POSITIVE"
    }

    ให้ตอบเป็นภาษาไทยเท่านั้น และต้องเป็น JSON ที่ valid
  `;

  try {
    const result = await kpiAnalyzerModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid AI response format");
  } catch (error) {
    console.error("Gemini Evaluation Analysis Error:", error);
    return null;
  }
}
