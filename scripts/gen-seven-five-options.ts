import 'dotenv/config'
import prisma from '../lib/db'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''

async function generateOptions(article: { id: string; title: string; content: string }) {
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
          content: `你是一位考研英语专家。请根据给定的七选五文章，生成7个选项段落（A-G）。

要求：
1. 每个选项段落长度适中（50-100词）
2. 其中5个是正确选项，2个是干扰项
3. 返回JSON数组格式
4. 格式：[{"optionKey": "A", "content": "段落内容"}, ...]

只返回JSON数组，不要其他文字。`
        },
        {
          role: 'user',
          content: `请为这篇七选五文章生成选项A-G：\n\n${article.content.slice(0, 2000)}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || '[]'
  
  // 解析JSON
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }
  return JSON.parse(text)
}

async function main() {
  const articles = await prisma.article.findMany({
    where: { questionType: 'sevenFive' },
    select: { id: true, title: true, content: true },
  })

  console.log(`找到 ${articles.length} 篇七选五文章`)

  for (const article of articles) {
    // 检查是否已有选项
    const existing = await prisma.sevenFiveOption.findMany({
      where: { articleId: article.id },
    })
    
    if (existing.length > 0) {
      console.log(`${article.title} 已有 ${existing.length} 个选项，跳过`)
      continue
    }

    console.log(`正在为 ${article.title} 生成选项...`)
    
    try {
      const options = await generateOptions(article)
      
      for (const opt of options) {
        await prisma.sevenFiveOption.create({
          data: {
            articleId: article.id,
            optionKey: opt.optionKey,
            content: opt.content,
          },
        })
      }
      
      console.log(`${article.title} 生成了 ${options.length} 个选项`)
    } catch (error) {
      console.error(`${article.title} 生成失败:`, error)
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
