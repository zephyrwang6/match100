import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.DEEPSEEK_API_KEY

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    config: {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      environment: process.env.NODE_ENV,
      // 只在开发环境显示更多信息
      ...(process.env.NODE_ENV === "development" && {
        availableEnvVars: Object.keys(process.env).filter((key) => key.includes("DEEPSEEK") || key.includes("API")),
      }),
    },
  })
}
