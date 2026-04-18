// 从已解析的文本导入完型填空数据
import fs from 'fs'
import prisma from '../lib/db'

// 2023年完型填空数据（从解析文件中提取）
const clozeData = {
  year: 2023,
  title: '2023年完型填空',
  content: `Caravanserais were roadside inns that were built along the Silk Road in areas including China, North Africa and the Middle East. They were typically (1) outside the walls of a city or village and were usually funded by local governments or (2).

The word "caravanserai" is a (3) of the Persian words "karvan", which means a group of travellers or a caravan, and "sardy", a palace or enclosed building. The term caravan was used to (4) groups of people who travelled together across the ancient network for safety reasons, (5) merchants, travellers or pilgrims.

From the 10th century onwards, as merchant and travel routes became more developed, the (6) of caravanserais increased and they served as a safe place for people to rest at night. Travellers on the Silk Road (7) the possibility of being attacked by thieves or being (8) to extreme weather conditions. For this reason, caravanserais were strategically placed (9) they could be reached in a day's travel time.

Caravanserais served as an informal (10) point for the various people who travelled the Silk Road. (11), these structures became important centres for cultural (12) and interaction, with travellers sharing their cultures, ideas and beliefs, (13) taking knowledge with them, greatly (14) the development of several civilisations.

Caravanserais were also an important marketplace for commodities and (15) in the trade of goods along the Silk Road. (16), it was frequently the first stop for merchants looking to sell their wares and (17) supplies for their own journeys. It is (18) that around 12,000 to 15,000 caravanserais were built along the Silk Road, (19) only about 3,000 are known to remain today, many of which are in (20).`,
  blanks: [
    { blankNum: 1, optionA: 'displayed', optionB: 'occupied', optionC: 'located', optionD: 'equipped', correctAnswer: 'C' },
    { blankNum: 2, optionA: 'privately', optionB: 'regularly', optionC: 'respectively', optionD: 'permanently', correctAnswer: 'A' },
    { blankNum: 3, optionA: 'definition', optionB: 'transition', optionC: 'substitution', optionD: 'combination', correctAnswer: 'D' },
    { blankNum: 4, optionA: 'classify', optionB: 'record', optionC: 'describe', optionD: 'connect', correctAnswer: 'C' },
    { blankNum: 5, optionA: 'apart from', optionB: 'instead of', optionC: 'such as', optionD: 'along with', correctAnswer: 'D' },
    { blankNum: 6, optionA: 'construction', optionB: 'restoration', optionC: 'impression', optionD: 'evaluation', correctAnswer: 'A' },
    { blankNum: 7, optionA: 'doubted', optionB: 'faced', optionC: 'accepted', optionD: 'reduced', correctAnswer: 'B' },
    { blankNum: 8, optionA: 'assigned', optionB: 'subjected', optionC: 'accustomed', optionD: 'opposed', correctAnswer: 'B' },
    { blankNum: 9, optionA: 'so that', optionB: 'even if', optionC: 'now that', optionD: 'in case', correctAnswer: 'A' },
    { blankNum: 10, optionA: 'talking', optionB: 'starting', optionC: 'breaking', optionD: 'meeting', correctAnswer: 'D' },
    { blankNum: 11, optionA: 'By the way', optionB: 'On occasion', optionC: 'In comparison', optionD: 'As a result', correctAnswer: 'D' },
    { blankNum: 12, optionA: 'heritage', optionB: 'revival', optionC: 'exchange', optionD: 'status', correctAnswer: 'C' },
    { blankNum: 13, optionA: 'with regard to', optionB: 'in spite of', optionC: 'as well as', optionD: 'in line with', correctAnswer: 'C' },
    { blankNum: 14, optionA: 'completing', optionB: 'influencing', optionC: 'resuming', optionD: 'pioneering', correctAnswer: 'B' },
    { blankNum: 15, optionA: 'aided', optionB: 'invested', optionC: 'failed', optionD: 'competed', correctAnswer: 'A' },
    { blankNum: 16, optionA: 'Rather', optionB: 'Indeed', optionC: 'Otherwise', optionD: 'However', correctAnswer: 'B' },
    { blankNum: 17, optionA: 'go in for', optionB: 'stand up for', optionC: 'close in on', optionD: 'stock up on', correctAnswer: 'D' },
    { blankNum: 18, optionA: 'believed', optionB: 'predicted', optionC: 'recalled', optionD: 'implied', correctAnswer: 'A' },
    { blankNum: 19, optionA: 'until', optionB: 'because', optionC: 'unless', optionD: 'although', correctAnswer: 'D' },
    { blankNum: 20, optionA: 'ruins', optionB: 'debt', optionC: 'fashion', optionD: 'series', correctAnswer: 'A' },
  ]
}

async function main() {
  console.log('导入完型填空数据...')
  
  try {
    const article = await prisma.article.create({
      data: {
        title: clozeData.title,
        content: clozeData.content,
        source: `${clozeData.year}年考研英语一真题`,
        year: clozeData.year,
        examType: 'english1',
        questionType: 'cloze',
        category: '完型填空',
        clozeBlanks: {
          create: clozeData.blanks
        }
      }
    })
    console.log(`✓ ${clozeData.title} 已保存 (${clozeData.blanks.length} 空)`)
  } catch (error) {
    console.error('保存失败:', error)
  }
  
  const count = await prisma.article.count()
  const byType = await prisma.article.groupBy({ by: ['questionType'], _count: true })
  console.log('\n数据库统计:')
  console.log(`  总计: ${count} 篇`)
  byType.forEach(t => console.log(`  ${t.questionType}: ${t._count} 篇`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
