// 插入完型填空文章到数据库
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
    where: { title: "The Paradox of Choice in the Digital Age" }
  })
  
  if (existing) {
    console.log('Article already exists:', existing.id)
    return
  }
  
  const article = await prisma.article.create({
    data: {
      title: "The Paradox of Choice in the Digital Age",
      content: `In an era defined by unprecedented access to information and goods, one might assume that greater choice inevitably leads to greater satisfaction. However, psychological research presents a more [1] picture. The "paradox of choice," a concept popularized by psychologist Barry Schwartz, suggests that an abundance of options can, counterintuitively, lead to anxiety, decision paralysis, and [2] dissatisfaction with our final selections.

This phenomenon is particularly [3] in the digital landscape. Online shopping platforms offer millions of products, streaming services provide endless entertainment options, and social media exposes us to countless lifestyles to compare ourselves against. While this variety was initially hailed as liberating, it often [4] a hidden psychological toll. When faced with too many alternatives, individuals often experience "choice overload." They may spend an inordinate amount of time researching options, fear making the wrong decision, and ultimately [5] less content with their choice, plagued by thoughts of the potentially superior alternatives they [6].

This has profound implications for consumer behavior and personal well-being. Some companies have begun to [7] this insight by curating selections or offering personalized recommendations, effectively reducing the cognitive burden on the customer. On a personal level, experts suggest that consciously [8] our choices in certain areas can reduce stress. This might mean limiting time spent browsing online stores, using decision rules of thumb, or learning to embrace "good enough" rather than obsessively seeking the "best."

Furthermore, the social dimension of choice cannot be [9]. Constant exposure to the curated highlights of others' lives on social media can [10] our own choices seem inadequate, fueling regret and the fear of missing out (FOMO). This comparative aspect [11] the negative effects of choice overload.

Ultimately, navigating the modern world requires not just the ability to choose, but the wisdom to manage choice. Recognizing that more options do not [12] equate to better outcomes is the first step. By developing strategies to filter information and [13] our own decision-making criteria, we can reclaim a sense of agency and satisfaction. The goal is not to eliminate choice, but to structure our environments and mindsets so that freedom of choice enhances, rather than [14], our happiness.

In conclusion, while the digital age offers remarkable freedoms, it also demands new forms of psychological literacy. Understanding the paradox of choice allows us to be more [15] consumers of both products and experiences. It encourages a shift from maximizing every decision to satisficing—finding what is sufficiently good. This approach can lead to more [16] decisions and greater overall contentment, proving that sometimes, less [17] more when it comes to our menu of options.

The implications extend beyond the individual to educators and policymakers. In educational settings, providing structured guidance within a framework of choice can foster better learning outcomes than presenting students with completely [18] options. Similarly, in designing public services or retirement plans, offering a manageable number of well-curated choices can lead to higher participation and satisfaction than presenting a bewildering array. The key is to find the sweet spot between oppressive restriction and paralyzing abundance, where autonomy is preserved but the burden of excessive choice is [19]. As we continue to advance technologically, our greatest challenge may not be creating more options, but cultivating the discernment to choose wisely among them, ensuring that our technological abundance serves to enrich, rather than [20], the human experience.`,
      source: "AI Generated",
      year: 2024,
      category: "社会心理",
      difficulty: 3,
      questionType: "cloze",
      examType: "english1",
      questions: {
        create: [
          { questionNum: 1, stem: "第1空", correctAnswer: "C", analysis: "后文提到“选择悖论”指出选择过多会导致焦虑等负面结果，因此画面是“复杂的、有细微差别的”(nuanced)。", options: { create: [{ optionKey: "A", content: "optimistic" }, { optionKey: "B", content: "simple" }, { optionKey: "C", content: "nuanced" }, { optionKey: "D", content: "bright" }] } },
          { questionNum: 2, stem: "第2空", correctAnswer: "B", analysis: "根据上下文，这是对“最终选择”的事后感受，因此是“事后的、回顾的”(retrospective)不满。", options: { create: [{ optionKey: "A", content: "temporary" }, { optionKey: "B", content: "retrospective" }, { optionKey: "C", content: "immediate" }, { optionKey: "D", content: "permanent" }] } },
          { questionNum: 3, stem: "第3空", correctAnswer: "D", analysis: "数字环境提供了海量选择，因此这种现象在那里应该“显著、明显”(pronounced)。", options: { create: [{ optionKey: "A", content: "hidden" }, { optionKey: "B", content: "neglected" }, { optionKey: "C", content: "solved" }, { optionKey: "D", content: "pronounced" }] } },
          { questionNum: 4, stem: "第4空", correctAnswer: "A", analysis: "exact a toll是固定搭配，意为“造成损失/代价”。", options: { create: [{ optionKey: "A", content: "exacts" }, { optionKey: "B", content: "reduces" }, { optionKey: "C", content: "ignores" }, { optionKey: "D", content: "compensates" }] } },
          { questionNum: 5, stem: "第5空", correctAnswer: "C", analysis: "此处描述心理感受，与“content with”搭配，表示“感到”不满意。", options: { create: [{ optionKey: "A", content: "grow" }, { optionKey: "B", content: "remain" }, { optionKey: "C", content: "feel" }, { optionKey: "D", content: "prove" }] } },
          { questionNum: 6, stem: "第6空", correctAnswer: "B", analysis: "这里指被他们“拒绝了的”可能更好的选择。", options: { create: [{ optionKey: "A", content: "forgot" }, { optionKey: "B", content: "rejected" }, { optionKey: "C", content: "created" }, { optionKey: "D", content: "accepted" }] } },
          { questionNum: 7, stem: "第7空", correctAnswer: "D", analysis: "leverage意为“利用”，公司利用这一洞见来优化服务。", options: { create: [{ optionKey: "A", content: "ignore" }, { optionKey: "B", content: "complicate" }, { optionKey: "C", content: "advertise" }, { optionKey: "D", content: "leverage" }] } },
          { questionNum: 8, stem: "第8空", correctAnswer: "A", analysis: "根据后文“减少压力”可知，是主动“限制、约束”(constraining)选择。", options: { create: [{ optionKey: "A", content: "constraining" }, { optionKey: "B", content: "expanding" }, { optionKey: "C", content: "analyzing" }, { optionKey: "D", content: "delegating" }] } },
          { questionNum: 9, stem: "第9空", correctAnswer: "C", analysis: "cannot be overlooked意为“不能被忽视”。", options: { create: [{ optionKey: "A", content: "exaggerated" }, { optionKey: "B", content: "measured" }, { optionKey: "C", content: "overlooked" }, { optionKey: "D", content: "enjoyed" }] } },
          { questionNum: 10, stem: "第10空", correctAnswer: "D", analysis: "render sth. + adj. 意为“使…成为某种状态”。", options: { create: [{ optionKey: "A", content: "celebrate" }, { optionKey: "B", content: "justify" }, { optionKey: "C", content: "clarify" }, { optionKey: "D", content: "render" }] } },
          { questionNum: 11, stem: "第11空", correctAnswer: "B", analysis: "这种社会比较会“加剧、放大”(amplifies)选择过载的负面影响。", options: { create: [{ optionKey: "A", content: "mitigates" }, { optionKey: "B", content: "amplifies" }, { optionKey: "C", content: "reflects" }, { optionKey: "D", content: "isolates" }] } },
          { questionNum: 12, stem: "第12空", correctAnswer: "A", analysis: "not necessarily是固定搭配，意为“不一定”。", options: { create: [{ optionKey: "A", content: "necessarily" }, { optionKey: "B", content: "rarely" }, { optionKey: "C", content: "fortunately" }, { optionKey: "D", content: "intentionally" }] } },
          { questionNum: 13, stem: "第13空", correctAnswer: "C", analysis: "应该是“澄清、明确”(clarify)自己的决策标准。", options: { create: [{ optionKey: "A", content: "abandon" }, { optionKey: "B", content: "question" }, { optionKey: "C", content: "clarify" }, { optionKey: "D", content: "complicate" }] } },
          { questionNum: 14, stem: "第14空", correctAnswer: "D", analysis: "rather than 前后意思相反，前面是enhances（提升），后面应为“削弱、减少”(diminishes)。", options: { create: [{ optionKey: "A", content: "guarantees" }, { optionKey: "B", content: "predicts" }, { optionKey: "C", content: "investigates" }, { optionKey: "D", content: "diminishes" }] } },
          { questionNum: 15, stem: "第15空", correctAnswer: "B", analysis: "理解了选择悖论，我们就能成为更“有洞察力的”(discerning)消费者。", options: { create: [{ optionKey: "A", content: "passive" }, { optionKey: "B", content: "discerning" }, { optionKey: "C", content: "impulsive" }, { optionKey: "D", content: "reluctant" }] } },
          { questionNum: 16, stem: "第16空", correctAnswer: "A", analysis: "与“greater overall contentment”结果一致，应该是“令人满足的”(fulfilling)决定。", options: { create: [{ optionKey: "A", content: "fulfilling" }, { optionKey: "B", content: "hasty" }, { optionKey: "C", content: "random" }, { optionKey: "D", content: "reversible" }] } },
          { questionNum: 17, stem: "第17空", correctAnswer: "C", analysis: "“less is more”是固定谚语，意为“少即是多”。", options: { create: [{ optionKey: "A", content: "confuses" }, { optionKey: "B", content: "equals" }, { optionKey: "C", content: "is" }, { optionKey: "D", content: "costs" }] } },
          { questionNum: 18, stem: "第18空", correctAnswer: "D", analysis: "与“structured guidance”形成对比，应为“无结构的”(unstructured)选项。", options: { create: [{ optionKey: "A", content: "challenging" }, { optionKey: "B", content: "obvious" }, { optionKey: "C", content: "sequential" }, { optionKey: "D", content: "unstructured" }] } },
          { questionNum: 19, stem: "第19空", correctAnswer: "B", analysis: "the burden is lifted意为“负担被减轻/解除”。", options: { create: [{ optionKey: "A", content: "imposed" }, { optionKey: "B", content: "lifted" }, { optionKey: "C", content: "doubled" }, { optionKey: "D", content: "examined" }] } },
          { questionNum: 20, stem: "第20空", correctAnswer: "A", analysis: "rather than前后对比，前面是enrich（丰富），后面应为负面动作“压倒”(overwhelm)。", options: { create: [{ optionKey: "A", content: "overwhelm" }, { optionKey: "B", content: "simplify" }, { optionKey: "C", content: "document" }, { optionKey: "D", content: "initiate" }] } },
        ]
      }
    }
  })
  
  console.log('Created article:', article.id)
}

main().catch(console.error).finally(() => prisma.$disconnect())
