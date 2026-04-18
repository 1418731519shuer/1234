import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/practice/stats - 获取统计数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'today'
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (type === 'today') {
      // 今日统计
      const todayRecords = await prisma.practiceRecord.findMany({
        where: {
          startTime: { gte: today },
          isCompleted: true,
        },
      })
      
      const stats = {
        articlesRead: todayRecords.length,
        totalQuestions: todayRecords.reduce((sum, r) => sum + r.totalQuestions, 0),
        totalCorrect: todayRecords.reduce((sum, r) => sum + r.totalCorrect, 0),
        totalTime: todayRecords.reduce((sum, r) => sum + (r.duration || 0), 0),
      }
      
      return NextResponse.json(stats)
    }
    
    if (type === 'week') {
      // 本周统计
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const weekRecords = await prisma.practiceRecord.findMany({
        where: {
          startTime: { gte: weekAgo },
          isCompleted: true,
        },
        orderBy: { startTime: 'asc' },
      })
      
      // 按天分组
      const dailyStats: Record<string, { articles: number; questions: number; correct: number }> = {}
      weekRecords.forEach(record => {
        const date = record.startTime.toISOString().split('T')[0]
        if (!dailyStats[date]) {
          dailyStats[date] = { articles: 0, questions: 0, correct: 0 }
        }
        dailyStats[date].articles++
        dailyStats[date].questions += record.totalQuestions
        dailyStats[date].correct += record.totalCorrect
      })
      
      return NextResponse.json({
        total: {
          articles: weekRecords.length,
          questions: weekRecords.reduce((sum, r) => sum + r.totalQuestions, 0),
          correct: weekRecords.reduce((sum, r) => sum + r.totalCorrect, 0),
        },
        daily: dailyStats,
      })
    }
    
    if (type === 'wrong') {
      // 错题列表
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
    }
    
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    )
  }
}

// POST /api/practice - 创建练习记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articleId } = body
    
    const record = await prisma.practiceRecord.create({
      data: {
        articleId,
        totalQuestions: 5, // 默认5题
      },
    })
    
    return NextResponse.json(record)
  } catch (error) {
    console.error('Create practice error:', error)
    return NextResponse.json(
      { error: '创建练习记录失败' },
      { status: 500 }
    )
  }
}

// PUT /api/practice - 更新练习记录（提交答案）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { practiceId, answers, duration } = body
    
    // 获取练习记录和题目信息
    const practice = await prisma.practiceRecord.findUnique({
      where: { id: practiceId },
      include: {
        article: {
          include: {
            questions: true,
          },
        },
      },
    })
    
    if (!practice) {
      return NextResponse.json({ error: '练习记录不存在' }, { status: 404 })
    }
    
    // 计算正确数
    let correctCount = 0
    const answerRecords = []
    
    for (const [questionId, userAnswer] of Object.entries(answers)) {
      const question = practice.article.questions.find(q => q.id === questionId)
      const isCorrect = question?.correctAnswer === userAnswer
      
      if (isCorrect) correctCount++
      
      answerRecords.push({
        practiceId,
        questionId,
        userAnswer: userAnswer as string,
        isCorrect,
      })
    }
    
    // 保存答案记录
    await prisma.answerRecord.createMany({
      data: answerRecords,
    })
    
    // 更新练习记录
    const updated = await prisma.practiceRecord.update({
      where: { id: practiceId },
      data: {
        endTime: new Date(),
        duration,
        totalCorrect: correctCount,
        totalQuestions: practice.article.questions.length,
        isCompleted: true,
      },
    })
    
    // 更新学习进度
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    await prisma.learningProgress.upsert({
      where: { date: today },
      create: {
        date: today,
        articlesRead: 1,
        questionsAnswered: practice.article.questions.length,
        correctCount,
        totalTime: duration,
      },
      update: {
        articlesRead: { increment: 1 },
        questionsAnswered: { increment: practice.article.questions.length },
        correctCount: { increment: correctCount },
        totalTime: { increment: duration },
      },
    })
    
    // 更新错题本
    for (const record of answerRecords) {
      if (!record.isCorrect) {
        await prisma.wrongQuestion.upsert({
          where: { questionId: record.questionId },
          create: {
            questionId: record.questionId,
            articleId: practice.articleId,
            userAnswer: record.userAnswer || '',
          },
          update: {
            wrongCount: { increment: 1 },
            lastWrongAt: new Date(),
          },
        })
      }
    }
    
    return NextResponse.json({
      ...updated,
      correctCount,
      totalQuestions: practice.article.questions.length,
    })
  } catch (error) {
    console.error('Submit practice error:', error)
    return NextResponse.json(
      { error: '提交答案失败' },
      { status: 500 }
    )
  }
}
