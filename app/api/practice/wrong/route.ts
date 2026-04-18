import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/practice/wrong - 获取错题列表
export async function GET(request: NextRequest) {
  try {
    const wrongQuestions = await prisma.wrongQuestion.findMany({
      where: { isMastered: false },
      orderBy: { lastWrongAt: 'desc' },
    })

    // 获取关联的文章和题目信息
    const enrichedQuestions = await Promise.all(
      wrongQuestions.map(async (wq) => {
        const question = await prisma.question.findUnique({
          where: { id: wq.questionId },
          include: {
            article: {
              select: { id: true, title: true, year: true }
            }
          }
        })
        return {
          ...wq,
          question,
        }
      })
    )

    return NextResponse.json({ questions: enrichedQuestions })
  } catch (error) {
    console.error('Get wrong questions error:', error)
    return NextResponse.json(
      { error: '获取错题失败' },
      { status: 500 }
    )
  }
}
