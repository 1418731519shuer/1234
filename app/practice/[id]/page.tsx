'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import ReadingPanel from '@/components/practice/ReadingPanel'
import QuestionPanel from '@/components/practice/QuestionPanel'
import AIChatPanel from '@/components/practice/AIChatPanel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Home,
  Loader2,
  PanelRightOpen,
  PanelRightClose,
  Highlighter,
  MousePointer
} from 'lucide-react'
import { useTextMark } from '@/hooks/useTextMark'
import { usePracticeStorage } from '@/hooks/usePracticeStorage'
import { WrongQuestionStorage, type LocalWrongQuestion, AIChatStorage, type LocalAIChat } from '@/lib/localStorage'

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

interface Highlight {
  id: string
  text: string
  color: string
  questionNum: number
}

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [startTime] = useState(new Date())
  const [showAI, setShowAI] = useState(false)
  const [errorNotes, setErrorNotes] = useState<Record<string, string>>({})
  const [translation, setTranslation] = useState<Array<{english: string, chinese: string}>>([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [aiQuestion, setAiQuestion] = useState<string>('')
  
  // 标记功能
  const textMark = useTextMark(isSubmitted)
  
  // 本地存储
  const practiceStorage = usePracticeStorage()
  
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/articles/${resolvedParams.id}`)
        const data = await response.json()
        setArticle(data)
        
        if (data.translation) {
          // 尝试解析翻译数据
          try {
            const parsed = typeof data.translation === 'string' ? JSON.parse(data.translation) : data.translation
            if (Array.isArray(parsed)) {
              setTranslation(parsed)
            }
          } catch {
            // 如果解析失败，忽略
          }
        }
        
        // 从 localStorage 读取已有的答题记录
        const existingAnswers = practiceStorage.getAnswers(resolvedParams.id)
        if (existingAnswers.length > 0) {
          const answerMap: Record<string, string> = {}
          existingAnswers.forEach(a => {
            if (a.questionId && a.userAnswer) {
              answerMap[a.questionId] = a.userAnswer
            }
          })
          setAnswers(answerMap)
        }
      } catch (error) {
        console.error('Load article error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchArticle()
  }, [resolvedParams.id])
  
  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }
  
  const handleNavigate = (index: number) => {
    if (index >= 0 && index < (article?.questions.length || 0)) {
      setCurrentIndex(index)
    }
  }
  
  const handleHighlight = (text: string, color: string, questionNum: number) => {
    const existingIndex = highlights.findIndex(h => h.text === text)
    
    if (existingIndex >= 0) {
      setHighlights(prev => {
        const updated = [...prev]
        updated[existingIndex] = { ...updated[existingIndex], color, questionNum }
        return updated
      })
    } else {
      setHighlights(prev => [...prev, { 
        id: `${Date.now()}-${Math.random()}`, 
        text, 
        color, 
        questionNum 
      }])
    }
  }
  
  const handleRemoveHighlight = (text: string) => {
    setHighlights(prev => prev.filter(h => h.text !== text))
  }
  
  const handleUpdateHighlight = (text: string, color: string) => {
    setHighlights(prev => prev.map(h => 
      h.text === text ? { ...h, color } : h
    ))
  }
  
  const handleSubmit = async () => {
    if (!article) return
    
    // 计算正确数量
    let correctCount = 0
    article.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++
      }
    })
    
    const duration = Math.floor((Date.now() - startTime.getTime()) / 1000)
    
    // 保存到 localStorage
    practiceStorage.completePractice(
      article.id,
      correctCount,
      article.questions.length,
      duration
    )
    
    // 保存答题记录并记录错题
    article.questions.forEach(q => {
      const isCorrect = answers[q.id] === q.correctAnswer
      
      practiceStorage.saveAnswer({
        id: `answer_${q.id}`,
        articleId: article.id,
        questionId: q.id,
        userAnswer: answers[q.id],
        isCorrect,
        answeredAt: new Date().toISOString(),
      })
      
      // 如果答错，添加到错题本
      if (!isCorrect) {
        const wrongQuestion: LocalWrongQuestion = {
          id: `wrong_${q.id}`,
          questionId: q.id,
          articleId: article.id,
          articleTitle: article.title,
          year: article.year,
          questionNum: q.questionNum,
          stem: q.stem,
          userAnswer: answers[q.id] || '',
          correctAnswer: q.correctAnswer,
          analysis: q.analysis,
          wrongCount: 1,
          lastWrongAt: new Date().toISOString(),
          isMastered: false,
        }
        WrongQuestionStorage.add(wrongQuestion)
      }
    })
    
    setIsSubmitted(true)
    setShowAI(true)
  }
  
  const handleSaveChat = (userMessage: string, aiResponse: string, category?: string) => {
    if (!article) return
    
    const chat: LocalAIChat = {
      id: `chat_${Date.now()}`,
      articleId: article.id,
      userMessage,
      aiResponse,
      category: category || 'AI问答',
      keywords: extractKeywords(userMessage),
      createdAt: new Date().toISOString(),
    }
    
    AIChatStorage.add(chat)
  }
  
  // 提取关键词
  const extractKeywords = (text: string): string[] => {
    const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || []
    const stopWords = ['的', '是', '在', '了', '和', '与', '或', '这', '那', '有', '为', '以', '及', '我', '你', '他', '她', '它']
    return [...new Set(words.filter(w => w.length > 1 && !stopWords.includes(w)))].slice(0, 5)
  }
  
  const handleSaveErrorNote = (questionId: string, note: string) => {
    setErrorNotes(prev => ({ ...prev, [questionId]: note }))
    // 笔记暂时只保存在组件状态中，刷新后丢失
    // 如果需要持久化，可以扩展 localStorage
  }
  
  const handleTranslate = async () => {
    if (!article || translation.length > 0) return
    
    setIsTranslating(true)
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          content: article.content,
        }),
      })
      const data = await response.json()
      setTranslation(data.sentences || [])
    } catch (error) {
      console.error('Translate error:', error)
    } finally {
      setIsTranslating(false)
    }
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
  
  const correctCount = article.questions.filter(
    q => answers[q.id] === q.correctAnswer
  ).length
  
  // 已提交，显示结果页面
  if (isSubmitted) {
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
              <Badge variant="outline" className="text-sm">
                正确率 {Math.round((correctCount / article.questions.length) * 100)}%
              </Badge>
              <Badge className="bg-emerald-500 text-sm">
                {correctCount}/{article.questions.length}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* 主内容区 - 三栏布局 */}
        <div className="flex" style={{ height: 'calc(100vh - 57px)' }}>
          {/* 左侧文章 - 50% */}
          <div className="border-r border-slate-200 bg-white" style={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <ReadingPanel
              content={article.content}
              title={article.title}
              highlights={highlights}
              currentQuestion={currentIndex + 1}
              onHighlight={handleHighlight}
              onRemoveHighlight={handleRemoveHighlight}
              onUpdateHighlight={handleUpdateHighlight}
              translation={translation}
              onTranslate={handleTranslate}
              isTranslating={isTranslating}
              articleId={article.id}
              isSubmitted={isSubmitted}
            />
          </div>
          
          {/* 中间题目解析 - 25% */}
          <div className="border-r border-slate-200 bg-slate-50" style={{ width: '25%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="p-3 border-b bg-white" style={{ flexShrink: 0 }}>
              <h2 className="font-semibold text-slate-800">题目解析</h2>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} className="p-3">
              <div className="space-y-3">
                {article.questions.map((q, i) => {
                  const isCorrect = answers[q.id] === q.correctAnswer
                  const userAnswer = answers[q.id]
                  
                  return (
                    <Card 
                      key={q.id} 
                      className={`p-4 cursor-pointer transition-all border-slate-200 ${
                        currentIndex === i ? 'ring-2 ring-blue-500' : ''
                      } ${isCorrect ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-400'}`}
                      onClick={() => setCurrentIndex(i)}
                    >
                      <div className="flex items-start gap-2 mb-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                          isCorrect ? 'bg-emerald-500' : 'bg-red-400'
                        }`}>
                          {i + 1}
                        </span>
                        <p className="font-medium text-sm text-slate-800 flex-1">{q.stem}</p>
                      </div>
                      
                      <div className="space-y-1.5 ml-8">
                        {q.options.map(opt => {
                          const isUserChoice = userAnswer === opt.optionKey
                          const isCorrectOption = q.correctAnswer === opt.optionKey
                          
                          return (
                            <div 
                              key={opt.id} 
                              className={`text-xs p-2 rounded-lg ${
                                isCorrectOption ? 'bg-emerald-50 text-emerald-700 font-medium' :
                                isUserChoice && !isCorrectOption ? 'bg-red-50 text-red-600' :
                                'text-slate-600'
                              }`}
                            >
                              <span className="font-medium">{opt.optionKey}.</span> {opt.content}
                              {isCorrectOption && <span className="ml-2">✓</span>}
                              {isUserChoice && !isCorrectOption && <span className="ml-2">✗</span>}
                            </div>
                          )
                        })}
                      </div>
                      
                      {q.analysis && (
                        <div className="mt-3 ml-8 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                          <span className="font-medium">解析：</span>{q.analysis}
                        </div>
                      )}
                      
                      {/* 问AI按钮 */}
                      <div className="mt-3 ml-8">
                        <button
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentIndex(i)
                            setAiQuestion(`请帮我详细解析第${i + 1}题：${q.stem}`)
                            setShowAI(true)
                          }}
                        >
                          <span>🐱</span> 问AI助教
                        </button>
                      </div>
                      
                      {errorNotes[q.id] && (
                        <div className="mt-2 ml-8 p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                          <span className="font-medium">笔记：</span>{errorNotes[q.id]}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* 右侧AI问答 - 25% */}
          <div className="bg-white" style={{ width: '25%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <AIChatPanel
              articleTitle={article.title}
              articleContent={article.content}
              questions={article.questions.map(q => ({
                ...q,
                userAnswer: answers[q.id],
              }))}
              currentQuestionIndex={currentIndex}
              answers={answers}
              isSubmitted={isSubmitted}
              onSaveChat={handleSaveChat}
              onSaveErrorNote={handleSaveErrorNote}
              errorNotes={errorNotes}
              initialQuestion={aiQuestion}
            />
          </div>
        </div>
      </div>
    )
  }
  
  // 答题中
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
              {Object.keys(answers).length}/{article.questions.length} 已答
            </Badge>
            <Button
              variant={showAI ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAI(!showAI)}
            >
              {showAI ? (
                <>
                  <PanelRightClose className="w-4 h-4 mr-1.5" />
                  隐藏AI
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-4 h-4 mr-1.5" />
                  AI助教
                </>
              )}
            </Button>
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
      
      {/* 主内容区 */}
      <div className="flex h-[calc(100vh-75px)]">
        {/* 左侧文章 */}
        <div 
          className={`${showAI ? 'w-[35%]' : 'w-1/2'} min-w-0 border-r border-slate-200 transition-all duration-300`}
          style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
        >
          <ReadingPanel
            content={article.content}
            title={article.title}
            highlights={highlights}
            currentQuestion={currentIndex + 1}
            onHighlight={handleHighlight}
            onRemoveHighlight={handleRemoveHighlight}
            onUpdateHighlight={handleUpdateHighlight}
            translation={translation}
            onTranslate={handleTranslate}
            isTranslating={isTranslating}
            textMark={textMark}
          />
        </div>
        
        {/* 右侧题目 */}
        <div 
          className={`${showAI ? 'w-[35%]' : 'w-1/2'} min-w-0 border-r border-slate-200 transition-all duration-300`}
          style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
        >
          <QuestionPanel
            questions={article.questions}
            currentIndex={currentIndex}
            answers={answers}
            isSubmitted={isSubmitted}
            onAnswer={handleAnswer}
            onNavigate={handleNavigate}
            onSubmit={handleSubmit}
            startTime={startTime}
            textMark={textMark}
          />
        </div>
        
        {/* AI面板 */}
        {showAI && (
          <div 
            className="w-[30%] min-w-0 border-l border-slate-200 animate-in slide-in-from-right"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
          >
            <AIChatPanel
              articleTitle={article.title}
              articleContent={article.content}
              questions={article.questions.map(q => ({
                ...q,
                userAnswer: answers[q.id],
              }))}
              currentQuestionIndex={currentIndex}
              answers={answers}
              isSubmitted={isSubmitted}
              onSaveChat={handleSaveChat}
              onSaveErrorNote={handleSaveErrorNote}
              errorNotes={errorNotes}
            />
          </div>
        )}
      </div>
    </div>
  )
}
