// AI解析服务 - 智能识别文章结构和题型

import type { QuestionType, ParsedResult, AIGenerationSuggestion, ReadingSubmit, ClozeSubmit, SevenFiveSubmit, TranslationSubmit, WritingTaskSubmit } from '@/types/submit'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

// 调用DeepSeek API
async function callDeepSeek(prompt: string, content: string): Promise<string> {
  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (error) {
    console.error('DeepSeek API call failed:', error)
    throw error
  }
}

// 识别题型
export async function detectQuestionType(content: string): Promise<{ type: QuestionType; confidence: number }> {
  const prompt = `你是一个考研英语题目分析专家。请分析以下文本，判断它属于哪种题型。

题型说明：
- reading: 阅读理解，包含一篇完整文章和若干选择题
- cloze: 完型填空，文章中有20个空格需要填空
- sevenFive: 七选五，文章中有5个空缺段落，从7个选项中选择
- translation: 翻译题，包含需要翻译的英文句子
- writing: 写作题，包含写作要求和提示

请只返回JSON格式：{"type": "题型", "confidence": 0.0-1.0}`

  try {
    const result = await callDeepSeek(prompt, content)
    const jsonMatch = result.match(/\{[^}]+\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Detect question type error:', error)
  }

  return { type: 'reading', confidence: 0.5 }
}

// 解析阅读理解
export async function parseReading(content: string): Promise<ParsedResult> {
  const prompt = `你是一个考研英语阅读理解解析专家。请解析以下文本，提取文章和题目信息。

要求：
1. 识别文章标题、正文内容
2. 识别每道题的题干、选项、正确答案
3. 如果有解析，也提取出来

请返回JSON格式：
{
  "success": true,
  "data": {
    "title": "文章标题",
    "content": "文章正文",
    "year": 年份,
    "examType": "english1或english2",
    "difficulty": 1-5,
    "questions": [
      {
        "questionNum": 1,
        "stem": "题干",
        "questionType": "主旨题/细节题/推断题/词义题/态度题",
        "options": {"A": "选项A", "B": "选项B", "C": "选项C", "D": "选项D"},
        "correctAnswer": "A/B/C/D",
        "analysis": "解析（如有）"
      }
    ]
  },
  "confidence": 0.0-1.0,
  "errors": []
}`

  try {
    const result = await callDeepSeek(prompt, content)
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        success: parsed.success,
        questionType: 'reading',
        data: parsed.data as ReadingSubmit,
        confidence: parsed.confidence,
        errors: parsed.errors,
      }
    }
  } catch (error) {
    console.error('Parse reading error:', error)
  }

  return { success: false, confidence: 0, errors: ['解析失败'] }
}

// 解析完型填空
export async function parseCloze(content: string): Promise<ParsedResult> {
  const prompt = `你是一个考研英语完型填空解析专家。请解析以下文本，提取文章和选项信息。

要求：
1. 识别文章标题
2. 将文章中的空格标记为 [1][2]...[20]
3. 提取每个空格的四个选项和正确答案

请返回JSON格式：
{
  "success": true,
  "data": {
    "title": "文章标题",
    "content": "带[1][2]...[20]标记的文章",
    "year": 年份,
    "examType": "english1或english2",
    "difficulty": 1-5,
    "blanks": [
      {
        "blankNum": 1,
        "correctAnswer": "A/B/C/D",
        "options": {"A": "选项A", "B": "选项B", "C": "选项C", "D": "选项D"}
      }
    ]
  },
  "confidence": 0.0-1.0,
  "errors": []
}`

  try {
    const result = await callDeepSeek(prompt, content)
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        success: parsed.success,
        questionType: 'cloze',
        data: parsed.data as ClozeSubmit,
        confidence: parsed.confidence,
        errors: parsed.errors,
      }
    }
  } catch (error) {
    console.error('Parse cloze error:', error)
  }

  return { success: false, confidence: 0, errors: ['解析失败'] }
}

// 解析七选五
export async function parseSevenFive(content: string): Promise<ParsedResult> {
  const prompt = `你是一个考研英语七选五解析专家。请解析以下文本，提取文章和选项信息。

要求：
1. 识别文章标题
2. 将文章中的空缺段落标记为 [1][2]...[5]
3. 提取7个选项段落（A-G）
4. 识别正确答案顺序

请返回JSON格式：
{
  "success": true,
  "data": {
    "title": "文章标题",
    "content": "带[1][2]...[5]标记的文章",
    "year": 年份,
    "examType": "english1或english2",
    "difficulty": 1-5,
    "correctAnswers": ["A", "C", "E", "B", "G"],
    "options": [
      {"optionKey": "A", "content": "段落内容"},
      {"optionKey": "B", "content": "段落内容"}
    ]
  },
  "confidence": 0.0-1.0,
  "errors": []
}`

  try {
    const result = await callDeepSeek(prompt, content)
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        success: parsed.success,
        questionType: 'sevenFive',
        data: parsed.data as SevenFiveSubmit,
        confidence: parsed.confidence,
        errors: parsed.errors,
      }
    }
  } catch (error) {
    console.error('Parse seven-five error:', error)
  }

  return { success: false, confidence: 0, errors: ['解析失败'] }
}

