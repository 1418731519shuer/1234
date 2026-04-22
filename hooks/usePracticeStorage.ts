// 练习记录管理 Hook
import { useCallback } from 'react'
import { PracticeStorage, AnswerStorage, StudyStatsStorage, AchievementStorage, type LocalPracticeRecord, type LocalAnswerRecord } from '@/lib/localStorage'

export function usePracticeStorage() {
  // 创建新的练习记录
  const createPractice = useCallback((articleId: string, totalQuestions: number): LocalPracticeRecord => {
    const record: LocalPracticeRecord = {
      id: `practice_${Date.now()}`,
      articleId,
      startTime: new Date().toISOString(),
      duration: 0,
      totalCorrect: 0,
      totalQuestions,
      isCompleted: false,
    }
    PracticeStorage.save(record)
    return record
  }, [])

  // 更新练习记录
  const updatePractice = useCallback((record: LocalPracticeRecord) => {
    PracticeStorage.save(record)
  }, [])

  // 完成练习
  const completePractice = useCallback((
    articleId: string,
    correctCount: number,
    totalQuestions: number,
    duration: number,
    questionType: 'reading' | 'cloze' | 'sevenFive' | 'translation' | 'writing' = 'reading'
  ) => {
    const existing = PracticeStorage.getByArticle(articleId)
    
    const record: LocalPracticeRecord = {
      id: existing?.id || `practice_${Date.now()}`,
      articleId,
      startTime: existing?.startTime || new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration,
      totalCorrect: correctCount,
      totalQuestions,
      isCompleted: true,
    }
    
    PracticeStorage.save(record)
    
    // 更新今日统计
    const stats = PracticeStorage.getTodayStats()
    PracticeStorage.updateTodayStats({
      articlesRead: stats.articlesRead + (existing?.isCompleted ? 0 : 1),
      questionsAnswered: stats.questionsAnswered + totalQuestions,
      correctCount: stats.correctCount + correctCount,
      totalTime: stats.totalTime + duration,
    })

    // 更新学习统计（按日期）
    const today = new Date().toISOString().split('T')[0]
    const existingStats = StudyStatsStorage.getByDate(today)
    StudyStatsStorage.update(today, {
      articlesRead: (existingStats?.articlesRead || 0) + (existing?.isCompleted ? 0 : 1),
      questionsAnswered: (existingStats?.questionsAnswered || 0) + totalQuestions,
      correctCount: (existingStats?.correctCount || 0) + correctCount,
      studyTime: (existingStats?.studyTime || 0) + Math.round(duration / 60), // 转换为分钟
      questionTypes: {
        reading: (existingStats?.questionTypes.reading || 0) + (questionType === 'reading' ? totalQuestions : 0),
        cloze: (existingStats?.questionTypes.cloze || 0) + (questionType === 'cloze' ? totalQuestions : 0),
        sevenFive: (existingStats?.questionTypes.sevenFive || 0) + (questionType === 'sevenFive' ? totalQuestions : 0),
        translation: (existingStats?.questionTypes.translation || 0) + (questionType === 'translation' ? totalQuestions : 0),
        writing: (existingStats?.questionTypes.writing || 0) + (questionType === 'writing' ? totalQuestions : 0),
      },
    })

    // 更新成就进度
    const totalStats = StudyStatsStorage.getTotalStats()
    AchievementStorage.updateProgress('questions', totalStats.totalQuestions)
    AchievementStorage.updateProgress('time', totalStats.totalTime)
    if (totalStats.totalQuestions > 0) {
      AchievementStorage.updateProgress('accuracy', Math.round((totalStats.totalCorrect / totalStats.totalQuestions) * 100))
    }
  }, [])

  // 保存答题记录
  const saveAnswer = useCallback((record: LocalAnswerRecord) => {
    AnswerStorage.save(record)
  }, [])

  // 获取文章的答题记录
  const getAnswers = useCallback((articleId: string) => {
    return AnswerStorage.getByArticle(articleId)
  }, [])

  // 清除文章的答题记录
  const clearAnswers = useCallback((articleId: string) => {
    AnswerStorage.clearByArticle(articleId)
  }, [])

  // 获取练习记录
  const getPractice = useCallback((articleId: string) => {
    return PracticeStorage.getByArticle(articleId)
  }, [])

  return {
    createPractice,
    updatePractice,
    completePractice,
    saveAnswer,
    getAnswers,
    clearAnswers,
    getPractice,
  }
}
