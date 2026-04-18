// 重新解析真题数据 - 修复阅读理解和完型填空
import mammoth from 'mammoth'
import fs from 'fs'
import path from 'path'
import prisma from '../lib/db'

const DATA_DIR = 'external-data/2. 2010-2024年考研英语一真题及解析/01、真题部分/word版'

async function parseAndImport() {
  console.log('开始解析真题数据...\n')
  
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.docx')).sort()
  
  for (const file of files) {
    const yearMatch = file.match(/(\d{4})/)
    if (!yearMatch) continue
    const year = parseInt(yearMatch[1])
    
    console.log(`\n处理 ${year} 年真题...`)
    
    const filePath = path.join(DATA_DIR, file)
    const result = await mammoth.extractRawText({ path: filePath })
    const text = result.value
    
    // 解析完型填空
    await parseCloze(text, year)
    
    // 解析阅读理解
    await parseReading(text, year)
  }
  
  const count = await prisma.article.count()
  console.log(`\n完成！数据库总计: ${count} 篇文章`)
}

async function parseCloze(text: string, year: number) {
  console.log('  解析完型填空...')
  
  // 找到 Section I 和 Section II 之间的内容
  const sectionIMatch = text.match(/Section I[\s\S]*?Use of English/i)
  const sectionIIMatch = text.match(/Section II/i)
  
  if (!sectionIMatch || !sectionIIMatch) {
    console.log('    未找到完型填空部分')
    return
  }
  
  const clozeStart = sectionIMatch.index!
  const clozeEnd = sectionIIMatch.index!
  const clozeText = text.slice(clozeStart, clozeEnd)
  
  // 找到选项开始的位置（第一个 "1. [A]"）
  const optionsMatch = clozeText.match(/1\.\s*\[A\]/)
  if (!optionsMatch) {
    console.log('    未找到选项')
    return
  }
  
  const contentEnd = optionsMatch.index!
  const content = clozeText.slice(0, contentEnd)
    .replace(/Section I[\s\S]*?Use of English/i, '')
    .replace(/Directions:[\s\S]*?points\)/i, '')
    .trim()
  
  // 解析选项
  const blanks: any[] = []
  for (let i = 1; i <= 20; i++) {
    // 匹配格式: "1. [A] xxx [B] xxx [C] xxx [D] xxx"
    const optPattern = new RegExp(
      `${i}\\.\\s*\\[A\\]\\s*([^\\[]+)\\s*\\[B\\]\\s*([^\\[]+)\\s*\\[C\\]\\s*([^\\[]+)\\s*\\[D\\]\\s*([^\\n]+)`,
      'i'
    )
    const match = clozeText.match(optPattern)
    if (match) {
      blanks.push({
        blankNum: i,
        optionA: match[1].trim(),
        optionB: match[2].trim(),
        optionC: match[3].trim(),
        optionD: match[4].trim(),
        correctAnswer: 'A' // 需要从答案文件获取
      })
    }
  }
  
  if (blanks.length < 10) {
    console.log(`    只找到 ${blanks.length} 个选项，跳过`)
    return
  }
  
  // 保存到数据库
  try {
    await prisma.article.create({
      data: {
        title: `${year}年完型填空`,
        content,
        source: `${year}年考研英语一真题`,
        year,
        examType: 'english1',
        questionType: 'cloze',
        category: '完型填空',
        clozeBlanks: {
          create: blanks
        }
      }
    })
    console.log(`    ✓ 完型填空已保存 (${blanks.length} 空)`)
  } catch (error) {
    console.log('    保存失败:', error)
  }
}

async function parseReading(text: string, year: number) {
  console.log('  解析阅读理解...')
  
  // 找到 Part A 部分
  const partAMatch = text.match(/Part A/i)
  const partBMatch = text.match(/Part B/i)
  
  if (!partAMatch) {
    console.log('    未找到 Part A')
    return
  }
  
  const partAStart = partAMatch.index!
  const partAEnd = partBMatch?.index || text.indexOf('Part C', partAStart)
  const partAText = partAEnd > partAStart ? text.slice(partAStart, partAEnd) : text.slice(partAStart)
  
  // 分割成 Text 1, Text 2, Text 3, Text 4
  const textPattern = /Text (\d)/gi
  const textMatches: { num: number; index: number }[] = []
  let match
  
  while ((match = textPattern.exec(partAText)) !== null) {
    textMatches.push({ num: parseInt(match[1]), index: match.index })
  }
  
  if (textMatches.length < 4) {
    console.log(`    只找到 ${textMatches.length} 篇文章`)
    return
  }
  
  // 处理每篇文章
  for (let i = 0; i < textMatches.length; i++) {
    const textNum = textMatches[i].num
    const startIndex = textMatches[i].index
    const endIndex = i < textMatches.length - 1 ? textMatches[i + 1].index : partAText.length
    const articleText = partAText.slice(startIndex, endIndex)
    
    // 找到第一个问题（通常是21, 26, 31, 36）
    const firstQMatch = articleText.match(/(\d{2})\.\s*[^\[]+\[A\]/)
    if (!firstQMatch) continue
    
    const firstQNum = parseInt(firstQMatch[1])
    const contentEnd = articleText.indexOf(firstQMatch[0])
    const content = articleText.slice(0, contentEnd)
      .replace(/Text \d/i, '')
      .replace(/Directions:[\s\S]*?points\)/i, '')
      .trim()
    
    // 解析问题
    const questions: any[] = []
    const qPattern = /(\d{2})\.\s*([^\[]+)\[A\]\s*([^\[]+)\[B\]\s*([^\[]+)\[C\]\s*([^\[]+)\[D\]\s*([^\n]+)/g
    
    while ((match = qPattern.exec(articleText)) !== null) {
      const qNum = parseInt(match[1])
      if (qNum >= 21 && qNum <= 40) {
        questions.push({
          questionNum: qNum,
          stem: match[2].trim(),
          options: {
            A: match[3].trim(),
            B: match[4].trim(),
            C: match[5].trim(),
            D: match[6].trim()
          },
          correctAnswer: 'A'
        })
      }
    }
    
    if (questions.length < 4) continue
    
    // 保存到数据库
    try {
      await prisma.article.create({
        data: {
          title: `${year}年阅读理解 Text ${textNum}`,
          content,
          source: `${year}年考研英语一真题`,
          year,
          examType: 'english1',
          questionType: 'reading',
          category: '阅读理解',
          questions: {
            create: questions.map(q => ({
              questionNum: q.questionNum,
              stem: q.stem,
              correctAnswer: q.correctAnswer,
              options: {
                create: [
                  { optionKey: 'A', content: q.options.A },
                  { optionKey: 'B', content: q.options.B },
                  { optionKey: 'C', content: q.options.C },
                  { optionKey: 'D', content: q.options.D }
                ]
              }
            }))
          }
        }
      })
      console.log(`    ✓ Text ${textNum} 已保存 (${questions.length} 题)`)
    } catch (error) {
      console.log(`    Text ${textNum} 保存失败`)
    }
  }
}

parseAndImport()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
