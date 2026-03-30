"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Activity, User, Box, Clock } from "lucide-react"

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/audit-logs")
      if (res.ok) {
        const data = await res.json()
        setLogs(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE": return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">สร้าง</Badge>
      case "UPDATE": return <Badge className="bg-blue-100 text-blue-800 border-blue-200">แก้ไข</Badge>
      case "DELETE": return <Badge variant="destructive">ลบ</Badge>
      case "LOGIN": return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">เข้าสู่ระบบ</Badge>
      default: return <Badge variant="outline">{action}</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">บันทึกกิจกรรม (Audit Logs)</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>กิจกรรมทั้งหมดในระบบ</CardTitle>
          <CardDescription>
            ติดตามความเคลื่อนไหวและการเปลี่ยนแปลงข้อมูลสำคัญเพื่อความโปร่งใสและตรวจสอบได้
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Clock className="h-4 w-4 inline mr-2"/>วัน-เวลา</TableHead>
                  <TableHead><User className="h-4 w-4 inline mr-2"/>ผู้ใช้งาน</TableHead>
                  <TableHead><Activity className="h-4 w-4 inline mr-2"/>การกระทำ</TableHead>
                  <TableHead><Box className="h-4 w-4 inline mr-2"/>ประเภทข้อมูล</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString("th-TH")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.userId?.name || "Unknown User"}</span>
                        <span className="text-[10px] text-muted-foreground">{log.userId?.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                       <Badge variant="outline" className="text-[10px]">{log.resourceType}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[400px] text-xs text-muted-foreground truncate" title={log.details}>
                      {log.details || "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      ไม่พบประวัติการทำรายการในระบบ
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
