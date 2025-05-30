export type ReportType = "analysis" | "beautified_html"

export interface BaseReport {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  type: ReportType
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
}

export type Report = AnalysisReport | BeautifiedHtmlReport

const STORAGE_KEY = "match100_reports"

export class ReportStorage {
  static getAll(): Report[] {
    if (typeof window === "undefined") return []

    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error("Error reading reports from localStorage:", error)
      return []
    }
  }

  static save(
    reportData:
      | Omit<AnalysisReport, "id" | "createdAt" | "updatedAt" | "type">
      | Omit<BeautifiedHtmlReport, "id" | "createdAt" | "updatedAt" | "type">,
    type: ReportType,
  ): Report {
    const reports = this.getAll()
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

    reports.unshift(newReport) // 添加到开头

    // 限制最多保存50个报告
    if (reports.length > 50) {
      reports.splice(50)
    }

    this.saveAll(reports)
    return newReport
  }

  static update(id: string, updates: Partial<Report>): Report | null {
    const reports = this.getAll()
    const index = reports.findIndex((r) => r.id === id)

    if (index === -1) return null

    reports[index] = {
      ...reports[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    } as Report // Type assertion

    this.saveAll(reports)
    return reports[index]
  }

  static delete(id: string): boolean {
    const reports = this.getAll()
    const filteredReports = reports.filter((r) => r.id !== id)

    if (filteredReports.length === reports.length) return false

    this.saveAll(filteredReports)
    return true
  }

  static getById(id: string): Report | null {
    const reports = this.getAll()
    return reports.find((r) => r.id === id) || null
  }

  private static saveAll(reports: Report[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
    } catch (error) {
      console.error("Error saving reports to localStorage:", error)
    }
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
