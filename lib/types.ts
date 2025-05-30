export interface ResumeData {
  id: string
  title: string
  originalContent: string
  htmlContent: string
  createdAt: string
  updatedAt: string
  viewCount: number
}

export interface ResumeHistory {
  resumes: ResumeData[]
} 