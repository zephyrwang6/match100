import { type NextRequest, NextResponse } from "next/server"
import { saveResume, extractResumeTitle } from "@/lib/resume-storage"
import { ReportStorage } from "@/lib/report-storage"

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

const SYSTEM_PROMPT = `# 苹果风格简历生成器提示词

## 角色定义
你是一个专业的苹果风格简历HTML生成器，能够将用户提供的简历信息转换为优雅的苹果设计风格HTML页面。

## 设计原则
- **极简主义：** 简洁清晰，去除冗余元素
- **扁平设计：** 使用扁平化图标和界面元素
- **微妙渐变：** 适度使用淡雅的渐变效果
- **柔和配色：** 采用低饱和度的颜色搭配
- **系统字体：** 使用苹果系统字体栈
- **精确间距：** 遵循8px网格系统

## 视觉风格要求
- **配色方案：** 以白色、浅灰为主，使用淡蓝色、淡绿色等低饱和度颜色作为点缀
- **圆角设计：** 统一使用12-16px圆角
- **微妙阴影：** 使用轻柔的投影效果增加层次
- **渐变元素：** 在标题、按钮、装饰等处使用淡雅渐变
- **扁平图标：** 使用简洁的emoji或符号作为图标

## 布局结构
1. **头部区域：** 姓名、职位、联系方式（居中布局）
2. **主要内容：** 个人简介、工作经验、项目经验、教育背景、技能专长、个人评价
3. **响应式设计：** 支持移动端和打印版本

## 内容处理原则
- **完整保留：** 用户输入的所有文字内容必须完整保留，不得删除、修改或简化
- **原文呈现：** 保持用户原始的表达方式和用词习惯
- **结构优化：** 仅对内容进行排版和视觉呈现的优化
- **信息完整：** 确保所有细节信息都得到展示

## 输出要求
- **纯HTML输出：** 只输出完整的HTML代码，不包含任何解释文字
- **内嵌CSS：** 所有样式写在\`<style>\`标签内
- **完整内容：** 用户提供的所有信息都要完整展示，一字不漏
- **无动效：** 不使用任何CSS动画或过渡效果
- **排版优化：** 仅对视觉呈现进行美化，不改动文字内容

## 使用方式
用户输入简历信息后，你直接输出符合苹果设计风格的HTML代码，代码应该：
- 结构清晰，语义化标签
- 样式优雅，符合苹果设计美学
- 内容完整，原封不动保留用户所有输入信息
- 响应式布局，适配各种设备

**重要提醒：绝对不能删除、修改或简化用户提供的任何文字内容，只能对排版和视觉效果进行优化。**

请根据用户提供的简历信息，生成对应的苹果风格HTML简历页面。`

export async function POST(request: NextRequest) {
  try {
    console.log("API Key exists:", !!DEEPSEEK_API_KEY)
    console.log("API Key length:", DEEPSEEK_API_KEY?.length || 0)
    
    if (!DEEPSEEK_API_KEY) {
      console.error("DEEPSEEK_API_KEY is not configured")
      return NextResponse.json({ error: "服务配置错误：API密钥未配置" }, { status: 500 })
    }

    const { resume } = await request.json()

    if (!resume || resume.length < 100) {
      return NextResponse.json({ error: "简历内容过短，请提供更详细的信息（至少100字）" }, { status: 400 })
    }

    const userMessage = `请将以下简历信息转换为苹果设计风格的HTML页面：

${resume}

请严格按照系统提示词的要求输出纯HTML代码。`

    console.log("Making request to DeepSeek API...")
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        stream: false,
        temperature: 0.3, // 较低的温度以确保输出格式稳定
        max_tokens: 8192,
      }),
    })

    console.log("Response status:", response.status)
    console.log("Response ok:", response.ok)

    if (!response.ok) {
      const errorData = await response.text()
      console.error("DeepSeek API Error (Beautify):", errorData)
      console.error("Response status:", response.status)
      console.error("Response headers:", Object.fromEntries(response.headers.entries()))
      return NextResponse.json({ error: "AI服务暂时不可用，请稍后再试" }, { status: 500 })
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected API response format (Beautify):", data)
      return NextResponse.json({ error: "AI服务响应格式异常" }, { status: 500 })
    }

    const htmlContent = data.choices[0].message.content

    // 确保返回的是HTML
    const cleanedHtml = htmlContent.replace(/^```html\s*|```$/g, "").trim()

    // 保存简历到存储系统
    const title = extractResumeTitle(resume)
    const savedReport = ReportStorage.save({
      title,
      resume,
      htmlContent: cleanedHtml,
      viewCount: 0
    }, "beautified_html")

    // 生成简历URL
    const resumeUrl = `/resume/${savedReport.id}`

    return NextResponse.json({
      success: true,
      htmlContent: cleanedHtml,
      resumeId: savedReport.id,
      resumeUrl,
      title,
      usage: data.usage || null,
    })
  } catch (error) {
    console.error("API Error (Beautify):", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    return NextResponse.json({ error: "服务器内部错误，请稍后再试" }, { status: 500 })
  }
}
