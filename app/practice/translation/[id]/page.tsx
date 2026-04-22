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
import { usePracticeStorage } from '@/hooks/usePracticeStorage'

interface TranslationSentence {
  id: string
  sentenceNum: number
  englishText: string
  referenceCn?: string
  keyVocabulary?: string
  grammarPoints?: string
  scoringRules?: string
  userAnswer?: string
  aiScore?: {
    vocabScore: number
    fluencyScore: number
    totalScore: number
    feedback: string
    keyWordsCorrect: string[]
    keyWordsMissing: string[]
  }
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
  translationSentences?: TranslationSentence[]
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
  const [aiQuestion, setAiQuestion] = useState<string>('')
  const [isBatchScoring, setIsBatchScoring] = useState(false)
  
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
        
        // 解析翻译句子
        if (data.translationSentences && data.translationSentences.length > 0) {
          setSentences(data.translationSentences)
        } else if (data.questions && data.questions.length > 0) {
          // 兼容旧数据格式
          const translationSentences: TranslationSentence[] = data.questions.map((q: any) => ({
            id: q.id,
            sentenceNum: q.questionNum,
            englishText: q.stem,
            referenceCn: q.correctAnswer,
            grammarPoints: q.analysis,
          }))
          setSentences(translationSentences)
        }
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
  
  const handleAIScore = async (sentenceId: string, score: TranslationSentence['aiScore']) => {
    setSentences(prev => prev.map(s => 
      s.id === sentenceId ? { ...s, aiScore: score } : s
    ))
  }
  
  // 批量AI评分
  const batchAIScore = async () => {
    setIsBatchScoring(true)
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      if (!sentence.userAnswer || sentence.aiScore) continue
      
      try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer sk-864e66eafdc648a6ba27607b1518f9bc`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{
              role: 'user',
              content: `请对以下翻译进行评分，严格按照JSON格式返回：

【英文原句】
${sentence.englishText}

【参考译文】
${sentence.referenceCn || '暂无'}

【用户翻译】
${sentence.userAnswer}

请返回以下JSON格式（不要有其他内容）：
{"vocabScore":0.8,"fluencyScore":0.7,"totalScore":1.5,"feedback":"详细反馈","keyWordsCorrect":["词1"],"keyWordsMissing":["词2"]}`
            }],
            temperature: 0.3,
          }),
        })
        
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || ''
        
        let scoreData
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            scoreData = JSON.parse(jsonMatch[0])
          } else {
            throw new Error('No JSON')
          }
        } catch {
          scoreData = {
            vocabScore: 0.5,
            fluencyScore: 0.5,
            totalScore: 1.0,
            feedback: '评分完成',
            keyWordsCorrect: [],
            keyWordsMissing: []
          }
        }
        
        setSentences(prev => prev.map(s => 
          s.id === sentence.id ? { ...s, aiScore: scoreData } : s
        ))
      } catch (error) {
        console.error('Batch score error:', error)
      }
      
      // 稍微延迟避免API限流
      if (i < sentences.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    setIsBatchScoring(false)
  }
  
  const handleSubmit = async (withAIScore: boolean) => {
    if (!article) return
    
    const duration = Math.floor((Date.now() - startTime.getTime()) / 1000)
    
    // 保存到 localStorage（翻译题没有标准答案，只记录完成状态）
    practiceStorage.completePractice(
      article.id,
      sentences.filter(s => s.userAnswer).length, // 已翻译的句子数
      sentences.length,
      duration
    )
    
    setIsSubmitted(true)
    
    // 如果选择AI评分，则批量评分
    if (withAIScore) {
      batchAIScore()
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
              英译汉
            </Badge>
            {isSubmitted && (
              <Badge className="bg-emerald-500 text-white text-sm">已完成</Badge>
            )}
            {isBatchScoring && (
              <Badge className="bg-blue-500 text-white text-sm">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                AI评分中
              </Badge>
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
            content={article.content}
            title={article.title}
            sentences={sentences}
            currentIndex={currentIndex}
            onSelectSentence={setCurrentIndex}
            isSubmitted={isSubmitted}
            textMark={textMark}
            onAskAI={handleAskAI}
            articleId={article.id}
            savedTranslation={article.translation}
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
            onSelectSentence={setCurrentIndex}
            onSubmit={handleSubmit}
            isSubmitted={isSubmitted}
            startTime={startTime}
            onAskAI={handleAskAI}
            onAIScore={handleAIScore}
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
              stem: s.englishText,
              correctAnswer: s.referenceCn || '',
              analysis: s.grammarPoints || '',
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
