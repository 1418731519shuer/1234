'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  Target, 
  BookOpen,
  Trophy,
  Flame,
  Calendar,
  BarChart3,
  PieChart,
  CheckCircle2
} from 'lucide-react'
import CheckinCard from '@/components/CheckinCard'
import { 
  StudyStatsStorage, 
  AchievementStorage, 
  CheckinStorage,
  type LocalStudyStats,
  type LocalAchievement 
} from '@/lib/localStorage'

export default function StatsPage() {
  const router = useRouter()
  const [weeklyStats, setWeeklyStats] = useState<LocalStudyStats[]>([])
  const [monthlyStats, setMonthlyStats] = useState<LocalStudyStats[]>([])
  const [totalStats, setTotalStats] = useState({ totalQuestions: 0, totalCorrect: 0, totalTime: 0 })
  const [achievements, setAchievements] = useState<LocalAchievement[]>([])
  const [streak, setStreak] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setWeeklyStats(StudyStatsStorage.getWeeklyStats())
    setMonthlyStats(StudyStatsStorage.getMonthlyStats())
    setTotalStats(StudyStatsStorage.getTotalStats())
    setAchievements(AchievementStorage.getAll())
    setStreak(CheckinStorage.getStreak())
  }

  // 计算正确率
  const getAccuracy = (correct: number, total: number) => {
    return total > 0 ? Math.round((correct / total) * 100) : 0
  }

  // 生成趋势图数据
  const getTrendData = () => {
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const stat = weeklyStats.find(s => s.date === dateStr)
      last7Days.push({
        day: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
        date: dateStr,
        accuracy: stat ? getAccuracy(stat.correctCount, stat.questionsAnswered) : 0,
        questions: stat?.questionsAnswered || 0,
        time: stat?.studyTime || 0,
      })
    }
    return last7Days
  }

  // 计算题型分布
  const getQuestionTypeDistribution = () => {
    const distribution = { reading: 0, cloze: 0, sevenFive: 0, translation: 0, writing: 0 }
    monthlyStats.forEach(s => {
      distribution.reading += s.questionTypes.reading
      distribution.cloze += s.questionTypes.cloze
      distribution.sevenFive += s.questionTypes.sevenFive
      distribution.translation += s.questionTypes.translation
      distribution.writing += s.questionTypes.writing
    })
    return distribution
  }

  const trendData = getTrendData()
  const typeDistribution = getQuestionTypeDistribution()
  const totalQuestions = Object.values(typeDistribution).reduce((a, b) => a + b, 0)
  const overallAccuracy = getAccuracy(totalStats.totalCorrect, totalStats.totalQuestions)

  // 今日统计
  const todayStr = new Date().toISOString().split('T')[0]
  const todayStats = weeklyStats.find(s => s.date === todayStr)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            学习统计
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* 打卡卡片 */}
        <CheckinCard />

        {/* 总览统计 */}
        <div className="grid grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-blue-600">{overallAccuracy}%</div>
              <div className="text-xs text-gray-500">总正确率</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold text-purple-600">{totalStats.totalQuestions}</div>
              <div className="text-xs text-gray-500">完成题目</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold text-green-600">{Math.round(totalStats.totalTime / 60)}</div>
              <div className="text-xs text-gray-500">学习小时</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold text-orange-600">{streak}</div>
              <div className="text-xs text-gray-500">连续天数</div>
            </CardContent>
          </Card>
        </div>

        {/* 今日目标 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              今日目标
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>文章阅读</span>
                  <span>{todayStats?.articlesRead || 0}/3 篇</span>
                </div>
                <Progress value={((todayStats?.articlesRead || 0) / 3) * 100} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>题目练习</span>
                  <span>{todayStats?.questionsAnswered || 0}/20 题</span>
                </div>
                <Progress value={((todayStats?.questionsAnswered || 0) / 20) * 100} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>学习时长</span>
                  <span>{todayStats?.studyTime || 0}/60 分钟</span>
                </div>
                <Progress value={((todayStats?.studyTime || 0) / 60) * 100} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 详细统计 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">趋势</TabsTrigger>
            <TabsTrigger value="types">题型</TabsTrigger>
            <TabsTrigger value="achievements">成就</TabsTrigger>
          </TabsList>

          {/* 趋势图 */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  正确率趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-32 gap-2">
                  {trendData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all"
                        style={{ height: `${d.accuracy}%`, minHeight: d.accuracy > 0 ? '4px' : '0' }}
                      />
                      <div className="text-xs text-gray-400 mt-1">{d.day}</div>
                      <div className="text-xs font-medium text-blue-600">{d.accuracy}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  学习时长
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-32 gap-2">
                  {trendData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all"
                        style={{ height: `${Math.min(d.time / 60 * 100, 100)}%`, minHeight: d.time > 0 ? '4px' : '0' }}
                      />
                      <div className="text-xs text-gray-400 mt-1">{d.day}</div>
                      <div className="text-xs font-medium text-green-600">{d.time}分</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 题型分布 */}
          <TabsContent value="types">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  题型分布（近30天）
                </CardTitle>
              </CardHeader>
              <CardContent>
                {totalQuestions === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    暂无练习数据，开始刷题后这里会显示统计
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { key: 'reading', label: '阅读理解', icon: '📖', color: 'bg-blue-500' },
                      { key: 'cloze', label: '完型填空', icon: '📝', color: 'bg-purple-500' },
                      { key: 'sevenFive', label: '七选五', icon: '🔗', color: 'bg-green-500' },
                      { key: 'translation', label: '翻译', icon: '🌐', color: 'bg-orange-500' },
                      { key: 'writing', label: '写作', icon: '✍️', color: 'bg-pink-500' },
                    ].map(type => {
                      const count = typeDistribution[type.key as keyof typeof typeDistribution]
                      const percent = totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0
                      return (
                        <div key={type.key} className="flex items-center gap-3">
                          <span className="text-lg">{type.icon}</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{type.label}</span>
                              <span className="text-gray-500">{count}题 ({percent}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${type.color} rounded-full transition-all`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 成就 */}
          <TabsContent value="achievements">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  成就徽章 ({achievements.filter(a => a.unlockedAt).length}/{achievements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map(a => (
                    <div 
                      key={a.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        a.unlockedAt 
                          ? 'border-yellow-400 bg-yellow-50' 
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{a.icon}</span>
                        <div>
                          <div className={`font-medium text-sm ${a.unlockedAt ? 'text-yellow-700' : 'text-gray-500'}`}>
                            {a.name}
                          </div>
                          <div className="text-xs text-gray-400">{a.description}</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${a.unlockedAt ? 'bg-yellow-500' : 'bg-gray-400'}`}
                            style={{ width: `${Math.min((a.progress / a.target) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-400 mt-1 text-right">
                          {a.progress}/{a.target}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 学习建议 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">学习建议</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {((todayStats?.articlesRead || 0) < 3) && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">1</div>
                  <p className="text-sm text-blue-800">建议每天至少完成3篇文章，保持阅读手感</p>
                </div>
              )}
              
              {overallAccuracy < 60 && totalStats.totalQuestions > 10 && (
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">2</div>
                  <p className="text-sm text-orange-800">正确率偏低，建议回顾错题并分析原因</p>
                </div>
              )}
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <p className="text-sm text-green-800">遇到不懂的长难句，可以使用AI助教进行解析</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
