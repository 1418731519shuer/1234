import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// POST /api/practice/note - 保存错题笔记
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { practiceId, questionId, note } = body
    
    // 更新答案记录中的笔记
    const answerRecord = await prisma.answerRecord.findFirst({
      where: {
        practiceId,
        questionId,
      },
    })
    
    if (answerRecord) {
      await prisma.answerRecord.update({
        where: { id: answerRecord.id },
        data: { note },
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save note error:', error)
    return NextResponse.json(
      { error: '保存笔记失败' },
      { status: 500 }
    )
  }
}
