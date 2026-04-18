// 插入七选五文章到数据库
const { PrismaClient } = require('@prisma/client')
const { PrismaLibSql } = require('@prisma/adapter-libsql')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db')
const adapter = new PrismaLibSql({
  url: `file:${dbPath}`,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  // 先检查是否已存在
  const existing = await prisma.article.findFirst({
    where: { title: "The Paradox of Choice - Seven Five" }
  })
  
  if (existing) {
    console.log('Article already exists:', existing.id)
    return
  }
  
  const article = await prisma.article.create({
    data: {
      title: "The Paradox of Choice - Seven Five",
      content: `In an era where information is abundant and accessible at our fingertips, one might assume that making decisions has become easier than ever. However, a growing body of psychological research suggests the opposite is true. The digital age, with its endless streams of data, recommendations, and options, has ushered in a new kind of anxiety: the paradox of choice. This phenomenon, first popularized by psychologist Barry Schwartz, posits that while some choice is good, an overabundance can lead to decision paralysis, dissatisfaction, and regret. [41] This is not merely a personal inconvenience; it has profound implications for education, consumer behavior, and mental well-being in contemporary society.

Consider the realm of online education. Platforms offer thousands of courses on every conceivable topic, from advanced quantum physics to beginner's knitting. While this democratizes knowledge, it also places a heavy burden on the learner to curate their own path. [42] Consequently, many learners spend more time browsing and planning than actually engaging with the material, a behavior often termed as 'planning fallacy.' The initial excitement of limitless possibility can quickly sour into overwhelm.

The impact extends into the professional sphere. Job seekers now face a global marketplace through LinkedIn and other portals, sifting through an unprecedented number of opportunities. [43] This constant comparison to idealized alternatives can foster a 'grass is greener' mentality, reducing job satisfaction and increasing turnover rates. The cognitive load of evaluating countless profiles, company reviews, and role descriptions is immense.

Social media platforms are perhaps the most potent engines of this paradox. They present a curated highlight reel of others' lives, careers, and achievements, against which we measure our own choices. [44] The fear of missing out (FOMO) is a direct symptom of this condition, driving compulsive checking and a nagging sense that a better experience is always happening elsewhere. This environment makes it difficult to feel content with one's own selected path.

So, how can we navigate this sea of options without drowning? Experts suggest several strategies. First, learning to satisfice—a term coined by Herbert Simon meaning to accept a 'good enough' option rather than seeking the elusive 'best.' Second, consciously limiting one's information intake before a decision. [45] Ultimately, the goal is not to eliminate choice, but to develop the metacognitive skills to manage it effectively. By understanding the psychological traps of excessive choice, individuals and institutions can design systems—from educational curricula to app interfaces—that empower rather than overwhelm, turning the paradox of choice from a source of stress into an opportunity for mindful engagement.`,
      source: "AI Generated",
      year: 2024,
      category: "社会心理",
      difficulty: 3,
      questionType: "sevenFive",
      examType: "english1",
      questions: {
        create: [
          { 
            questionNum: 41, 
            stem: "第41空", 
            correctAnswer: "A", 
            analysis: "前文提到选择过多会导致决策瘫痪、不满和后悔，此处应填入对此现象的进一步解释",
            options: { 
              create: [
                { optionKey: "A", content: "When faced with too many alternatives, individuals often experience increased anxiety, fear of making the wrong choice, and ultimately, less happiness with the selection they do make, even if it is objectively good." },
                { optionKey: "B", content: "This relentless exposure to alternative realities can undermine commitment to our own decisions, as we are perpetually aware of the paths not taken." },
                { optionKey: "C", content: "Without a guided curriculum, students may jump from one enticing course to another, never achieving depth in any single area." },
                { optionKey: "D", content: "For instance, some companies have started offering 'curated choice' models, where experts pre-select a smaller set of high-quality options for consumers." },
                { optionKey: "E", content: "Similarly, the modern employee, armed with data on salaries and benefits across industries, may second-guess their career trajectory more than previous generations ever did." },
                { optionKey: "F", content: "Studies show that people who adopt a 'maximizing' strategy, seeking the absolute best, report higher levels of depression and perfectionism than 'satisficers.'" },
                { optionKey: "G", content: "Finally, reflecting on and appreciating the choices already made can cultivate gratitude and reduce post-decision regret, fostering a greater sense of contentment." }
              ] 
            } 
          },
          { 
            questionNum: 42, 
            stem: "第42空", 
            correctAnswer: "C", 
            analysis: "前文提到在线教育平台提供海量课程，学习者需要自己规划学习路径，此处应填入缺乏指导的后果",
            options: { 
              create: [
                { optionKey: "A", content: "When faced with too many alternatives, individuals often experience increased anxiety, fear of making the wrong choice, and ultimately, less happiness with the selection they do make, even if it is objectively good." },
                { optionKey: "B", content: "This relentless exposure to alternative realities can undermine commitment to our own decisions, as we are perpetually aware of the paths not taken." },
                { optionKey: "C", content: "Without a guided curriculum, students may jump from one enticing course to another, never achieving depth in any single area." },
                { optionKey: "D", content: "For instance, some companies have started offering 'curated choice' models, where experts pre-select a smaller set of high-quality options for consumers." },
                { optionKey: "E", content: "Similarly, the modern employee, armed with data on salaries and benefits across industries, may second-guess their career trajectory more than previous generations ever did." },
                { optionKey: "F", content: "Studies show that people who adopt a 'maximizing' strategy, seeking the absolute best, report higher levels of depression and perfectionism than 'satisficers.'" },
                { optionKey: "G", content: "Finally, reflecting on and appreciating the choices already made can cultivate gratitude and reduce post-decision regret, fostering a greater sense of contentment." }
              ] 
            } 
          },
          { 
            questionNum: 43, 
            stem: "第43空", 
            correctAnswer: "E", 
            analysis: "前文提到求职者面临全球市场，此处应填入现代员工面对更多信息时的心理状态",
            options: { 
              create: [
                { optionKey: "A", content: "When faced with too many alternatives, individuals often experience increased anxiety, fear of making the wrong choice, and ultimately, less happiness with the selection they do make, even if it is objectively good." },
                { optionKey: "B", content: "This relentless exposure to alternative realities can undermine commitment to our own decisions, as we are perpetually aware of the paths not taken." },
                { optionKey: "C", content: "Without a guided curriculum, students may jump from one enticing course to another, never achieving depth in any single area." },
                { optionKey: "D", content: "For instance, some companies have started offering 'curated choice' models, where experts pre-select a smaller set of high-quality options for consumers." },
                { optionKey: "E", content: "Similarly, the modern employee, armed with data on salaries and benefits across industries, may second-guess their career trajectory more than previous generations ever did." },
                { optionKey: "F", content: "Studies show that people who adopt a 'maximizing' strategy, seeking the absolute best, report higher levels of depression and perfectionism than 'satisficers.'" },
                { optionKey: "G", content: "Finally, reflecting on and appreciating the choices already made can cultivate gratitude and reduce post-decision regret, fostering a greater sense of contentment." }
              ] 
            } 
          },
          { 
            questionNum: 44, 
            stem: "第44空", 
            correctAnswer: "B", 
            analysis: "前文提到社交媒体展示他人生活的精选片段，此处应填入这种持续曝光对我们决策的影响",
            options: { 
              create: [
                { optionKey: "A", content: "When faced with too many alternatives, individuals often experience increased anxiety, fear of making the wrong choice, and ultimately, less happiness with the selection they do make, even if it is objectively good." },
                { optionKey: "B", content: "This relentless exposure to alternative realities can undermine commitment to our own decisions, as we are perpetually aware of the paths not taken." },
                { optionKey: "C", content: "Without a guided curriculum, students may jump from one enticing course to another, never achieving depth in any single area." },
                { optionKey: "D", content: "For instance, some companies have started offering 'curated choice' models, where experts pre-select a smaller set of high-quality options for consumers." },
                { optionKey: "E", content: "Similarly, the modern employee, armed with data on salaries and benefits across industries, may second-guess their career trajectory more than previous generations ever did." },
                { optionKey: "F", content: "Studies show that people who adopt a 'maximizing' strategy, seeking the absolute best, report higher levels of depression and perfectionism than 'satisficers.'" },
                { optionKey: "G", content: "Finally, reflecting on and appreciating the choices already made can cultivate gratitude and reduce post-decision regret, fostering a greater sense of contentment." }
              ] 
            } 
          },
          { 
            questionNum: 45, 
            stem: "第45空", 
            correctAnswer: "G", 
            analysis: "前文提到专家建议的策略，此处应填入最后一个建议",
            options: { 
              create: [
                { optionKey: "A", content: "When faced with too many alternatives, individuals often experience increased anxiety, fear of making the wrong choice, and ultimately, less happiness with the selection they do make, even if it is objectively good." },
                { optionKey: "B", content: "This relentless exposure to alternative realities can undermine commitment to our own decisions, as we are perpetually aware of the paths not taken." },
                { optionKey: "C", content: "Without a guided curriculum, students may jump from one enticing course to another, never achieving depth in any single area." },
                { optionKey: "D", content: "For instance, some companies have started offering 'curated choice' models, where experts pre-select a smaller set of high-quality options for consumers." },
                { optionKey: "E", content: "Similarly, the modern employee, armed with data on salaries and benefits across industries, may second-guess their career trajectory more than previous generations ever did." },
                { optionKey: "F", content: "Studies show that people who adopt a 'maximizing' strategy, seeking the absolute best, report higher levels of depression and perfectionism than 'satisficers.'" },
                { optionKey: "G", content: "Finally, reflecting on and appreciating the choices already made can cultivate gratitude and reduce post-decision regret, fostering a greater sense of contentment." }
              ] 
            } 
          },
        ]
      }
    }
  })
  
  console.log('Created article:', article.id)
}

main().catch(console.error).finally(() => prisma.$disconnect())
