'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target,
  TrendingUp,
  Award
} from 'lucide-react'

interface ResultStatsProps {
  totalQuestions: number
  correctCount: number
  elapsedTime: number // 秒
  todayStats?: {
    articlesRead: number
    totalQuestions: number
    totalCorrect: number
  }
  onReview: () => void
  onNewPractice: () => void
}

export default function ResultStats({
  totalQuestions,
  correctCount,
  elapsedTime,
  todayStats,
  onReview,
  onNewPractice,
}: ResultStatsProps) {
  const accuracy = Math.round((correctCount / totalQuestions) * 100)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }
  
  const getGrade = () => {
    if (accuracy >= 80) return { text: '优秀', color: 'text-green-600', icon: Award }
    if (accuracy >= 60) return { text: '良好', color: 'text-blue-600', icon: TrendingUp }
    return { text: '继续加油', color: 'text-orange-600', icon: Target }
  }
  
  const grade = getGrade()
  const GradeIcon = grade.icon

  return (
    <div className="space-y-6">
      {/* 本次成绩 */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">本次正确率</p>
              <p className="text-5xl font-bold mt-1">{accuracy}%</p>
            </div>
            <div className={`bg-white/20 rounded-full p-4`}>
              <GradeIcon className="w-12 h-12" />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="secondary" className="bg-white/20 text-white">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              正确 {correctCount}/{totalQuestions}
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white">
              <Clock className="w-3 h-3 mr-1" />
              用时 {formatTime(elapsedTime)}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="flex gap-3">
            <button
              onClick={onReview}
              className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-medium"
            >
              查看解析
            </button>
            <button
              onClick={onNewPractice}
              className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-white font-medium"
            >
              继续练习
            </button>
          </div>
        </CardContent>
      </Card>
      
      {/* 今日统计 */}
      {todayStats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              今日学习
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{todayStats.articlesRead}</p>
                <p className="text-xs text-gray-500">完成文章</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{todayStats.totalQuestions}</p>
                <p className="text-xs text-gray-500">答题数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {todayStats.totalQuestions > 0 
                    ? Math.round((todayStats.totalCorrect / todayStats.totalQuestions) * 100) 
                    : 0}%
                </p>
                <p className="text-xs text-gray-500">正确率</p>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">今日目标进度</span>
                <span className="text-gray-900 font-medium">{todayStats.articlesRead}/5 篇</span>
              </div>
              <Progress value={(todayStats.articlesRead / 5) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 答题详情 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">答题详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                  <span className="text-gray-700">题目 {i + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  {i < correctCount ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-green-600 text-sm">正确</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-600 text-sm">错误</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
