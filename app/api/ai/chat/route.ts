import { NextRequest, NextResponse } from 'next/server'

// AI聊天接口 - 使用DeepSeek API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, context, history } = body
    
    // 构建系统提示
    const systemPrompt = `你是一位专业的考研英语辅导老师，擅长解答英语阅读理解问题。
你的任务是帮助学生理解文章内容、分析题目选项、讲解长难句、拓展词汇知识。

回答要求：
1. 用中文回答，语言简洁清晰
2. 对于题目分析，要解释每个选项为什么对或错
3. 讲解长难句时，分析句子结构
4. 适当拓展相关词汇和语法知识
5. 鼓励学生，给出学习建议

${context ? `当前上下文：\n${context}` : ''}`

    // 构建消息历史
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message },
    ]
    
    // 调用DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })
    
    if (!response.ok) {
      // 如果API调用失败，返回模拟响应
      const fallbackResponse = generateFallbackResponse(message, context)
      return NextResponse.json({ response: fallbackResponse })
    }
    
    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || '抱歉，我暂时无法回答这个问题。'
    
    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'AI服务暂时不可用' },
      { status: 500 }
    )
  }
}

// 备用响应生成（当API不可用时）
function generateFallbackResponse(message: string, context?: string) {
  if (message.includes('主旨') || message.includes('main idea')) {
    return `这篇文章的主旨需要从整体结构来分析：

1. 首段通常引出话题
2. 中间段落展开论述
3. 结尾段总结观点

建议你：
- 关注首尾段的关键词
- 找出各段的主题句
- 归纳文章的核心论点

需要我帮你具体分析这篇文章的结构吗？`
  }
  
  if (message.includes('为什么') || message.includes('解析')) {
    return `分析这道题需要：

1. **定位原文**：找到题目相关的段落
2. **理解题干**：明确题目问的是什么
3. **分析选项**：
   - 正确选项：与原文信息一致
   - 错误选项：偷换概念、过度推断、无中生有

你可以告诉我具体是哪道题，我来帮你详细分析。`
  }
  
  if (message.includes('长难句') || message.includes('句子')) {
    return `分析长难句的方法：

1. **找主干**：主谓宾结构
2. **拆修饰**：定语从句、状语从句
3. **理逻辑**：连接词表示的关系

常见句型：
- 倒装句
- 强调句
- 虚拟语气

把具体句子发给我，我来帮你拆解分析。`
  }
  
  return `我是你的考研英语助教，可以帮助你：

- 📖 分析文章主旨和结构
- 🎯 讲解题目选项
- 📝 解析长难句
- 📚 拓展词汇和语法

请告诉我你想了解什么？`
}
