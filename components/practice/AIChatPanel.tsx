'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Send, 
  Loader2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Fish,
  Plus
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Question {
  id: string
  questionNum: number
  stem: string
  options: Array<{
    id: string
    optionKey: string
    content: string
  }>
  correctAnswer: string
  userAnswer?: string
  analysis?: string
}

interface AIChatPanelProps {
  articleTitle: string
  articleContent: string
  questions: Question[]
  currentQuestionIndex: number
  answers: Record<string, string>
  isSubmitted: boolean
  onSaveChat: (messages: Message[]) => void
  onSaveErrorNote?: (questionId: string, note: string) => void
  errorNotes?: Record<string, string>
  initialQuestion?: string
}

const GREETINGS = [
  '喵~ 有什么可以帮你的吗？',
  '嗨~ 准备好学习了吗？',
  '欢迎回来！今天也要加油哦！',
  '喵呜~ 让我们一起学习吧！',
]

export default function AIChatPanel({
  articleTitle,
  articleContent,
  questions,
  currentQuestionIndex,
  answers,
  isSubmitted,
  onSaveChat,
  onSaveErrorNote,
  errorNotes = {},
  initialQuestion = '',
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null)
  const [showArticle, setShowArticle] = useState(false)
  const [errorNote, setErrorNote] = useState('')
  const [showErrorNote, setShowErrorNote] = useState(false)
  const [fishCount, setFishCount] = useState(5)
  const [petMessage, setPetMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const currentQuestion = questions[currentQuestionIndex]
  
  useEffect(() => {
    setPetMessage(GREETINGS[Math.floor(Math.random() * GREETINGS.length)])
    setTimeout(() => setPetMessage(''), 4000)
  }, [])
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])
  
  useEffect(() => {
    if (isSubmitted && selectedQuestion === null) {
      setSelectedQuestion(currentQuestionIndex)
    }
  }, [isSubmitted, currentQuestionIndex])
  
  // 当题目解析选中变化时，自动同步到AI助教
  useEffect(() => {
    if (isSubmitted && currentQuestionIndex !== selectedQuestion) {
      setSelectedQuestion(currentQuestionIndex)
    }
  }, [currentQuestionIndex, isSubmitted])
  
  // 处理从题目解析传入的问题
  useEffect(() => {
    if (initialQuestion) {
      setInput(initialQuestion)
    }
  }, [initialQuestion])
  
  const handleFeed = () => {
    if (fishCount > 0) {
      setFishCount(prev => prev - 1)
      setPetMessage('好吃！谢谢~')
      setTimeout(() => setPetMessage(''), 2000)
    }
  }
  
  const handleAddFish = () => {
    setFishCount(prev => prev + 1)
    setPetMessage('谢谢主人的奖励！')
    setTimeout(() => setPetMessage(''), 2000)
  }
  
  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      let context = `文章标题: ${articleTitle}\n\n`
      
      if (selectedQuestion !== null) {
        const q = questions[selectedQuestion]
        context += `【当前题目 Q${q.questionNum}】\n`
        context += `题干: ${q.stem}\n\n选项:\n`
        q.options.forEach(opt => {
          const isSelected = answers[q.id] === opt.optionKey
          const isCorrect = q.correctAnswer === opt.optionKey
          context += `${opt.optionKey}. ${opt.content}`
          if (isSubmitted) {
            if (isCorrect) context += ' ✓'
            if (isSelected && !isCorrect) context += ' ✗'
          }
          context += '\n'
        })
        context += `\n正确答案: ${q.correctAnswer}\n`
        if (q.analysis) context += `\n解析: ${q.analysis}\n`
      }
      
      if (showArticle && articleContent) {
        context += `\n【文章段落】\n${articleContent.split('\n\n').slice(0, 2).join('\n\n')}\n`
      }
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, context, history: messages.slice(-6) }),
      })
      
      const data = await response.json()
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || '抱歉，我暂时无法回答。',
        timestamp: new Date(),
      }])
    } catch (error) {
      console.error('AI chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSaveErrorNote = () => {
    if (selectedQuestion !== null && errorNote.trim()) {
      const q = questions[selectedQuestion]
      onSaveErrorNote?.(q.id, errorNote)
      setShowErrorNote(false)
      setErrorNote('')
      setFishCount(prev => prev + 1)
      setPetMessage('记录成功！奖励一条鱼干~')
      setTimeout(() => setPetMessage(''), 2000)
    }
  }
  
  const isWrongAnswer = selectedQuestion !== null && isSubmitted && 
    answers[questions[selectedQuestion].id] !== questions[selectedQuestion].correctAnswer

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 - 小宠物 */}
      <div className="p-4 border-b border-emerald-100 bg-gradient-to-b from-emerald-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* 小宠物图标 */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                🐱
              </div>
              {/* 消息气泡 */}
              {petMessage && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-xl shadow-md border border-emerald-100 text-xs whitespace-nowrap animate-bounce">
                  {petMessage}
                </div>
              )}
            </div>
            <div>
              <span className="font-medium text-emerald-900">AI 助教</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Fish className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600">{fishCount}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleFeed} disabled={fishCount <= 0}>
              <Fish className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleAddFish}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* 题目选择 */}
      <div className="p-3 border-b border-emerald-100 bg-emerald-50/50">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-emerald-600 mr-1">题目:</span>
          {questions.map((q, index) => {
            const isSelected = selectedQuestion === index
            const userAnswer = answers[q.id]
            const isCorrect = userAnswer === q.correctAnswer
            
            return (
              <button
                key={q.id}
                onClick={() => setSelectedQuestion(index)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                  isSelected 
                    ? 'bg-emerald-500 text-white border-emerald-500' 
                    : 'bg-white hover:bg-emerald-50 border-emerald-200'
                }`}
              >
                Q{q.questionNum}
                {isSubmitted && userAnswer && (
                  <span className="ml-1">{isCorrect ? '✓' : '✗'}</span>
                )}
              </button>
            )
          })}
        </div>
        
        {selectedQuestion !== null && (
          <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-100 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="font-medium text-emerald-600">Q{questions[selectedQuestion].questionNum}:</span>
                <span className="ml-1.5 text-emerald-900">{questions[selectedQuestion].stem}</span>
              </div>
              {isSubmitted && isWrongAnswer && (
                <Button variant="outline" size="sm" onClick={() => setShowErrorNote(!showErrorNote)}>
                  <FileText className="w-3 h-3 mr-1" />
                  记录错因
                </Button>
              )}
            </div>
            
            <div className="mt-2 space-y-1">
              {questions[selectedQuestion].options.map(opt => {
                const isUserChoice = answers[questions[selectedQuestion].id] === opt.optionKey
                const isCorrect = questions[selectedQuestion].correctAnswer === opt.optionKey
                
                return (
                  <div 
                    key={opt.id}
                    className={`text-xs p-2 rounded-lg ${
                      isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      isUserChoice && !isCorrect ? 'bg-red-50 text-red-600 border border-red-200' :
                      'text-emerald-700 bg-emerald-50/50'
                    }`}
                  >
                    <span className="font-medium">{opt.optionKey}.</span> {opt.content}
                    {isCorrect && <span className="ml-2">✓</span>}
                    {isUserChoice && !isCorrect && <span className="ml-2">✗</span>}
                  </div>
                )
              })}
            </div>
            
            {showErrorNote && isWrongAnswer && (
              <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-700 mb-2 font-medium">记录错误原因:</p>
                <Textarea
                  value={errorNote}
                  onChange={(e) => setErrorNote(e.target.value)}
                  placeholder="为什么选错了？"
                  className="min-h-[60px] text-sm border-amber-200"
                />
                <div className="flex justify-end mt-2 gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowErrorNote(false)}>取消</Button>
                  <Button size="sm" onClick={handleSaveErrorNote}>保存</Button>
                </div>
              </div>
            )}
            
            {errorNotes[questions[selectedQuestion].id] && (
              <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-orange-700 font-medium">我的笔记:</p>
                <p className="text-xs text-orange-600 mt-1">{errorNotes[questions[selectedQuestion].id]}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 文章参考 */}
      <div className="px-3 py-2 border-b border-emerald-100 bg-emerald-50/30">
        <button
          onClick={() => setShowArticle(!showArticle)}
          className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          {showArticle ? '隐藏文章' : '显示文章'}
          {showArticle ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        
        {showArticle && (
          <div className="mt-2 p-3 bg-white rounded-lg border border-emerald-100 text-xs text-emerald-700 max-h-24 overflow-auto">
            {articleContent.split('\n\n').slice(0, 2).map((p, i) => (
              <p key={i} className="mb-2">{p}</p>
            ))}
          </div>
        )}
      </div>
      
      {/* 消息列表 */}
      <div 
        className="p-4"
        ref={scrollRef}
        style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto' }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-emerald-600 text-sm mb-4">有什么问题想问我？</p>
            <div className="space-y-2">
              <button
                onClick={() => setInput('这道题为什么选这个答案？')}
                className="block w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-100"
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                这道题为什么选这个答案？
              </button>
              <button
                onClick={() => setInput('帮我分析每个选项')}
                className="block w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-100"
              >
                📝 帮我分析每个选项
              </button>
              <button
                onClick={() => setInput('这篇文章的主旨是什么？')}
                className="block w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-100"
              >
                📖 这篇文章的主旨是什么？
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  msg.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {msg.role === 'user' ? '你' : '🐱'}
                </div>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-emerald-500 text-white rounded-br-md' 
                    : 'bg-emerald-50 text-emerald-800 rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">🐱</div>
                <div className="bg-emerald-50 p-3 rounded-2xl rounded-bl-md">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 输入区 */}
      <div className="p-3 border-t border-emerald-100">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入问题..."
            className="min-h-[44px] max-h-24 resize-none text-sm rounded-xl border-emerald-200 focus:border-emerald-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="sm" className="h-auto px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-emerald-400 mt-2 text-center">Enter 发送 · Shift+Enter 换行</p>
      </div>
    </div>
  )
}
