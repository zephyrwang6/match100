"use client"

import { Button } from "@/components/ui/button"
import { ReportStorage } from "@/lib/report-storage"
import { RefreshCw } from "lucide-react"

export function TestDataButton({ onDataAdded }: { onDataAdded?: () => void }) {
  const addTestData = () => {
    const testReports = [
      {
        title: "前端开发工程师 - 阿里巴巴",
        jobDescription: `岗位：前端开发工程师
公司：阿里巴巴
要求：
- 3年以上前端开发经验
- 熟练掌握React、Vue等前端框架
- 熟悉TypeScript、ES6+
- 有大型项目开发经验
- 良好的团队协作能力`,
        resume: `姓名：张三
工作经验：2年前端开发经验
技能：React、Vue、JavaScript、HTML、CSS
项目经验：
- 电商平台前端开发
- 管理后台系统开发
教育背景：计算机科学与技术本科`,
        analysis: `### 【岗位契合度分析】
- **综合匹配度**：7/10分
- **关键契合点**：
  1. 前端技术栈匹配度高 - React、Vue技能符合要求
  2. 项目经验相关 - 电商平台开发经验有价值

- **主要差距点**：
  1. 工作年限不足 - 要求3年，实际2年
  2. TypeScript技能缺失 - 需要补充学习`,
      },
      {
        title: "产品经理 - 腾讯",
        jobDescription: `岗位：产品经理
公司：腾讯
要求：
- 5年以上产品管理经验
- 有互联网产品从0到1的经验
- 数据分析能力强
- 用户体验敏感度高`,
        resume: `姓名：李四
工作经验：4年产品经验
项目经验：
- 负责过2个移动端产品
- 用户增长从0到100万
- 熟悉数据分析工具
教育背景：工商管理硕士`,
        analysis: `### 【岗位契合度分析】
- **综合匹配度**：8/10分
- **关键契合点**：
  1. 产品从0到1经验匹配
  2. 用户增长经验突出
  3. 数据分析能力符合要求

- **主要差距点**：
  1. 工作年限略显不足 - 要求5年，实际4年`,
      },
    ]

    testReports.forEach((report) => {
      ReportStorage.save(report)
    })

    onDataAdded?.()
    alert("测试数据已添加！")
  }

  return (
    <Button variant="outline" size="sm" onClick={addTestData} className="mb-4">
      <RefreshCw className="w-4 h-4 mr-2" />
      添加测试数据
    </Button>
  )
}
