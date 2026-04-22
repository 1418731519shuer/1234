'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import SevenFivePanel from '@/components/practice/SevenFivePanel'
import SevenFiveQuestionPanel from '@/components/practice/SevenFiveQuestionPanel'
import AIChatPanel from '@/components/practice/AIChatPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, Loader2, Highlighter, MousePointer } from 'lucide-react'
import { useTextMark } from '@/hooks/useTextMark'
import { usePracticeStorage } from '@/hooks/usePracticeStorage'
import { WrongQuestionStorage, type LocalWrongQuestion } from '@/lib/localStorage'

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
            if (a.gapNum !== undefined && a.userAnswer) {
              answerMap[a.gapNum] = a.userAnswer
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
  
  const handleAnswer = (blankNum: number, optionKey: string) => {
    setAnswers(prev => ({ ...prev, [blankNum]: optionKey }))
  }
  
  const handleClearAnswer = (blankNum: number) => {
    setAnswers(prev => {
      const newAnswers = { ...prev }
      delete newAnswers[blankNum]
      return newAnswers
    })
  }
  
  const handleNavigate = (index: number) => {
    if (index >= 0 && index < 5) {
      setCurrentIndex(index)
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
        id: `answer_7five_${q.questionNum}`,
        articleId: article.id,
        gapNum: q.questionNum,
        userAnswer: answers[q.questionNum],
        isCorrect,
        answeredAt: new Date().toISOString(),
      })
      
      // 如果答错，添加到错题本
      if (!isCorrect) {
        const wrongQuestion: LocalWrongQuestion = {
          id: `wrong_7five_${q.id}`,
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
  
  // 提取七选五选项（A-G段落）- 从题目的选项中提取
  // 七选五的选项应该是7个段落，每个段落对应一个字母
  const sevenFiveOptions: Array<{ key: string; content: string }> = []
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  
  // 尝试从第一个题目提取选项
  const firstQuestion = article.questions.find(q => q.questionNum >= 41 && q.questionNum <= 45)
  if (firstQuestion) {
    letters.forEach(letter => {
      const opt = firstQuestion.options.find(o => o.optionKey === letter)
      if (opt) {
        sevenFiveOptions.push({ key: letter, content: opt.content })
      }
    })
  }
  
  // 如果选项不足7个，生成模拟数据
  if (sevenFiveOptions.length < 7) {
    sevenFiveOptions.length = 0
    letters.forEach(letter => {
      sevenFiveOptions.push({
        key: letter,
        content: `[${letter}] This is a sample paragraph for option ${letter}. In a real exam, this would be a meaningful paragraph that fits into one of the blanks in the article.`
      })
    })
  }
  
  // 提取七选五空位编号（41-45）
  const blanks = [41, 42, 43, 44, 45]
  
  // 提取正确答案
  const correctAnswers: Record<number, string> = {}
  article.questions
    .filter(q => q.questionNum >= 41 && q.questionNum <= 45)
    .forEach(q => {
      correctAnswers[q.questionNum] = q.correctAnswer
    })
  
  const correctCount = blanks.filter(b => answers[b] === correctAnswers[b]).length
  
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
            <Badge variant="outline" className="text-sm">七选五</Badge>
            {isSubmitted && (
              <Badge className={`${correctCount === 5 ? 'bg-emerald-500' : 'bg-red-400'} text-white text-sm`}>
                {correctCount}/5
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
          <SevenFivePanel
            content={article.content}
            title={article.title}
            options={sevenFiveOptions}
            blanks={blanks}
            answers={answers}
            isSubmitted={isSubmitted}
            correctAnswers={correctAnswers}
            articleId={article.id}
            onAskAI={handleAskAI}
            textMark={textMark}
          />
        </div>
        
        {/* 中间题目解析 - 25% */}
        <div 
          className="border-r border-slate-200 bg-slate-50"
          style={{ width: '25%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <SevenFiveQuestionPanel
            options={sevenFiveOptions}
            blanks={blanks}
            answers={answers}
            currentIndex={currentIndex}
            onNavigate={handleNavigate}
            onAnswer={handleAnswer}
            onClearAnswer={handleClearAnswer}
            onSubmit={handleSubmit}
            isSubmitted={isSubmitted}
            correctAnswers={correctAnswers}
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
            questions={article.questions.filter(q => q.questionNum >= 41 && q.questionNum <= 45).map(q => ({
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
