// 本地存储工具类 - 管理用户数据

const STORAGE_KEYS = {
  PRACTICE_RECORDS: 'kaoyan_practice_records',
  ANSWER_RECORDS: 'kaoyan_answer_records',
  WRONG_QUESTIONS: 'kaoyan_wrong_questions',
  VOCABULARY: 'kaoyan_vocabulary',
  TODAY_STATS: 'kaoyan_today_stats',
  USER_SETTINGS: 'kaoyan_user_settings',
  AI_CHATS: 'kaoyan_ai_chats',
  CHECKIN_RECORDS: 'kaoyan_checkin_records',
  STUDY_STATS: 'kaoyan_study_stats',
  ACHIEVEMENTS: 'kaoyan_achievements',
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

// 错题 - 扩展字段
export interface LocalWrongQuestion {
  id: string
  questionId: string
  articleId: string
  articleTitle?: string
  year?: number
  questionNum?: number
  stem?: string           // 题目内容
  relatedParagraph?: string // 关联段落
  userAnswer: string
  correctAnswer: string
  analysis?: string       // 错因分析
  wrongCount: number
  lastWrongAt: string
  isMastered: boolean
}

// AI对话记录
export interface LocalAIChat {
  id: string
  articleId?: string
  questionId?: string
  userMessage: string
  aiResponse: string
  category?: string       // 分类标签
  keywords?: string[]     // 关键词
  createdAt: string
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

// AI对话管理
export const AIChatStorage = {
  getAll: (): LocalAIChat[] => {
    return getItem<LocalAIChat[]>(STORAGE_KEYS.AI_CHATS, [])
  },

  getByArticle: (articleId: string): LocalAIChat[] => {
    return AIChatStorage.getAll().filter(c => c.articleId === articleId)
  },

  add: (chat: LocalAIChat): void => {
    const chats = AIChatStorage.getAll()
    chats.unshift(chat) // 新的放前面
    setItem(STORAGE_KEYS.AI_CHATS, chats)
  },

  remove: (id: string): void => {
    const chats = AIChatStorage.getAll().filter(c => c.id !== id)
    setItem(STORAGE_KEYS.AI_CHATS, chats)
  },

  search: (keyword: string): LocalAIChat[] => {
    const lowerKeyword = keyword.toLowerCase()
    return AIChatStorage.getAll().filter(c => 
      c.userMessage.toLowerCase().includes(lowerKeyword) ||
      c.aiResponse.toLowerCase().includes(lowerKeyword) ||
      c.keywords?.some(k => k.toLowerCase().includes(lowerKeyword))
    )
  },

  getCategories: (): string[] => {
    const chats = AIChatStorage.getAll()
    const categories = new Set<string>()
    chats.forEach(c => {
      if (c.category) categories.add(c.category)
    })
    return Array.from(categories)
  },
}

// 打卡记录
export interface LocalCheckinRecord {
  date: string // YYYY-MM-DD
  checkedAt: string // ISO时间戳
  articlesRead: number
  questionsAnswered: number
  correctCount: number
  studyTime: number // 分钟
}

// 学习统计（按日期）
export interface LocalStudyStats {
  date: string // YYYY-MM-DD
  articlesRead: number
  questionsAnswered: number
  correctCount: number
  studyTime: number // 分钟
  questionTypes: {
    reading: number
    cloze: number
    sevenFive: number
    translation: number
    writing: number
  }
}

// 成就
export interface LocalAchievement {
  id: string
  type: 'streak' | 'questions' | 'accuracy' | 'time' | 'vocabulary'
  name: string
  description: string
  icon: string
  unlockedAt?: string
  progress: number
  target: number
}

// 打卡管理
export const CheckinStorage = {
  getAll: (): LocalCheckinRecord[] => {
    return getItem<LocalCheckinRecord[]>(STORAGE_KEYS.CHECKIN_RECORDS, [])
  },

  getToday: (): LocalCheckinRecord | null => {
    const today = new Date().toISOString().split('T')[0]
    return CheckinStorage.getAll().find(c => c.date === today) || null
  },

  checkin: (data: Partial<LocalCheckinRecord>): void => {
    const today = new Date().toISOString().split('T')[0]
    const records = CheckinStorage.getAll()
    const existingIndex = records.findIndex(c => c.date === today)

    const record: LocalCheckinRecord = {
      date: today,
      checkedAt: new Date().toISOString(),
      articlesRead: data.articlesRead || 0,
      questionsAnswered: data.questionsAnswered || 0,
      correctCount: data.correctCount || 0,
      studyTime: data.studyTime || 0,
    }

    if (existingIndex >= 0) {
      records[existingIndex] = record
    } else {
      records.push(record)
    }

    setItem(STORAGE_KEYS.CHECKIN_RECORDS, records)
  },

  getStreak: (): number => {
    const records = CheckinStorage.getAll().sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    if (records.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < records.length; i++) {
      const checkDate = new Date(records[i].date)
      checkDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)

      if (checkDate.getTime() === expectedDate.getTime()) {
        streak++
      } else {
        break
      }
    }

    return streak
  },

  getWeeklyRecords: (): LocalCheckinRecord[] => {
    const records = CheckinStorage.getAll()
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    return records.filter(r => new Date(r.date) >= weekAgo)
  },
}

// 学习统计管理
export const StudyStatsStorage = {
  getAll: (): LocalStudyStats[] => {
    return getItem<LocalStudyStats[]>(STORAGE_KEYS.STUDY_STATS, [])
  },

  getByDate: (date: string): LocalStudyStats | null => {
    return StudyStatsStorage.getAll().find(s => s.date === date) || null
  },

  update: (date: string, updates: Partial<LocalStudyStats>): void => {
    const stats = StudyStatsStorage.getAll()
    const existingIndex = stats.findIndex(s => s.date === date)

    const defaultStats: LocalStudyStats = {
      date,
      articlesRead: 0,
      questionsAnswered: 0,
      correctCount: 0,
      studyTime: 0,
      questionTypes: {
        reading: 0,
        cloze: 0,
        sevenFive: 0,
        translation: 0,
        writing: 0,
      },
    }

    if (existingIndex >= 0) {
      stats[existingIndex] = { ...stats[existingIndex], ...updates }
    } else {
      stats.push({ ...defaultStats, ...updates })
    }

    setItem(STORAGE_KEYS.STUDY_STATS, stats)
  },

  getWeeklyStats: (): LocalStudyStats[] => {
    const stats = StudyStatsStorage.getAll()
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    return stats.filter(s => new Date(s.date) >= weekAgo)
  },

  getMonthlyStats: (): LocalStudyStats[] => {
    const stats = StudyStatsStorage.getAll()
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)

    return stats.filter(s => new Date(s.date) >= monthAgo)
  },

  getTotalStats: (): { totalQuestions: number; totalCorrect: number; totalTime: number } => {
    const stats = StudyStatsStorage.getAll()
    return stats.reduce((acc, s) => ({
      totalQuestions: acc.totalQuestions + s.questionsAnswered,
      totalCorrect: acc.totalCorrect + s.correctCount,
      totalTime: acc.totalTime + s.studyTime,
    }), { totalQuestions: 0, totalCorrect: 0, totalTime: 0 })
  },
}

