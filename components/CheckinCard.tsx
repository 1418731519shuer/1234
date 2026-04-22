'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckinStorage, AchievementStorage, StudyStatsStorage, type LocalCheckinRecord } from '@/lib/localStorage'
import { Flame, Gift, Trophy, Calendar, ChevronRight } from 'lucide-react'

interface CheckinCardProps {
  onCheckin?: () => void
  compact?: boolean
}

export default function CheckinCard({ onCheckin, compact = false }: CheckinCardProps) {
  const [streak, setStreak] = useState(0)
  const [todayRecord, setTodayRecord] = useState<LocalCheckinRecord | null>(null)
  const [weeklyRecords, setWeeklyRecords] = useState<LocalCheckinRecord[]>([])
  const [newAchievement, setNewAchievement] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setStreak(CheckinStorage.getStreak())
    setTodayRecord(CheckinStorage.getToday())
    setWeeklyRecords(CheckinStorage.getWeeklyRecords())
  }

  const handleCheckin = () => {
    const stats = StudyStatsStorage.getByDate(new Date().toISOString().split('T')[0])
    
    CheckinStorage.checkin({
      articlesRead: stats?.articlesRead || 0,
      questionsAnswered: stats?.questionsAnswered || 0,
      correctCount: stats?.correctCount || 0,
      studyTime: stats?.studyTime || 0,
    })

    // 更新成就进度
    const totalStats = StudyStatsStorage.getTotalStats()
    AchievementStorage.updateProgress('streak', CheckinStorage.getStreak() + 1)
    AchievementStorage.updateProgress('questions', totalStats.totalQuestions)
    AchievementStorage.updateProgress('time', totalStats.totalTime)

    // 检查新成就
    const achievements = AchievementStorage.getUnlocked()
    if (achievements.length > 0) {
      const latest = achievements[achievements.length - 1]
      if (latest.unlockedAt && new Date(latest.unlockedAt).toDateString() === new Date().toDateString()) {
        setNewAchievement(latest.name)
        setTimeout(() => setNewAchievement(null), 3000)
      }
    }

    loadData()
    onCheckin?.()
  }

  // 生成本周日历
  const getWeekDays = () => {
    const days = []
    const today = new Date()
    const dayNames = ['日', '一', '二', '三', '四', '五', '六']

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const record = weeklyRecords.find(r => r.date === dateStr)
      const isToday = i === 0

      days.push({
        day: dayNames[date.getDay()],
        date: date.getDate(),
        checked: !!record,
        isToday,
        record,
      })
    }

    return days
  }

  const weekDays = getWeekDays()
  const hasCheckedToday = !!todayRecord

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-orange-800">连续学习 {streak} 天</div>
          <div className="text-xs text-orange-600">
            {hasCheckedToday ? '今日已打卡' : '今日未打卡'}
          </div>
        </div>
        {!hasCheckedToday && (
          <Button size="sm" onClick={handleCheckin} className="bg-orange-500 hover:bg-orange-600">
            打卡
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* 打卡头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{streak}</div>
              <div className="text-xs text-gray-500">连续学习天数</div>
            </div>
          </div>
          {!hasCheckedToday ? (
            <Button onClick={handleCheckin} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
              <Gift className="w-4 h-4 mr-1" />
              打卡
            </Button>
          ) : (
            <Badge className="bg-green-500">
              <Trophy className="w-3 h-3 mr-1" />
              今日已打卡
            </Badge>
          )}
        </div>

        {/* 本周日历 */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={`text-center p-2 rounded-lg transition-all ${
                day.isToday
                  ? 'bg-orange-100 border-2 border-orange-400'
                  : day.checked
                  ? 'bg-green-50'
                  : 'bg-gray-50'
              }`}
            >
              <div className="text-xs text-gray-400 mb-1">{day.day}</div>
              <div
                className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-xs ${
                  day.checked
                    ? 'bg-green-500 text-white'
                    : day.isToday && !hasCheckedToday
                    ? 'bg-orange-200 text-orange-600'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {day.checked ? '✓' : day.date}
              </div>
            </div>
          ))}
        </div>

        {/* 今日统计 */}
        {todayRecord && (
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{todayRecord.articlesRead}</div>
              <div className="text-xs text-gray-500">文章</div>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{todayRecord.questionsAnswered}</div>
              <div className="text-xs text-gray-500">题目</div>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {todayRecord.questionsAnswered > 0
                  ? Math.round((todayRecord.correctCount / todayRecord.questionsAnswered) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-gray-500">正确率</div>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{todayRecord.studyTime}</div>
              <div className="text-xs text-gray-500">分钟</div>
            </div>
          </div>
        )}

        {/* 新成就提示 */}
        {newAchievement && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200 flex items-center gap-2 animate-pulse">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-yellow-700">恭喜解锁成就：{newAchievement}！</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
