'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import WritingPanel from '@/components/practice/WritingPanel'
import WritingTaskPanel from '@/components/practice/WritingTaskPanel'
import AIChatPanel from '@/components/practice/AIChatPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, Loader2 } from 'lucide-react'

interface WritingTask {
  id: string
  taskType: 'small' | 'big'
  title: string
  description: string
  requirements: string[]
  wordCount: { min: number; max: number }
  image?: string
  sampleAnswer?: string
  tips?: string[]
}

interface Article {
  id: string
  title: string
  content: string
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

export default function WritingPracticePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
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
  
  const handleAnswerChange = (answer: string) => {
    if (!article || !tasks[currentTaskIndex]) return
    const taskId = tasks[currentTaskIndex].id
    setUserAnswers(prev => ({ ...prev, [taskId]: answer }))
  }
  
  const handleSubmit = async () => {
    if (!article || !practiceId) return
    
    try {
      await fetch('/api/practice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practiceId,
          answers: userAnswers,
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
  
  // 从文章内容解析写作任务
  // 格式：文章内容中包含小作文和大作文的题目信息
  const tasks: WritingTask[] = article.questions.map((q, i) => ({
    id: q.id,
    taskType: q.questionNum === 1 ? 'small' as const : 'big' as const,
    title: q.stem || (q.questionNum === 1 ? '小作文' : '大作文'),
    description: q.analysis || '',
    requirements: q.options.map(o => o.content),
    wordCount: q.questionNum === 1 ? { min: 100, max: 120 } : { min: 160, max: 200 },
    sampleAnswer: q.correctAnswer || undefined,
    tips: q.questionNum === 1 
      ? ['注意书信格式', '语言简洁明了', '要点齐全']
      : ['描述图画内容', '分析深层含义', '发表个人观点'],
  }))
  
  const currentTask = tasks[currentTaskIndex]
  const currentAnswer = currentTask ? userAnswers[currentTask.id] || '' : ''
  
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
            <Badge variant="outline" className="text-sm">写作</Badge>
            {isSubmitted && (
              <Badge className="bg-emerald-500 text-white text-sm">已完成</Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* 主内容区 - 三栏布局 */}
      <div className="flex" style={{ height: 'calc(100vh - 57px)' }}>
        {/* 左侧写作区 - 50% */}
        <div 
          className="border-r border-slate-200"
          style={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {currentTask && (
            <WritingPanel
              task={currentTask}
              userAnswer={currentAnswer}
              onAnswerChange={handleAnswerChange}
              isSubmitted={isSubmitted}
              onAskAI={handleAskAI}
            />
          )}
        </div>
        
        {/* 中间任务面板 - 25% */}
        <div 
          className="border-r border-slate-200 bg-slate-50"
          style={{ width: '25%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <WritingTaskPanel
            tasks={tasks}
            currentTaskIndex={currentTaskIndex}
            onSelectTask={setCurrentTaskIndex}
            onSubmit={handleSubmit}
            isSubmitted={isSubmitted}
            userAnswers={userAnswers}
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
              userAnswer: userAnswers[q.id],
            }))}
            currentQuestionIndex={currentTaskIndex}
            answers={userAnswers}
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
