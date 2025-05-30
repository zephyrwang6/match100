import { ResumeData, ResumeHistory } from './types'

// 简单的内存存储，实际项目中应该使用数据库
const resumeStorage = new Map<string, ResumeData>()

// 生成唯一ID
export function generateResumeId(): string {
  return `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 保存简历
export function saveResume(resumeData: Omit<ResumeData, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>): string {
  const id = generateResumeId()
  const now = new Date().toISOString()
  
  const resume: ResumeData = {
    ...resumeData,
    id,
    createdAt: now,
    updatedAt: now,
    viewCount: 0
  }
  
  resumeStorage.set(id, resume)
  return id
}

// 获取简历
export function getResume(id: string): ResumeData | null {
  const resume = resumeStorage.get(id)
  if (resume) {
    // 增加浏览次数
    resume.viewCount += 1
    resume.updatedAt = new Date().toISOString()
    resumeStorage.set(id, resume)
  }
  return resume || null
}

// 获取所有简历（历史记录）
export function getAllResumes(): ResumeData[] {
  return Array.from(resumeStorage.values()).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

// 删除简历
export function deleteResume(id: string): boolean {
  return resumeStorage.delete(id)
}

// 更新简历
export function updateResume(id: string, updates: Partial<ResumeData>): boolean {
  const resume = resumeStorage.get(id)
  if (resume) {
    const updatedResume = {
      ...resume,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    resumeStorage.set(id, updatedResume)
    return true
  }
  return false
}

// 从简历内容中提取标题
export function extractResumeTitle(content: string): string {
  // 尝试从内容中提取姓名或职位作为标题
  const lines = content.split('\n').filter(line => line.trim())
  
  // 查找可能的姓名
  const namePattern = /^[\u4e00-\u9fa5a-zA-Z\s]{2,10}$/
  const titlePattern = /(工程师|经理|主管|总监|专员|助理|顾问|分析师|设计师|开发|产品|运营|市场|销售)/
  
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim()
    if (namePattern.test(trimmed) && !titlePattern.test(trimmed)) {
      return trimmed
    }
  }
  
  // 如果找不到姓名，使用职位或默认标题
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim()
    if (titlePattern.test(trimmed)) {
      return trimmed
    }
  }
  
  // 使用时间戳作为默认标题
  return `简历_${new Date().toLocaleDateString()}`
} 