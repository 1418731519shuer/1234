import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/vocabulary - 获取词汇列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const favorites = searchParams.get('favorites')
    
    // 如果请求收藏列表，只返回收藏的词
    const where = favorites === 'true' ? { isFavorite: true } : {}
    
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

// POST /api/vocabulary - 收藏/取消收藏词汇
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word, isFavorite } = body
    
    if (!word) {
      return NextResponse.json({ error: '单词不能为空' }, { status: 400 })
    }
    
    // 查找词汇
    const existing = await prisma.vocabulary.findUnique({
      where: { word },
    })
    
    if (!existing) {
      return NextResponse.json({ error: '词汇不存在' }, { status: 404 })
    }
    
    // 切换收藏状态
    const vocabulary = await prisma.vocabulary.update({
      where: { word },
      data: {
        isFavorite: isFavorite !== undefined ? isFavorite : !existing.isFavorite,
        lastReviewAt: new Date(),
      },
    })
    
    return NextResponse.json({ vocabulary, isFavorite: vocabulary.isFavorite })
  } catch (error) {
    console.error('Toggle favorite error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// DELETE /api/vocabulary - 删除词汇（支持单个和批量）
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // 检查是否是批量删除（通过body传递ids数组）
    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const body = await request.json()
      if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
        await prisma.vocabulary.deleteMany({
          where: { id: { in: body.ids } },
        })
        return NextResponse.json({ success: true, count: body.ids.length })
      }
    }
    
    // 单个删除
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
