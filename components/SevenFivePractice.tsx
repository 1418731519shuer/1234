'use client'

import { useState } from 'react'

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
}

interface SevenFivePracticeProps {
  content: string
  options: SevenFiveOption[]
  questions: SevenFiveQuestion[]
  onSubmit: (answers: Record<number, string>) => void
  isSubmitted: boolean
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

export default function SevenFivePractice({ 
  content, 
  options, 
  questions, 
  onSubmit, 
  isSubmitted 
}: SevenFivePracticeProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // 获取空位编号列表 (41-45)
  const gaps = questions.map(q => q.questionNum).sort((a, b) => a - b)
  const currentGap = gaps[currentIndex]
  const currentAnswer = answers[currentGap]
  
  // 检查选项是否已被使用
  const isOptionUsed = (optionKey: string, excludeGap?: number) => {
    return Object.entries(answers).some(([gap, ans]) => 
      ans === optionKey && parseInt(gap) !== excludeGap
    )
  }
  
  // 选择选项
  const handleSelectOption = (optionKey: string) => {
    if (isSubmitted) return
    setAnswers(prev => ({ ...prev, [currentGap]: optionKey }))
  }
  
  // 清除当前选择
  const handleClearAnswer = () => {
    if (isSubmitted) return
    setAnswers(prev => {
      const newAnswers = { ...prev }
      delete newAnswers[currentGap]
      return newAnswers
    })
  }
  
  const answeredCount = Object.keys(answers).length
  const correctCount = isSubmitted 
    ? questions.filter(q => answers[q.questionNum] === q.correctAnswer).length 
    : 0
  
  // 渲染文章内容，标记空位
  const renderContent = () => {
    // 简单显示文章内容
    return content.split('\n').map((line, i) => {
      // 检查是否包含空位标记
      const gapMatch = line.match(/\((\d+)\)|\[(\d+)\]|_{2,}(\d+)_{2,}/)
      if (gapMatch) {
        const gapNum = parseInt(gapMatch[1] || gapMatch[2] || gapMatch[3])
        if (gapNum >= 41 && gapNum <= 45) {
          const answer = answers[gapNum]
          const question = questions.find(q => q.questionNum === gapNum)
          const isCorrect = isSubmitted && question && answer === question.correctAnswer
          const isWrong = isSubmitted && question && answer && answer !== question.correctAnswer
          const colorStyle = answer ? OPTION_COLORS[answer] : null
          
          return (
            <div key={i} className="mb-4">
              <span
                className="inline-block px-4 py-2 rounded-lg font-medium cursor-pointer border-2 transition-all"
                style={{
                  background: isSubmitted 
                    ? (isCorrect ? '#d1fae5' : isWrong ? '#fee2e2' : colorStyle?.light || 'var(--bg2)')
                    : colorStyle?.light || 'var(--bg2)',
                  borderColor: isSubmitted 
                    ? (isCorrect ? '#10b981' : isWrong ? '#ef4444' : colorStyle?.border || 'var(--bd)')
                    : colorStyle?.border || 'var(--bd)',
                  color: colorStyle?.text || 'var(--tx2)',
                }}
                onClick={() => !isSubmitted && setCurrentIndex(gaps.indexOf(gapNum))}
              >
                {answer ? `[${answer}]` : `(${gapNum - 40})`}
                {isSubmitted && !isCorrect && question && (
                  <span className="ml-2 text-xs opacity-70">正确: {question.correctAnswer}</span>
                )}
              </span>
            </div>
          )
        }
      }
      return <p key={i} className="mb-3 leading-relaxed">{line}</p>
    })
  }
  
  return (
    <div className="flex h-full">
      {/* 左侧文章 */}
      <div className="w-1/2 overflow-y-auto p-6 border-r" style={{ borderColor: 'var(--bd)' }}>
        <div className="text-sm leading-relaxed" style={{ color: 'var(--tx)' }}>
          {renderContent()}
        </div>
        
        {/* 技巧提示 */}
        {!isSubmitted && (
          <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--m1)' }}>
            <div className="text-xs font-medium mb-2" style={{ color: 'var(--m)' }}>七选五解题技巧</div>
            <ul className="text-xs space-y-1" style={{ color: 'var(--tx2)' }}>
              <li>• 先读首尾段，了解文章主旨</li>
              <li>• 关注空格前后的连接词和代词</li>
              <li>• 注意段落之间的逻辑关系</li>
              <li>• 已选选项不能重复使用</li>
            </ul>
          </div>
        )}
      </div>
      
      {/* 右侧选项区 */}
      <div className="w-1/2 flex flex-col">
        {/* 空位导航 */}
        <div className="flex gap-2 p-4 border-b" style={{ borderColor: 'var(--bd)' }}>
          {gaps.map((gap, i) => {
            const answer = answers[gap]
            const colorStyle = answer ? OPTION_COLORS[answer] : null
            const question = questions.find(q => q.questionNum === gap)
            const isCorrect = isSubmitted && question && answer === question.correctAnswer
            const isWrong = isSubmitted && question && answer && answer !== question.correctAnswer
            
            return (
              <button
                key={gap}
                className="w-10 h-10 rounded-lg text-sm font-medium transition-all border-2"
                style={{
                  background: isSubmitted 
                    ? (isCorrect ? '#d1fae5' : isWrong ? '#fee2e2' : colorStyle?.light || 'var(--bg2)')
                    : currentIndex === i ? 'var(--m)' : colorStyle?.light || 'var(--bg2)',
                  color: currentIndex === i ? 'white' : colorStyle?.text || 'var(--tx2)',
                  borderColor: isSubmitted 
                    ? (isCorrect ? '#10b981' : isWrong ? '#ef4444' : colorStyle?.border || 'var(--bd)')
                    : currentIndex === i ? 'var(--m)' : colorStyle?.border || 'var(--bd)',
                }}
                onClick={() => setCurrentIndex(i)}
              >
                {gap - 40}
              </button>
            )
          })}
        </div>
        
        {/* 当前空位信息 */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--bd)', background: 'var(--bg2)' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium" style={{ color: 'var(--tx)' }}>第 {currentGap - 40} 空</span>
              {currentAnswer && (
                <span 
                  className="ml-3 px-3 py-1 rounded-lg text-sm font-medium"
                  style={{ 
                    background: OPTION_COLORS[currentAnswer]?.bg,
                    color: OPTION_COLORS[currentAnswer]?.text,
                  }}
                >
                  已选: {currentAnswer}
                </span>
              )}
            </div>
            {currentAnswer && !isSubmitted && (
              <button
                className="text-xs px-3 py-1 rounded-lg"
                style={{ background: 'var(--bg)', color: 'var(--tx2)' }}
                onClick={handleClearAnswer}
              >
                清除
              </button>
            )}
          </div>
        </div>
        
        {/* 选项列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--tx3)' }}>
            选择段落 (A-G)
          </div>
          <div className="space-y-3">
            {options.sort((a, b) => a.optionKey.localeCompare(b.optionKey)).map(opt => {
              const isUsed = isOptionUsed(opt.optionKey, currentGap)
              const isSelected = currentAnswer === opt.optionKey
              const colorStyle = OPTION_COLORS[opt.optionKey]
              const isCorrectOption = isSubmitted && questions.find(q => q.questionNum === currentGap)?.correctAnswer === opt.optionKey
              
              return (
                <button
                  key={opt.id}
                  className="w-full text-left p-4 rounded-xl transition-all border-2"
                  style={{
                    background: isSubmitted 
                      ? (isCorrectOption ? '#d1fae5' : isSelected ? colorStyle?.bg : 'var(--bg)')
                      : isSelected ? colorStyle?.bg : isUsed ? 'var(--bg2)' : 'var(--bg)',
                    borderColor: isSubmitted 
                      ? (isCorrectOption ? '#10b981' : isSelected ? colorStyle?.border : 'var(--bd)')
                      : isSelected ? colorStyle?.border : isUsed ? 'var(--bd)' : 'var(--bd)',
                    opacity: isUsed && !isSelected ? 0.5 : 1,
                  }}
                  onClick={() => !isSubmitted && !isUsed && handleSelectOption(opt.optionKey)}
                  disabled={isSubmitted || (isUsed && !isSelected)}
                >
                  <div className="flex items-start gap-3">
                    <span 
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: colorStyle?.border, color: 'white' }}
                    >
                      {opt.optionKey}
                    </span>
                    <span 
                      className="text-sm leading-relaxed"
                      style={{ color: isSelected || isCorrectOption ? colorStyle?.text : 'var(--tx)' }}
                    >
                      {opt.content.length > 150 ? opt.content.slice(0, 150) + '...' : opt.content}
                    </span>
                  </div>
                  {isUsed && !isSelected && !isSubmitted && (
                    <div className="text-xs mt-2" style={{ color: 'var(--tx3)' }}>
                      已被其他空位选择
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* 底部状态栏 */}
        <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--bd)' }}>
          <div className="text-sm" style={{ color: 'var(--tx2)' }}>
            已选 {answeredCount}/5
            {isSubmitted && (
              <span className="ml-3" style={{ color: correctCount === 5 ? 'var(--m)' : '#ef4444' }}>
                正确 {correctCount}/5
              </span>
            )}
          </div>
          {!isSubmitted && answeredCount === 5 && (
            <button
              className="px-6 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90"
              style={{ background: 'var(--m)' }}
              onClick={() => onSubmit(answers)}
            >
              提交答案
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
