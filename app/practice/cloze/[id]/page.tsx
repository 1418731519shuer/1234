'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import ClozePanel from '@/components/practice/ClozePanel'
import ClozeQuestionPanel from '@/components/practice/ClozeQuestionPanel'
import AIChatPanel from '@/components/practice/AIChatPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, Loader2, Highlighter, MousePointer } from 'lucide-react'
import { useTextMark } from '@/hooks/useTextMark'
import { usePracticeStorage } from '@/hooks/usePracticeStorage'
import { WrongQuestionStorage, type LocalWrongQuestion, AIChatStorage, type LocalAIChat } from '@/lib/localStorage'

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
        
        // 从 localStorage 读取已有的答题记录
        const existingAnswers = practiceStorage.getAnswers(resolvedParams.id)
        if (existingAnswers.length > 0) {
          const answerMap: Record<number, string> = {}
          existingAnswers.forEach(a => {
            if (a.blankNum !== undefined && a.userAnswer) {
              answerMap[a.blankNum] = a.userAnswer
            }
          })
          setAnswers(answerMap)
        }
        
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
    if (!article) return
    
    // 计算正确数量
    let correctCount = 0
    article.questions.forEach(q => {
      if (answers[q.questionNum] === q.correctAnswer) {
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
      const isCorrect = answers[q.questionNum] === q.correctAnswer
      
      practiceStorage.saveAnswer({
        id: `answer_cloze_${q.questionNum}`,
        articleId: article.id,
        blankNum: q.questionNum,
        userAnswer: answers[q.questionNum],
        isCorrect,
        answeredAt: new Date().toISOString(),
      })
      
      // 如果答错，添加到错题本
      if (!isCorrect) {
        const wrongQuestion: LocalWrongQuestion = {
          id: `wrong_cloze_${q.id}`,
          questionId: q.id,
          articleId: article.id,
          articleTitle: article.title,
          year: article.year,
          questionNum: q.questionNum,
          stem: `第${q.questionNum}题: ${q.stem}`,
          userAnswer: answers[q.questionNum] || '',
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
  }
  
  const handleAskAI = (question: string) => {
    setAiQuestion(question)
  }
  
  const handleSaveChat = (userMessage: string, aiResponse: string, category?: string) => {
    if (!article) return
    
    const chat: LocalAIChat = {
      id: `chat_${Date.now()}`,
      articleId: article.id,
      userMessage,
      aiResponse,
      category: category || '完型填空',
      keywords: extractKeywords(userMessage),
      createdAt: new Date().toISOString(),
    }
    
    AIChatStorage.add(chat)
  }
  
  const extractKeywords = (text: string): string[] => {
    const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || []
    const stopWords = ['的', '是', '在', '了', '和', '与', '或', '这', '那', '有', '为', '以', '及', '我', '你', '他', '她', '它']
    return [...new Set(words.filter(w => w.length > 1 && !stopWords.includes(w)))].slice(0, 5)
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
            {/* 模式切换 */}
            {!isSubmitted && (
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
            )}
            <Badge variant="outline" className="text-sm">完型填空</Badge>
            {isSubmitted && (
              <Badge className={`${correctCount >= 12 ? 'bg-emerald-500' : 'bg-red-400'} text-white text-sm`}>
                {correctCount}/20
              </Badge>
            )}
          </div>
        </div>
        {/* 模式提示 */}
        {!isSubmitted && (
          <div className="max-w-7xl mx-auto mt-1">
            <span className="text-xs text-slate-400">
              按 <kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-500">Shift</kbd> 切换 {textMark.isMarkMode ? '答题' : '标记'}模式
              {textMark.marks.length > 0 && ` · 已标记 ${textMark.marks.length} 处`}
            </span>
          </div>
        )}
      </div>
      
      {/* 主内容区 - 三栏布局 */}
      <div className="flex" style={{ height: 'calc(100vh - 75px)' }}>
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
            textMark={textMark}
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
            textMark={textMark}
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
            onSaveChat={handleSaveChat}
            onSaveErrorNote={() => {}}
            errorNotes={{}}
            initialQuestion={aiQuestion}
          />
        </div>
      </div>
    </div>
  )
}
