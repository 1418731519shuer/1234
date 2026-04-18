// 示例数据 - 用于测试
// 运行方式: npx ts-node scripts/seed.ts

import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({
  url: 'file:./prisma/dev.db',
})

const prisma = new PrismaClient({ adapter })

async function main() {
  // 创建示例文章
  const article = await prisma.article.create({
    data: {
      title: 'The Impact of Artificial Intelligence on Modern Society',
      content: `Artificial intelligence (AI) has become one of the most transformative technologies of the 21st century. From healthcare to transportation, AI is reshaping how we live and work.

The healthcare industry has seen remarkable advances through AI applications. Machine learning algorithms can now detect diseases earlier than human doctors in many cases. For example, AI systems have demonstrated the ability to identify cancer in medical images with accuracy rates exceeding those of experienced radiologists.

In the transportation sector, autonomous vehicles represent a major breakthrough. Companies like Tesla and Waymo have developed self-driving cars that can navigate complex urban environments. While fully autonomous vehicles are not yet widespread, the technology continues to advance rapidly.

However, the rise of AI also raises important ethical questions. Concerns about job displacement, privacy, and algorithmic bias have sparked intense debate. Some experts warn that AI could lead to significant unemployment as machines replace human workers in various industries.

Despite these challenges, the potential benefits of AI are enormous. Researchers believe that AI could help solve some of humanity's greatest challenges, from climate change to disease eradication. The key lies in developing AI responsibly and ensuring that its benefits are distributed equitably across society.

As we move forward, it is crucial that policymakers, technologists, and citizens work together to shape the future of AI. By establishing appropriate regulations and ethical guidelines, we can harness the power of AI while minimizing its risks.`,
      source: '2024年考研英语一模拟题',
      year: 2024,
      category: '科技',
      difficulty: 3,
      wordCount: 280,
      questions: {
        create: [
          {
            questionNum: 1,
            stem: 'According to the passage, what is one major achievement of AI in healthcare?',
            questionType: '细节理解题',
            correctAnswer: 'B',
            analysis: '文章第二段提到AI系统在医学图像中识别癌症的准确率超过了经验丰富的放射科医生，因此B选项正确。',
            options: {
              create: [
                { optionKey: 'A', content: 'AI has replaced all human doctors in hospitals.' },
                { optionKey: 'B', content: 'AI can detect diseases earlier than human doctors in some cases.' },
                { optionKey: 'C', content: 'AI has reduced healthcare costs by 50%.' },
                { optionKey: 'D', content: 'AI has eliminated all medical errors.' },
              ],
            },
          },
          {
            questionNum: 2,
            stem: 'The author mentions autonomous vehicles primarily to',
            questionType: '推理判断题',
            correctAnswer: 'C',
            analysis: '第三段讨论自动驾驶汽车是为了说明AI在交通领域的重大突破，展示AI的实际应用。',
            options: {
              create: [
                { optionKey: 'A', content: 'criticize the slow development of transportation technology.' },
                { optionKey: 'B', content: 'compare different car manufacturers.' },
                { optionKey: 'C', content: 'illustrate a major breakthrough in AI applications.' },
                { optionKey: 'D', content: 'predict the future of the automotive industry.' },
              ],
            },
          },
          {
            questionNum: 3,
            stem: 'What concern about AI is mentioned in the passage?',
            questionType: '细节理解题',
            correctAnswer: 'A',
            analysis: '第四段明确提到人们对工作被取代、隐私和算法偏见的担忧。',
            options: {
              create: [
                { optionKey: 'A', content: 'Job displacement caused by automation.' },
                { optionKey: 'B', content: 'The high cost of AI development.' },
                { optionKey: 'C', content: 'The lack of interest in AI research.' },
                { optionKey: 'D', content: 'The difficulty of understanding AI technology.' },
              ],
            },
          },
          {
            questionNum: 4,
            stem: 'The word "equitably" (Paragraph 5) is closest in meaning to',
            questionType: '词义猜测题',
            correctAnswer: 'D',
            analysis: '"equitably"意为"公平地、公正地"，与"fairly"意思最接近。',
            options: {
              create: [
                { optionKey: 'A', content: 'rapidly' },
                { optionKey: 'B', content: 'efficiently' },
                { optionKey: 'C', content: 'completely' },
                { optionKey: 'D', content: 'fairly' },
              ],
            },
          },
          {
            questionNum: 5,
            stem: 'What is the main idea of this passage?',
            questionType: '主旨大意题',
            correctAnswer: 'B',
            analysis: '文章讨论了AI的影响、成就、挑战和未来发展，核心主题是AI对现代社会的变革性影响。',
            options: {
              create: [
                { optionKey: 'A', content: 'AI will soon replace all human workers.' },
                { optionKey: 'B', content: 'AI has significant impacts on society with both benefits and challenges.' },
                { optionKey: 'C', content: 'Healthcare is the most important application of AI.' },
                { optionKey: 'D', content: 'Autonomous vehicles are the future of transportation.' },
              ],
            },
          },
        ],
      },
    },
  })

  console.log('Created article:', article.title)
  console.log('Created 5 questions with options')
  
  // 创建第二篇示例文章
  const article2 = await prisma.article.create({
    data: {
      title: 'Climate Change and Global Economic Impact',
      content: `Climate change has emerged as one of the most pressing challenges facing the global economy. Rising temperatures, extreme weather events, and shifting precipitation patterns are affecting industries worldwide.

The agricultural sector is particularly vulnerable to climate change. Farmers are experiencing reduced crop yields due to droughts, floods, and changing growing seasons. In some regions, traditional crops can no longer be cultivated, forcing farmers to adapt or abandon their livelihoods.

The insurance industry faces mounting costs from climate-related disasters. Hurricanes, wildfires, and floods have caused billions of dollars in damages in recent years. Insurance companies are raising premiums and, in some cases, withdrawing coverage from high-risk areas.

However, climate change is also creating new economic opportunities. The renewable energy sector has experienced explosive growth as countries seek to reduce carbon emissions. Solar and wind power have become increasingly cost-competitive with fossil fuels, attracting significant investment.

Governments around the world are implementing policies to address climate change. Carbon taxes, emissions trading systems, and green subsidies are becoming more common. These policies aim to incentivize businesses to reduce their environmental impact while promoting sustainable economic growth.

The transition to a low-carbon economy will require substantial investment but could ultimately create millions of new jobs. Studies suggest that the economic benefits of addressing climate change far outweigh the costs of inaction.`,
      source: '2023年考研英语二真题改编',
      year: 2023,
      category: '经济',
      difficulty: 3,
      wordCount: 250,
      questions: {
        create: [
          {
            questionNum: 1,
            stem: 'Which industry is mentioned as especially affected by climate change?',
            questionType: '细节理解题',
            correctAnswer: 'A',
            analysis: '文章第二段明确指出农业部门特别容易受到气候变化的影响。',
            options: {
              create: [
                { optionKey: 'A', content: 'The agricultural sector.' },
                { optionKey: 'B', content: 'The technology sector.' },
                { optionKey: 'C', content: 'The entertainment industry.' },
                { optionKey: 'D', content: 'The pharmaceutical industry.' },
              ],
            },
          },
          {
            questionNum: 2,
            stem: 'According to the passage, how are insurance companies responding to climate change?',
            questionType: '细节理解题',
            correctAnswer: 'C',
            analysis: '第三段提到保险公司正在提高保费，在某些情况下从高风险地区撤出保险。',
            options: {
              create: [
                { optionKey: 'A', content: 'They are investing more in fossil fuels.' },
                { optionKey: 'B', content: 'They are ignoring climate-related risks.' },
                { optionKey: 'C', content: 'They are raising premiums and withdrawing from high-risk areas.' },
                { optionKey: 'D', content: 'They are reducing coverage for all customers.' },
              ],
            },
          },
          {
            questionNum: 3,
            stem: 'What economic opportunity does climate change create?',
            questionType: '细节理解题',
            correctAnswer: 'B',
            analysis: '第四段提到可再生能源行业经历了爆炸性增长，这是气候变化带来的经济机会。',
            options: {
              create: [
                { optionKey: 'A', content: 'Increased demand for fossil fuels.' },
                { optionKey: 'B', content: 'Growth in the renewable energy sector.' },
                { optionKey: 'C', content: 'Expansion of traditional manufacturing.' },
                { optionKey: 'D', content: 'Development of space exploration.' },
              ],
            },
          },
          {
            questionNum: 4,
            stem: 'The word "incentivize" (Paragraph 5) most nearly means',
            questionType: '词义猜测题',
            correctAnswer: 'D',
            analysis: '"incentivize"意为"激励、鼓励"，与"encourage"意思最接近。',
            options: {
              create: [
                { optionKey: 'A', content: 'force' },
                { optionKey: 'B', content: 'prevent' },
                { optionKey: 'C', content: 'regulate' },
                { optionKey: 'D', content: 'encourage' },
              ],
            },
          },
          {
            questionNum: 5,
            stem: 'What is the author\'s attitude toward addressing climate change?',
            questionType: '态度观点题',
            correctAnswer: 'C',
            analysis: '文章最后一段提到应对气候变化的经济效益远超过不作为的成本，表明作者持积极乐观的态度。',
            options: {
              create: [
                { optionKey: 'A', content: 'Pessimistic and hopeless.' },
                { optionKey: 'B', content: 'Neutral and indifferent.' },
                { optionKey: 'C', content: 'Cautiously optimistic.' },
                { optionKey: 'D', content: 'Highly critical.' },
              ],
            },
          },
        ],
      },
    },
  })

  console.log('Created article:', article2.title)
  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
