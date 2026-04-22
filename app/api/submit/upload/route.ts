import { NextRequest, NextResponse } from 'next/server'
import { parseFile } from '@/lib/submit/file-parser'
import { smartParse } from '@/lib/submit/ai-parser'

// 配置路由
export const runtime = 'nodejs'
export const maxDuration = 60

// POST /api/submit/upload - 文件上传解析
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const autoParse = formData.get('autoParse') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: '请选择要上传的文件' },
        { status: 400 }
      )
    }

    // 检查文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '文件大小不能超过 10MB' },
        { status: 400 }
      )
    }

    // 检查文件类型
    const allowedTypes = ['.txt', '.doc', '.docx', '.pdf']
    const ext = file.name.toLowerCase().split('.').pop()
    if (!allowedTypes.includes(`.${ext}`)) {
      return NextResponse.json(
        { error: `不支持的文件格式，支持: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer())

    // 解析文件
    const parseResult = await parseFile(buffer, file.name)

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: parseResult.error,
      })
    }

    // 如果需要AI解析
    if (autoParse && parseResult.content) {
      const aiResult = await smartParse(parseResult.content)
      return NextResponse.json({
        success: true,
        content: parseResult.content,
        metadata: parseResult.metadata,
        filename: file.name,
        aiParsed: aiResult,
      })
    }

    return NextResponse.json({
      success: true,
      content: parseResult.content,
      metadata: parseResult.metadata,
      filename: file.name,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: '文件上传失败，请稍后重试' },
      { status: 500 }
    )
  }
}
