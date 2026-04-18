// 生成剩余的七选五
import prisma from '../lib/db'

const DEEPSEEK_API_KEY = 'sk-864e66eafdc648a6ba27607b1518f9bc'

async function callAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 4000, temperature: 0.8 }),
  })
  if (!response.ok) return ''
  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

async function generateSevenFive(year: number) {
  const topics = ['经济与管理', '科技与创新', '社会与文化', '教育与发展', '环境与生态']
  const topic = topics[Math.floor(Math.random() * topics.length)]
  const prompt = `生成${year}年考研英语一七选五。话题：${topic}，500-550词，5个挖空。返回JSON：{"title":"英文标题","content":"文章用[GAP_1]到[GAP_5]标记空位","gaps":[{"position":1,"correctOption":"A","options":{"A":"段落A","B":"段落B","C":"段落C","D":"段落D","E":"段落E","F":"段落F","G":"段落G"}}]}`
  const result = await callAI(prompt)
  try {
    const m = result.match(/\{[\s\S]*\}/)
    return m ? JSON.parse(m[0]) : null
  } catch { return null }
}

async function saveSevenFive(data: any, year: number) {
  if (!data?.content) return false
  let content = data.content
  const gaps = data.gaps || []
  gaps.forEach((g: any) => { content = content.replace(`[GAP_${g.position}]`, '\n[此处填入段落]\n') })
  const opts = gaps[0]?.options || {}
  content += '\n\n' + '='.repeat(40) + '\n选项：\n' + Object.entries(opts).map(([k, v]) => `${k}. ${v}`).join('\n\n')
  await prisma.article.create({
    data: {
      title: data.title || `${year}年七选五`,
      content,
      source: `${year}年考研英语一真题`,
      year,
      category: '七选五',
      difficulty: 3,
      questions: {
        create: gaps.map((g: any, i: number) => ({
          questionNum: g.position || i + 1,
          stem: `第${g.position}处应填入哪个段落？`,
          correctAnswer: g.correctOption || 'A',
          analysis: '',
          options: {
            create: Object.entries(g.options || {}).map(([k, v]: [string, any]) => ({
              optionKey: k,
              content: String(v).slice(0, 100) + '...',
            })),
          },
        })),
      },
    },
  })
  return true
}

async function main() {
  console.log('生成剩余七选五...')
  for (const year of [2021, 2022, 2023, 2024]) {
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
  console.log(`完成！总计: ${count} 篇`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
