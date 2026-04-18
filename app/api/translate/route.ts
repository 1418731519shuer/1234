import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// POST /api/translate - 翻译文章（逐句对照）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articleId, content } = body
    
    // 检查是否已有翻译
    if (articleId) {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: { translation: true },
      })
      
      if (article?.translation) {
        // 尝试解析为JSON格式
        try {
          const parsed = JSON.parse(article.translation)
          if (Array.isArray(parsed)) {
            return NextResponse.json({ sentences: parsed })
          }
        } catch {
          // 旧格式，返回原始文本
        }
      }
    }
    
    // 调用DeepSeek API进行翻译
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一位专业的考研英语翻译专家。请将用户提供的英文文章翻译成中文。

要求：
1. 按句子翻译，每个句子单独一行
2. 返回JSON数组格式，每个元素包含 english 和 chinese 两个字段
3. 翻译准确、流畅，符合考研英语难度
4. 对于专业术语，可以在括号中保留英文原文
5. 长句可以适当拆分，但保持语义完整

返回格式示例：
[
  {"english": "The quick brown fox jumps over the lazy dog.", "chinese": "那只敏捷的棕色狐狸跳过了懒惰的狗。"},
  {"english": "This is another sentence.", "chinese": "这是另一个句子。"}
]

只返回JSON数组，不要添加任何其他文字。`
          },
          {
            role: 'user',
            content: `请翻译以下英文文章，按句子返回JSON数组：\n\n${content}`
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    })
    
    if (!response.ok) {
      // 返回模拟翻译
      const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim()).map((s: string) => ({
        english: s.trim() + '.',
        chinese: `[翻译] ${s.trim().slice(0, 50)}...`
      }))
      return NextResponse.json({ sentences })
    }
    
    const data = await response.json()
    const translationText = data.choices?.[0]?.message?.content || '[]'
    
    // 解析翻译结果
    let sentences = []
    try {
      // 尝试提取JSON数组
      const jsonMatch = translationText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        sentences = JSON.parse(jsonMatch[0])
      } else {
        sentences = JSON.parse(translationText)
      }
    } catch {
      // 如果解析失败，按行分割
      const lines = translationText.split('\n').filter((l: string) => l.trim())
      sentences = lines.map((line: string, i: number) => ({
        english: content.split(/[.!?]+/)[i]?.trim() + '.' || '',
        chinese: line
      }))
    }
    
    // 保存翻译到数据库
    if (articleId && sentences.length > 0) {
      await prisma.article.update({
        where: { id: articleId },
        data: { translation: JSON.stringify(sentences) },
      })
    }
    
    return NextResponse.json({ sentences })
  } catch (error) {
    console.error('Translate error:', error)
    return NextResponse.json(
      { error: '翻译失败', sentences: [] },
      { status: 500 }
    )
  }
}
