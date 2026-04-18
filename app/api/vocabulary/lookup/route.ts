import { NextRequest, NextResponse } from 'next/server'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''

// POST /api/vocabulary/lookup - 查询单词释义
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word } = body
    
    if (!word) {
      return NextResponse.json({ error: '单词不能为空' }, { status: 400 })
    }
    
    // 调用DeepSeek API获取单词释义
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一位英语词典专家。请给出单词的中文释义和例句。

返回格式（简洁）：
词性. 中文释义
例句（英文）

只返回释义，不要其他内容。`
          },
          {
            role: 'user',
            content: `请给出单词 "${word}" 的释义：`
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    })
    
    if (!response.ok) {
      return NextResponse.json({ meaning: '查询失败' })
    }
    
    const data = await response.json()
    const meaning = data.choices?.[0]?.message?.content || '未找到释义'
    
    return NextResponse.json({ meaning })
  } catch (error) {
    console.error('Lookup word error:', error)
    return NextResponse.json({ meaning: '查询失败' })
  }
}
