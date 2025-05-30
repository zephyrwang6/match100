"use client"

import { useState } from "react"
import { Sparkles, FileText, Briefcase, AlertCircle, Info, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AnalysisDialog } from "@/components/analysis-dialog"
import { LoadingAnimation } from "@/components/loading-animation"
import { ReportStorage } from "@/lib/report-storage"
import { useRouter } from "next/navigation"
import { TestDataButton } from "@/components/test-data-button"
import { Tabs } from "@/components/tabs"

type ActiveMode = "analysis" | "beautify"

export default function Home() {
  const [jobDescription, setJobDescription] = useState("")
  const [resume, setResume] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultContent, setResultContent] = useState("")
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [error, setError] = useState("")
  const [activeMode, setActiveMode] = useState<ActiveMode>("analysis")
  const router = useRouter()

  const handleProcess = async () => {
    setError("")
    setIsProcessing(true)

    if (activeMode === "analysis") {
      if (!jobDescription || !resume) {
        setError("请填写完整的岗位描述和简历内容")
        setIsProcessing(false)
        return
      }
      if (jobDescription.length < 50) {
        setError("岗位描述过短，请提供更详细的信息（至少50字）")
        setIsProcessing(false)
        return
      }
      if (resume.length < 100) {
        setError("简历内容过短，请提供更详细的信息（至少100字）")
        setIsProcessing(false)
        return
      }

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription, resume }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "分析失败")

        setResultContent(data.analysis)
        setShowResultDialog(true)

        const savedReport = ReportStorage.save(
          {
            title: ReportStorage.generateTitle(jobDescription, "analysis"),
            jobDescription,
            resume,
            analysis: data.analysis,
          },
          "analysis",
        )
        setTimeout(() => {
          setShowResultDialog(false)
          router.push(`/report/${savedReport.id}`)
        }, 1000)
      } catch (err) {
        handleError(err)
      } finally {
        setIsProcessing(false)
      }
    } else {
      // beautify mode
      if (!resume) {
        setError("请填写简历内容")
        setIsProcessing(false)
        return
      }
      if (resume.length < 100) {
        setError("简历内容过短，请提供更详细的信息（至少100字）")
        setIsProcessing(false)
        return
      }

      try {
        const response = await fetch("/api/beautify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resume }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "美化失败")

        setResultContent(data.htmlContent) // Store HTML content
        setShowResultDialog(true) // Show dialog for HTML preview

        const savedReport = ReportStorage.save(
          {
            title: ReportStorage.generateTitle(resume, "beautified_html"),
            resume,
            htmlContent: data.htmlContent,
          },
          "beautified_html",
        )
        // No automatic redirect for HTML, user can view in dialog or go to report page later
      } catch (err) {
        handleError(err)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleError = (err: unknown) => {
    console.error("Processing error:", err)
    let errorMessage = "处理过程中出现错误，请稍后再试"
    if (err instanceof Error) {
      if (err.message.includes("API密钥")) {
        errorMessage = "服务配置错误，请联系管理员检查API配置"
      } else if (err.message.includes("网络")) {
        errorMessage = "网络连接错误，请检查网络后重试"
      } else {
        errorMessage = err.message
      }
    }
    setError(errorMessage)
  }

  const tabs = [
    { id: "analysis", label: "简历修改" },
    { id: "beautify", label: "美化简历" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            {activeMode === "analysis" ? "简历与岗位匹配度分析" : "简历美化"}
          </h1>
          <p className="text-gray-600 text-lg">
            {activeMode === "analysis"
              ? "用AI帮你分析简历与岗位的匹配度，提供专业修改建议"
              : "将您的简历转换为优雅的HTML页面"}
          </p>
        </div>

        <Tabs tabs={tabs} activeTab={activeMode} onTabChange={(tabId) => setActiveMode(tabId as ActiveMode)} />

        {process.env.NODE_ENV === "development" && (
          <div className="mb-4">
            <TestDataButton onDataAdded={() => window.location.reload()} />
          </div>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <div className={`grid gap-6 mb-8 ${activeMode === "analysis" ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
          {activeMode === "analysis" && (
            <Card className="p-6 border-gray-200 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-800">岗位描述 (JD)</h2>
              </div>
              <Textarea
                placeholder="请粘贴岗位描述内容..."
                className="min-h-[300px] resize-none border-gray-200 focus:border-purple-400"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <div className="mt-2 text-sm text-gray-500">已输入 {jobDescription.length} 字符（建议至少50字符）</div>
            </Card>
          )}

          <Card
            className={`p-6 border-gray-200 hover:shadow-lg transition-all duration-300 group ${activeMode === "beautify" ? "max-w-3xl mx-auto w-full" : ""}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-pink-600" />
              <h2 className="text-xl font-semibold text-gray-800">简历内容</h2>
            </div>
            <Textarea
              placeholder="请粘贴简历内容..."
              className="min-h-[300px] resize-none border-gray-200 focus:border-pink-400"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />
            <div className="mt-2 text-sm text-gray-500">已输入 {resume.length} 字符（建议至少100字符）</div>
          </Card>
        </div>

        <div className="flex flex-col items-center">
          <Button
            onClick={handleProcess}
            disabled={isProcessing}
            className="px-8 py-6 text-lg font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <LoadingAnimation />
                <span className="ml-2">AI 处理中...</span>
              </>
            ) : (
              <>
                {activeMode === "analysis" ? <Sparkles className="w-5 h-5 mr-2" /> : <Wand2 className="w-5 h-5 mr-2" />}
                {activeMode === "analysis" ? "AI 分析" : "AI 美化"}
              </>
            )}
          </Button>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <Info className="w-4 h-4 mr-1.5 text-gray-400" />
            所有数据将保存在您的浏览器本地，不会上传至服务器。
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16 mb-8">
          <div className="text-center group">
            <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-3 p-1 bg-purple-100 rounded-lg" />
            <h3 className="font-semibold text-gray-800 mb-2">智能匹配</h3>
            <p className="text-gray-600 text-sm">深度分析简历与岗位要求的匹配程度</p>
          </div>
          <div className="text-center group">
            <Wand2 className="w-8 h-8 text-pink-600 mx-auto mb-3 p-1 bg-pink-100 rounded-lg" />
            <h3 className="font-semibold text-gray-800 mb-2">简历美化</h3>
            <p className="text-gray-600 text-sm">生成优雅的HTML简历页面</p>
          </div>
          <div className="text-center group">
            <FileText className="w-8 h-8 text-indigo-600 mx-auto mb-3 p-1 bg-indigo-100 rounded-lg" />
            <h3 className="font-semibold text-gray-800 mb-2">专业建议</h3>
            <p className="text-gray-600 text-sm">提供针对性的简历优化和面试准备建议</p>
          </div>
        </div>
      </div>

      <AnalysisDialog
        open={showResultDialog}
        onOpenChange={setShowResultDialog}
        content={resultContent}
        contentType={activeMode === "beautify" ? "html" : "markdown"}
        title={activeMode === "beautify" ? "美化简历预览" : "匹配度分析报告"}
      />
    </div>
  )
}
