'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import SevenFivePanel from '@/components/practice/SevenFivePanel'
import SevenFiveQuestionPanel from '@/components/practice/SevenFiveQuestionPanel'
import AIChatPanel from '@/components/practice/AIChatPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Home,
  Loader2
} from 'lucide-react'

interface Article {
  id: string
  title: string
  content: string
  source: string
  year: number
  questions: Array<{
    id: string
    questionNum: number
    stem: string
    questionType: string
    correctAnswer: string
    analysis: string
    options: Array<{
      id: string
      optionKey: string
      content: string
    }>
  }>
}

export default function SevenFivePracticePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [startTime] = useState(new Date())
  const [practiceId, setPracticeId] = useState<string>('')
  const [aiQuestion, setAiQuestion] = useState<string>('')
  
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/articles/${resolvedParams.id}`)
        const data = await response.json()
        setArticle(data)
        
        const practiceRes = await fetch('/api/practice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId: resolvedParams.id }),
        })
        const practice = await practiceRes.json()
        setPracticeId(practice.id)
      } catch (error) {
        console.error('Load article error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchArticle()
  }, [resolvedParams.id])
  
  const handleAnswer = (questionNum: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionNum]: answer }))
  }
  
  const handleClearAnswer = (questionNum: number) => {
    setAnswers(prev => {
      const newAnswers = { ...prev }
      delete newAnswers[questionNum]
      return newAnswers
    })
  }
  
  const handleNavigate = (index: number) => {
    if (index >= 0 && index < 5) {
      setCurrentIndex(index)
    }
  }
  
  const handleSubmit = async () => {
    if (!article || !practiceId) return
    
    try {
      await fetch('/api/practice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practiceId,
          answers,
          duration: Math.floor((Date.now() - startTime.getTime()) / 1000),
        }),
      })
      
      setIsSubmitted(true)
    } catch (error) {
      console.error('Submit error:', error)
    }
  }
  
  const handleAskAI = (question: string) => {
    setAiQuestion(question)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">加载中...</p>
        </div>
      </div>
    )
  }
  
  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500 mb-4">文章不存在</p>
          <Button onClick={() => router.push('/')}>返回首页</Button>
        </div>
      </div>
    )
  }
  
  // 提取七选五选项（A-G）
  const sevenFiveOptions = article.questions
    .filter(q => q.questionNum >= 41 && q.questionNum <= 45)
    .flatMap(q => q.options)
    .filter((opt, index, self) => 
      opt.optionKey >= 'A' && opt.optionKey <= 'G' &&
      self.findIndex(o => o.optionKey === opt.optionKey) === index
    )
  
  // 提取七选五题目（41-45）
  const sevenFiveQuestions = article.questions
    .filter(q => q.questionNum >= 41 && q.questionNum <= 45)
    .sort((a, b) => a.questionNum - b.questionNum)
  
  const correctCount = sevenFiveQuestions.filter(
    q => answers[q.questionNum] === q.correctAnswer
  ).length
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              <Home className="w-4 h-4 mr-1.5" />
              首页
            </Button>
            <span className="text-slate-300">|</span>
            <h1 className="font-medium text-slate-700 truncate max-w-lg">{article.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">七选五</Badge>
            {isSubmitted && (
              <Badge className={`${correctCount === 5 ? 'bg-emerald-500' : 'bg-red-400'} text-white text-sm`}>
                {correctCount}/5
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* 主内容区 - 三栏布局 */}
      <div className="flex" style={{ height: 'calc(100vh - 57px)' }}>
        {/* 左侧文章 - 50% */}
        <div className="border-r border-slate-200 bg-white" style={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <SevenFivePanel
            content={article.content}
            title={article.title}
            options={sevenFiveOptions}
            questions={sevenFiveQuestions}
            answers={answers}
            currentQuestion={sevenFiveQuestions[currentIndex]?.questionNum || 41}
            onAnswer={handleAnswer}
            isSubmitted={isSubmitted}
            articleId={article.id}
            onAskAI={handleAskAI}
          />
        </div>
        
        {/* 中间题目解析 - 25% */}
        <div className="border-r border-slate-200 bg-slate-50" style={{ width: '25%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <SevenFiveQuestionPanel
            options={sevenFiveOptions}
            questions={sevenFiveQuestions}
            answers={answers}
            currentIndex={currentIndex}
            onNavigate={handleNavigate}
            onAnswer={handleAnswer}
            onClearAnswer={handleClearAnswer}
            onSubmit={handleSubmit}
            isSubmitted={isSubmitted}
            onAskAI={handleAskAI}
          />
        </div>
        
        {/* 右侧AI问答 - 25% */}
        <div className="bg-white" style={{ width: '25%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <AIChatPanel
            articleTitle={article.title}
            articleContent={article.content}
            questions={sevenFiveQuestions.map(q => ({
              ...q,
              userAnswer: answers[q.questionNum],
            }))}
            currentQuestionIndex={currentIndex}
            answers={answers}
            isSubmitted={isSubmitted}
            onSaveChat={async () => {}}
            onSaveErrorNote={() => {}}
            errorNotes={{}}
            initialQuestion={aiQuestion}
          />
        </div>
      </div>
    </div>
  )
}
