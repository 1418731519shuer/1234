// 本地存储工具类 - 管理用户数据

const STORAGE_KEYS = {
  PRACTICE_RECORDS: 'kaoyan_practice_records',
  ANSWER_RECORDS: 'kaoyan_answer_records',
  WRONG_QUESTIONS: 'kaoyan_wrong_questions',
  VOCABULARY: 'kaoyan_vocabulary',
  TODAY_STATS: 'kaoyan_today_stats',
  USER_SETTINGS: 'kaoyan_user_settings',
}

// 练习记录
export interface LocalPracticeRecord {
  id: string
  articleId: string
  startTime: string
  endTime?: string
  duration: number
  totalCorrect: number
  totalQuestions: number
  isCompleted: boolean
}

// 答题记录
export interface LocalAnswerRecord {
  id: string
  articleId: string
  questionId?: string
  blankNum?: number
  gapNum?: number
  userAnswer?: string
  isCorrect?: boolean
  markedColor?: string
  markedText?: string
  note?: string
  answeredAt: string
}

// 错题
export interface LocalWrongQuestion {
  id: string
  questionId: string
  articleId: string
  userAnswer: string
  correctAnswer: string
  wrongCount: number
  lastWrongAt: string
  isMastered: boolean
}

// 生词
export interface LocalVocabulary {
  id: string
  word: string
  meaning: string
  context?: string
  articleId?: string
  isFavorite: boolean
  mastery: number
  reviewCount: number
  createdAt: string
  lastReviewAt?: string
}

// 今日统计
export interface LocalTodayStats {
  date: string
  articlesRead: number
  questionsAnswered: number
  correctCount: number
  totalTime: number
}

// 工具函数
function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('localStorage save error:', e)
  }
}

// 练习记录管理
export const PracticeStorage = {
  getAll: (): LocalPracticeRecord[] => {
    return getItem<LocalPracticeRecord[]>(STORAGE_KEYS.PRACTICE_RECORDS, [])
  },

  getByArticle: (articleId: string): LocalPracticeRecord | undefined => {
    return PracticeStorage.getAll().find(r => r.articleId === articleId)
  },

  save: (record: LocalPracticeRecord): void => {
    const records = PracticeStorage.getAll()
    const index = records.findIndex(r => r.id === record.id)
    if (index >= 0) {
      records[index] = record
    } else {
      records.push(record)
    }
    setItem(STORAGE_KEYS.PRACTICE_RECORDS, records)
  },

  getTodayStats: (): LocalTodayStats => {
    const today = new Date().toISOString().split('T')[0]
    const stats = getItem<LocalTodayStats>(STORAGE_KEYS.TODAY_STATS, {
      date: today,
      articlesRead: 0,
      questionsAnswered: 0,
      correctCount: 0,
      totalTime: 0,
    })
    
    // 如果是新的一天，重置统计
    if (stats.date !== today) {
      return {
        date: today,
        articlesRead: 0,
        questionsAnswered: 0,
        correctCount: 0,
        totalTime: 0,
      }
    }
    return stats
  },

  updateTodayStats: (updates: Partial<LocalTodayStats>): void => {
    const today = new Date().toISOString().split('T')[0]
    const stats = PracticeStorage.getTodayStats()
    const newStats = { ...stats, ...updates, date: today }
    setItem(STORAGE_KEYS.TODAY_STATS, newStats)
  },
}

// 答题记录管理
export const AnswerStorage = {
  getAll: (): LocalAnswerRecord[] => {
    return getItem<LocalAnswerRecord[]>(STORAGE_KEYS.ANSWER_RECORDS, [])
  },

  getByArticle: (articleId: string): LocalAnswerRecord[] => {
    return AnswerStorage.getAll().filter(r => r.articleId === articleId)
  },

  save: (record: LocalAnswerRecord): void => {
    const records = AnswerStorage.getAll()
    const index = records.findIndex(r => r.id === record.id)
    if (index >= 0) {
      records[index] = record
    } else {
      records.push(record)
    }
    setItem(STORAGE_KEYS.ANSWER_RECORDS, records)
  },

  clearByArticle: (articleId: string): void => {
    const records = AnswerStorage.getAll().filter(r => r.articleId !== articleId)
    setItem(STORAGE_KEYS.ANSWER_RECORDS, records)
  },
}

// 错题本管理
export const WrongQuestionStorage = {
  getAll: (): LocalWrongQuestion[] => {
    return getItem<LocalWrongQuestion[]>(STORAGE_KEYS.WRONG_QUESTIONS, [])
  },

  add: (wrong: LocalWrongQuestion): void => {
    const wrongs = WrongQuestionStorage.getAll()
    const existing = wrongs.find(w => w.questionId === wrong.questionId)
    if (existing) {
      existing.wrongCount += 1
      existing.lastWrongAt = new Date().toISOString()
    } else {
      wrongs.push(wrong)
    }
    setItem(STORAGE_KEYS.WRONG_QUESTIONS, wrongs)
  },

  remove: (questionId: string): void => {
    const wrongs = WrongQuestionStorage.getAll().filter(w => w.questionId !== questionId)
    setItem(STORAGE_KEYS.WRONG_QUESTIONS, wrongs)
  },

  markMastered: (questionId: string): void => {
    const wrongs = WrongQuestionStorage.getAll()
    const wrong = wrongs.find(w => w.questionId === questionId)
    if (wrong) {
      wrong.isMastered = true
      setItem(STORAGE_KEYS.WRONG_QUESTIONS, wrongs)
    }
  },
}

// 生词本管理
export const VocabularyStorage = {
  getAll: (): LocalVocabulary[] => {
    return getItem<LocalVocabulary[]>(STORAGE_KEYS.VOCABULARY, [])
  },

  getFavorites: (): LocalVocabulary[] => {
    return VocabularyStorage.getAll().filter(v => v.isFavorite)
  },

  add: (vocab: LocalVocabulary): void => {
    const vocabs = VocabularyStorage.getAll()
    const existing = vocabs.find(v => v.word === vocab.word)
    if (!existing) {
      vocabs.push(vocab)
      setItem(STORAGE_KEYS.VOCABULARY, vocabs)
    }
  },

  toggleFavorite: (word: string): void => {
    const vocabs = VocabularyStorage.getAll()
    const vocab = vocabs.find(v => v.word === word)
    if (vocab) {
      vocab.isFavorite = !vocab.isFavorite
      setItem(STORAGE_KEYS.VOCABULARY, vocabs)
    }
  },

  updateMastery: (word: string, mastery: number): void => {
    const vocabs = VocabularyStorage.getAll()
    const vocab = vocabs.find(v => v.word === word)
    if (vocab) {
      vocab.mastery = mastery
      vocab.reviewCount += 1
      vocab.lastReviewAt = new Date().toISOString()
      setItem(STORAGE_KEYS.VOCABULARY, vocabs)
    }
  },

  remove: (word: string): void => {
    const vocabs = VocabularyStorage.getAll().filter(v => v.word !== word)
    setItem(STORAGE_KEYS.VOCABULARY, vocabs)
  },
}
