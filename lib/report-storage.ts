export type ReportType = "analysis" | "beautified_html"

export interface BaseReport {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  type: ReportType
  viewCount?: number
}

export interface AnalysisReport extends BaseReport {
  type: "analysis"
  jobDescription: string
  resume: string
  analysis: string
}

export interface BeautifiedHtmlReport extends BaseReport {
  type: "beautified_html"
  resume: string // Original resume text
  htmlContent: string
  viewCount: number
}

export type Report = AnalysisReport | BeautifiedHtmlReport

const STORAGE_KEY = "match100_reports"
const RESUME_STORAGE_KEY = "match100_resumes"

// 内存缓存，用于客户端和服务端
let memoryCache: Report[] = []
let cacheInitialized = false

export class ReportStorage {
  // 同步客户端数据到服务端
  static async syncToServer(reports: Report[]) {
    if (typeof window === "undefined") return // 仅在客户端执行
    
    try {
      const response = await fetch('/api/sync-storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reports }),
      })
      
      if (!response.ok) {
        console.error('Failed to sync data to server')
      }
    } catch (error) {
      console.error('Error syncing to server:', error)
    }
  }

  // 从服务端加载数据
  static async loadFromServer(): Promise<Report[]> {
    if (typeof window === "undefined") return [] // 仅在客户端执行
    
    try {
      const response = await fetch('/api/sync-storage', {
        method: 'GET',
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.reports || []
      }
    } catch (error) {
      console.error('Error loading from server:', error)
    }
    return []
  }

  // 初始化缓存（仅在需要时调用）
  static initializeCache() {
    if (cacheInitialized) return
    cacheInitialized = true
    
    if (typeof window !== "undefined") {
      // 客户端：从 localStorage 加载
      try {
        this.migrateResumeData()
        const data = localStorage.getItem(STORAGE_KEY)
        memoryCache = data ? JSON.parse(data) : []
      } catch (error) {
        console.error("Error reading reports from localStorage:", error)
        memoryCache = []
      }
    } else {
      // 服务端：从外部数据源初始化（通过 API 调用）
      memoryCache = []
    }
  }

  // 服务端专用：直接设置缓存数据
  static setServerCache(reports: Report[]) {
    if (typeof window !== "undefined") return // 仅在服务端执行
    memoryCache = reports
    cacheInitialized = true
  }

  // 迁移简历数据到统一存储
  static migrateResumeData() {
    if (typeof window === "undefined") return

    try {
      const resumeData = localStorage.getItem(RESUME_STORAGE_KEY)
      if (!resumeData) return

      const resumes = JSON.parse(resumeData)
      // 直接读取现有报告，避免递归
      const existingData = localStorage.getItem(STORAGE_KEY)
      const existingReports: Report[] = existingData ? JSON.parse(existingData) : []
      const existingIds = new Set(existingReports.map(r => r.id))

      let hasNewData = false
      for (const [id, resumeData] of Object.entries(resumes as Record<string, any>)) {
        if (!existingIds.has(id) && resumeData && typeof resumeData === 'object') {
          const beautifiedReport: BeautifiedHtmlReport = {
            id: resumeData.id,
            title: resumeData.title,
            type: "beautified_html",
            resume: resumeData.originalContent,
            htmlContent: resumeData.htmlContent,
            createdAt: resumeData.createdAt,
            updatedAt: resumeData.updatedAt,
            viewCount: resumeData.viewCount || 0
          }
          existingReports.push(beautifiedReport)
          hasNewData = true
        }
      }

      if (hasNewData) {
        // 按创建时间排序
        existingReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        this.saveAll(existingReports)
      }
    } catch (error) {
      console.error("Error migrating resume data:", error)
    }
  }

  static getAll(): Report[] {
    this.initializeCache()
    return [...memoryCache] // 返回副本
  }

  static save(
    reportData:
      | Omit<AnalysisReport, "id" | "createdAt" | "updatedAt" | "type">
      | Omit<BeautifiedHtmlReport, "id" | "createdAt" | "updatedAt" | "type">,
    type: ReportType,
  ): Report {
    this.initializeCache()
    const now = new Date().toISOString()

    let newReport: Report

    if (type === "analysis") {
      const analysisData = reportData as Omit<AnalysisReport, "id" | "createdAt" | "updatedAt" | "type">
      newReport = {
        ...analysisData,
        id: this.generateId(),
        type: "analysis",
        createdAt: now,
        updatedAt: now,
      }
    } else {
      // beautified_html
      const beautifyData = reportData as Omit<BeautifiedHtmlReport, "id" | "createdAt" | "updatedAt" | "type">
      newReport = {
        ...beautifyData,
        id: this.generateId(),
        type: "beautified_html",
        createdAt: now,
        updatedAt: now,
      }
    }

    memoryCache.unshift(newReport) // 添加到开头

    // 限制最多保存50个报告
    if (memoryCache.length > 50) {
      memoryCache.splice(50)
    }

    this.saveAll(memoryCache)
    return newReport
  }

  static update(id: string, updates: Partial<Report>): Report | null {
    this.initializeCache()
    const index = memoryCache.findIndex((r) => r.id === id)

    if (index === -1) return null

    memoryCache[index] = {
      ...memoryCache[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    } as Report // Type assertion

    this.saveAll(memoryCache)
    return memoryCache[index]
  }

  static delete(id: string): boolean {
    this.initializeCache()
    const originalLength = memoryCache.length
    memoryCache = memoryCache.filter((r) => r.id !== id)

    if (memoryCache.length === originalLength) return false

    this.saveAll(memoryCache)
    return true
  }

  static getById(id: string): Report | null {
    this.initializeCache()
    return memoryCache.find((r) => r.id === id) || null
  }

  private static saveAll(reports: Report[]): void {
    // 更新内存缓存
    memoryCache = [...reports]
    
    if (typeof window !== "undefined") {
      // 客户端：保存到 localStorage 并同步到服务端
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
        // 异步同步到服务端，不等待结果
        this.syncToServer(reports)
      } catch (error) {
        console.error("Error saving reports to localStorage:", error)
      }
    }
    // 注意：服务端不在这里保存，而是通过 API 端点处理
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  static generateTitle(content: string, type: ReportType): string {
    if (type === "analysis") {
      // 从岗位描述中提取职位名称作为标题
      const lines = content.split("\n").filter((line) => line.trim())
      const firstLine = lines[0] || ""

      // 尝试提取职位名称
      const jobTitleMatch = firstLine.match(/(?:岗位|职位|招聘)[:：]?\s*([^\n,，。]+)/)
      if (jobTitleMatch) {
        return jobTitleMatch[1].trim()
      }

      // 如果没有找到，使用前30个字符
      const title = firstLine.length > 30 ? firstLine.substring(0, 30) + "..." : firstLine
      return title || "未命名分析报告"
    } else {
      // beautified_html
      // 从简历内容中提取姓名或前几个词作为标题
      const lines = content.split("\n").filter((line) => line.trim())
      const firstLine = lines[0] || ""
      const nameMatch = firstLine.match(/(?:姓名|Name)[:：]?\s*([^\n,，。]+)/)
      if (nameMatch) {
        return `${nameMatch[1].trim()}的简历`
      }
      const title = firstLine.length > 20 ? firstLine.substring(0, 20) + "..." : firstLine
      return title ? `${title} - 美化简历` : "未命名美化简历"
    }
  }
}
