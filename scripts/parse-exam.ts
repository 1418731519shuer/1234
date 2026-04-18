// 解析考研英语真题docx文件
import mammoth from 'mammoth'
import fs from 'fs'
import path from 'path'
import prisma from '../lib/db'

const DATA_DIR = 'external-data/2. 2010-2024年考研英语一真题及解析/01、真题部分/word版'

interface ParsedExam {
  year: number
  examType: string
  sections: {
    cloze?: {
      title: string
      content: string
      blanks: Array<{
        num: number
        options: { A: string; B: string; C: string; D: string }
        answer: string
      }>
    }
    readings?: Array<{
      title: string
      content: string
      questions: Array<{
        num: number
        stem: string
        options: { A: string; B: string; C: string; D: string }
        answer: string
      }>
    }>
    sevenFive?: {
      title: string
      content: string
      gaps: Array<{
        num: number
        answer: string
      }>
      options: { [key: string]: string }
    }
    translation?: {
      title: string
      content: string
      sentences: Array<{
        num: number
        english: string
      }>
    }
    writing?: {
      partA: {
        instructions: string
        wordCount: number
      }
      partB: {
        instructions: string
        wordCount: string
      }
    }
  }
}

// 解析单个docx文件
async function parseExamFile(filePath: string): Promise<ParsedExam | null> {
  const result = await mammoth.extractRawText({ path: filePath })
  const text = result.value
  
  // 提取年份
  const yearMatch = text.match(/(\d{4})年/)
  if (!yearMatch) return null
  const year = parseInt(yearMatch[1])
  
  console.log(`\n解析 ${year} 年真题...`)
  
  const exam: ParsedExam = {
    year,
    examType: 'english1',
    sections: {}
  }
  
  // 解析完型填空 (Section I Use of English)
  const clozeMatch = text.match(/Section I[\s\S]*?Use of English[\s\S]*?(?=Section II|Part A|1\.\s*\[A\])/i)
  if (clozeMatch) {
    exam.sections.cloze = parseCloze(text, year)
  }
  
  // 解析阅读理解 (Section II Part A)
  exam.sections.readings = parseReadings(text)
  
  // 解析七选五 (Part B)
  exam.sections.sevenFive = parseSevenFive(text)
  
  // 解析翻译 (Part C)
  exam.sections.translation = parseTranslation(text)
  
  // 解析写作 (Section III)
  exam.sections.writing = parseWriting(text)
  
  return exam
}

// 解析完型填空
function parseCloze(text: string, year: number): ParsedExam['sections']['cloze'] {
  console.log('  解析完型填空...')
  
  // 找到完型填空部分
  const clozeStart = text.indexOf('Section I')
  const clozeEnd = text.indexOf('Section II')
  if (clozeStart === -1 || clozeEnd === -1) return undefined
  
  const clozeText = text.slice(clozeStart, clozeEnd)
  
  // 提取文章内容（在选项之前）
  const optionsStart = clozeText.match(/1\.\s*\[A\]/)
  if (!optionsStart) return undefined
  
  const content = clozeText.slice(0, clozeText.indexOf('1. [A]')).trim()
  
  // 提取选项
  const blanks: any[] = []
  for (let i = 1; i <= 20; i++) {
    const pattern = new RegExp(
      `${i}\\.\\s*\\[A\\]\\s*([^\\[]+)\\s*\\[B\\]\\s*([^\\[]+)\\s*\\[C\\]\\s*([^\\[]+)\\s*\\[D\\]\\s*([^\\n]+)`,
      'i'
    )
    const match = clozeText.match(pattern)
    if (match) {
      blanks.push({
        num: i,
        options: {
          A: match[1].trim(),
          B: match[2].trim(),
          C: match[3].trim(),
          D: match[4].trim()
        },
        answer: 'A' // 需要从答案文件获取
      })
    }
  }
  
  console.log(`    找到 ${blanks.length} 个空`)
  
  return {
    title: `${year}年完型填空`,
    content,
    blanks
  }
}

