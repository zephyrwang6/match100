"use client"

import { useState, useEffect, use } from "react"
import { notFound } from "next/navigation"
import { ResumeData } from "@/lib/types"
import Link from "next/link"

interface ResumePageProps {
  params: Promise<{ id: string }>
}

export default function ResumePage({ params }: ResumePageProps) {
  const { id } = use(params)
  const [resume, setResume] = useState<ResumeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const response = await fetch(`/api/resumes/${id}`)
        const data = await response.json()
        
        if (response.ok && data.success) {
          setResume(data.resume)
        } else {
          notFound()
        }
      } catch (error) {
        console.error("获取简历失败:", error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    fetchResume()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!resume) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                ← 返回首页
              </Link>
              <div className="text-gray-300">|</div>
              <h1 className="text-lg font-semibold text-gray-900">{resume.title}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                浏览次数: {resume.viewCount}
              </div>
              <div className="text-sm text-gray-500">
                创建时间: {new Date(resume.createdAt).toLocaleDateString()}
              </div>
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🖨️ 打印简历
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([resume.htmlContent], { type: 'text/html' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${resume.title}.html`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                💾 下载HTML
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 简历内容 */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div 
            dangerouslySetInnerHTML={{ __html: resume.htmlContent }}
            className="resume-content"
          />
        </div>
      </div>

      {/* 底部信息 */}
      <div className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              最后更新: {new Date(resume.updatedAt).toLocaleString()}
            </div>
            <div>
              简历ID: {resume.id}
            </div>
          </div>
        </div>
      </div>

      {/* 打印样式 */}
      <style jsx global>{`
        @media print {
          .sticky {
            position: relative !important;
          }
          
          .bg-gray-50 {
            background: white !important;
          }
          
          .shadow-lg {
            box-shadow: none !important;
          }
          
          .border-t,
          .border-b {
            display: none !important;
          }
          
          .resume-content {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  )
} 