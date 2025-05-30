import { NextRequest, NextResponse } from "next/server"
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { Report } from "@/lib/report-storage"

const STORAGE_DIR = join(process.cwd(), '.temp-storage')
const STORAGE_FILE = join(STORAGE_DIR, 'reports.json')

function ensureStorageDir() {
  try {
    if (!existsSync(STORAGE_DIR)) {
      mkdirSync(STORAGE_DIR, { recursive: true })
    }
  } catch (error) {
    console.error("Error creating storage directory:", error)
  }
}

function loadReports(): Report[] {
  try {
    if (existsSync(STORAGE_FILE)) {
      const data = readFileSync(STORAGE_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error("Error reading from file storage:", error)
  }
  return []
}

export async function GET() {
  try {
    const reports = loadReports()
    return NextResponse.json({ success: true, reports })
  } catch (error) {
    console.error("Error loading storage:", error)
    return NextResponse.json({ error: "加载失败" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { reports } = await request.json()
    
    if (!Array.isArray(reports)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    // 保存到文件系统
    ensureStorageDir()
    writeFileSync(STORAGE_FILE, JSON.stringify(reports, null, 2), 'utf8')
    
    return NextResponse.json({ success: true, count: reports.length })
  } catch (error) {
    console.error("Error syncing storage:", error)
    return NextResponse.json({ error: "同步失败" }, { status: 500 })
  }
} 