// 解析翻译题
export async function parseTranslation(content: string): Promise<ParsedResult> {
  const prompt = `你是一个考研英语翻译解析专家。请解析以下文本，提取翻译句子信息。

要求：
1. 识别文章标题和完整文章
2. 提取需要翻译的英文句子（通常是划线部分）
3. 提取参考译文

请返回JSON格式：
{
  "success": true,
  "data": {
    "title": "文章标题",
    "content": "完整文章",
    "year": 年份,
    "examType": "english1或english2",
    "difficulty": 1-5,
    "sentences": [
      {
        "sentenceNum": 1,
        "englishText": "英文原句",
        "referenceCn": "参考译文",
        "keyVocabulary": [{"word": "单词", "meaning": "含义"}],
        "grammarPoints": ["语法点1", "语法点2"]
      }
    ]
  },
  "confidence": 0.0-1.0,
  "errors": []
}`

  try {
    const result = await callDeepSeek(prompt, content)
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        success: parsed.success,
        questionType: 'translation',
        data: parsed.data as TranslationSubmit,
        confidence: parsed.confidence,
        errors: parsed.errors,
      }
    }
  } catch (error) {
    console.error('Parse translation error:', error)
  }

  return { success: false, confidence: 0, errors: ['解析失败'] }
}

// 解析写作题
export async function parseWriting(content: string): Promise<ParsedResult> {
  const prompt = `你是一个考研英语写作解析专家。请解析以下文本，提取写作任务信息。

要求：
1. 识别是应用文（小作文）还是议论文（大作文）
2. 提取写作要求和字数要求
3. 如果有范文，也提取出来

请返回JSON格式：
{
  "success": true,
  "data": {
    "title": "题目名称",
    "taskType": "small或large",
    "instructions": "写作要求",
    "wordCount": 建议字数,
    "sampleAnswer": "范文（如有）",
    "year": 年份,
    "examType": "english1或english2",
    "difficulty": 1-5
  },
  "confidence": 0.0-1.0,
  "errors": []
}`

  try {
    const result = await callDeepSeek(prompt, content)
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        success: parsed.success,
        questionType: 'writing',
        data: parsed.data as WritingTaskSubmit,
        confidence: parsed.confidence,
        errors: parsed.errors,
      }
    }
  } catch (error) {
    console.error('Parse writing error:', error)
  }

  return { success: false, confidence: 0, errors: ['解析失败'] }
}

// 智能解析入口
export async function smartParse(content: string): Promise<ParsedResult> {
  // 1. 先识别题型
  const { type, confidence: typeConfidence } = await detectQuestionType(content)
  
  // 2. 根据题型调用对应解析
  switch (type) {
    case 'reading':
      return parseReading(content)
    case 'cloze':
      return parseCloze(content)
    case 'sevenFive':
      return parseSevenFive(content)
    case 'translation':
      return parseTranslation(content)
    case 'writing':
      return parseWriting(content)
    default:
      return { success: false, confidence: 0, errors: ['无法识别题型'] }
  }
}

// AI出题建议
export async function generateQuestionSuggestion(content: string): Promise<AIGenerationSuggestion> {
  const prompt = `你是一个考研英语出题专家。请分析以下文章，给出出题建议。

要求：
1. 分析文章适合出什么类型的题
2. 建议在哪些位置出题
3. 提取重点词汇
4. 分析文章主旨和结构

请返回JSON格式：
{
  "questionType": "推荐的题型",
  "confidence": 0.0-1.0,
  "suggestedQuestions": [
    {
      "position": "第一段",
      "questionType": "主旨题",
      "reason": "第一段点明了文章主题"
    }
  ],
  "keyVocabulary": [
    {"word": "单词", "meaning": "含义", "importance": 1-5}
  ],
  "mainIdea": "文章主旨",
  "structure": ["第一段：引入", "第二段：论证", "..."]
}`

  try {
    const result = await callDeepSeek(prompt, content)
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Generate suggestion error:', error)
  }

  return {
    questionType: 'reading',
    confidence: 0,
  }
}
