// 快速生成完型填空和七选五
import prisma from '../lib/db'

const DEEPSEEK_API_KEY = 'sk-864e66eafdc648a6ba27607b1518f9bc'

async function callAI(prompt: string): Promise<string> {
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
  if (!response.ok) return ''
  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

async function generateCloze(year: number) {
  const topics = ['经济与管理', '科技与创新', '社会与文化', '教育与发展', '环境与生态']
  const topic = topics[Math.floor(Math.random() * topics.length)]
  
  const prompt = `生成${year}年考研英语一完型填空。话题：${topic}，280-300词，20个空。
返回JSON格式：
{"title":"英文标题","content":"文章用[BLANK_1]到[BLANK_20]标记空位","blanks":[{"position":1,"options":["A内容","B内容","C内容","D内容"],"correctAnswer":"A"}]}`

  const result = await callAI(prompt)
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null
  } catch { return null }
}

async function generateSevenFive(year: number) {
  const topics = ['经济与管理', '科技与创新', '社会与文化', '教育与发展', '环境与生态']
  const topic = topics[Math.floor(Math.random() * topics.length)]
  
  const prompt = `生成${year}年考研英语一七选五。话题：${topic}，500-550词，5个挖空。
返回JSON格式：
{"title":"英文标题","content":"文章用[GAP_1]到[GAP_5]标记空位","gaps":[{"position":1,"correctOption":"A","options":{"A":"段落A","B":"段落B","C":"段落C","D":"段落D","E":"段落E","F":"段落F","G":"段落G"}}]}`

  const result = await callAI(prompt)
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null
  } catch { return null }
}

async function saveCloze(data: any, year: number) {
  if (!data?.content) return false
  let content = data.content
  const blanks = data.blanks || []
  
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
      category: '完型填空',
      difficulty: 3,
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
}

async function saveSevenFive(data: any, year: number) {
  if (!data?.content) return false
  let content = data.content
  const gaps = data.gaps || []
  
  gaps.forEach((gap: any) => {
    content = content.replace(`[GAP_${gap.position}]`, '\n[此处填入段落]\n')
  })
  
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
      category: '七选五',
      difficulty: 3,
      questions: {
        create: gaps.map((gap: any, i: number) => ({
          questionNum: gap.position || i + 1,
          stem: `第${gap.position}处应填入哪个段落？`,
          correctAnswer: gap.correctOption || 'A',
          analysis: '',
          options: {
            create: Object.entries(gap.options || {}).map(([key, value]: [string, any]) => ({
              optionKey: key,
              content: String(value).slice(0, 100) + '...',
            })),
          },
        })),
      },
    },
  })
  return true
}

async function main() {
  console.log('开始生成完型填空和七选五...\n')
  
  // 完型填空
  console.log('📝 完型填空:')
  for (const year of [2020, 2021, 2022, 2023, 2024]) {
    process.stdout.write(`  ${year}年... `)
    const data = await generateCloze(year)
    if (data && await saveCloze(data, year)) {
      console.log('✓')
    } else {
      console.log('✗')
    }
    await new Promise(r => setTimeout(r, 1000))
  }
  
  // 七选五
  console.log('\n📋 七选五:')
  for (const year of [2020, 2021, 2022, 2023, 2024]) {
    process.stdout.write(`  ${year}年... `)
    const data = await generateSevenFive(year)
    if (data && await saveSevenFive(data, year)) {
      console.log('✓')
    } else {
      console.log('✗')
    }
    await new Promise(r => setTimeout(r, 1000))
  }
  
  const count = await prisma.article.count()
  console.log(`\n✅ 完成！数据库总计: ${count} 篇文章`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
