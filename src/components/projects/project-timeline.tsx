"use client"

import { useMemo } from "react"
import { format, differenceInDays, startOfYear, endOfYear, eachMonthOfInterval, isWithinInterval, addDays } from "date-fns"
import { th } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

type Project = {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  budgetAllocated: number;
}

interface ProjectTimelineProps {
  projects: Project[];
}

export function ProjectTimeline({ projects }: ProjectTimelineProps) {
  // Determine date range for the timeline (current year)
  const currentYear = new Date().getFullYear();
  const timelineStart = startOfYear(new Date(currentYear, 0, 1));
  const timelineEnd = endOfYear(new Date(currentYear, 11, 31));
  
  const months = eachMonthOfInterval({
    start: timelineStart,
    end: timelineEnd
  });

  const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;

  const projectBars = useMemo(() => {
    return projects.map(project => {
      const start = new Date(project.startDate);
      const end = new Date(project.endDate);
      
      // Calculate position and width in percentage
      let startOffset = differenceInDays(start, timelineStart);
      let duration = differenceInDays(end, start) + 1;
      
      // Clamp to timeline range
      if (start < timelineStart) {
        duration -= differenceInDays(timelineStart, start);
        startOffset = 0;
      }
      
      if (end > timelineEnd) {
        duration -= differenceInDays(end, timelineEnd);
      }
      
      const left = Math.max(0, (startOffset / totalDays) * 100);
      const width = Math.max(2, (duration / totalDays) * 100); // Min 2% width for visibility
      
      const isVisible = (start <= timelineEnd && end >= timelineStart);

      return {
        ...project,
        left,
        width,
        isVisible
      };
    }).filter(p => p.isVisible);
  }, [projects, timelineStart, timelineEnd, totalDays]);

  return (
    <div className="w-full bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <div className="min-w-[1000px] p-6">
          {/* Timeline Header (Months) */}
          <div className="flex border-b border-muted pb-4 mb-6">
            <div className="w-[200px] shrink-0 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              โครงการ / ระยะเวลา
            </div>
            <div className="flex-1 flex relative h-8">
              {months.map((month, i) => (
                <div 
                  key={i} 
                  className="flex-1 text-center text-[10px] font-bold text-muted-foreground border-l border-muted/50 last:border-r"
                >
                  {format(month, "MMM", { locale: th })}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Body */}
          <div className="space-y-4">
            {projectBars.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
                <p className="text-sm">ไม่มีโครงการในช่วงปีนี้ ({currentYear})</p>
              </div>
            ) : (
              projectBars.map((project, index) => (
                <div key={project._id} className="flex items-center group">
                  {/* Project Info */}
                  <div className="w-[200px] shrink-0 pr-4">
                    <p className="text-xs font-bold truncate group-hover:text-primary transition-colors" title={project.name}>
                      {project.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[9px] text-muted-foreground">
                        {format(new Date(project.startDate), "dd/MM/yy")} - {format(new Date(project.endDate), "dd/MM/yy")}
                       </span>
                    </div>
                  </div>

                  {/* Project Bar Area */}
                  <div className="flex-1 relative h-6 bg-muted/20 rounded-full overflow-hidden border border-muted/30">
                    {/* Month Vertical Lines */}
                    <div className="absolute inset-0 flex">
                      {months.map((_, i) => (
                        <div key={i} className="flex-1 border-l border-muted/20 last:border-r" />
                      ))}
                    </div>

                    {/* Progress Bar */}
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: `${project.width}%`, opacity: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
                      style={{ left: `${project.left}%` }}
                      className={cn(
                        "absolute top-1 bottom-1 rounded-full shadow-sm flex items-center px-2",
                        project.status === "COMPLETED" ? "bg-emerald-500" : 
                        project.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-slate-400"
                      )}
                    >
                      <span className="text-[8px] text-white font-bold truncate">
                        {project.status === "COMPLETED" ? "สำเร็จ" : project.status === "IN_PROGRESS" ? "กำลังทำ" : "วางแผน"}
                      </span>
                    </motion.div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="bg-muted/30 p-4 border-t flex justify-end gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-medium uppercase text-muted-foreground">เสร็จสิ้น</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-[10px] font-medium uppercase text-muted-foreground">กำลังดำเนินการ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-400" />
          <span className="text-[10px] font-medium uppercase text-muted-foreground">รอการดำเนินงาน</span>
        </div>
      </div>
    </div>
  )
}
