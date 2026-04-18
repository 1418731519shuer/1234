'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Target,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'

interface WrongQuestion {
  id: string
  questionId: string
  articleId: string
  userAnswer: string
  wrongCount: number
  lastWrongAt: string
  isMastered: boolean
  article: {
    title: string
    year: number | null
  }
  question: {
    questionNum: number
    stem: string
    correctAnswer: string
  }
}

export default function WrongQuestionsPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<WrongQuestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWrongQuestions = async () => {
      try {
        const response = await fetch('/api/practice?type=wrong')
        const data = await response.json()
        setQuestions(data.questions || [])
      } catch (error) {
        console.error('Fetch wrong questions error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWrongQuestions()
  }, [])

  const handleMarkMastered = async (id: string) => {
    try {
      await fetch(`/api/practice/wrong/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMastered: true }),
      })
      setQuestions(prev =>
        prev.map(q => q.id === id ? { ...q, isMastered: true } : q)
      )
    } catch (error) {
      console.error('Mark mastered error:', error)
    }
  }

  const wrongCount = questions.filter(q => !q.isMastered).length
  const masteredCount = questions.filter(q => q.isMastered).length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            错题本
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="text-center">
            <CardContent className="pt-4">
              <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{wrongCount}</p>
              <p className="text-xs text-gray-500">待复习</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4">
              <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{masteredCount}</p>
              <p className="text-xs text-gray-500">已掌握</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4">
              <RefreshCw className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{questions.length}</p>
              <p className="text-xs text-gray-500">总错题</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : questions.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">太棒了！暂无错题</p>
            <p className="text-sm text-gray-400">继续保持，加油！</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <Card 
                key={q.id} 
                className={`hover:shadow-md transition-shadow ${q.isMastered ? 'opacity-60' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={q.isMastered ? "outline" : "destructive"}>
                          Q{q.question.questionNum}
                        </Badge>
                        {q.article.year && (
                          <Badge variant="secondary">{q.article.year}</Badge>
                        )}
                        {q.isMastered && (
                          <Badge variant="outline" className="text-green-600">
                            已掌握
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-sm font-medium">
                        {q.question.stem}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span className="text-red-500">你的答案: {q.userAnswer}</span>
                      <span className="mx-2">|</span>
                      <span className="text-green-600">正确答案: {q.question.correctAnswer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!q.isMastered && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkMastered(q.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          标记已掌握
                        </Button>
                      )}
                      <Link href={`/practice/${q.articleId}`}>
                        <Button variant="default" size="sm">
                          <BookOpen className="w-4 h-4 mr-1" />
                          重新练习
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    来源: {q.article.title}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
