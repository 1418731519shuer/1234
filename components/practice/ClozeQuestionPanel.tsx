'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'

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

interface ClozeQuestionPanelProps {
  blanks: ClozeBlank[]
  answers: Record<number, string>
  currentBlank: number | null
  onSelectBlank: (blankNum: number) => void
  onAnswer: (blankNum: number, optionKey: string) => void
  onSubmit: () => void
  isSubmitted: boolean
  onAskAI?: (question: string) => void
}

// 选项颜色
const OPTION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'A': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  'B': { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  'C': { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  'D': { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
}

export default function ClozeQuestionPanel({
  blanks,
  answers,
  currentBlank,
  onSelectBlank,
  onAnswer,
  onSubmit,
  isSubmitted,
  onAskAI,
}: ClozeQuestionPanelProps) {
  const currentBlankData = currentBlank ? blanks.find(b => b.blankNum === currentBlank) : null
  const currentAnswer = currentBlank ? answers[currentBlank] : null
  
  // 选择选项
  const handleSelectOption = (optionKey: string) => {
    if (isSubmitted || !currentBlank) return
    onAnswer(currentBlank, optionKey)
  }
  
  // 计算统计
  const answeredCount = Object.keys(answers).length
  const correctCount = isSubmitted 
    ? blanks.filter(b => answers[b.blankNum] === b.correctAnswer).length 
    : 0
  
  return (
    <div className="h-full flex flex-col bg-slate-50" style={{ minHeight: 0 }}>
      {/* 题目导航 */}
      <div className="p-3 border-b bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-800">选择答案</h2>
          {isSubmitted && (
            <Badge className={`${correctCount >= 12 ? 'bg-emerald-500' : 'bg-red-400'} text-white`}>
              {correctCount}/20
            </Badge>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {blanks.sort((a, b) => a.blankNum - b.blankNum).map(blank => {
            const answer = answers[blank.blankNum]
            const isCorrect = isSubmitted && answer === blank.correctAnswer
            const isWrong = isSubmitted && answer && answer !== blank.correctAnswer
            const isCurrent = currentBlank === blank.blankNum
            
            return (
              <button
                key={blank.blankNum}
                className="w-7 h-7 rounded text-xs font-medium transition-all border"
                style={{
                  background: isSubmitted 
                    ? (isCorrect ? '#d1fae5' : isWrong ? '#fee2e2' : answer ? OPTION_COLORS[answer]?.bg || '#f3f4f6' : '#f3f4f6')
                    : isCurrent ? '#bfdbfe' : answer ? OPTION_COLORS[answer]?.bg || '#f3f4f6' : '#f3f4f6',
                  borderColor: isSubmitted 
                    ? (isCorrect ? '#10b981' : isWrong ? '#ef4444' : answer ? OPTION_COLORS[answer]?.border || '#d1d5db' : '#d1d5db')
                    : isCurrent ? '#3b82f6' : answer ? OPTION_COLORS[answer]?.border || '#d1d5db' : '#d1d5db',
                  color: answer ? OPTION_COLORS[answer]?.text || '#374151' : '#6b7280',
                }}
                onClick={() => onSelectBlank(blank.blankNum)}
              >
                {blank.blankNum}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* 当前题目选项 */}
      <div className="flex-1 overflow-y-auto p-3" style={{ minHeight: 0 }}>
        {currentBlankData ? (
          <div>
            <div className="text-sm font-medium text-slate-700 mb-3">
              第 {currentBlankData.blankNum} 空选项
            </div>
            <div className="space-y-2">
              {(['A', 'B', 'C', 'D'] as const).map(opt => {
                const isSelected = currentAnswer === opt
                const isCorrectOption = isSubmitted && currentBlankData.correctAnswer === opt
                const colorStyle = OPTION_COLORS[opt]
                
                return (
                  <button
                    key={opt}
                    className="w-full text-left p-3 rounded-lg border-2 transition-all flex items-start gap-2"
                    style={{
                      background: isSubmitted 
                        ? (isCorrectOption ? '#d1fae5' : isSelected ? '#fee2e2' : '#ffffff')
                        : isSelected ? colorStyle.bg : '#ffffff',
                      borderColor: isSubmitted 
                        ? (isCorrectOption ? '#10b981' : isSelected ? '#ef4444' : '#e5e7eb')
                        : isSelected ? colorStyle.border : '#e5e7eb',
                    }}
                    onClick={() => handleSelectOption(opt)}
                    disabled={isSubmitted}
                  >
                    <span 
                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                      style={{ background: colorStyle.border }}
                    >
                      {opt}
                    </span>
                    <span 
                      className="text-sm leading-relaxed flex-1"
                      style={{ color: isSelected || isCorrectOption ? colorStyle.text : '#374151' }}
                    >
                      {currentBlankData.options[opt]}
                    </span>
                    {isSubmitted && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                    {isSubmitted && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
            
            {/* 解析 */}
            {isSubmitted && currentBlankData.analysis && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <span className="font-medium">解析：</span>{currentBlankData.analysis}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-400 py-8">
            点击文章中的空位选择答案
          </div>
        )}
      </div>
      
      {/* 提交按钮 */}
      <div className="p-3 border-t bg-white flex-shrink-0">
        {!isSubmitted ? (
          <>
            {answeredCount === 20 ? (
              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600"
                onClick={onSubmit}
              >
                提交答案
              </Button>
            ) : (
              <div className="text-center text-sm text-slate-500">
                还需选择 {20 - answeredCount} 个答案
              </div>
            )}
          </>
        ) : (
          onAskAI && currentBlankData && (
            <Button
              variant="outline"
              className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={() => onAskAI(`请帮我详细解析完型填空第${currentBlankData.blankNum}空的选择技巧`)}
            >
              <span className="mr-1">🐱</span> 问AI助教
            </Button>
          )
        )}
      </div>
    </div>
  )
}
