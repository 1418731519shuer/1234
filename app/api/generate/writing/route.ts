import { NextRequest, NextResponse } from 'next/server'

// 生成作文题目API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year = 2024 } = body
    
    // 调用DeepSeek生成作文题目
    const prompt = `请生成${year}年考研英语一的作文题目，包括小作文和大作文。

要求：
1. 小作文：应用文写作（书信、通知等），约100词
2. 大作文：图画作文，描述图画内容并发表观点，约160-200词

请严格按照以下JSON格式输出：
{
  "year": ${year},
  "smallWriting": {
    "title": "小作文标题",
    "description": "题目描述和要求",
    "requirements": ["要求1", "要求2", "要求3"],
    "sampleAnswer": "参考范文"
  },
  "bigWriting": {
    "title": "大作文标题",
    "description": "题目描述和图画内容",
    "requirements": ["要求1", "要求2", "要求3"],
    "imageDescription": "图画描述（因为无法生成图片，用文字描述图画内容）",
    "sampleAnswer": "参考范文"
  }
}

只输出JSON，不要其他内容。`

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
      return NextResponse.json(getFallbackWriting(year))
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const writing = JSON.parse(jsonMatch[0])
        return NextResponse.json(writing)
      }
    } catch (parseError) {
      console.error('Parse JSON error:', parseError)
    }
    
    return NextResponse.json(getFallbackWriting(year))
  } catch (error) {
    console.error('Generate writing error:', error)
    return NextResponse.json(getFallbackWriting(2024))
  }
}

// 预设的作文题目
function getFallbackWriting(year: number) {
  return {
    year,
    smallWriting: {
      title: "建议信",
      description: `假设你是李华，你的英国朋友Jim对中国传统文化很感兴趣。他计划来中国学习，想了解一些中国的传统节日。请你给他写一封邮件，介绍一个中国传统节日。`,
      requirements: [
        "介绍一个中国传统节日（如春节、中秋节等）",
        "说明该节日的意义和主要活动",
        "邀请他来中国时一起庆祝",
        "词数约100词"
      ],
      sampleAnswer: `Dear Jim,

I'm glad to hear that you're interested in Chinese traditional culture and planning to study in China. I'd like to introduce the Spring Festival to you, which is the most important traditional festival in China.

The Spring Festival, also known as Chinese New Year, usually falls in late January or early February. It's a time for family reunions. During this festival, families gather together to have a big dinner on New Year's Eve. People also visit relatives and friends, exchange gifts, and children receive red envelopes with lucky money.

I sincerely invite you to celebrate the Spring Festival with my family when you come to China. I'm sure you'll have an unforgettable experience.

Looking forward to your arrival.

Yours,
Li Hua`
    },
    bigWriting: {
      title: "图画作文：传统文化传承",
      description: `图画描述：图画中展示了一位老人正在教一个小孩子写毛笔字。老人神情专注，孩子认真模仿。背景是传统的书房，墙上挂着书法作品。图画下方有一行字："传承"`,
      requirements: [
        "描述图画内容",
        "分析图画所反映的社会现象",
        "发表你的观点和建议",
        "词数160-200词"
      ],
      imageDescription: "一位老人正在教小孩子写毛笔字，体现传统文化的传承",
      sampleAnswer: `As is vividly depicted in the picture, an elderly man is teaching a young child to write with a traditional Chinese brush. The man looks focused and patient, while the child imitates earnestly. In the background, we can see a traditional study room with calligraphy works hanging on the wall. The word "Inheritance" at the bottom of the picture highlights the theme.

This picture reveals a significant social phenomenon: the inheritance and preservation of traditional Chinese culture. In recent years, with the rapid development of modernization and globalization, traditional culture has faced challenges. Many young people are more attracted to modern technology and foreign cultures, paying less attention to traditional arts like calligraphy.

In my opinion, inheriting traditional culture is of great significance. It not only helps preserve our cultural identity but also enriches our spiritual life. To achieve this, schools should offer more courses on traditional arts, and families should encourage children to learn traditional skills. Only through joint efforts can we ensure that our precious cultural heritage is passed down from generation to generation.`
    }
  }
}
