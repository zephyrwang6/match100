import { NextResponse } from "next/server"
import { ReportStorage } from "@/lib/report-storage"

export async function GET() {
  try {
    const allReports = ReportStorage.getAll()
    // 只返回简历美化记录
    const resumes = allReports
      .filter(report => report.type === "beautified_html")
      .map(report => ({
        id: report.id,
        title: report.title,
        originalContent: report.resume,
        htmlContent: report.htmlContent,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        viewCount: report.viewCount || 0
      }))
    
    return NextResponse.json({
      success: true,
      resumes,
      total: resumes.length
    })
  } catch (error) {
    console.error("获取简历历史记录失败:", error)
    return NextResponse.json({ error: "获取历史记录失败" }, { status: 500 })
  }
} 