import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import Project from "@/models/Project"
import KPI from "@/models/KPI"

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  
  try {
    const tenantId = req.auth.user.tenantId
    await connectDB()

    // 1. Total Budget Allocated & Active Projects
    const projectsConfig = await Project.aggregate([
      { $match: { tenantId: tenantId } },
      { 
        $group: { 
          _id: null, 
          totalBudget: { $sum: "$budgetAllocated" },
          activeCount: {
            $sum: { $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0] }
          }
        } 
      }
    ])
    
    // 2. Overall KPI Success (Average of (currentValue / targetValue * 100))
    const kpisConfig = await KPI.aggregate([
      { $match: { tenantId: tenantId } },
      {
        $project: {
          achievementPercentage: {
            $cond: [
              { $gt: ["$targetValue", 0] },
              { $multiply: [{ $divide: ["$currentValue", "$targetValue"] }, 100] },
              0
            ]
          },
          isCritical: { $cond: ["$isAlertTriggered", 1, 0] }
        }
      },
      {
        $group: {
          _id: null,
          avgAchievement: { $avg: "$achievementPercentage" },
          criticalAlerts: { $sum: "$isCritical" }
        }
      }
    ])

    const totalBudget = projectsConfig.length > 0 ? projectsConfig[0].totalBudget : 0
    const activeProjects = projectsConfig.length > 0 ? projectsConfig[0].activeCount : 0
    
    const overallKpiSuccess = kpisConfig.length > 0 && kpisConfig[0].avgAchievement != null 
                              ? Math.round(kpisConfig[0].avgAchievement) 
                              : 0
    const criticalAlerts = kpisConfig.length > 0 ? kpisConfig[0].criticalAlerts : 0
    
    // 3. Recent Projects
    const recentProjects = await Project.find({ tenantId: tenantId })
      .populate('planId', 'title')
      .sort({ createdAt: -1 })
      .limit(5)

    return NextResponse.json({
      totalBudget,
      activeProjects,
      overallKpiSuccess,
      criticalAlerts,
      recentProjects
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
})
