// 批量生成考研英语真题数据
// 项目经理模式：指挥DeepSeek干活

import prisma from '../lib/db'

const DEEPSEEK_API_KEY = 'sk-864e66eafdc648a6ba27607b1518f9bc'

// 年份范围（近15年）
const YEARS = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

// 话题分类
const TOPICS = [
  '经济与管理', '科技与创新', '社会与文化', '教育与发展',
  '环境与生态', '心理与认知', '政治与法律', '医学与健康',
  '人工智能', '全球化', '职场与就业', '媒体与传播'
]

// 调用 DeepSeek API
async function callAI(prompt: string): Promise<string> {
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
      console.error(`API Error: ${response.status}`)
      return ''
    }
    
    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (error) {
    console.error('API call error:', error)
    return ''
  }
}

// ========== 阅读理解 ==========
async function generateReading(year: number, textNum: number) {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]
  
  const prompt = `你是考研英语命题专家。请生成${year}年考研英语一阅读理解Text ${textNum}。

要求：
1. 话题：${topic}
2. 字数：420-450词
3. 难度：符合考研英语一难度
4. 文章风格：学术性议论文

请严格按以下JSON格式返回，不要其他文字：
{
  "title": "英文标题",
  "content": "完整英文文章正文",
  "category": "${topic}",
  "difficulty": ${Math.floor(Math.random() * 2) + 3},
  "questions": [
    {
      "stem": "题目问题（英文）",
      "options": ["A选项内容", "B选项内容", "C选项内容", "D选项内容"],
      "correctAnswer": "A",
      "analysis": "中文解析"
    }
  ]
}

生成5道题目：主旨题1道、细节题2道、推断题1道、词义猜测题1道。`

  const result = await callAI(prompt)
  if (!result) return null
  
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null
  } catch {
    return null
  }
}

// ========== 完型填空 ==========
async function generateCloze(year: number) {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]
  
  const prompt = `你是考研英语命题专家。请生成${year}年考研英语一完型填空真题。

要求：
1. 话题：${topic}
2. 字数：280-300词
3. 挖空：20个空
4. 难度：符合考研英语一难度

请严格按以下JSON格式返回：
{
  "title": "英文标题",
  "content": "文章正文，用 [BLANK_1] 到 [BLANK_20] 标记20个挖空位置",
  "category": "${topic}",
  "difficulty": 3,
  "blanks": [
    {
      "position": 1,
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A"
    }
  ]
}

每个空提供4个选项，只返回选项字母A/B/C/D即可。`

  const result = await callAI(prompt)
  if (!result) return null
  
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null
  } catch {
    return null
  }
}

// ========== 七选五 ==========
async function generateSevenFive(year: number) {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]
  
  const prompt = `你是考研英语命题专家。请生成${year}年考研英语一七选五真题。

要求：
1. 话题：${topic}
2. 字数：500-550词
3. 挖空：5个段落位置
4. 难度：符合考研英语一难度

请严格按以下JSON格式返回：
{
  "title": "英文标题",
  "content": "文章正文，用 [GAP_1] 到 [GAP_5] 标记5个挖空位置",
  "category": "${topic}",
  "difficulty": 3,
  "gaps": [
    {
      "position": 1,
      "correctOption": "A",
      "options": {
        "A": "段落A的内容",
        "B": "段落B的内容",
        "C": "段落C的内容",
        "D": "段落D的内容",
        "E": "段落E的内容",
        "F": "段落F的内容",
        "G": "段落G的内容"
      }
    }
  ]
}

提供7个选项段落(A-G)，其中5个是正确答案。`

  const result = await callAI(prompt)
  if (!result) return null
  
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null
  } catch {
    return null
  }
}

// ========== 保存到数据库 ==========
async function saveReading(data: any, year: number, textNum: number) {
  if (!data?.content) return false
  
  try {
    await prisma.article.create({
      data: {
        title: data.title || `${year}年阅读理解 Text ${textNum}`,
        content: data.content,
        source: `${year}年考研英语一真题`,
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
                content: typeof opt === 'string' ? opt : opt.content || '',
              })),
            },
          })),
        },
      },
    })
    return true
  } catch (error) {
    console.error('Save error:', error)
    return false
  }
}

