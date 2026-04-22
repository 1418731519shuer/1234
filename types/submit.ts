// 文章提交相关类型定义

// 提交状态
export type SubmitStatus = 'draft' | 'pending' | 'approved' | 'rejected'

// 题型
export type QuestionType = 'reading' | 'cloze' | 'sevenFive' | 'translation' | 'writing'

// 考试类型
export type ExamType = 'english1' | 'english2'

// 阅读理解题目
export interface ReadingQuestion {
  questionNum: number
  stem: string
  questionType?: string // 主旨题、细节题、推断题、词义题、态度题
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  analysis?: string
}

// 阅读理解文章提交
export interface ReadingSubmit {
  title: string
  content: string
  source?: string
  year: number
  examType: ExamType
  category?: string
  difficulty: number // 1-5
  questions: ReadingQuestion[]
}

// 完型填空空位
export interface ClozeBlank {
  blankNum: number
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  options: {
    A: string
    B: string
    C: string
    D: string
  }
}

// 完型填空文章提交
export interface ClozeSubmit {
  title: string
  content: string // 带 [1][2]...[20] 标记的文章
  source?: string
  year: number
  examType: ExamType
  difficulty: number
  blanks: ClozeBlank[]
}

// 七选五选项
export interface SevenFiveOption {
  optionKey: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
  content: string
}

// 七选五文章提交
export interface SevenFiveSubmit {
  title: string
  content: string // 带 [1][2]...[5] 标记的文章
  source?: string
  year: number
  examType: ExamType
  difficulty: number
  correctAnswers: string[] // 如 ['A', 'C', 'E', 'B', 'G']
  options: SevenFiveOption[]
}

// 翻译句子
export interface TranslationSentence {
  sentenceNum: number
  englishText: string
  referenceCn: string
  keyVocabulary?: { word: string; meaning: string }[]
  grammarPoints?: string[]
}

// 翻译文章提交
export interface TranslationSubmit {
  title: string
  content: string // 完整文章
  source?: string
  year: number
  examType: ExamType
  difficulty: number
  sentences: TranslationSentence[]
}

// 写作任务
export interface WritingTaskSubmit {
  title: string
  taskType: 'small' | 'large' // 小作文/大作文
  instructions: string
  wordCount: number
  sampleAnswer?: string
  source?: string
  year: number
  examType: ExamType
  difficulty: number
}

// AI解析结果
export interface ParsedResult {
  success: boolean
  questionType?: QuestionType
  data?: ReadingSubmit | ClozeSubmit | SevenFiveSubmit | TranslationSubmit | WritingTaskSubmit
  confidence: number // 0-1，解析置信度
  suggestions?: string[] // AI建议
  errors?: string[] // 解析错误
}

// AI出题建议
export interface AIGenerationSuggestion {
  questionType: QuestionType
  confidence: number
  suggestedQuestions?: {
    position: string // 建议出题位置（段落）
    questionType: string // 题型
    reason: string // 为什么适合出这类题
  }[]
  keyVocabulary?: { word: string; meaning: string; importance: number }[]
  mainIdea?: string
  structure?: string[]
}
