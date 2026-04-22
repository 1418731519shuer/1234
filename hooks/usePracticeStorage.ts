// 练习记录管理 Hook
import { useCallback } from 'react'
import { PracticeStorage, AnswerStorage, type LocalPracticeRecord, type LocalAnswerRecord } from '@/lib/localStorage'

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
    duration: number
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
