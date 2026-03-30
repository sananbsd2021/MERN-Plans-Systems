"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Building2, User, Mail, Lock } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    organizationName: "",
    name: "",
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-sm border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-green-700">สมัครสมาชิกสำเร็จ!</CardTitle>
            <CardDescription className="text-center text-green-600">
              กำลังพาระบบไปหน้าเข้าสู่ระบบ...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">สร้างบัญชีผู้ใช้งานใหม่</CardTitle>
          <CardDescription className="text-center text-xs">
            ลงทะเบียนหน่วยงาน (อบต./เทศบาล) และผู้ดูแลระบบเพื่อเริ่มต้นใช้งาน
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-xs p-2 rounded border border-destructive/20">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="organizationName">ชื่อหน่วยงาน / องค์กร</Label>
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="organizationName"
                    placeholder="เช่น องค์การบริหารส่วนตำบล..."
                    className="pl-9"
                    value={formData.organizationName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">ชื่อ-นามสกุล ผู้ดูแลระบบ</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="นายสมชาย มั่งมี"
                    className="pl-9"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">อีเมล (Email)</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    className="pl-9"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">รหัสผ่าน (Password)</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ลงทะเบียนเข้าใช้งาน
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              มีบัญชีอยู่แล้ว?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                เข้าสู่ระบบที่นี่
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
