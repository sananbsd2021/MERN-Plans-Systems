"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  
  if (status === "loading") {
    return <div className="p-8 flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">การตั้งค่า (Settings)</h2>
      </div>
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">โปรไฟล์ส่วนตัว</TabsTrigger>
          <TabsTrigger value="organization">องค์กร (Tenant)</TabsTrigger>
          <TabsTrigger value="notifications">การแจ้งเตือน</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลโปรไฟล์</CardTitle>
              <CardDescription>
                จัดการข้อมูลส่วนตัวและรหัสผ่านของคุณ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                <Input id="name" defaultValue={session?.user?.name || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input id="email" defaultValue={session?.user?.email || ""} disabled />
                <p className="text-[0.8rem] text-muted-foreground">ไม่สามารถเปลี่ยนอีเมลได้ หากต้องการเปลี่ยนกรุณาติดต่อผู้ดูแลระบบ</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">บทบาท (Role)</Label>
                <Input id="role" defaultValue={session?.user?.role || ""} disabled />
              </div>
              <Button>บันทึกการเปลี่ยนแปลง</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลองค์กร</CardTitle>
              <CardDescription>
                จัดการข้อมูลองค์กรปกครองส่วนท้องถิ่น (เฉพาะ Admin)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">ชื่อองค์กร (อบต./เทศบาล)</Label>
                <Input id="org-name" defaultValue="เทศบาลตำบลทดสอบ" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">จังหวัด</Label>
                <Input id="province" defaultValue="กรุงเทพมหานคร" />
              </div>
              <Button>บันทึกการเปลี่ยนแปลง</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>การแจ้งเตือน</CardTitle>
              <CardDescription>
                ตั้งค่าการรับการแจ้งเตือนผ่านอีเมลและระบบ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">การแจ้งเตือน KPI</Label>
                    <p className="text-[0.8rem] text-muted-foreground">รับการแจ้งเตือนเมื่อเป้าหมาย KPI ต่ำกว่าเกณฑ์</p>
                  </div>
                  {/* Placeholder for Switch component */}
                  <div className="h-6 w-11 rounded-full bg-primary relative">
                    <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">การแจ้งเตือนงบประมาณ</Label>
                    <p className="text-[0.8rem] text-muted-foreground">รับการแจ้งเตือนเมื่อมีการใช้งบประมาณเกินกำหนด</p>
                  </div>
                  <div className="h-6 w-11 rounded-full bg-primary relative">
                    <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
