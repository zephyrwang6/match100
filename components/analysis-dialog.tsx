"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, Download, X, Eye } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface AnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: string
  contentType?: "markdown" | "html"
  title?: string
  reportId?: string // Optional: if we want to link to the full report page
}

export function AnalysisDialog({
  open,
  onOpenChange,
  content,
  contentType = "markdown",
  title = "分析结果",
  reportId,
}: AnalysisDialogProps) {
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: contentType === "html" ? "text/html" : "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = contentType === "html" ? "美化简历.html" : "分析报告.md"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleViewFullReport = () => {
    if (reportId) {
      onOpenChange(false) // Close dialog
      router.push(`/report/${reportId}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {reportId && (
                <Button variant="outline" size="sm" onClick={handleViewFullReport} className="hover:bg-gray-100">
                  <Eye className="w-4 h-4 mr-1" />
                  查看完整报告
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleCopy} className="hover:bg-gray-100">
                <Copy className="w-4 h-4 mr-1" />
                {copied ? "已复制" : "复制"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} className="hover:bg-gray-100">
                <Download className="w-4 h-4 mr-1" />
                下载
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="hover:bg-gray-100">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {contentType === "markdown" ? (
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 mb-6">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl font-medium text-gray-700 mt-6 mb-3">{children}</h3>,
                  p: ({ children }) => <p className="text-gray-600 leading-relaxed mb-4">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-4">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-600">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                  code: ({ children }) => (
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{children}</code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <iframe
              srcDoc={content}
              title="美化简历预览"
              className="w-full h-full border-0"
              sandbox="allow-same-origin" // For security, if HTML is from untrusted source
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
