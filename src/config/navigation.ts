import { Activity, BarChart3, Building2, FolderKanban, Home, LayoutDashboard, Settings, Users, User, Banknote, Package, FileText, Brain, Calendar, ClipboardCheck } from "lucide-react"

export const getSidebarNavItems = (role: string) => {
  const items = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      roles: ["SUPER_ADMIN", "ADMIN", "EXECUTIVE", "POLICY_ANALYST", "OFFICER"],
    },
    {
      title: "ปฏิทินกิจกรรม",
      icon: Calendar,
      href: "/dashboard/calendar",
      roles: ["SUPER_ADMIN", "ADMIN", "EXECUTIVE", "POLICY_ANALYST", "OFFICER"],
    },
    {
      title: "ยุทธศาสตร์",
      icon: Activity,
      href: "/dashboard/plans",
      roles: ["SUPER_ADMIN", "ADMIN", "EXECUTIVE", "POLICY_ANALYST", "OFFICER"],
    },
    {
      title: "โครงการ",
      icon: FolderKanban,
      href: "/dashboard/projects",
      roles: ["SUPER_ADMIN", "ADMIN", "EXECUTIVE", "POLICY_ANALYST", "OFFICER"],
    },
    {
      title: "งบประมาณ",
      icon: BarChart3,
      href: "/dashboard/budget",
      roles: ["SUPER_ADMIN", "ADMIN", "EXECUTIVE", "POLICY_ANALYST"],
    },
    {
      title: "ระบบเบิกจ่าย",
      icon: Activity,
      href: "/dashboard/disbursements",
      roles: ["SUPER_ADMIN", "ADMIN", "EXECUTIVE", "POLICY_ANALYST", "OFFICER"],
    },
    {
      title: "KPI Monitoring",
      icon: Activity,
      href: "/dashboard/kpi",
      roles: ["SUPER_ADMIN", "ADMIN", "EXECUTIVE", "POLICY_ANALYST", "OFFICER"],
    },
    {
      title: "งานบุคคล",
      icon: Users,
      href: "/dashboard/hrms",
      roles: ["SUPER_ADMIN", "ADMIN", "EXECUTIVE"],
      items: [
        { title: "พนักงาน", href: "/dashboard/hrms/employees" },
        { title: "แผนก", href: "/dashboard/hrms/departments" },
        { title: "การลา", href: "/dashboard/hrms/leaves" },
        { title: "การลงเวลา", href: "/dashboard/hrms/attendance" },
        { title: "สลิปเงินเดือน", href: "/dashboard/hrms/salary-slips" },
      ]
    },
    {
      title: "สลิปของฉัน",
      icon: FileText,
      href: "/dashboard/hrms/my-slips",
      roles: ["SUPER_ADMIN", "ADMIN", "EXECUTIVE", "POLICY_ANALYST", "OFFICER"],
    },
    {
      title: "ประเมินผลงาน",
      icon: ClipboardCheck,
      href: "/dashboard/evaluations",
      roles: ["SUPER_ADMIN", "ADMIN", "EXECUTIVE", "POLICY_ANALYST", "OFFICER"],
      items: [
        { title: "แดชบอร์ด", href: "/dashboard/evaluations" },
        { title: "รอบการประเมิน", href: "/dashboard/evaluations/periods" },
        { title: "จัดการตัวชี้วัด", href: "/dashboard/evaluations/kpis" },
        { title: "รายงาน", href: "/dashboard/evaluations/reports" }
      ]
    },
    {
      title: "งานจัดเก็บรายได้",
      icon: Banknote,
      href: "/dashboard/revenue",
      roles: ["SUPER_ADMIN", "ADMIN", "EXECUTIVE"],
    },
    {
      title: "งานทะเบียนทรัพย์สินและพัสดุ",
      icon: Package,
      href: "/dashboard/assets",
      roles: ["ADMIN", "EXECUTIVE"],
      items: [
        { title: "แดชบอร์ดทรัพย์สิน", href: "/dashboard/assets" },
        { title: "ทะเบียนครุภัณฑ์", href: "/dashboard/assets/inventory" },
        { title: "ประวัติการซ่อมบำรุง", href: "/dashboard/assets/maintenance" },
      ]
    },
    {
      title: "รายงาน",
      icon: FileText,
      href: "/dashboard/reports",
      roles: ["SUPER_ADMIN", "ADMIN", "EXECUTIVE", "POLICY_ANALYST"],
    },
    {
      title: "AI Analysis",
      icon: Brain,
      href: "/dashboard/ai-analysis",
      roles: ["SUPER_ADMIN", "ADMIN", "EXECUTIVE", "POLICY_ANALYST"],
    },
    {
      title: "สมาชิก",
      icon: User,
      href: "/dashboard/members",
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: "ตั้งค่า",
      icon: Settings,
      href: "/dashboard/settings",
      roles: ["SUPER_ADMIN", "ADMIN"],
    }
  ]

  return items.filter(item => item.roles.includes(role))
}
