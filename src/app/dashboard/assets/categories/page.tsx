"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, Edit, Trash2, FolderTree } from "lucide-react"

interface Category {
  _id: string;
  name: string;
  code: string;
  type: string;
  description?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("ASSET")
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    type: "ASSET"
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/assets/categories?type=${activeTab}`)
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editingCategory ? `/api/assets/categories/${editingCategory._id}` : "/api/assets/categories"
      const method = editingCategory ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, type: activeTab }),
      })
      
      const data = await res.json()
      if (res.ok) {
        setDialogOpen(false)
        setEditingCategory(null)
        setFormData({ name: "", code: "", description: "", type: activeTab })
        fetchData()
        setError("")
      } else {
        setError(data.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบหมวดหมู่?")) return
    try {
      const res = await fetch(`/api/assets/categories/${id}`, { method: "DELETE" })
      if (res.ok) fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      code: cat.code,
      description: cat.description || "",
      type: cat.type
    })
    setDialogOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">จัดการหมวดหมู่</h2>
          <p className="text-muted-foreground">จัดการหมวดหมู่สำหรับครุภัณฑ์และพัสดุ</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingCategory(null)
            setFormData({ name: "", code: "", description: "", type: activeTab })
          }
        }}>
          <DialogTrigger render={
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> เพิ่มหมวดหมู่ใหม่
            </Button>
          } />
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}</DialogTitle>
                <DialogDescription>
                  กำหนดรหัสและชื่อหมวดหมู่สำหรับใช้ในการจำแนกทรัพยากร
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {error && (
                  <div className="text-destructive text-sm p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>ชื่อหมวดหมู่</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="เช่น วัสดุสำนักงาน, คอมพิวเตอร์"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>รหัสหมวดหมู่</Label>
                  <Input 
                    value={formData.code} 
                    onChange={(e) => setFormData({...formData, code: e.target.value})} 
                    placeholder="เช่น 7440, OFF01"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>คำอธิบาย</Label>
                  <Input 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCategory ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="ASSET" className="space-y-4" onValueChange={(v: string | null) => setActiveTab(v || "ASSET")}>
        <TabsList>
          <TabsTrigger value="ASSET" className="gap-2">
            <FolderTree className="h-4 w-4" /> หมวดหมู่ครุภัณฑ์
          </TabsTrigger>
          <TabsTrigger value="SUPPLY" className="gap-2">
            <FolderTree className="h-4 w-4" /> หมวดหมู่พัสดุ
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>รายการหมวดหมู่ ({activeTab === "ASSET" ? "ครุภัณฑ์" : "พัสดุ"})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">รหัส</TableHead>
                      <TableHead>ชื่อหมวดหมู่</TableHead>
                      <TableHead>รายละเอียด</TableHead>
                      <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูลหมวดหมู่</TableCell>
                      </TableRow>
                    ) : (
                      categories.map((cat) => (
                        <TableRow key={cat._id}>
                          <TableCell className="font-mono font-bold">{cat.code}</TableCell>
                          <TableCell className="font-medium">{cat.name}</TableCell>
                          <TableCell className="text-muted-foreground">{cat.description || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(cat._id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
