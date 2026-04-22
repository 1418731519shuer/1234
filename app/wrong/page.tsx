'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ArrowLeft, 
  Target,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { WrongQuestionStorage, type LocalWrongQuestion } from '@/lib/localStorage'

export default function WrongQuestionsPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<LocalWrongQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    // 从 localStorage 读取错题
    const wrongs = WrongQuestionStorage.getAll()
    setQuestions(wrongs)
    setLoading(false)
  }, [])

  const handleMarkMastered = (questionId: string) => {
    WrongQuestionStorage.markMastered(questionId)
    setQuestions(prev =>
      prev.map(q => q.questionId === questionId ? { ...q, isMastered: true } : q)
    )
  }

  const handleDelete = (questionId: string) => {
    WrongQuestionStorage.remove(questionId)
    setQuestions(prev => prev.filter(q => q.questionId !== questionId))
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const wrongCount = questions.filter(q => !q.isMastered).length
  const masteredCount = questions.filter(q => q.isMastered).length

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
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
                        {q.questionNum && (
                          <Badge variant={q.isMastered ? "outline" : "destructive"}>
                            Q{q.questionNum}
                          </Badge>
                        )}
                        {q.year && (
                          <Badge variant="secondary">{q.year}</Badge>
                        )}
                        {q.isMastered && (
                          <Badge variant="outline" className="text-green-600">
                            已掌握
                          </Badge>
                        )}
                        {q.wrongCount > 1 && (
                          <Badge variant="outline" className="text-orange-500">
                            错{q.wrongCount}次
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-sm font-medium">
                        {q.stem || '题目内容'}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 答案对比 */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">你的答案：</span>
                        <span className="text-red-500 font-medium">{q.userAnswer}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">正确答案：</span>
                        <span className="text-green-600 font-medium">{q.correctAnswer}</span>
                      </div>
                    </div>
                  </div>

                  {/* 关联段落 - 可展开 */}
                  {q.relatedParagraph && (
                    <div className="mb-3">
                      <button
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                        onClick={() => toggleExpand(q.id)}
                      >
                        <FileText className="w-4 h-4" />
                        关联段落
                        {expandedId === q.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {expandedId === q.id && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                          {q.relatedParagraph}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 错因分析 */}
                  {q.analysis && (
                    <div className="mb-3 p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs text-amber-600 mb-1">错因分析</p>
                      <p className="text-sm text-gray-700">{q.analysis}</p>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-xs text-gray-400">
                      {q.articleTitle || '来源文章'}
                    </p>
                    <div className="flex items-center gap-2">
                      {!q.isMastered && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkMastered(q.questionId)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          已掌握
                        </Button>
                      )}
                      <Link href={`/practice/${q.articleId}`}>
                        <Button variant="default" size="sm">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          跳转练习
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(q.questionId)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
