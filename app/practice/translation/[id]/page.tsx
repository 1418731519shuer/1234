'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import TranslationPanel from '@/components/practice/TranslationPanel'
import TranslationQuestionPanel from '@/components/practice/TranslationQuestionPanel'
import AIChatPanel from '@/components/practice/AIChatPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, Loader2, Highlighter, MousePointer } from 'lucide-react'
import { useTextMark } from '@/hooks/useTextMark'

interface TranslationSentence {
  id: string
  sentenceNum: number
  english: string
  chinese?: string
  userAnswer?: string
  analysis?: string
}

interface Article {
  id: string
  title: string
  content: string
  translation?: string
  source: string
  year: number
  questions: Array<{
    id: string
    questionNum: number
    stem: string
    correctAnswer: string
    analysis: string
  }>
}

export default function TranslationPracticePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [sentences, setSentences] = useState<TranslationSentence[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [startTime] = useState(new Date())
  const [practiceId, setPracticeId] = useState<string>('')
  const [aiQuestion, setAiQuestion] = useState<string>('')
  
  // 标记功能
  const textMark = useTextMark(isSubmitted)
  
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/articles/${resolvedParams.id}`)
        const data = await response.json()
        setArticle(data)
        
        // 解析翻译句子
        if (data.questions && data.questions.length > 0) {
          const translationSentences: TranslationSentence[] = data.questions.map((q: any) => ({
            id: q.id,
            sentenceNum: q.questionNum,
            english: q.stem, // 英文原文存在stem字段
            chinese: q.correctAnswer, // 参考译文存在correctAnswer字段
            analysis: q.analysis,
          }))
          setSentences(translationSentences)
        }
        
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
  
  const handleAnswerChange = (sentenceId: string, answer: string) => {
    setSentences(prev => prev.map(s => 
      s.id === sentenceId ? { ...s, userAnswer: answer } : s
    ))
  }
  
  const handleSubmit = async () => {
    if (!article || !practiceId) return
    
    const answers: Record<string, string> = {}
    sentences.forEach(s => {
      if (s.userAnswer) {
        answers[s.id] = s.userAnswer
      }
    })
    
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
  
  return (
    <div className="min-h-screen bg-slate-100">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              <Home className="w-4 h-4 mr-1.5" />
              首页
            </Button>
            <span className="text-slate-300">|</span>
            <h1 className="font-medium text-slate-700 truncate max-w-md">{article.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* 模式切换 */}
            <div 
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm cursor-pointer transition-all border"
              style={{ 
                background: textMark.isMarkMode ? '#fef08a' : '#f1f5f9',
                borderColor: textMark.isMarkMode ? '#facc15' : '#e2e8f0',
                color: textMark.isMarkMode ? '#854d0e' : '#64748b'
              }}
              onClick={() => textMark.setIsMarkMode(!textMark.isMarkMode)}
            >
              {textMark.isMarkMode ? (
                <>
                  <Highlighter className="w-4 h-4" />
                  <span>标记模式</span>
                </>
              ) : (
                <>
                  <MousePointer className="w-4 h-4" />
                  <span>答题模式</span>
                </>
              )}
            </div>
            <Badge variant="outline" className="text-sm">
              翻译
            </Badge>
            {isSubmitted && (
              <Badge className="bg-emerald-500 text-white text-sm">已完成</Badge>
            )}
          </div>
        </div>
        {/* 模式提示 */}
        <div className="max-w-7xl mx-auto mt-1">
          <span className="text-xs text-slate-400">
            按 <kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-500">Shift</kbd> 切换 {textMark.isMarkMode ? '答题' : '标记'}模式
            {textMark.marks.length > 0 && ` · 已标记 ${textMark.marks.length} 处`}
          </span>
        </div>
      </div>
      
      {/* 主内容区 - 三栏布局 */}
      <div className="flex" style={{ height: 'calc(100vh - 75px)' }}>
        {/* 左侧英文原文 - 50% */}
        <div 
          className="border-r border-slate-200 bg-white"
          style={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <TranslationPanel
            sentences={sentences}
            currentIndex={currentIndex}
            onSelectSentence={setCurrentIndex}
            isSubmitted={isSubmitted}
            textMark={textMark}
            onAskAI={handleAskAI}
          />
        </div>
        
        {/* 中间翻译输入 - 25% */}
        <div 
          className="border-r border-slate-200 bg-slate-50"
          style={{ width: '25%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <TranslationQuestionPanel
            sentences={sentences}
            currentIndex={currentIndex}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleSubmit}
            isSubmitted={isSubmitted}
            startTime={startTime}
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
            questions={sentences.map(s => ({
              id: s.id,
              questionNum: s.sentenceNum,
              stem: s.english,
              correctAnswer: s.chinese || '',
              analysis: s.analysis || '',
              userAnswer: s.userAnswer,
              options: [],
            }))}
            currentQuestionIndex={currentIndex}
            answers={sentences.reduce((acc, s) => {
              if (s.userAnswer) acc[s.id] = s.userAnswer
              return acc
            }, {} as Record<string, string>)}
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