// 成就管理
export const AchievementStorage = {
  getAll: (): LocalAchievement[] => {
    const defaults: LocalAchievement[] = [
      { id: 'streak_7', type: 'streak', name: '初露锋芒', description: '连续学习7天', icon: '🌱', progress: 0, target: 7 },
      { id: 'streak_30', type: 'streak', name: '持之以恒', description: '连续学习30天', icon: '🔥', progress: 0, target: 30 },
      { id: 'streak_100', type: 'streak', name: '学霸养成', description: '连续学习100天', icon: '👑', progress: 0, target: 100 },
      { id: 'questions_100', type: 'questions', name: '小试牛刀', description: '完成100道题目', icon: '✏️', progress: 0, target: 100 },
      { id: 'questions_500', type: 'questions', name: '勤学苦练', description: '完成500道题目', icon: '📚', progress: 0, target: 500 },
      { id: 'questions_1000', type: 'questions', name: '题海战术', description: '完成1000道题目', icon: '🏆', progress: 0, target: 1000 },
      { id: 'accuracy_80', type: 'accuracy', name: '精准打击', description: '正确率达到80%', icon: '🎯', progress: 0, target: 80 },
      { id: 'accuracy_90', type: 'accuracy', name: '满分达人', description: '正确率达到90%', icon: '⭐', progress: 0, target: 90 },
      { id: 'time_10h', type: 'time', name: '时间管理', description: '累计学习10小时', icon: '⏰', progress: 0, target: 600 },
      { id: 'time_50h', type: 'time', name: '专注学习', description: '累计学习50小时', icon: '📖', progress: 0, target: 3000 },
      { id: 'vocabulary_100', type: 'vocabulary', name: '词汇积累', description: '收藏100个生词', icon: '📝', progress: 0, target: 100 },
      { id: 'vocabulary_500', type: 'vocabulary', name: '词汇大师', description: '收藏500个生词', icon: '🎓', progress: 0, target: 500 },
    ]
    return getItem<LocalAchievement[]>(STORAGE_KEYS.ACHIEVEMENTS, defaults)
  },

  updateProgress: (type: string, progress: number): LocalAchievement[] => {
    const achievements = AchievementStorage.getAll()
    const today = new Date().toISOString()

    achievements.forEach(a => {
      if (a.type === type) {
        a.progress = progress
        if (progress >= a.target && !a.unlockedAt) {
          a.unlockedAt = today
        }
      }
    })

    setItem(STORAGE_KEYS.ACHIEVEMENTS, achievements)
    return achievements
  },

  getUnlocked: (): LocalAchievement[] => {
    return AchievementStorage.getAll().filter(a => a.unlockedAt)
  },

  getLocked: (): LocalAchievement[] => {
    return AchievementStorage.getAll().filter(a => !a.unlockedAt)
  },
}
