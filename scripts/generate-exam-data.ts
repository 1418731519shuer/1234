// 生成近十年考研英语真题数据
// 使用 DeepSeek API 生成模拟真题

import 'dotenv/config'
import prisma from '../lib/db'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''

console.log('API Key loaded:', DEEPSEEK_API_KEY ? `${DEEPSEEK_API_KEY.slice(0, 10)}...` : 'NOT FOUND')

// 题型配置
const EXAM_TYPES = {
  reading: { name: '阅读理解', count: 4 }, // 每年4篇阅读
  cloze: { name: '完型填空', count: 1 }, // 每年1篇完型
  sevenFive: { name: '七选五', count: 1 }, // 每年1篇七选五
}

// 年份范围
const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

// 话题分类
const TOPICS = [
  '经济与管理', '科技与创新', '社会与文化', '教育与发展',
  '环境与生态', '心理与认知', '政治与法律', '医学与健康'
]

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

// 生成阅读理解文章
async function generateReadingArticle(year: number, textNum: number) {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]
  
  const prompt = `请生成一篇考研英语阅读理解文章，要求：

1. 年份：${year}年 Text ${textNum}
2. 话题：${topic}
3. 字数：400-450词
4. 难度：符合考研英语难度
5. 文章结构：学术性文章，有明确论点和论据

请按以下JSON格式返回：
{
  "title": "文章标题",
  "content": "文章正文（英文）",
  "category": "${topic}",
  "difficulty": 3,
  "questions": [
    {
      "stem": "题目问题",
      "options": ["A选项", "B选项", "C选项", "D选项"],
      "correctAnswer": "A",
      "analysis": "题目解析"
    }
  ]
}

生成5道题目，包括：主旨题1道、细节题2道、推断题1道、词义题1道。

只返回JSON，不要其他文字。`

  const result = await generateWithAI(prompt)
  
  try {
    // 提取JSON
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('Parse error:', e)
  }
  
  return null
}

// 生成完型填空
async function generateCloze(year: number) {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]
  
  const prompt = `请生成一篇考研英语完型填空文章，要求：

1. 年份：${year}年
2. 话题：${topic}
3. 字数：250-300词
4. 挖空数量：20个

请按以下JSON格式返回：
{
  "title": "文章标题",
  "content": "文章正文，用 [BLANK_1] 到 [BLANK_20] 标记挖空位置",
  "category": "${topic}",
  "difficulty": 3,
  "blanks": [
    {
      "position": 1,
      "options": ["A选项", "B选项", "C选项", "D选项"],
      "correctAnswer": "A"
    }
  ]
}

只返回JSON，不要其他文字。`

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

// 生成七选五
async function generateSevenFive(year: number) {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]
  
  const prompt = `请生成一篇考研英语七选五文章，要求：

1. 年份：${year}年
2. 话题：${topic}
3. 字数：500-600词
4. 挖空数量：5个段落

请按以下JSON格式返回：
{
  "title": "文章标题",
  "content": "文章正文，用 [GAP_1] 到 [GAP_5] 标记挖空位置",
  "category": "${topic}",
  "difficulty": 3,
  "gaps": [
    {
      "position": 1,
      "content": "填入的段落内容",
      "options": ["A选项段落", "B选项段落", "C选项段落", "D选项段落", "E选项段落", "F选项段落", "G选项段落"],
      "correctAnswer": "A"
    }
  ]
}

只返回JSON，不要其他文字。`

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

// 保存阅读理解文章到数据库
async function saveReadingArticle(data: any, year: number, textNum: number) {
  if (!data) return null
  
  try {
    const article = await prisma.article.create({
      data: {
        title: data.title || `${year}年阅读理解 Text ${textNum}`,
        content: data.content || '',
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
                optionKey: String.fromCharCode(65 + j), // A, B, C, D
                content: opt,
              })),
            },
          })),
        },
      },
    })
    
    console.log(`✓ 已保存: ${year}年阅读 Text ${textNum}`)
    return article
  } catch (error) {
    console.error(`✗ 保存失败: ${year}年阅读 Text ${textNum}`, error)
    return null
  }
}

// 主函数
async function main() {
  console.log('开始生成真题数据...\n')
  
  // 生成阅读理解（每年4篇，先生成近3年）
  console.log('=== 生成阅读理解 ===')
  for (const year of [2022, 2023, 2024]) {
    for (let i = 1; i <= 2; i++) { // 每年先生成2篇
      console.log(`生成 ${year}年 Text ${i}...`)
      const data = await generateReadingArticle(year, i)
      if (data) {
        await saveReadingArticle(data, year, i)
      }
      // 延迟避免API限流
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  
  console.log('\n真题数据生成完成！')
  
  // 统计
  const count = await prisma.article.count()
  console.log(`数据库中共有 ${count} 篇文章`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
