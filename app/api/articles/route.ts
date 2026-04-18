import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/articles - 获取文章列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const year = searchParams.get('year')
    const questionType = searchParams.get('questionType')
    const examType = searchParams.get('examType')
    
    const where: Prisma.ArticleWhereInput = {}
    if (category) where.category = category
    if (year) where.year = parseInt(year)
    if (questionType) where.questionType = questionType
    if (examType) where.examType = examType
    
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          _count: {
            select: { questions: true }
          }
        },
        orderBy: [
          { year: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.article.count({ where }),
    ])
    
    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get articles error:', error)
    return NextResponse.json(
      { error: '获取文章列表失败' },
      { status: 500 }
    )
  }
}

// POST /api/articles - 创建文章
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, source, year, category, questionType, examType, questions } = body
    
    const article = await prisma.article.create({
      data: {
        title,
        content,
        source,
        year,
        category,
        questionType: questionType || 'reading',
        examType: examType || 'english1',
        wordCount: content.split(/\s+/).length,
        questions: {
          create: questions?.map((q: any, index: number) => ({
            questionNum: index + 1,
            stem: q.stem,
            questionType: q.questionType,
            analysis: q.analysis,
            correctAnswer: q.correctAnswer,
            options: {
              create: Object.entries(q.options || {}).map(([key, value]) => ({
                optionKey: key,
                content: value as string,
              })),
            },
          })) || [],
        },
      },
      include: {
        questions: {
          include: { options: true },
        },
      },
    })
    
    return NextResponse.json(article)
  } catch (error) {
    console.error('Create article error:', error)
    return NextResponse.json(
      { error: '创建文章失败' },
      { status: 500 }
    )
  }
}
