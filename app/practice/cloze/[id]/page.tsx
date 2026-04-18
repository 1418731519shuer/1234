'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import ClozePanel from '@/components/practice/ClozePanel'
import ClozeQuestionPanel from '@/components/practice/ClozeQuestionPanel'
import AIChatPanel from '@/components/practice/AIChatPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, Loader2 } from 'lucide-react'

interface ClozeBlank {
  blankNum: number
  correctAnswer: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  analysis?: string
}

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

export default function ClozePracticePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentBlank, setCurrentBlank] = useState<number | null>(null)
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
        
        // 默认选中第一个空位
        if (data.questions && data.questions.length > 0) {
          setCurrentBlank(data.questions[0].questionNum)
        }
      } catch (error) {
        console.error('Load article error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchArticle()
  }, [resolvedParams.id])
  
  const handleSelectBlank = (blankNum: number) => {
    setCurrentBlank(blankNum)
  }
  
  const handleAnswer = (blankNum: number, optionKey: string) => {
    setAnswers(prev => ({ ...prev, [blankNum]: optionKey }))
    
    // 选择后自动跳到下一个未答的空位
    const blanks = article?.questions.map(q => q.questionNum).sort((a, b) => a - b) || []
    const currentIndex = blanks.indexOf(blankNum)
    
    // 找下一个未答的空位
    for (let i = currentIndex + 1; i < blanks.length; i++) {
      if (!answers[blanks[i]]) {
        setTimeout(() => setCurrentBlank(blanks[i]), 200)
        return
      }
    }
    
    // 如果后面都答了，找前面未答的
    for (let i = 0; i < currentIndex; i++) {
      if (!answers[blanks[i]]) {
        setTimeout(() => setCurrentBlank(blanks[i]), 200)
        return
      }
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
  
  // 转换为完型填空格式
  const blanks: ClozeBlank[] = article.questions.map(q => ({
    blankNum: q.questionNum,
    correctAnswer: q.correctAnswer,
    options: {
      A: q.options.find(o => o.optionKey === 'A')?.content || '',
      B: q.options.find(o => o.optionKey === 'B')?.content || '',
      C: q.options.find(o => o.optionKey === 'C')?.content || '',
      D: q.options.find(o => o.optionKey === 'D')?.content || '',
    },
    analysis: q.analysis,
  }))
  
  const correctCount = blanks.filter(b => answers[b.blankNum] === b.correctAnswer).length
  
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
            <Badge variant="outline" className="text-sm">完型填空</Badge>
            {isSubmitted && (
              <Badge className={`${correctCount >= 12 ? 'bg-emerald-500' : 'bg-red-400'} text-white text-sm`}>
                {correctCount}/20
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* 主内容区 - 三栏布局 */}
      <div className="flex" style={{ height: 'calc(100vh - 57px)' }}>
        {/* 左侧文章 - 50% */}
        <div 
          className="border-r border-slate-200"
          style={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <ClozePanel
            content={article.content}
            title={article.title}
            blanks={blanks}
            answers={answers}
            currentBlank={currentBlank}
            onSelectBlank={handleSelectBlank}
            isSubmitted={isSubmitted}
            articleId={article.id}
          />
        </div>
        
        {/* 中间题目选项 - 25% */}
        <div 
          className="border-r border-slate-200 bg-slate-50"
          style={{ width: '25%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <ClozeQuestionPanel
            blanks={blanks}
            answers={answers}
            currentBlank={currentBlank}
            onSelectBlank={handleSelectBlank}
            onAnswer={handleAnswer}
            onSubmit={handleSubmit}
            isSubmitted={isSubmitted}
            onAskAI={handleAskAI}
          />
        </div>
        
        {/* 右侧AI问答 - 25% */}
        <div 
          className="bg-white"
          style={{ width: '25%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <AIChatPanel
            articleTitle={article.title}
            articleContent={article.content}
            questions={article.questions.map(q => ({
              ...q,
              userAnswer: answers[q.questionNum],
            }))}
            currentQuestionIndex={currentBlank ? article.questions.findIndex(q => q.questionNum === currentBlank) : 0}
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