async function saveCloze(data: any, year: number) {
  if (!data?.content) return false
  
  try {
    // 将完型填空转换为文章格式
    let content = data.content
    const blanks = data.blanks || []
    
    // 替换挖空为选项格式
    blanks.forEach((blank: any) => {
      const options = (blank.options || []).map((opt: string, i: number) => 
        `${String.fromCharCode(65 + i)}. ${opt}`
      ).join(' | ')
      content = content.replace(`[BLANK_${blank.position}]`, `____(${options})____`)
    })
    
    await prisma.article.create({
      data: {
        title: data.title || `${year}年完型填空`,
        content,
        source: `${year}年考研英语一真题`,
        year,
        category: data.category || '完型填空',
        difficulty: data.difficulty || 3,
        questions: {
          create: blanks.map((blank: any, i: number) => ({
            questionNum: blank.position || i + 1,
            stem: `第${blank.position}空`,
            correctAnswer: blank.correctAnswer || 'A',
            analysis: '',
            options: {
              create: (blank.options || []).map((opt: string, j: number) => ({
                optionKey: String.fromCharCode(65 + j),
                content: opt,
              })),
            },
          })),
        },
      },
    })
    return true
  } catch (error) {
    console.error('Save cloze error:', error)
    return false
  }
}

async function saveSevenFive(data: any, year: number) {
  if (!data?.content) return false
  
  try {
    // 将七选五转换为文章格式
    let content = data.content
    const gaps = data.gaps || []
    
    // 替换挖空
    gaps.forEach((gap: any) => {
      content = content.replace(`[GAP_${gap.position}]`, `\n[此处填入段落]\n`)
    })
    
    // 添加选项
    const allOptions = gaps[0]?.options || {}
    const optionsText = Object.entries(allOptions)
      .map(([key, value]) => `${key}. ${value}`)
      .join('\n\n')
    
    content = content + '\n\n' + '='.repeat(40) + '\n选项：\n' + optionsText
    
    await prisma.article.create({
      data: {
        title: data.title || `${year}年七选五`,
        content,
        source: `${year}年考研英语一真题`,
        year,
        category: data.category || '七选五',
        difficulty: data.difficulty || 3,
        questions: {
          create: gaps.map((gap: any, i: number) => ({
            questionNum: gap.position || i + 1,
            stem: `第${gap.position}处应填入哪个段落？`,
            correctAnswer: gap.correctOption || 'A',
            analysis: '',
            options: {
              create: Object.entries(gap.options || {}).map(([key, value]: [string, any]) => ({
                optionKey: key,
                content: value.slice(0, 100) + '...',
              })),
            },
          })),
        },
      },
    })
    return true
  } catch (error) {
    console.error('Save seven-five error:', error)
    return false
  }
}

// ========== 主函数 ==========
async function main() {
  console.log('='.repeat(50))
  console.log('考研英语真题数据批量生成')
  console.log('项目经理模式：指挥DeepSeek干活')
  console.log('='.repeat(50))
  
  let totalGenerated = 0
  
  // 1. 生成阅读理解（每年4篇，先做近5年）
  console.log('\n📚 生成阅读理解...')
  for (const year of [2020, 2021, 2022, 2023, 2024]) {
    for (let i = 1; i <= 4; i++) {
      process.stdout.write(`  ${year} Text ${i}... `)
      const data = await generateReading(year, i)
      if (data && await saveReading(data, year, i)) {
        console.log('✓')
        totalGenerated++
      } else {
        console.log('✗')
      }
      await new Promise(r => setTimeout(r, 1500))
    }
  }
  
  // 2. 生成完型填空（每年1篇，近5年）
  console.log('\n📝 生成完型填空...')
  for (const year of [2020, 2021, 2022, 2023, 2024]) {
    process.stdout.write(`  ${year}年... `)
    const data = await generateCloze(year)
    if (data && await saveCloze(data, year)) {
      console.log('✓')
      totalGenerated++
    } else {
      console.log('✗')
    }
    await new Promise(r => setTimeout(r, 1500))
  }
  
  // 3. 生成七选五（每年1篇，近5年）
  console.log('\n📋 生成七选五...')
  for (const year of [2020, 2021, 2022, 2023, 2024]) {
    process.stdout.write(`  ${year}年... `)
    const data = await generateSevenFive(year)
    if (data && await saveSevenFive(data, year)) {
      console.log('✓')
      totalGenerated++
    } else {
      console.log('✗')
    }
    await new Promise(r => setTimeout(r, 1500))
  }
  
  // 统计
  const count = await prisma.article.count()
  console.log('\n' + '='.repeat(50))
  console.log(`✅ 本次生成: ${totalGenerated} 篇`)
  console.log(`📊 数据库总计: ${count} 篇文章`)
  console.log('='.repeat(50))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
