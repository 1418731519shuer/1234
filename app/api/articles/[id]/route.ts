import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { questionNum: 'asc' },
          include: {
            options: {
              orderBy: { optionKey: 'asc' },
            },
          },
        },
        clozeBlanks: {
          orderBy: { blankNum: 'asc' },
        },
        sevenFiveOpts: {
          orderBy: { optionKey: 'asc' },
        },
        writingTask: true,
      },
    })
    
    if (!article) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }
    
    return NextResponse.json(article)
  } catch (error) {
    console.error('Get article error:', error)
    return NextResponse.json(
      { error: '获取文章失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.article.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete article error:', error)
    return NextResponse.json(
      { error: '删除文章失败' },
      { status: 500 }
    )
  }
}
