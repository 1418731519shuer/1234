import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/vocabulary - 获取词汇列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    const where = category ? { category } : {}
    
    const vocabularies = await prisma.vocabulary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    
    return NextResponse.json({ vocabularies })
  } catch (error) {
    console.error('Get vocabulary error:', error)
    return NextResponse.json({ error: '获取词汇失败' }, { status: 500 })
  }
}

// POST /api/vocabulary - 添加词汇
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word, meaning, context, articleId, category = 'word' } = body
    
    if (!word || !meaning) {
      return NextResponse.json({ error: '单词和释义不能为空' }, { status: 400 })
    }
    
    // 检查是否已存在
    const existing = await prisma.vocabulary.findUnique({
      where: { word },
    })
    
    if (existing) {
      // 更新复习次数
      const updated = await prisma.vocabulary.update({
        where: { word },
        data: {
          reviewCount: { increment: 1 },
          lastReviewAt: new Date(),
        },
      })
      return NextResponse.json({ vocabulary: updated, isNew: false })
    }
    
    // 创建新词汇
    const vocabulary = await prisma.vocabulary.create({
      data: {
        word,
        meaning,
        context,
        articleId,
        category,
      },
    })
    
    return NextResponse.json({ vocabulary, isNew: true })
  } catch (error) {
    console.error('Add vocabulary error:', error)
    return NextResponse.json({ error: '添加词汇失败' }, { status: 500 })
  }
}

// DELETE /api/vocabulary - 删除词汇
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: '缺少词汇ID' }, { status: 400 })
    }
    
    await prisma.vocabulary.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete vocabulary error:', error)
    return NextResponse.json({ error: '删除词汇失败' }, { status: 500 })
  }
}
