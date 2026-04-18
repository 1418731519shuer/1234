import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/knowledge - 获取知识库列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    
    const where: Prisma.KnowledgeWhereInput = {}
    if (category) where.category = category
    
    const [items, total] = await Promise.all([
      prisma.knowledge.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.knowledge.count({ where }),
    ])
    
    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get knowledge error:', error)
    return NextResponse.json(
      { error: '获取知识库失败' },
      { status: 500 }
    )
  }
}

// POST /api/knowledge - 保存知识（AI问答记录）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articleId, messages, title, category } = body
    
    // 从对话中提取知识点
    const lastMessage = messages[messages.length - 1]
    const knowledgeTitle = title || `问答记录 - ${new Date().toLocaleDateString()}`
    
    // 将对话内容整理成知识
    const content = messages.map((m: { role: string; content: string }) => 
      `${m.role === 'user' ? '问' : '答'}: ${m.content}`
    ).join('\n\n')
    
    const knowledge = await prisma.knowledge.create({
      data: {
        title: knowledgeTitle,
        content,
        category: category || 'AI问答',
        source: articleId,
      },
    })
    
    return NextResponse.json(knowledge)
  } catch (error) {
    console.error('Save knowledge error:', error)
    return NextResponse.json(
      { error: '保存知识失败' },
      { status: 500 }
    )
  }
}
