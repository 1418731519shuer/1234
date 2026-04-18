'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SevenFiveOption {
  id: string
  optionKey: string
  content: string
}

interface SevenFiveQuestion {
  id: string
  questionNum: number
  stem: string
  correctAnswer: string
  analysis?: string
}

interface SevenFiveQuestionPanelProps {
  options: SevenFiveOption[]
  questions: SevenFiveQuestion[]
  answers: Record<number, string>
  currentIndex: number
  onNavigate: (index: number) => void
  onAnswer: (questionNum: number, answer: string) => void
  onClearAnswer: (questionNum: number) => void
  onSubmit: () => void
  isSubmitted: boolean
  onAskAI?: (question: string) => void
}

// 每个选项独立的颜色
const OPTION_COLORS: Record<string, { bg: string; border: string; text: string; light: string }> = {
  'A': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', light: '#fffbeb' },
  'B': { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', light: '#eff6ff' },
  'C': { bg: '#dcfce7', border: '#22c55e', text: '#166534', light: '#f0fdf4' },
  'D': { bg: '#fce7f3', border: '#ec4899', text: '#9d174d', light: '#fdf2f8' },
  'E': { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3', light: '#eef2ff' },
  'F': { bg: '#fed7aa', border: '#f97316', text: '#9a3412', light: '#fff7ed' },
  'G': { bg: '#d1fae5', border: '#10b981', text: '#065f46', light: '#ecfdf5' },
}

export default function SevenFiveQuestionPanel({
  options,
  questions,
  answers,
  currentIndex,
  onNavigate,
  onAnswer,
  onClearAnswer,
  onSubmit,
  isSubmitted,
  onAskAI,
}: SevenFiveQuestionPanelProps) {
  // 当前题目
  const currentQ = questions[currentIndex]
  const currentAnswer = currentQ ? answers[currentQ.questionNum] : null
  
  // 检查选项是否已被使用
  const isOptionUsed = (optionKey: string, excludeNum?: number) => {
    return Object.entries(answers).some(([num, ans]) => 
      ans === optionKey && parseInt(num) !== excludeNum
    )
  }
  
  // 选择选项
  const handleSelectOption = (optionKey: string) => {
    if (isSubmitted || !currentQ) return
    onAnswer(currentQ.questionNum, optionKey)
  }
  
  // 清除当前选择
  const handleClearAnswer = () => {
    if (isSubmitted || !currentQ) return
    onClearAnswer(currentQ.questionNum)
  }
  
  // 计算统计
  const answeredCount = Object.keys(answers).length
  const correctCount = isSubmitted 
    ? questions.filter(q => answers[q.questionNum] === q.correctAnswer).length 
    : 0
  
  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* 题目导航 */}
      <div className="p-3 border-b bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-800">题目选择</h2>
          {isSubmitted && (
            <Badge className={`${correctCount === 5 ? 'bg-emerald-500' : 'bg-red-400'} text-white`}>
              {correctCount}/5
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {questions.sort((a, b) => a.questionNum - b.questionNum).map((q, i) => {
            const answer = answers[q.questionNum]
            const colorStyle = answer ? OPTION_COLORS[answer] : null
            const isCorrect = isSubmitted && answer === q.correctAnswer
            const isWrong = isSubmitted && answer && answer !== q.correctAnswer
            
            return (
              <button
                key={q.id}
                className="w-10 h-10 rounded-lg text-sm font-medium transition-all border-2"
                style={{
                  background: isSubmitted 
                    ? (isCorrect ? '#d1fae5' : isWrong ? '#fee2e2' : colorStyle?.light || '#f3f4f6')
                    : currentIndex === i ? '#18a06a' : colorStyle?.light || '#f3f4f6',
                  color: currentIndex === i ? 'white' : colorStyle?.text || '#6b7280',
                  borderColor: isSubmitted 
                    ? (isCorrect ? '#10b981' : isWrong ? '#ef4444' : colorStyle?.border || '#d1d5db')
                    : currentIndex === i ? '#18a06a' : colorStyle?.border || '#d1d5db',
                }}
                onClick={() => onNavigate(i)}
              >
                {q.questionNum - 40}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* 当前题目信息 */}
      <div className="p-3 border-b bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">第 {currentQ?.questionNum ? currentQ.questionNum - 40 : '?'} 空</span>
            {currentAnswer && (
              <Badge 
                className="font-medium"
                style={{ 
                  background: OPTION_COLORS[currentAnswer]?.bg,
                  color: OPTION_COLORS[currentAnswer]?.text,
                }}
              >
                已选: {currentAnswer}
              </Badge>
            )}
          </div>
          {currentAnswer && !isSubmitted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAnswer}
              className="text-xs"
            >
              清除
            </Button>
          )}
        </div>
      </div>
      
      {/* 选项列表 */}
      <div className="flex-1 overflow-y-auto p-3" style={{ minHeight: 0 }}>
        <div className="text-xs uppercase tracking-wider mb-3 text-slate-400">选择段落 (A-G)</div>
        <div className="space-y-2">
          {options.sort((a, b) => a.optionKey.localeCompare(b.optionKey)).map(opt => {
            const isUsed = isOptionUsed(opt.optionKey, currentQ?.questionNum)
            const isSelected = currentAnswer === opt.optionKey
            const colorStyle = OPTION_COLORS[opt.optionKey]
            const isCorrectOption = isSubmitted && currentQ?.correctAnswer === opt.optionKey
            
            return (
              <button
                key={opt.id}
                className="w-full text-left p-3 rounded-xl transition-all border-2"
                style={{
                  background: isSubmitted 
                    ? (isCorrectOption ? '#d1fae5' : isSelected ? colorStyle?.bg : '#ffffff')
                    : isSelected ? colorStyle?.bg : isUsed ? '#f3f4f6' : '#ffffff',
                  borderColor: isSubmitted 
                    ? (isCorrectOption ? '#10b981' : isSelected ? colorStyle?.border : '#e5e7eb')
                    : isSelected ? colorStyle?.border : isUsed ? '#d1d5db' : '#e5e7eb',
                  opacity: isUsed && !isSelected ? 0.5 : 1,
                }}
                onClick={() => !isSubmitted && !isUsed && handleSelectOption(opt.optionKey)}
                disabled={isSubmitted || (isUsed && !isSelected)}
              >
                <div className="flex items-start gap-2">
                  <span 
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                    style={{ background: colorStyle?.border }}
                  >
                    {opt.optionKey}
                  </span>
                  <span 
                    className="text-sm leading-relaxed"
                    style={{ color: isSelected || isCorrectOption ? colorStyle?.text : '#374151' }}
                  >
                    {opt.content.length > 120 ? opt.content.slice(0, 120) + '...' : opt.content}
                  </span>
                </div>
                {isUsed && !isSelected && !isSubmitted && (
                  <div className="text-xs mt-1 text-slate-400 ml-8">已被其他空位选择</div>
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* 提交按钮或解析 */}
      <div className="p-3 border-t bg-white flex-shrink-0">
        {!isSubmitted ? (
          <>
            {answeredCount === 5 ? (
              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600"
                onClick={onSubmit}
              >
                提交答案
              </Button>
            ) : (
              <div className="text-center text-sm text-slate-500">
                还需选择 {5 - answeredCount} 个答案
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            {currentQ?.analysis && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <span className="font-medium">解析：</span>{currentQ.analysis}
              </div>
            )}
            {onAskAI && currentQ && (
              <Button
                variant="outline"
                className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={() => onAskAI(`请帮我详细解析第${currentQ.questionNum - 40}空的七选五题目`)}
              >
                <span className="mr-1">🐱</span> 问AI助教
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
