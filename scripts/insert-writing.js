// 插入作文题目到数据库
const { PrismaClient } = require('@prisma/client')
const { PrismaLibSql } = require('@prisma/adapter-libsql')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db')
const adapter = new PrismaLibSql({
  url: `file:${dbPath}`,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  // 检查是否已存在
  const existing = await prisma.article.findFirst({
    where: { title: "2024年考研英语一作文" }
  })
  
  if (existing) {
    console.log('Article already exists:', existing.id)
    return
  }
  
  const article = await prisma.article.create({
    data: {
      title: "2024年考研英语一作文",
      content: `2024年考研英语一作文题目

【小作文】
A Letter of Invitation

Suppose your university is going to host an international cultural festival. Write a letter to a foreign expert in your field, inviting him/her to give a short speech at the opening ceremony.

【大作文】
Reflection in the Digital Mirror

Write an essay of 160-200 words based on the following drawing. The drawing shows a person looking at a smartphone screen, which acts as a 'digital mirror' displaying a curated social media profile.`,
      source: "AI Generated",
      year: 2024,
      category: "写作",
      difficulty: 3,
      questionType: "writing",
      examType: "english1",
      questions: {
        create: [
          { 
            questionNum: 1, 
            stem: "A Letter of Invitation", 
            correctAnswer: `Dear Professor Smith,

I am writing on behalf of our university to cordially invite you to deliver a brief speech at the opening ceremony of our International Cultural Festival on October 20, 2024.

Given your distinguished expertise in cross-cultural communication and your popularity among our students, we believe your insights would greatly enrich this event. The ceremony will commence at 9:00 AM in the University Auditorium. Your speech is scheduled for approximately 10 minutes.

We sincerely hope you can honor us with your presence and share your valuable perspective.

Yours sincerely,
Li Ming`,
            analysis: `题目要求：
1) introduce the event briefly
2) explain why you are inviting him/her
3) provide details about the time and venue

字数要求：约100词`, 
            options: { 
              create: [
                { optionKey: "A", content: "Write about 100 words" },
                { optionKey: "B", content: "Do not use your own name at the end of the letter. Use 'Li Ming' instead" },
                { optionKey: "C", content: "Do not write your address" },
              ] 
            } 
          },
          { 
            questionNum: 2, 
            stem: "Reflection in the Digital Mirror", 
            correctAnswer: `The thought-provoking drawing presents a stark contrast. On the left, an individual sees their true self in a physical mirror. On the right, gazing at a smartphone, they perceive a meticulously crafted digital persona—glamorous photos and social validation—which acts as a distorted mirror.

This illustration poignantly critiques the modern phenomenon of seeking identity and self-worth through the lens of social media. The digital mirror reflects not who we are, but who we wish to project, often leading to a disconnect between our real and online selves. The anxious expression hints at the pressure and insecurity this curated existence can foster.

In my view, while digital platforms offer connection, over-reliance on them for self-definition is perilous. True self-awareness and confidence stem from offline experiences, genuine relationships, and personal growth, not from the ephemeral applause of a virtual audience. We must learn to look beyond the digital mirror to appreciate our authentic, imperfect, and real selves.`,
            analysis: `图画描述：一个人看着智能手机屏幕，屏幕像一个"数字镜子"，展示精心策划的社交媒体形象。

写作要求：
1) describe the drawing briefly
2) interpret its intended meaning
3) give your comments

字数要求：160-200词`, 
            options: { 
              create: [
                { optionKey: "A", content: "Write 160-200 words" },
                { optionKey: "B", content: "Your essay must be written clearly on the ANSWER SHEET" },
                { optionKey: "C", content: "Support your argument with reasons and examples" },
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
