import { NextRequest, NextResponse } from 'next/server'

// 生成完型填空文章API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type = 'cloze' } = body
    
    if (type === 'cloze') {
      return await generateClozeArticle()
    } else if (type === 'sevenFive') {
      return await generateSevenFiveArticle()
    }
    
    return NextResponse.json({ error: '未知类型' }, { status: 400 })
  } catch (error) {
    console.error('Generate article error:', error)
    return NextResponse.json({ error: '生成失败' }, { status: 500 })
  }
}

// 生成完型填空文章
async function generateClozeArticle() {
  const prompt = `请生成一篇考研英语完型填空文章，要求：

1. 文章长度：约300词，包含20个空位
2. 题材：科技、教育、社会热点等考研常见话题
3. 难度：与考研英语一相当
4. 格式要求：
   - 文章中用 [1] [2] [3] ... [20] 表示空位
   - 每个空位提供4个选项（A/B/C/D）
   - 标注正确答案
   - 提供简要解析

请严格按照以下JSON格式输出：
{
  "title": "文章标题",
  "content": "文章内容，空位用[1][2]...表示",
  "questions": [
    {
      "blankNum": 1,
      "correctAnswer": "A",
      "options": {
        "A": "选项A内容",
        "B": "选项B内容",
        "C": "选项C内容",
        "D": "选项D内容"
      },
      "analysis": "解析"
    }
  ]
}

只输出JSON，不要其他内容。`

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.8,
      }),
    })
    
    if (!response.ok) {
      // 返回预设的完型填空文章
      return NextResponse.json(getFallbackClozeArticle())
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    // 尝试解析JSON
    try {
      // 提取JSON部分
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const article = JSON.parse(jsonMatch[0])
        return NextResponse.json(article)
      }
    } catch (parseError) {
      console.error('Parse JSON error:', parseError)
    }
    
    // 解析失败，返回预设文章
    return NextResponse.json(getFallbackClozeArticle())
  } catch (error) {
    console.error('DeepSeek API error:', error)
    return NextResponse.json(getFallbackClozeArticle())
  }
}

// 生成七选五文章
async function generateSevenFiveArticle() {
  const prompt = `请生成一篇考研英语七选五文章，要求：

1. 文章长度：约500词，包含5个空位（编号41-45）
2. 题材：科技、教育、社会热点等考研常见话题
3. 提供7个选项段落（A-G），其中5个是正确答案
4. 难度：与考研英语一相当
5. 格式要求：
   - 文章中用 [41] [42] [43] [44] [45] 表示空位
   - 7个选项段落
   - 标注正确答案

请严格按照以下JSON格式输出：
{
  "title": "文章标题",
  "content": "文章内容，空位用[41][42]...表示",
  "options": {
    "A": "段落A内容",
    "B": "段落B内容",
    "C": "段落C内容",
    "D": "段落D内容",
    "E": "段落E内容",
    "F": "段落F内容",
    "G": "段落G内容"
  },
  "correctAnswers": {
    "41": "A",
    "42": "C",
    "43": "E",
    "44": "B",
    "45": "G"
  }
}

只输出JSON，不要其他内容。`

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.8,
      }),
    })
    
    if (!response.ok) {
      return NextResponse.json(getFallbackSevenFiveArticle())
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const article = JSON.parse(jsonMatch[0])
        return NextResponse.json(article)
      }
    } catch (parseError) {
      console.error('Parse JSON error:', parseError)
    }
    
    return NextResponse.json(getFallbackSevenFiveArticle())
  } catch (error) {
    console.error('DeepSeek API error:', error)
    return NextResponse.json(getFallbackSevenFiveArticle())
  }
}