// 解析阅读理解
function parseReadings(text: string): ParsedExam['sections']['readings'] {
  console.log('  解析阅读理解...')
  
  const readings: any[] = []
  
  // 找到 Part A 部分
  const partAStart = text.indexOf('Part A')
  const partBStart = text.indexOf('Part B')
  if (partAStart === -1) return readings
  
  const partAText = partBStart > 0 ? text.slice(partAStart, partBStart) : text.slice(partAStart)
  
  // 分割成四篇文章
  const textMatches = partAText.split(/Text (\d)/i)
  
  for (let i = 1; i < textMatches.length; i += 2) {
    const textNum = parseInt(textMatches[i])
    const textContent = textMatches[i + 1]
    
    if (!textContent) continue
    
    // 提取文章内容（在第一个问题之前）
    const firstQuestion = textContent.match(/(\d+)\.\s*\[A\]/)
    if (!firstQuestion) continue
    
    const articleEnd = textContent.indexOf(firstQuestion[0])
    const content = textContent.slice(0, articleEnd).trim()
    
    // 提取问题
    const questions: any[] = []
    const questionPattern = /(\d+)\.\s*([^\[]+)\[A\]\s*([^\[]+)\[B\]\s*([^\[]+)\[C\]\s*([^\[]+)\[D\]\s*([^\n]+)/g
    let match
    
    while ((match = questionPattern.exec(textContent)) !== null) {
      const qNum = parseInt(match[1])
      if (qNum >= 21 && qNum <= 40) { // 阅读理解题目编号是21-40
        questions.push({
          num: qNum,
          stem: match[2].trim(),
          options: {
            A: match[3].trim(),
            B: match[4].trim(),
            C: match[5].trim(),
            D: match[6].trim()
          },
          answer: 'A'
        })
      }
    }
    
    if (questions.length > 0) {
      readings.push({
        title: `Text ${textNum}`,
        content,
        questions
      })
      console.log(`    Text ${textNum}: ${questions.length} 题`)
    }
  }
  
  return readings
}

// 解析七选五
function parseSevenFive(text: string): ParsedExam['sections']['sevenFive'] {
  console.log('  解析七选五...')
  
  const partBStart = text.indexOf('Part B')
  const partCStart = text.indexOf('Part C')
  if (partBStart === -1) return undefined
  
  const partBText = partCStart > 0 ? text.slice(partBStart, partCStart) : text.slice(partBStart)
  
  // 提取选项段落 A-H
  const options: { [key: string]: string } = {}
  const optionPattern = /\[([A-H])\]\s*([^[]+?)(?=\[|$)/g
  let match
  
  while ((match = optionPattern.exec(partBText)) !== null) {
    options[match[1]] = match[2].trim()
  }
  
  console.log(`    找到 ${Object.keys(options).length} 个选项`)
  
  // 提取空位（41-45）
  const gaps: any[] = []
  for (let i = 41; i <= 45; i++) {
    gaps.push({ num: i, answer: 'A' })
  }
  
  return {
    title: '七选五',
    content: partBText,
    gaps,
    options
  }
}

// 解析翻译
function parseTranslation(text: string): ParsedExam['sections']['translation'] {
  console.log('  解析翻译...')
  
  const partCStart = text.indexOf('Part C')
  const sectionIIIStart = text.indexOf('Section III')
  if (partCStart === -1) return undefined
  
  const partCText = sectionIIIStart > 0 ? text.slice(partCStart, sectionIIIStart) : text.slice(partCStart)
  
  // 提取翻译句子 (46-50)
  const sentences: any[] = []
  const sentencePattern = /\((\d+)\)\s*([^()]+?)(?=\(|$)/g
  let match
  
  while ((match = sentencePattern.exec(partCText)) !== null) {
    const num = parseInt(match[1])
    if (num >= 46 && num <= 50) {
      sentences.push({
        num,
        english: match[2].trim()
      })
    }
  }
  
  console.log(`    找到 ${sentences.length} 个翻译句子`)
  
  return {
    title: '翻译',
    content: partCText,
    sentences
  }
}

// 解析写作
function parseWriting(text: string): ParsedExam['sections']['writing'] {
  console.log('  解析写作...')
  
  const sectionIIIStart = text.indexOf('Section III')
  if (sectionIIIStart === -1) return undefined
  
  const writingText = text.slice(sectionIIIStart)
  
  // Part A - 小作文
  const partAMatch = writingText.match(/Part A[\s\S]*?(\d+)\.\s*Directions:[\s\S]*?Write[^.]*\.([^\.]+\.)/i)
  
  // Part B - 大作文
  const partBMatch = writingText.match(/Part B[\s\S]*?(\d+)\.\s*Directions:([\s\S]*?)(?=Do not use|$)/i)
  
  return {
    partA: {
      instructions: partAMatch ? partAMatch[2] : 'Write a notice/letter...',
      wordCount: 100
    },
    partB: {
      instructions: partBMatch ? partBMatch[2] : 'Write an essay...',
      wordCount: '160-200'
    }
  }
}

// 保存到数据库
async function saveToDatabase(exam: ParsedExam) {
  console.log(`\n保存 ${exam.year} 年真题到数据库...`)
  
  // 保存完型填空
  if (exam.sections.cloze) {
    const cloze = exam.sections.cloze
    const article = await prisma.article.create({
      data: {
        title: cloze.title,
        content: cloze.content,
        source: `${exam.year}年考研英语${exam.examType === 'english1' ? '一' : '二'}真题`,
        year: exam.year,
        examType: exam.examType,
        questionType: 'cloze',
        category: '完型填空',
        clozeBlanks: {
          create: cloze.blanks.map(b => ({
            blankNum: b.num,
            correctAnswer: b.answer,
            optionA: b.options.A,
            optionB: b.options.B,
            optionC: b.options.C,
            optionD: b.options.D
          }))
        }
      }
    })
    console.log(`  ✓ 完型填空已保存`)
  }
  
  // 保存阅读理解
  if (exam.sections.readings) {
    for (const reading of exam.sections.readings) {
      const article = await prisma.article.create({
        data: {
          title: `${exam.year}年阅读理解 ${reading.title}`,
          content: reading.content,
          source: `${exam.year}年考研英语${exam.examType === 'english1' ? '一' : '二'}真题`,
          year: exam.year,
          examType: exam.examType,
          questionType: 'reading',
          category: '阅读理解',
          questions: {
            create: reading.questions.map(q => ({
              questionNum: q.num,
              stem: q.stem,
              correctAnswer: q.answer,
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
    }
    console.log(`  ✓ ${exam.sections.readings.length} 篇阅读理解已保存`)
  }
  
  // 保存七选五
  if (exam.sections.sevenFive) {
    const sf = exam.sections.sevenFive
    const article = await prisma.article.create({
      data: {
        title: `${exam.year}年七选五`,
        content: sf.content,
        source: `${exam.year}年考研英语${exam.examType === 'english1' ? '一' : '二'}真题`,
        year: exam.year,
        examType: exam.examType,
        questionType: 'sevenFive',
        category: '七选五',
        sevenFiveOpts: {
          create: Object.entries(sf.options).map(([key, content]) => ({
            optionKey: key,
            content: content
          }))
        },
        questions: {
          create: sf.gaps.map(g => ({
            questionNum: g.num,
            stem: `第${g.num - 40}处应填入哪个段落？`,
            correctAnswer: g.answer
          }))
        }
      }
    })
    console.log(`  ✓ 七选五已保存`)
  }
  
  // 保存翻译
  if (exam.sections.translation && exam.sections.translation.sentences.length > 0) {
    const trans = exam.sections.translation
    const article = await prisma.article.create({
      data: {
        title: `${exam.year}年翻译`,
        content: trans.content,
        source: `${exam.year}年考研英语${exam.examType === 'english1' ? '一' : '二'}真题`,
        year: exam.year,
        examType: exam.examType,
        questionType: 'translation',
        category: '翻译',
        questions: {
          create: trans.sentences.map(s => ({
            questionNum: s.num,
            stem: s.english,
            correctAnswer: '' // 翻译没有固定答案
          }))
        }
      }
    })
    console.log(`  ✓ 翻译已保存`)
  }
  
  // 保存写作
  if (exam.sections.writing) {
    const writing = exam.sections.writing
    
    // 小作文
    await prisma.article.create({
      data: {
        title: `${exam.year}年小作文`,
        content: writing.partA.instructions,
        source: `${exam.year}年考研英语${exam.examType === 'english1' ? '一' : '二'}真题`,
        year: exam.year,
        examType: exam.examType,
        questionType: 'writing',
        category: '小作文',
        writingTask: {
          create: {
            taskType: 'small',
            instructions: writing.partA.instructions,
            wordCount: writing.partA.wordCount
          }
        }
      }
    })
    
    // 大作文
    await prisma.article.create({
      data: {
        title: `${exam.year}年大作文`,
        content: writing.partB.instructions,
        source: `${exam.year}年考研英语${exam.examType === 'english1' ? '一' : '二'}真题`,
        year: exam.year,
        examType: exam.examType,
        questionType: 'writing',
        category: '大作文',
        writingTask: {
          create: {
            taskType: 'large',
            instructions: writing.partB.instructions,
            wordCount: parseInt(writing.partB.wordCount) || 160
          }
        }
      }
    })
    console.log(`  ✓ 写作已保存`)
  }
}

// 主函数
async function main() {
  console.log('='.repeat(50))
  console.log('考研英语真题解析导入')
  console.log('='.repeat(50))
  
  // 获取所有docx文件
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.docx'))
    .sort()
  
  console.log(`\n找到 ${files.length} 个真题文件`)
  
  for (const file of files) {
    const filePath = path.join(DATA_DIR, file)
    try {
      const exam = await parseExamFile(filePath)
      if (exam) {
        await saveToDatabase(exam)
      }
    } catch (error) {
      console.error(`解析 ${file} 失败:`, error)
    }
  }
  
  // 统计
  const count = await prisma.article.count()
  console.log('\n' + '='.repeat(50))
  console.log(`✅ 导入完成！数据库总计: ${count} 篇文章`)
  console.log('='.repeat(50))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
