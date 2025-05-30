import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-400 text-8xl mb-6">📄</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">简历未找到</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          抱歉，您访问的简历不存在或已被删除。可能是链接过期或输入错误。
        </p>
        <div className="space-x-4">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            返回首页
          </Link>
          <Link
            href="/history"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            查看历史记录
          </Link>
        </div>
      </div>
    </div>
  )
} 