"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Sparkles, FileText, Clock, Trash2, Edit3, Eye, Wand2, BarChart3, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ReportStorage, type Report, type AnalysisReport, type BeautifiedHtmlReport } from "@/lib/report-storage"

export function Navbar() {
  const [showHistory, setShowHistory] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [filterType, setFilterType] = useState<'all' | 'analysis' | 'beautified_html'>('all')
  const router = useRouter()
  const pathname = usePathname()

  const loadReports = () => {
    const allReports = ReportStorage.getAll()
    setReports(allReports)
  }

  const filteredReports = reports.filter(report => 
    filterType === 'all' || report.type === filterType
  )

  const handleShowHistory = () => {
    loadReports()
    setShowHistory(true)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("确定要删除这个记录吗？")) {
      ReportStorage.delete(id)
      loadReports()
    }
  }

  const handleEdit = (report: Report, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(report.id)
    setEditTitle(report.title)
  }

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      ReportStorage.update(id, { title: editTitle.trim() })
      loadReports()
    }
    setEditingId(null)
    setEditTitle("")
  }

  const handleViewReport = (report: Report) => {
    setShowHistory(false)
    if (report.type === "analysis") {
      router.push(`/report/${report.id}`)
    } else {
      router.push(`/resume/${report.id}`)
    }
  }

  const handleDownload = (report: BeautifiedHtmlReport, e: React.MouseEvent) => {
    e.stopPropagation()
    const blob = new Blob([report.htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.title}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "今天 " + date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "昨天 " + date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString("zh-CN")
    }
  }

  const getContentSummary = (report: Report) => {
    if (report.type === "analysis") {
      const firstLine = report.jobDescription.split("\n")[0] || ""
      return firstLine.length > 50 ? firstLine.substring(0, 50) + "..." : firstLine
    } else {
      const firstLine = report.resume.split("\n")[0] || ""
      return firstLine.length > 50 ? firstLine.substring(0, 50) + "..." : firstLine
    }
  }

  const getReportIcon = (type: Report['type']) => {
    return type === "analysis" ? (
      <BarChart3 className="w-4 h-4 text-purple-600" />
    ) : (
      <Wand2 className="w-4 h-4 text-pink-600" />
    )
  }

  const getReportTypeLabel = (type: Report['type']) => {
    return type === "analysis" ? "分析报告" : "美化简历"
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Match100%
            </span>
          </Link>

          <div className="flex-1"></div>

          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowHistory}
              className="flex items-center gap-1.5 text-gray-700 hover:bg-gray-100"
            >
              <Clock className="w-4 h-4" />
              <span>历史记录</span>
            </Button>
            {pathname !== "/" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="flex items-center gap-1.5 text-gray-700 hover:bg-gray-100"
              >
                <Sparkles className="w-4 h-4" />
                <span>新建分析</span>
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* 历史记录弹窗 */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              历史记录
            </DialogTitle>
          </DialogHeader>

          {/* 筛选器 */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              全部 ({reports.length})
            </Button>
            <Button
              variant={filterType === 'analysis' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('analysis')}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              分析报告 ({reports.filter(r => r.type === 'analysis').length})
            </Button>
            <Button
              variant={filterType === 'beautified_html' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('beautified_html')}
            >
              <Wand2 className="w-4 h-4 mr-1" />
              美化简历 ({reports.filter(r => r.type === 'beautified_html').length})
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">暂无历史记录</h3>
                <p className="text-gray-600">使用AI功能后，记录将保存在这里</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleViewReport(report)}>
                        {editingId === report.id ? (
                          <div className="flex items-center gap-2 mb-2">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="text-lg font-semibold"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveEdit(report.id)
                                } else if (e.key === "Escape") {
                                  setEditingId(null)
                                  setEditTitle("")
                                }
                              }}
                              autoFocus
                            />
                            <Button size="sm" onClick={() => handleSaveEdit(report.id)}>
                              保存
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-2">
                            {getReportIcon(report.type)}
                            <h3 className="text-lg font-semibold text-gray-800 hover:text-purple-600 transition-colors">
                              {report.title}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              report.type === 'analysis' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-pink-100 text-pink-700'
                            }`}>
                              {getReportTypeLabel(report.type)}
                            </span>
                          </div>
                        )}

                        <div className="text-sm text-gray-600 mb-2">
                          <div className="truncate">{getContentSummary(report)}</div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>创建时间：{formatDate(report.createdAt)}</span>
                          {report.updatedAt !== report.createdAt && (
                            <span>更新时间：{formatDate(report.updatedAt)}</span>
                          )}
                          {report.type === 'beautified_html' && (
                            <span>浏览次数：{report.viewCount || 0}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                          className="hover:bg-purple-100"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {report.type === 'beautified_html' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDownload(report as BeautifiedHtmlReport, e)}
                            className="hover:bg-green-100 text-green-600"
                            title="下载HTML"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleEdit(report, e)}
                          className="hover:bg-blue-100"
                          title="编辑标题"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(report.id, e)}
                          className="hover:bg-red-100 text-red-600"
                          title="删除记录"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
