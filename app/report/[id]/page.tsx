"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Copy, Download, Edit3, Calendar, FileText, Briefcase, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ReportStorage, type Report, type AnalysisReport, type BeautifiedHtmlReport } from "@/lib/report-storage"
import ReactMarkdown from "react-markdown"

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const reportId = params.id as string
    if (reportId) {
      const foundReport = ReportStorage.getById(reportId)
      setReport(foundReport)
      if (foundReport) {
        setNewTitle(foundReport.title)
      }
    }
    setLoading(false)
  }, [params.id])

  const handleCopy = () => {
    if (report) {
      const contentToCopy =
        report.type === "analysis" ? (report as AnalysisReport).analysis : (report as BeautifiedHtmlReport).htmlContent
      navigator.clipboard.writeText(contentToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (report) {
      let contentToDownload: string
      let fileName: string
      let mimeType: string

      if (report.type === "analysis") {
        const analysisReport = report as AnalysisReport
        contentToDownload = `# ${analysisReport.title}\n\n## 岗位描述\n${analysisReport.jobDescription}\n\n## 简历内容\n${analysisReport.resume}\n\n## 分析报告\n${analysisReport.analysis}\n\n---\n生成时间：${new Date(analysisReport.createdAt).toLocaleString("zh-CN")}`
        fileName = `${analysisReport.title}.md`
        mimeType = "text/markdown"
      } else {
        const htmlReport = report as BeautifiedHtmlReport
        contentToDownload = htmlReport.htmlContent
        fileName = `${htmlReport.title}.html`
        mimeType = "text/html"
      }

      const blob = new Blob([contentToDownload], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleSaveTitle = () => {
    if (report && newTitle.trim()) {
      const updatedReport = ReportStorage.update(report.id, { title: newTitle.trim() })
      if (updatedReport) {
        setReport(updatedReport)
      }
    }
    setEditingTitle(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载报告中...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">报告未找到</h1>
          <p className="text-gray-600 mb-6">该报告可能已被删除或不存在</p>
          <Button onClick={() => router.push("/")} className="bg-gradient-to-r from-purple-600 to-pink-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  const analysisReport = report.type === "analysis" ? (report as AnalysisReport) : null
  const htmlReport = report.type === "beautified_html" ? (report as BeautifiedHtmlReport) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-6">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-2xl font-bold border-none p-0 h-auto bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle()
                    else if (e.key === "Escape") {
                      setEditingTitle(false)
                      setNewTitle(report.title)
                    }
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveTitle}>
                  保存
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800">{report.title}</h1>
                <Button variant="ghost" size="sm" onClick={() => setEditingTitle(true)} className="hover:bg-gray-100">
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCopy} className="hover:bg-gray-100">
              <Copy className="w-4 h-4 mr-1" />
              {copied ? "已复制" : "复制"}
            </Button>
            <Button variant="outline" onClick={handleDownload} className="hover:bg-gray-100">
              <Download className="w-4 h-4 mr-1" />
              下载
            </Button>
          </div>
        </div>

        <Card className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              {report.type === "analysis" ? (
                <Wand2 className="w-4 h-4 text-purple-600" />
              ) : (
                <Wand2 className="w-4 h-4 text-pink-600" />
              )}
              <span>类型：{report.type === "analysis" ? "匹配度分析" : "美化简历"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>创建时间：{formatDate(report.createdAt)}</span>
            </div>
            {report.updatedAt !== report.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>更新时间：{formatDate(report.updatedAt)}</span>
              </div>
            )}
          </div>
        </Card>

        {analysisReport && (
          <>
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-800">岗位描述</h2>
                </div>
                <Textarea
                  value={analysisReport.jobDescription}
                  readOnly
                  className="min-h-[300px] resize-none border-gray-200 bg-gray-50"
                />
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-5 h-5 text-pink-600" />
                  <h2 className="text-xl font-semibold text-gray-800">简历内容</h2>
                </div>
                <Textarea
                  value={analysisReport.resume}
                  readOnly
                  className="min-h-[300px] resize-none border-gray-200 bg-gray-50"
                />
              </Card>
            </div>
            <Card className="p-6 mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                分析报告
              </h2>
              <div className="prose prose-gray max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 mb-6">{children}</h1>,
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">{children}</h2>
                    ),
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
                  {analysisReport.analysis}
                </ReactMarkdown>
              </div>
            </Card>
          </>
        )}

        {htmlReport && (
          <>
            <Card className="p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-pink-600" />
                <h2 className="text-xl font-semibold text-gray-800">原始简历内容</h2>
              </div>
              <Textarea
                value={htmlReport.resume}
                readOnly
                className="min-h-[200px] resize-none border-gray-200 bg-gray-50"
              />
            </Card>
            <Card className="p-6 mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                美化简历预览
              </h2>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={htmlReport.htmlContent}
                  title="美化简历预览"
                  className="w-full h-[600px] border-0" // Adjust height as needed
                  sandbox="allow-same-origin"
                />
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
