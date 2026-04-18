'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  Target,
  Calendar,
  BookOpen,
  CheckCircle2
} from 'lucide-react'

interface WeekStats {
  total: {
    articles: number
    questions: number
    correct: number
  }
  daily: Record<string, {
    articles: number
    questions: number
    correct: number
  }>
}

export default function StatsPage() {
  const router = useRouter()
  const [todayStats, setTodayStats] = useState<any>(null)
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [todayRes, weekRes] = await Promise.all([
          fetch('/api/practice?type=today'),
          fetch('/api/practice?type=week'),
        ])
        
        setTodayStats(await todayRes.json())
        setWeekStats(await weekRes.json())
      } catch (error) {
        console.error('Fetch stats error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [])
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}小时${mins}分钟`
    return `${mins}分钟`
  }
  
  const weekDays = Object.keys(weekStats?.daily || {}).sort().reverse()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <h1 className="text-xl font-bold">学习统计</h1>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : (
          <>
            {/* 今日统计 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  今日学习
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{todayStats?.articlesRead || 0}</p>
                    <p className="text-xs text-gray-500">完成文章</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{todayStats?.totalCorrect || 0}</p>
                    <p className="text-xs text-gray-500">正确题数</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <Target className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {todayStats?.totalQuestions 
                        ? Math.round((todayStats.totalCorrect / todayStats.totalQuestions) * 100) 
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500">正确率</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{formatTime(todayStats?.totalTime || 0)}</p>
                    <p className="text-xs text-gray-500">学习时长</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">今日目标进度</span>
                    <span className="font-medium">{todayStats?.articlesRead || 0}/5 篇</span>
                  </div>
                  <Progress value={((todayStats?.articlesRead || 0) / 5) * 100} className="h-3" />
                </div>
              </CardContent>
            </Card>
            
            {/* 本周统计 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  本周学习
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{weekStats?.total.articles || 0}</p>
                    <p className="text-sm text-gray-500">完成文章</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{weekStats?.total.questions || 0}</p>
                    <p className="text-sm text-gray-500">答题数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">
                      {weekStats?.total.questions 
                        ? Math.round((weekStats.total.correct / weekStats.total.questions) * 100) 
                        : 0}%
                    </p>
                    <p className="text-sm text-gray-500">正确率</p>
                  </div>
                </div>
                
                {/* 每日详情 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">每日记录</h4>
                  {weekDays.map(date => {
                    const dayData = weekStats?.daily[date]
                    const accuracy = dayData?.questions 
                      ? Math.round((dayData.correct / dayData.questions) * 100) 
                      : 0
                    
                    return (
                      <div key={date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">{date}</span>
                          <Badge variant="outline">{dayData?.articles || 0} 篇</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500">
                            {dayData?.questions || 0} 题
                          </span>
                          <span className={`text-sm font-medium ${accuracy >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                            {accuracy}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* 学习建议 */}
            <Card>
              <CardHeader>
                <CardTitle>学习建议</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {((todayStats?.articlesRead || 0) < 3) && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">1</div>
                      <p className="text-sm text-blue-800">建议每天至少完成3篇文章，保持阅读手感</p>
                    </div>
                  )}
                  
                  {((todayStats?.totalQuestions 
                    ? Math.round((todayStats.totalCorrect / todayStats.totalQuestions) * 100) 
                    : 0) < 60) && (
                    <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                      <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">2</div>
                      <p className="text-sm text-orange-800">正确率偏低，建议回顾错题并分析原因</p>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">3</div>
                    <p className="text-sm text-green-800">遇到不懂的长难句，可以使用AI助教进行解析</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
