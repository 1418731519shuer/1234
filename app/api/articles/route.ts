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
    const { 
      title, 
      content, 
      source, 
      year, 
      category, 
      questionType, 
      examType,
      difficulty,
      // 阅读理解
      questions,
      // 完型填空
      blanks,
      // 七选五
      correctAnswers,
      options: sevenFiveOptions,
      // 翻译
      sentences,
      // 写作
      taskType,
      instructions,
      wordCount: writingWordCount,
      sampleAnswer,
    } = body

    // 根据题型创建不同的数据
    const articleData: any = {
      title,
      content,
      source,
      year,
      category,
      questionType: questionType || 'reading',
      examType: examType || 'english1',
      difficulty: difficulty || 3,
      wordCount: content?.split(/\s+/).length || 0,
    }

    // 阅读理解
    if (questionType === 'reading' && questions) {
      articleData.questions = {
        create: questions.map((q: any, index: number) => ({
          questionNum: q.questionNum || index + 1,
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
        })),
      }
    }

    // 完型填空
    if (questionType === 'cloze' && blanks) {
      articleData.clozeBlanks = {
        create: blanks.map((b: any) => ({
          blankNum: b.blankNum,
          correctAnswer: b.correctAnswer,
          optionA: b.options?.A || '',
          optionB: b.options?.B || '',
          optionC: b.options?.C || '',
          optionD: b.options?.D || '',
        })),
      }
    }

    // 七选五
    if (questionType === 'sevenFive' && sevenFiveOptions) {
      articleData.sevenFiveOpts = {
        create: sevenFiveOptions.map((opt: any) => ({
          optionKey: opt.optionKey,
          content: opt.content,
        })),
      }
      // 存储正确答案到questions表（复用）
      if (correctAnswers) {
        articleData.questions = {
          create: correctAnswers.map((answer: string, index: number) => ({
            questionNum: index + 1,
            stem: `第${index + 1}空`,
            correctAnswer: answer,
            options: { create: [] },
          })),
        }
      }
    }

    // 翻译
    if (questionType === 'translation' && sentences) {
      articleData.translationSentences = {
        create: sentences.map((s: any) => ({
          sentenceNum: s.sentenceNum,
          englishText: s.englishText,
          referenceCn: s.referenceCn,
          keyVocabulary: s.keyVocabulary ? JSON.stringify(s.keyVocabulary) : null,
          grammarPoints: s.grammarPoints ? JSON.stringify(s.grammarPoints) : null,
        })),
      }
    }

    // 写作
    if (questionType === 'writing') {
      articleData.writingTask = {
        create: {
          taskType: taskType || 'small',
          instructions: instructions || '',
          wordCount: writingWordCount || 100,
          sampleAnswer: sampleAnswer,
        },
      }
    }

    const article = await prisma.article.create({
      data: articleData,
      include: {
        questions: {
          include: { options: true },
        },
        clozeBlanks: true,
        sevenFiveOpts: true,
        translationSentences: true,
        writingTask: true,
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
