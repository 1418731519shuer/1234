// 生成考研英语真题数据
// 使用 DeepSeek API 生成模拟真题

import prisma from '../lib/db'

const DEEPSEEK_API_KEY = 'sk-864e66eafdc648a6ba27607b1518f9bc'

// 调用 DeepSeek API 生成内容
async function generateWithAI(prompt: string): Promise<string> {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.8,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Error (${response.status}):`, errorText.slice(0, 200))
      return ''
    }
    
    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (error) {
    console.error('AI generation error:', error)
    return ''
  }
}

// 话题分类
const TOPICS = ['经济与管理', '科技与创新', '社会与文化', '教育与发展', '环境与生态']

// 生成阅读理解文章
async function generateReadingArticle(year: number, textNum: number) {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]
  
  const prompt = `请生成一篇考研英语阅读理解文章，要求：

1. 年份：${year}年 Text ${textNum}
2. 话题：${topic}
3. 字数：400-450词
4. 难度：符合考研英语难度

请按以下JSON格式返回，不要其他文字：
{"title":"文章标题","content":"文章正文英文","category":"${topic}","difficulty":3,"questions":[{"stem":"题目问题","options":["A选项","B选项","C选项","D选项"],"correctAnswer":"A","analysis":"解析"}]}

生成5道题目，包括主旨题、细节题、推断题、词义题。`

  const result = await generateWithAI(prompt)
  
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('Parse error:', e)
  }
  
  return null
}

// 保存文章到数据库
async function saveArticle(data: any, year: number, textNum: number) {
  if (!data || !data.content) return null
  
  try {
    const article = await prisma.article.create({
      data: {
        title: data.title || `${year}年阅读理解 Text ${textNum}`,
        content: data.content,
        source: `${year}年考研英语真题`,
        year,
        category: data.category || '综合',
        difficulty: data.difficulty || 3,
        questions: {
          create: (data.questions || []).map((q: any, i: number) => ({
            questionNum: i + 1,
            stem: q.stem || '',
            correctAnswer: q.correctAnswer || 'A',
            analysis: q.analysis || '',
            options: {
              create: (q.options || []).map((opt: string, j: number) => ({
                optionKey: String.fromCharCode(65 + j),
                content: opt,
              })),
            },
          })),
        },
      },
    })
    
    console.log(`✓ 已保存: ${year}年 Text ${textNum}`)
    return article
  } catch (error) {
    console.error(`✗ 保存失败:`, error)
    return null
  }
}

// 主函数
async function main() {
  console.log('开始生成真题数据...\n')
  
  // 生成阅读理解
  const years = [2022, 2023, 2024]
  
  for (const year of years) {
    for (let i = 1; i <= 2; i++) {
      console.log(`\n生成 ${year}年 Text ${i}...`)
      const data = await generateReadingArticle(year, i)
      if (data) {
        await saveArticle(data, year, i)
      }
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  
  const count = await prisma.article.count()
  console.log(`\n完成！数据库中共有 ${count} 篇文章`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
