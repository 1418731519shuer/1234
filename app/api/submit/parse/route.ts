import { NextRequest, NextResponse } from 'next/server'
import { smartParse, generateQuestionSuggestion } from '@/lib/submit/ai-parser'
import type { QuestionType } from '@/types/submit'

// POST /api/submit/parse - AI智能解析
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, questionType, generateSuggestion } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '请提供要解析的内容' },
        { status: 400 }
      )
    }

    // 如果指定了题型，直接解析该类型
    let result
    if (questionType) {
      const { parseReading, parseCloze, parseSevenFive, parseTranslation, parseWriting } = await import('@/lib/submit/ai-parser')
      switch (questionType) {
        case 'reading':
          result = await parseReading(content)
          break
        case 'cloze':
          result = await parseCloze(content)
          break
        case 'sevenFive':
          result = await parseSevenFive(content)
          break
        case 'translation':
          result = await parseTranslation(content)
          break
        case 'writing':
          result = await parseWriting(content)
          break
        default:
          result = await smartParse(content)
      }
    } else {
      // 自动识别题型
      result = await smartParse(content)
    }

    // 如果需要生成出题建议
    if (generateSuggestion && result.success && result.data) {
      const suggestion = await generateQuestionSuggestion(
        'content' in result.data ? result.data.content : content
      )
      result.suggestions = [JSON.stringify(suggestion)]
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json(
      { error: '解析失败，请稍后重试', success: false, confidence: 0 },
      { status: 500 }
    )
  }
}
