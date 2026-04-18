'use client'

import { useState, useEffect } from 'react'

interface ClozeBlank {
  id: string
  blankNum: number
  correctAnswer: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
}

interface ClozePracticeProps {
  content: string
  blanks: ClozeBlank[]
  onSubmit: (answers: Record<number, string>) => void
  isSubmitted: boolean
}

export default function ClozePractice({ content, blanks, onSubmit, isSubmitted }: ClozePracticeProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [hoveredBlank, setHoveredBlank] = useState<number | null>(null)
  
  // 将文章内容中的空位标记替换为可点击的空白
  const renderContent = () => {
    // 假设空位用数字标记，如 "___1___" 或 "[1]"
    let result = content
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    
    // 匹配空位标记 (支持多种格式)
    const blankPattern = /_{2,}(\d+)_{2,}|\[(\d+)\]|（(\d+)）/g
    let match
    
    while ((match = blankPattern.exec(content)) !== null) {
      const blankNum = parseInt(match[1] || match[2] || match[3])
      const matchStart = match.index
      const matchEnd = matchStart + match[0].length
      
      // 添加前面的文本
      if (matchStart > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex, matchStart)}</span>)
      }
      
      // 添加空位
      const blank = blanks.find(b => b.blankNum === blankNum)
      const answer = answers[blankNum]
      const isCorrect = isSubmitted && blank && answer === blank.correctAnswer
      const isWrong = isSubmitted && blank && answer && answer !== blank.correctAnswer
      
      parts.push(
        <span
          key={`blank-${blankNum}`}
          className="inline-flex items-center mx-1 cursor-pointer transition-all"
          onClick={() => !isSubmitted && setHoveredBlank(hoveredBlank === blankNum ? null : blankNum)}
        >
          <span
            className="px-3 py-1 rounded-lg font-medium text-sm border-2 min-w-[60px] text-center"
            style={{
              background: isSubmitted 
                ? (isCorrect ? '#d1fae5' : isWrong ? '#fee2e2' : '#f3f4f6')
                : answer ? '#e0f2fe' : '#f9fafb',
              borderColor: isSubmitted
                ? (isCorrect ? '#10b981' : isWrong ? '#ef4444' : '#d1d5db')
                : answer ? '#3b82f6' : '#d1d5db',
              color: answer ? '#1e3a5f' : '#6b7280',
            }}
          >
            {answer || `(${blankNum})`}
          </span>
        </span>
      )
      
      lastIndex = matchEnd
    }
    
    // 添加剩余文本
    if (lastIndex < content.length) {
      parts.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>)
    }
    
    return parts.length > 0 ? parts : content
  }
  
  const handleSelectAnswer = (blankNum: number, answer: string) => {
    if (isSubmitted) return
    setAnswers(prev => ({ ...prev, [blankNum]: answer }))
    setHoveredBlank(null)
  }
  
  // 计算统计
  const answeredCount = Object.keys(answers).length
  const correctCount = isSubmitted 
    ? blanks.filter(b => answers[b.blankNum] === b.correctAnswer).length 
    : 0
  
  return (
    <div className="flex flex-col h-full">
      {/* 文章区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose max-w-none leading-relaxed text-base" style={{ lineHeight: '2' }}>
          {renderContent()}
        </div>
      </div>
      
      {/* 选项面板 - 显示当前悬停的空位选项 */}
      {hoveredBlank && !isSubmitted && (
        <div className="border-t p-4" style={{ borderColor: 'var(--bd)', background: 'var(--bg)' }}>
          <div className="text-sm font-medium mb-3" style={{ color: 'var(--tx)' }}>
            第 {hoveredBlank} 空选项
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['A', 'B', 'C', 'D'].map(opt => {
              const blank = blanks.find(b => b.blankNum === hoveredBlank)
              const optionContent = blank?.[`option${opt}` as keyof ClozeBlank] as string
              return (
                <button
                  key={opt}
                  className="px-3 py-2 rounded-lg text-sm text-left transition-all hover:shadow-md"
                  style={{
                    background: answers[hoveredBlank] === opt ? 'var(--m)' : 'var(--bg2)',
                    color: answers[hoveredBlank] === opt ? 'white' : 'var(--tx)',
                    border: `1px solid ${answers[hoveredBlank] === opt ? 'var(--m)' : 'var(--bd)'}`,
                  }}
                  onClick={() => handleSelectAnswer(hoveredBlank, opt)}
                >
                  <span className="font-medium">{opt}.</span> {optionContent}
                </button>
              )
            })}
          </div>
        </div>
      )}
      
      {/* 已选答案汇总 - 始终显示在底部 */}
      <div className="border-t p-4" style={{ borderColor: 'var(--bd)', background: 'var(--bg2)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium" style={{ color: 'var(--tx)' }}>
            已选答案 ({answeredCount}/{blanks.length})
          </div>
          {isSubmitted && (
            <div className="text-sm" style={{ color: correctCount === blanks.length ? 'var(--m)' : '#ef4444' }}>
              正确 {correctCount}/{blanks.length}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {blanks.map(blank => {
            const answer = answers[blank.blankNum]
            const isCorrect = isSubmitted && answer === blank.correctAnswer
            const isWrong = isSubmitted && answer && answer !== blank.correctAnswer
            
            return (
              <div
                key={blank.id}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                style={{
                  background: isSubmitted 
                    ? (isCorrect ? '#d1fae5' : isWrong ? '#fee2e2' : '#f3f4f6')
                    : answer ? '#e0f2fe' : 'var(--bg)',
                  border: `1px solid ${isSubmitted 
                    ? (isCorrect ? '#10b981' : isWrong ? '#ef4444' : '#d1d5db')
                    : answer ? '#3b82f6' : 'var(--bd)'}`,
                }}
              >
                <span style={{ color: 'var(--tx3)' }}>{blank.blankNum}.</span>
                <span className="font-medium" style={{ color: 'var(--tx)' }}>
                  {answer || '_'}
                </span>
                {isSubmitted && (
                  <span style={{ color: isCorrect ? '#10b981' : '#ef4444' }}>
                    {isCorrect ? '✓' : isWrong ? `(${blank.correctAnswer})` : ''}
                  </span>
                )}
              </div>
            )
          })}
        </div>
        
        {!isSubmitted && answeredCount === blanks.length && (
          <button
            className="mt-4 w-full py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
            style={{ background: 'var(--m)' }}
            onClick={() => onSubmit(answers)}
          >
            提交答案
          </button>
        )}
      </div>
    </div>
  )
}
