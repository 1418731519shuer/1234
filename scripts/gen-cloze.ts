import 'dotenv/config'
import prisma from '../lib/db'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''

async function generateCloze() {
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
          content: `你是一位考研英语命题专家。请生成一篇考研英语完型填空文章。

要求：
1. 文章长度约300-350词
2. 设置20个空位，用 ___1___ 到 ___20___ 标记
3. 每个空位提供4个选项(A,B,C,D)
4. 难度适中，符合考研英语一标准
5. 话题选择：教育、科技、社会、经济等常见话题

返回JSON格式：
{
  "title": "文章标题",
  "content": "带空位标记的完整文章",
  "blanks": [
    {
      "blankNum": 1,
      "correctAnswer": "A",
      "optionA": "选项A内容",
      "optionB": "选项B内容",
      "optionC": "选项C内容",
      "optionD": "选项D内容"
    },
    ...
  ]
}

只返回JSON，不要其他文字。`
        },
        {
          role: 'user',
          content: '请生成一篇关于"人工智能对就业市场影响"的考研英语完型填空文章。'
        }
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || '{}'
  
  // 解析JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }
  return JSON.parse(text)
}

async function main() {
  console.log('正在生成完型填空文章...')
  
  const cloze = await generateCloze()
  
  // 创建文章
  const article = await prisma.article.create({
    data: {
      title: cloze.title,
      content: cloze.content,
      questionType: 'cloze',
      examType: 'english1',
      year: 2024,
      category: '科技',
      difficulty: 3,
    },
  })
  
  console.log(`文章已创建: ${article.title}`)
  
  // 创建空位选项
  for (const blank of cloze.blanks) {
    await prisma.clozeBlank.create({
      data: {
        articleId: article.id,
        blankNum: blank.blankNum,
        correctAnswer: blank.correctAnswer,
        optionA: blank.optionA,
        optionB: blank.optionB,
        optionC: blank.optionC,
        optionD: blank.optionD,
      },
    })
  }
  
  console.log(`已创建 ${cloze.blanks.length} 个空位选项`)
  console.log('完成！')
}

main().catch(console.error).finally(() => prisma.$disconnect())
