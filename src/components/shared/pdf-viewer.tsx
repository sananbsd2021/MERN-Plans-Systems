"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { FileText, ExternalLink, Download, X, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PDFViewerProps {
  url: string | null
  isOpen: boolean
  onClose: () => void
  title?: string
}

export function PDFViewer({ url, isOpen, onClose, title = "เอกสารประกอบ" }: PDFViewerProps) {
  if (!url) return null

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = url
    link.download = url.split("/").pop() || "document.pdf"
    link.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[95vw] h-[95vh] p-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-md border-primary/20">
        <DialogHeader className="p-4 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
              <p className="text-xs text-muted-foreground truncate max-w-[300px]">{url.split("/").pop()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(url, '_blank')} className="hidden sm:flex gap-2">
              <ExternalLink className="h-4 w-4" />
              เปิดหน้าใหม่
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="hidden sm:flex gap-2 text-primary border-primary/20 bg-primary/5">
              <Download className="h-4 w-4" />
              ดาวน์โหลด
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 bg-zinc-800/20 relative group">
          <iframe 
            src={`${url}#toolbar=0&navpanes=0&scrollbar=0`} 
            className="w-full h-full border-none shadow-2xl" 
            title="PDF Document Viewer"
          />
          
          {/* Quick Floating Actions for Mobile or Hover */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" className="rounded-full shadow-lg" onClick={() => window.open(url, '_blank')}>
                <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="p-2 border-t bg-muted/10 sm:justify-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
               Secure Document Viewer • Plans-Systems Enterprise
            </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
