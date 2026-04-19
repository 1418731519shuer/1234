'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Clock, Send, ChevronUp, ChevronDown, MessageCircle, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

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

interface TranslationQuestionPanelProps {
  sentences: TranslationSentence[]
  currentIndex: number
  onAnswerChange: (sentenceId: string, answer: string) => void
  onSelectSentence: (index: number) => void
  onSubmit: (withAIScore: boolean) => void
  isSubmitted: boolean
  startTime: Date
  onAskAI?: (question: string) => void
  onAIScore?: (sentenceId: string, score: TranslationSentence['aiScore']) => void
}

export default function TranslationQuestionPanel({
  sentences,
  currentIndex,
  onAnswerChange,
  onSelectSentence,
  onSubmit,
  isSubmitted,
  startTime,
  onAskAI,
  onAIScore,
}: TranslationQuestionPanelProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isScoring, setIsScoring] = useState(false)
  const [showKeyVocab, setShowKeyVocab] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const currentSentence = sentences[currentIndex]
  const answeredCount = sentences.filter(s => s.userAnswer && s.userAnswer.trim()).length
  const allAnswered = answeredCount === sentences.length
  
  // Tab 键跳转到下一个翻译
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !isSubmitted) {
        e.preventDefault()
        // 跳转到下一个句子，如果是最后一个则跳转到第一个
        const nextIndex = currentIndex < sentences.length - 1 ? currentIndex + 1 : 0
        onSelectSentence(nextIndex)
        // 聚焦到新的 textarea
        setTimeout(() => {
          textareaRef.current?.focus()
        }, 0)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, sentences.length, isSubmitted, onSelectSentence])
  
  // 计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // 解析重点词汇
  const parseKeyVocabulary = (keyVocab?: string) => {
    if (!keyVocab) return []
    try {
      return JSON.parse(keyVocab)
    } catch {
      return []
    }
  }
  
  const keyVocabList = parseKeyVocabulary(currentSentence.keyVocabulary)
  
  // AI 评分
  const handleAIScore = async () => {
    if (!currentSentence.userAnswer || !onAIScore) return
    
    setIsScoring(true)
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
${currentSentence.englishText}

【参考译文】
${currentSentence.referenceCn || '暂无'}

【用户翻译】
${currentSentence.userAnswer}

请返回以下JSON格式（不要有其他内容）：
{"vocabScore":0.8,"fluencyScore":0.7,"totalScore":1.5,"feedback":"详细反馈","keyWordsCorrect":["词1","词2"],"keyWordsMissing":["词3"]}

评分标准：
- vocabScore (0-1分)：重点词汇翻译是否正确
- fluencyScore (0-1分)：译文是否通顺、符合中文表达习惯
- totalScore (0-2分)：总分
- feedback：详细反馈（50字以内）
- keyWordsCorrect：翻译正确的关键词数组
- keyWordsMissing：遗漏或翻译错误的关键词数组`
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
          throw new Error('No JSON found')
        }
      } catch {
        scoreData = {
          vocabScore: 0.5,
          fluencyScore: 0.5,
          totalScore: 1.0,
          feedback: content.slice(0, 100),
          keyWordsCorrect: [],
          keyWordsMissing: []
        }
      }
      
      onAIScore(currentSentence.id, scoreData)
    } catch (error) {
      console.error('AI scoring error:', error)
      onAIScore(currentSentence.id, {
        vocabScore: 0.5,
        fluencyScore: 0.5,
        totalScore: 1.0,
        feedback: '评分服务暂时不可用，请稍后重试',
        keyWordsCorrect: [],
        keyWordsMissing: []
      })
    } finally {
      setIsScoring(false)
    }
  }
  
  if (!currentSentence) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        暂无翻译内容
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* 标题栏 */}
      <div className="p-3 border-b bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              第 {currentSentence.sentenceNum} / {sentences.length} 句
            </Badge>
            <Badge variant="outline" className="text-sm text-blue-600">
              {answeredCount}/{sentences.length} 已翻译
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </div>
      
      {/* 句子导航 */}
      <div className="p-2 border-b bg-white flex-shrink-0">
        <div className="flex gap-1 justify-center flex-wrap">
          {sentences.map((sentence, index) => {
            const isCurrent = index === currentIndex
            const hasAnswer = !!sentence.userAnswer
            
            return (
              <button
                key={sentence.id}
                onClick={() => onSelectSentence(index)}
                className={`
                  w-8 h-8 rounded-lg font-medium text-sm transition-all
                  ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                  ${isSubmitted && sentence.aiScore
                    ? sentence.aiScore.totalScore >= 1.5 
                      ? 'bg-green-100 text-green-700 border-2 border-green-400'
                      : 'bg-red-100 text-red-700 border-2 border-red-400'
                    : hasAnswer
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {sentence.sentenceNum}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* 翻译内容 */}
      <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
        {/* 英文原句 */}
        <div className="mb-4">
          <div className="text-xs font-medium text-slate-500 mb-2">英文原句（划线部分）</div>
          <div className="p-4 rounded-xl bg-yellow-50 border-2 border-yellow-300">
            <p className="text-base text-gray-800 leading-relaxed">{currentSentence.englishText}</p>
          </div>
        </div>
        
        {/* 重点词汇 */}
        {keyVocabList.length > 0 && (
          <div className="mb-4">
            <button
              className="flex items-center gap-2 text-xs font-medium text-amber-600 mb-2"
              onClick={() => setShowKeyVocab(!showKeyVocab)}
            >
              <span>重点词汇 ({keyVocabList.length})</span>
              {showKeyVocab ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showKeyVocab && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex flex-wrap gap-2">
                  {keyVocabList.map((vocab: any, i: number) => (
                    <div key={i} className="px-2 py-1 rounded bg-white border border-amber-200 text-sm">
                      <span className="font-medium text-amber-700">{vocab.word}</span>
                      <span className="text-gray-600 ml-1">{vocab.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 翻译输入 */}
        <div className="mb-4">
          <div className="text-xs font-medium text-slate-500 mb-2">你的翻译</div>
          <Textarea
            ref={textareaRef}
            value={currentSentence.userAnswer || ''}
            onChange={(e) => onAnswerChange(currentSentence.id, e.target.value)}
            placeholder="请输入中文翻译..."
            disabled={isSubmitted}
            className="min-h-[100px] resize-none"
          />
          <div className="text-xs text-slate-400 mt-1">
            按 Tab 键跳转到下一句
          </div>
        </div>
        
        {/* AI 评分结果 */}
        {currentSentence.aiScore && (
          <div className="mb-4 space-y-3">
            <div className="text-xs font-medium text-slate-500">AI 评分结果</div>
            
            {/* 分数展示 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                <div className="text-xs text-blue-600 mb-1">词汇得分</div>
                <div className="text-xl font-bold text-blue-700">
                  {currentSentence.aiScore.vocabScore.toFixed(1)}
                </div>
                <div className="text-xs text-blue-500">/ 1分</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
                <div className="text-xs text-green-600 mb-1">通顺度</div>
                <div className="text-xl font-bold text-green-700">
                  {currentSentence.aiScore.fluencyScore.toFixed(1)}
                </div>
                <div className="text-xs text-green-500">/ 1分</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-center">
                <div className="text-xs text-purple-600 mb-1">总分</div>
                <div className="text-xl font-bold text-purple-700">
                  {currentSentence.aiScore.totalScore.toFixed(1)}
                </div>
                <div className="text-xs text-purple-500">/ 2分</div>
              </div>
            </div>
            
            {/* 关键词反馈 */}
            {currentSentence.aiScore.keyWordsCorrect && currentSentence.aiScore.keyWordsCorrect.length > 0 && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="text-xs font-medium text-green-700 mb-1">翻译正确的关键词</div>
                <div className="flex flex-wrap gap-1">
                  {currentSentence.aiScore.keyWordsCorrect.map((word, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {currentSentence.aiScore.keyWordsMissing && currentSentence.aiScore.keyWordsMissing.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="text-xs font-medium text-red-700 mb-1">遗漏或错误的关键词</div>
                <div className="flex flex-wrap gap-1">
                  {currentSentence.aiScore.keyWordsMissing.map((word, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* 详细反馈 */}
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-1">详细反馈</div>
              <p className="text-sm text-gray-600 leading-relaxed">{currentSentence.aiScore.feedback}</p>
            </div>
          </div>
        )}
        
        {/* 参考译文（提交后显示） */}
        {isSubmitted && currentSentence.referenceCn && (
          <div className="mb-4">
            <div className="text-xs font-medium text-emerald-600 mb-2">参考译文</div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-base text-emerald-900 leading-relaxed">{currentSentence.referenceCn}</p>
            </div>
          </div>
        )}
        
        {/* AI助教按钮 */}
        {onAskAI && (
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAskAI(`请帮我分析这句话的翻译要点：\n\n${currentSentence.englishText}\n\n我的翻译：${currentSentence.userAnswer || '（还未翻译）'}`)}
              className="text-emerald-600 border-emerald-200"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              AI助教点评
            </Button>
          </div>
        )}
      </div>
      
      {/* 底部提交区 */}
      <div className="p-3 border-t bg-white flex-shrink-0">
        {!isSubmitted ? (
          <div className="space-y-2">
            {/* 直接提交 */}
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600"
              disabled={!allAnswered}
              onClick={() => onSubmit(false)}
            >
              {allAnswered ? (
                <>
                  <Send className="w-4 h-4 mr-1" />
                  提交翻译
                </>
              ) : (
                `还有 ${sentences.length - answeredCount} 句未翻译`
              )}
            </Button>
            
            {/* AI评分提交 */}
            {allAnswered && (
              <Button
                variant="outline"
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => onSubmit(true)}
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                提交并AI评分
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* AI 评分按钮 */}
            {!currentSentence.aiScore && (
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={handleAIScore}
                disabled={isScoring || !currentSentence.userAnswer}
              >
                {isScoring ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    AI 评分中...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-1" />
                    AI 评分
                  </>
                )}
              </Button>
            )}
            
            {currentSentence.aiScore && (
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">已完成评分</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