// 预设的完型填空文章
function getFallbackClozeArticle() {
  return {
    title: "The Impact of Artificial Intelligence on Modern Education",
    content: `Artificial intelligence is revolutionizing the field of education in ways that were once thought impossible. From personalized learning experiences to automated grading systems, AI technologies are [1] the traditional classroom model into something more dynamic and responsive to individual student needs.

One of the most significant [2] of AI in education is its ability to adapt to different learning styles. Traditional teaching methods often [3] a one-size-fits-all approach, which can leave some students struggling while others become bored. AI-powered platforms can [4] each student's progress and adjust the difficulty level accordingly, ensuring that everyone learns at their [5] pace.

Moreover, AI can help teachers [6] valuable time by automating routine tasks such as grading multiple-choice tests and checking for plagiarism. This [7] educators to focus more on creative lesson planning and one-on-one student interactions, which are [8] for developing critical thinking skills.

However, the integration of AI in education is not without its [9]. Some educators worry that over-reliance on technology might [10] the human element that is essential to effective teaching. There are also concerns about data [11] and the potential for AI systems to perpetuate biases present in their training data.

Despite these challenges, the [12] of AI in education appears promising. As the technology continues to [13], we can expect to see even more innovative applications that enhance the learning experience. The key will be finding the right [14] between technological efficiency and human interaction.

Educational institutions must also ensure that teachers receive adequate [15] to effectively use these new tools. Without proper support, even the most advanced AI systems will fail to [16] their potential in the classroom.

The cost of implementing AI technologies remains a significant [17] for many schools, particularly those in underprivileged areas. This digital divide could potentially [18] existing educational inequalities if not addressed properly.

In conclusion, while AI presents both opportunities and challenges for education, its thoughtful integration can lead to more [19] and effective learning environments. The goal should always be to use technology as a tool to [20], rather than replace, the irreplaceable human elements of teaching.`,
    questions: [
      { blankNum: 1, correctAnswer: "A", options: { A: "transforming", B: "maintaining", C: "destroying", D: "ignoring" }, analysis: "根据上下文，AI正在改变传统课堂模式" },
      { blankNum: 2, correctAnswer: "B", options: { A: "problems", B: "benefits", C: "dangers", D: "costs" }, analysis: "此处介绍AI的优点" },
      { blankNum: 3, correctAnswer: "C", options: { A: "avoid", B: "reject", C: "employ", D: "criticize" }, analysis: "传统方法采用一刀切的方式" },
      { blankNum: 4, correctAnswer: "D", options: { A: "ignore", B: "predict", C: "complicate", D: "track" }, analysis: "AI平台可以追踪学生进度" },
      { blankNum: 5, correctAnswer: "A", options: { A: "optimal", B: "slow", C: "fast", D: "minimum" }, analysis: "确保每个人以最佳速度学习" },
      { blankNum: 6, correctAnswer: "B", options: { A: "waste", B: "save", C: "spend", D: "lose" }, analysis: "AI帮助教师节省时间" },
      { blankNum: 7, correctAnswer: "C", options: { A: "forces", B: "prevents", C: "allows", D: "discourages" }, analysis: "这使得教育者能够专注于..." },
      { blankNum: 8, correctAnswer: "D", options: { A: "unnecessary", B: "harmful", C: "irrelevant", D: "crucial" }, analysis: "一对一互动对培养批判性思维至关重要" },
      { blankNum: 9, correctAnswer: "A", options: { A: "challenges", B: "advantages", C: "solutions", D: "benefits" }, analysis: "然而，AI的整合并非没有挑战" },
      { blankNum: 10, correctAnswer: "B", options: { A: "enhance", B: "diminish", C: "increase", D: "protect" }, analysis: "担心过度依赖技术可能会削弱人文元素" },
      { blankNum: 11, correctAnswer: "C", options: { A: "storage", B: "analysis", C: "privacy", D: "collection" }, analysis: "还有数据隐私的担忧" },
      { blankNum: 12, correctAnswer: "D", options: { A: "past", B: "history", C: "failure", D: "future" }, analysis: "AI在教育领域的未来前景光明" },
      { blankNum: 13, correctAnswer: "A", options: { A: "evolve", B: "decline", C: "disappear", D: "stagnate" }, analysis: "随着技术继续发展" },
      { blankNum: 14, correctAnswer: "B", options: { A: "conflict", B: "balance", C: "separation", D: "choice" }, analysis: "关键在于找到技术效率和人际互动之间的平衡" },
      { blankNum: 15, correctAnswer: "C", options: { A: "salary", B: "vacation", C: "training", D: "criticism" }, analysis: "教育机构必须确保教师接受足够的培训" },
      { blankNum: 16, correctAnswer: "D", options: { A: "hide", B: "reduce", C: "ignore", D: "realize" }, analysis: "发挥其潜力" },
      { blankNum: 17, correctAnswer: "A", options: { A: "barrier", B: "advantage", C: "benefit", D: "solution" }, analysis: "实施AI技术的成本仍然是重大障碍" },
      { blankNum: 18, correctAnswer: "B", options: { A: "eliminate", B: "worsen", C: "improve", D: "solve" }, analysis: "数字鸿沟可能会加剧现有的教育不平等" },
      { blankNum: 19, correctAnswer: "C", options: { A: "expensive", B: "difficult", C: "personalized", D: "traditional" }, analysis: "AI可以带来更加个性化和有效的学习环境" },
      { blankNum: 20, correctAnswer: "A", options: { A: "enhance", B: "replace", C: "eliminate", D: "ignore" }, analysis: "技术应该用来增强而非取代教学中的人文元素" },
    ]
  }
}

// 预设的七选五文章
function getFallbackSevenFiveArticle() {
  return {
    title: "The Science of Sleep: Why Rest Matters",
    content: `Sleep is one of the most fundamental biological processes, yet it remains one of the least understood. Scientists have long been fascinated by the question of why humans need to spend roughly one-third of their lives asleep. [41] __________

Recent research has revealed that sleep plays a crucial role in memory consolidation. During sleep, the brain processes and organizes information acquired throughout the day. [42] __________ This process is essential for learning and retaining new information.

The consequences of sleep deprivation are far more serious than simple fatigue. Studies have shown that chronic lack of sleep can lead to a weakened immune system, increased risk of heart disease, and impaired cognitive function. [43] __________

Perhaps most surprisingly, sleep also plays a vital role in emotional regulation. The brain processes emotional experiences during REM sleep, helping individuals cope with stress and trauma. [44] __________

Despite the clear importance of sleep, modern society seems designed to minimize it. The prevalence of screens, artificial lighting, and demanding work schedules all contribute to a widespread sleep deficit. [45] __________ Understanding and prioritizing sleep may be one of the most important steps we can take for our overall health and well-being.`,
    options: {
      A: "This emotional processing may explain why people who are sleep-deprived often feel irritable and have difficulty managing their emotions.",
      B: "The brain sorts through memories, deciding which ones to keep and which ones to discard.",
      C: "New technologies are being developed to help people track and improve their sleep patterns.",
      D: "Without adequate sleep, the brain struggles to form the neural connections necessary for long-term memory storage.",
      E: "Even more concerning is the link between chronic sleep deprivation and mental health disorders such as depression and anxiety.",
      F: "Research suggests that the brain uses this time to perform essential maintenance and repair work on the body's cells.",
      G: "Making sleep a priority requires conscious effort and lifestyle changes in our fast-paced world."
    },
    correctAnswers: {
      "41": "F",
      "42": "B",
      "43": "E",
      "44": "A",
      "45": "G"
    }
  }
}
