'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Clock, Send, ChevronUp, ChevronDown, MessageCircle, CheckCircle2 } from 'lucide-react'

interface TranslationSentence {
  id: string
  sentenceNum: number
  english: string
  chinese?: string
  userAnswer?: string
  analysis?: string
}

interface TranslationQuestionPanelProps {
  sentences: TranslationSentence[]
  currentIndex: number
  onAnswerChange: (sentenceId: string, answer: string) => void
  onSubmit: () => void
  isSubmitted: boolean
  startTime: Date
  onAskAI?: (question: string) => void
}

export default function TranslationQuestionPanel({
  sentences,
  currentIndex,
  onAnswerChange,
  onSubmit,
  isSubmitted,
  startTime,
  onAskAI,
}: TranslationQuestionPanelProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  
  const currentSentence = sentences[currentIndex]
  const answeredCount = sentences.filter(s => s.userAnswer && s.userAnswer.trim()).length
  const allAnswered = answeredCount === sentences.length
  
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
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      // currentIndex will be updated by parent
    }
  }
  
  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      // currentIndex will be updated by parent
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
    <div className="h-full flex flex-col">
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
      
      {/* 当前句子 */}
      <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
        {/* 英文原文 */}
        <div className="mb-4">
          <div className="text-xs font-medium text-slate-500 mb-2">英文原文</div>
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-base text-blue-900 leading-relaxed">{currentSentence.english}</p>
          </div>
        </div>
        
        {/* 翻译输入 */}
        <div className="mb-4">
          <div className="text-xs font-medium text-slate-500 mb-2">你的翻译</div>
          <Textarea
            value={currentSentence.userAnswer || ''}
            onChange={(e) => onAnswerChange(currentSentence.id, e.target.value)}
            placeholder="请输入中文翻译..."
            disabled={isSubmitted}
            className="min-h-[120px] resize-none"
          />
        </div>
        
        {/* 参考译文（提交后显示） */}
        {isSubmitted && currentSentence.chinese && (
          <div className="mb-4">
            <div className="text-xs font-medium text-emerald-600 mb-2">参考译文</div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-base text-emerald-900 leading-relaxed">{currentSentence.chinese}</p>
            </div>
          </div>
        )}
        
        {/* 解析（提交后显示） */}
        {isSubmitted && currentSentence.analysis && (
          <div className="mb-4">
            <div className="text-xs font-medium text-amber-600 mb-2">翻译解析</div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-900 leading-relaxed">{currentSentence.analysis}</p>
            </div>
          </div>
        )}
        
        {/* AI助教按钮 */}
        {onAskAI && (
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAskAI(`请帮我分析这句话的翻译要点：\n\n${currentSentence.english}\n\n我的翻译：${currentSentence.userAnswer || '（还未翻译）'}`)}
              className="text-emerald-600 border-emerald-200"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              🐱 AI助教点评
            </Button>
          </div>
        )}
      </div>
      
      {/* 底部导航 */}
      <div className="p-3 border-t bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="outline"
            size="sm"
            disabled={currentIndex === 0}
            onClick={() => {}}
          >
            <ChevronUp className="w-4 h-4 mr-1" />
            上一句
          </Button>
          <span className="text-sm text-slate-500">
            {currentIndex + 1} / {sentences.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentIndex === sentences.length - 1}
            onClick={() => {}}
          >
            下一句
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        {/* 提交按钮 */}
        {!isSubmitted && (
          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600"
            disabled={!allAnswered}
            onClick={onSubmit}
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
        )}
        
        {isSubmitted && (
          <div className="flex items-center justify-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">已完成</span>
          </div>
        )}
      </div>
    </div>
  )
}
