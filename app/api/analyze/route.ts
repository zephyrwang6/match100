import { type NextRequest, NextResponse } from "next/server"

// 使用服务器端环境变量，确保安全性
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

// 添加调试信息（仅在开发环境）
if (process.env.NODE_ENV === "development") {
  console.log("Environment check:", {
    hasApiKey: !!DEEPSEEK_API_KEY,
    keyLength: DEEPSEEK_API_KEY ? DEEPSEEK_API_KEY.length : 0,
    nodeEnv: process.env.NODE_ENV,
  })
}

const SYSTEM_PROMPT = `# 简历优化专家提示词

你是一位资深职业规划师和HR专家，拥有10年以上人才招聘和简历优化经验，熟悉各行业招聘标准和ATS系统筛选机制。你的任务是帮助求职者根据特定岗位要求优化简历，并提供全面的匹配度分析和面试准备建议。你需要保持客观理性，少一些谄媚和赞扬。

## 工作流程：
1. 深度分析岗位JD和个人简历
2. 进行多维度匹配度评估
3. 提供系统性优化建议
4. 预测面试场景并给出应对策略

## 输出格式：

### 【岗位契合度分析】
- **综合匹配度**：X/10分（详细说明评分依据）
- **关键契合点**：
  1. [具体契合点1] + 匹配程度说明
  2. [具体契合点2] + 匹配程度说明
- **主要差距点**：
  1. [差距点1] + 影响程度 + 弥补策略
  2. [差距点2] + 影响程度 + 弥补策略

### 【个人优势挖掘】
- **核心竞争力**：[基于简历识别的独特优势]
- **价值主张**：[在同类候选人中的差异化优势]
- **发展潜力**：[该岗位对个人职业发展的价值]

### 【简历修改建议】
1. **内容优化**：
   - [具体修改项1] + 修改理由 + 建议表达方式
   - [具体修改项2] + 修改理由 + 建议表达方式
2. **结构调整**：
   - [版面布局建议] + [信息层次优化]
3. **关键词策略**：
   - 必须添加：[JD高频词汇]
   - 建议优化：[现有表达的专业化改进]
   - ATS友好度：[格式和关键词分布建议]

### 【数据化包装建议】
- **成果量化**：[将定性描述转为具体数据]
- **影响力体现**：[突出工作成果的业务价值]
- **技能证明**：[用具体项目验证能力声明]

### 【面试准备指导】
1. **高概率问题**：
   - [问题1] + 回答框架 + 关键要点
   - [问题2] + 回答框架 + 关键要点
2. **弱点应对**：
   - [可能被质疑的点] + 化解策略
3. **反问建议**：
   - [展现专业度的反问题目]

## 质量标准：
- ✅ 分析基于JD和简历的客观对比
- ✅ 建议具体可操作，提供修改示例
- ✅ 考虑行业特点和公司文化
- ✅ 预测问题贴合实际招聘场景
- ✅ 语言专业但易懂，避免空泛建议

请根据用户提供的岗位描述和简历内容，按照上述格式进行专业分析。`

export async function POST(request: NextRequest) {
  try {
    // 更详细的API密钥检查
    if (!DEEPSEEK_API_KEY) {
      console.error(
        "API Key missing. Available env vars:",
        Object.keys(process.env).filter((key) => key.includes("DEEPSEEK")),
      )
      return NextResponse.json(
        {
          error: "服务配置错误：API密钥未配置。请检查环境变量设置。",
          debug:
            process.env.NODE_ENV === "development"
              ? {
                  availableEnvVars: Object.keys(process.env).filter((key) => key.includes("DEEPSEEK")),
                  nodeEnv: process.env.NODE_ENV,
                }
              : undefined,
        },
        { status: 500 },
      )
    }

    if (DEEPSEEK_API_KEY.length < 10) {
      return NextResponse.json(
        {
          error: "服务配置错误：API密钥格式不正确",
        },
        { status: 500 },
      )
    }

    // 解析请求体
    const { jobDescription, resume } = await request.json()

    // 验证输入
    if (!jobDescription || !resume) {
      return NextResponse.json({ error: "请提供完整的岗位描述和简历内容" }, { status: 400 })
    }

    if (jobDescription.length < 50 || resume.length < 100) {
      return NextResponse.json({ error: "岗位描述和简历内容过短，请提供更详细的信息" }, { status: 400 })
    }

    // 构建用户消息
    const userMessage = `请分析以下岗位描述和简历的匹配度：

**岗位描述：**
${jobDescription}

**简历内容：**
${resume}

请按照指定格式提供详细的匹配度分析和优化建议。`

    // 调用DeepSeek API
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
        temperature: 0.7,
        max_tokens: 8192,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("DeepSeek API Error:", errorData)

      if (response.status === 401) {
        return NextResponse.json({ error: "API密钥无效，请检查配置" }, { status: 500 })
      } else if (response.status === 429) {
        return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 })
      } else {
        return NextResponse.json({ error: "AI服务暂时不可用，请稍后再试" }, { status: 500 })
      }
    }

    const data = await response.json()

    // 检查响应格式
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected API response format:", data)
      return NextResponse.json({ error: "AI服务响应格式异常" }, { status: 500 })
    }

    const analysisResult = data.choices[0].message.content

    // 返回分析结果
    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      usage: data.usage || null,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "服务器内部错误，请稍后再试" }, { status: 500 })
  }
}
