import { NextRequest, NextResponse } from "next/server"
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { Report, BeautifiedHtmlReport } from "@/lib/report-storage"

const STORAGE_DIR = join(process.cwd(), '.temp-storage')
const STORAGE_FILE = join(STORAGE_DIR, 'reports.json')

interface RouteParams {
  params: Promise<{ id: string }>
}

function ensureStorageDir() {
  try {
    if (!existsSync(STORAGE_DIR)) {
      mkdirSync(STORAGE_DIR, { recursive: true })
    }
  } catch (error) {
    console.error("Error creating storage directory:", error)
  }
}

function loadReports(): Report[] {
  try {
    if (existsSync(STORAGE_FILE)) {
      const data = readFileSync(STORAGE_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error("Error reading from file storage:", error)
  }
  return []
}

function saveReports(reports: Report[]) {
  try {
    ensureStorageDir()
    writeFileSync(STORAGE_FILE, JSON.stringify(reports, null, 2), 'utf8')
  } catch (error) {
    console.error("Error writing to file storage:", error)
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const reports = loadReports()
    const report = reports.find(r => r.id === id)
    
    if (!report) {
      return NextResponse.json({ error: "简历未找到" }, { status: 404 })
    }
    
    if (report.type !== "beautified_html") {
      return NextResponse.json({ error: "简历未找到" }, { status: 404 })
    }

    const beautifiedReport = report as BeautifiedHtmlReport

    // 增加浏览次数
    beautifiedReport.viewCount = (beautifiedReport.viewCount || 0) + 1
    beautifiedReport.updatedAt = new Date().toISOString()
    
    // 保存更新后的数据
    saveReports(reports)
    
    return NextResponse.json({
      success: true,
      resume: {
        id: beautifiedReport.id,
        title: beautifiedReport.title,
        originalContent: beautifiedReport.resume,
        htmlContent: beautifiedReport.htmlContent,
        createdAt: beautifiedReport.createdAt,
        updatedAt: beautifiedReport.updatedAt,
        viewCount: beautifiedReport.viewCount
      }
    })
  } catch (error) {
    console.error("获取简历详情失败:", error)
    return NextResponse.json({ error: "获取简历失败" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const reports = loadReports()
    const originalLength = reports.length
    const filteredReports = reports.filter(r => r.id !== id)
    
    if (filteredReports.length === originalLength) {
      return NextResponse.json({ error: "简历未找到" }, { status: 404 })
    }
    
    saveReports(filteredReports)
    
    return NextResponse.json({
      success: true,
      message: "简历已删除"
    })
  } catch (error) {
    console.error("删除简历失败:", error)
    return NextResponse.json({ error: "删除简历失败" }, { status: 500 })
  }
} 