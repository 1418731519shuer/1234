'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTextMark, MARK_COLORS, TextMark, MarkColorType } from '@/hooks/useTextMark'

interface SevenFiveQuestionPanelProps {
  options: Array<{ key: string; content: string }>  // A-G段落
  blanks: number[]  // 空位编号 [41, 42, 43, 44, 45]
  answers: Record<number, string>  // 空位 -> 选项
  currentIndex: number  // 当前选中的空位索引
  onNavigate: (index: number) => void
  onAnswer: (blankNum: number, optionKey: string) => void
  onClearAnswer: (blankNum: number) => void
  onSubmit: () => void
  isSubmitted: boolean
  correctAnswers?: Record<number, string>
  onAskAI?: (question: string) => void
  textMark?: ReturnType<typeof useTextMark>
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
  blanks,
  answers,
  currentIndex,
  onNavigate,
  onAnswer,
  onClearAnswer,
  onSubmit,
  isSubmitted,
  correctAnswers,
  onAskAI,
  textMark,
}: SevenFiveQuestionPanelProps) {
  const [errorMsg, setErrorMsg] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const optionContentRefs = useRef<Record<string, HTMLSpanElement>>({})
  
  const currentBlank = blanks[currentIndex]
  const currentAnswer = currentBlank ? answers[currentBlank] : null
  
  // Tab 键跳转下一空（提交后可用）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && isSubmitted) {
        e.preventDefault()
        const nextIndex = currentIndex < blanks.length - 1 ? currentIndex + 1 : 0
        onNavigate(nextIndex)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, blanks.length, isSubmitted, onNavigate])
  
  // 检查选项是否已被使用
  const isOptionUsed = (optionKey: string, excludeBlank?: number) => {
    return Object.entries(answers).some(([blank, ans]) => 
      ans === optionKey && parseInt(blank) !== excludeBlank
    )
  }
  
  // 获取选项被哪个空位使用
  const getOptionUsedBy = (optionKey: string, excludeBlank?: number): number | null => {
    for (const [blank, ans] of Object.entries(answers)) {
      if (ans === optionKey && parseInt(blank) !== excludeBlank) {
        return parseInt(blank)
      }
    }
    return null
  }
  
  // 选择选项
  const handleSelectOption = (optionKey: string) => {
    if (isSubmitted || !currentBlank) return
    
    // 标记模式下不选择选项
    if (textMark?.isMarkMode) return
    
    // 检查该选项是否已被其他空位使用
    const usedBy = getOptionUsedBy(optionKey, currentBlank)
    if (usedBy) {
      setErrorMsg(`选项 ${optionKey} 已被第 ${usedBy - 40} 空选择，请先清除该空位的选择`)
      setTimeout(() => setErrorMsg(''), 3000)
      return
    }
    
    onAnswer(currentBlank, optionKey)
    setErrorMsg('')
    
    // 自动跳转到下一个空位
    if (currentIndex < blanks.length - 1) {
      setTimeout(() => onNavigate(currentIndex + 1), 100)
    }
  }
  
  // 处理选项文本选择（标记模式）
  const handleOptionMouseUp = (optionKey: string, e: React.MouseEvent) => {
    if (!textMark?.isMarkMode || isSubmitted) return
    
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    
    const selectedText = selection.toString().trim()
    if (!selectedText) return
    
    const container = optionContentRefs.current[optionKey]
    if (!container) return
    
    const range = selection.getRangeAt(0)
    
    // 获取选中文本在容器内的位置
    const preSelectionRange = document.createRange()
    preSelectionRange.selectNodeContents(container)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const start = preSelectionRange.toString().length
    
    const end = start + selectedText.length
    
    textMark.addMark('option', selectedText, start, end, optionKey)
    selection.removeAllRanges()
  }
  
  // 点击标记删除
  const handleMarkClick = (mark: TextMark, e: React.MouseEvent) => {
    e.stopPropagation()
    textMark?.removeMark(mark.id)
  }
  
  // 清除当前选项标记
  const clearOptionMarks = (optionKey: string) => {
    textMark?.clearRegionMarks('option', optionKey)
  }
  
  // 清除当前选择
  const handleClearAnswer = () => {
    if (isSubmitted || !currentBlank) return
    onClearAnswer(currentBlank)
    setErrorMsg('')
  }
  
  // 计算统计
  const answeredCount = Object.keys(answers).length
  const correctCount = isSubmitted && correctAnswers
    ? blanks.filter(b => answers[b] === correctAnswers[b]).length 
    : 0
  
  // 检查是否有重复选择
  const hasDuplicates = () => {
    const selectedOptions = Object.values(answers)
    return selectedOptions.length !== new Set(selectedOptions).size
  }
  
  // 提交前检查
  const handleSubmit = () => {
    if (hasDuplicates()) {
      setErrorMsg('存在重复选择，请确保每个选项只被一个空位选择')
      setTimeout(() => setErrorMsg(''), 3000)
      return
    }
    if (answeredCount !== 5) {
      setErrorMsg(`请完成所有5个空位的选择，当前已完成 ${answeredCount} 个`)
      setTimeout(() => setErrorMsg(''), 3000)
      return
    }
    setErrorMsg('')
    onSubmit()
  }
  
  // 渲染带标记的选项内容
  const renderMarkedContent = (optionKey: string, content: string) => {
    if (!textMark) return <span>{content}</span>
    
    const optionMarks = textMark.getMarks('option', optionKey)
    if (optionMarks.length === 0) {
      return <span>{content}</span>
    }
    
    const elements: React.ReactNode[] = []
    let lastIndex = 0
    
    optionMarks.forEach((mark, i) => {
      // 未标记部分
      if (mark.start > lastIndex) {
        elements.push(
          <span key={`text-${i}`}>{content.slice(lastIndex, mark.start)}</span>
        )
      }
      // 标记部分 - 使用标记的颜色
      const colorStyle = textMark.getMarkColorStyle(mark.color)
      elements.push(
        <span
          key={`mark-${mark.id}`}
          className="cursor-pointer rounded px-0.5"
          style={{ background: colorStyle.bg }}
          onClick={(e) => handleMarkClick(mark, e)}
          title="点击删除标记"
        >
          {content.slice(mark.start, mark.end)}
        </span>
      )
      lastIndex = mark.end
    })
    
    // 剩余部分
    if (lastIndex < content.length) {
      elements.push(<span key="text-end">{content.slice(lastIndex)}</span>)
    }
    
    return elements
  }
  
  return (
    <div className="h-full flex flex-col bg-slate-50" style={{ minHeight: 0 }}>
      {/* 题目导航 */}
      <div className="p-3 border-b bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-800">选择段落</h2>
          {isSubmitted && (
            <Badge className={`${correctCount === 5 ? 'bg-emerald-500' : 'bg-red-400'} text-white`}>
              {correctCount}/5
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {blanks.sort((a, b) => a - b).map((blank, i) => {
            const answer = answers[blank]
            const colorStyle = answer ? OPTION_COLORS[answer] : null
            const isCorrect = isSubmitted && correctAnswers && answer === correctAnswers[blank]
            const isWrong = isSubmitted && correctAnswers && answer && answer !== correctAnswers[blank]
            
            return (
              <button
                key={blank}
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
                {blank - 40}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* 当前空位信息 */}
      <div className="p-3 border-b bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">第 {currentBlank ? currentBlank - 40 : '?'} 空</span>
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
            <Button variant="ghost" size="sm" onClick={handleClearAnswer} className="text-xs">
              清除
            </Button>
          )}
        </div>
      </div>
      
      {/* 选项列表 A-G */}
      <div className="flex-1 overflow-y-auto p-3" style={{ minHeight: 0 }} ref={containerRef}>
        <div className="text-xs uppercase tracking-wider mb-3 text-slate-400">段落选项 (A-G)</div>
        <div className="space-y-2">
          {options.sort((a, b) => a.key.localeCompare(b.key)).map(opt => {
            const usedBy = getOptionUsedBy(opt.key, currentBlank)
            const isSelected = currentAnswer === opt.key
            const colorStyle = OPTION_COLORS[opt.key]
            const isCorrectOption = isSubmitted && correctAnswers && currentBlank && correctAnswers[currentBlank] === opt.key
            const optionMarkCount = textMark?.getMarkCount('option', opt.key) || 0
            
            return (
              <div
                key={opt.key}
                className="w-full text-left p-3 rounded-xl transition-all border-2 relative"
                style={{
                  background: isSubmitted 
                    ? (isCorrectOption ? '#d1fae5' : isSelected ? colorStyle?.bg : '#ffffff')
                    : isSelected ? colorStyle?.bg : usedBy ? '#f3f4f6' : '#ffffff',
                  borderColor: isSubmitted 
                    ? (isCorrectOption ? '#10b981' : isSelected ? colorStyle?.border : '#e5e7eb')
                    : isSelected ? colorStyle?.border : usedBy ? '#d1d5db' : '#e5e7eb',
                  opacity: usedBy && !isSelected ? 0.6 : 1,
                  cursor: textMark?.isMarkMode ? 'text' : 'pointer',
                }}
                onClick={() => !isSubmitted && !textMark?.isMarkMode && handleSelectOption(opt.key)}
              >
                <div className="flex items-start gap-2">
                  <span 
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                    style={{ background: colorStyle?.border }}
                  >
                    {opt.key}
                  </span>
                  <span 
                    ref={(el) => { if (el) optionContentRefs.current[opt.key] = el }}
                    className="text-sm leading-relaxed flex-1"
                    style={{ color: isSelected || isCorrectOption ? colorStyle?.text : '#374151' }}
                    onMouseUp={(e) => handleOptionMouseUp(opt.key, e)}
                  >
                    {renderMarkedContent(opt.key, opt.content.length > 150 ? opt.content.slice(0, 150) + '...' : opt.content)}
                  </span>
                  {/* 标记数量 */}
                  {optionMarkCount > 0 && !isSubmitted && (
                    <span 
                      className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 cursor-pointer hover:bg-yellow-200"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearOptionMarks(opt.key)
                      }}
                      title="点击清除标记"
                    >
                      {optionMarkCount} 标记
                    </span>
                  )}
                </div>
                {usedBy && !isSelected && !isSubmitted && (
                  <div className="text-xs mt-1 text-amber-600 ml-8">
                    已被第 {usedBy - 40} 空选择
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* 提交按钮 */}
      <div className="p-3 border-t bg-white flex-shrink-0">
        {/* 标记模式颜色选择器 */}
        {textMark?.isMarkMode && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b">
            <span className="text-xs text-gray-500">标记颜色：</span>
            {Object.entries(MARK_COLORS).map(([key, color]) => (
              <button
                key={key}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  textMark.currentColor === key ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''
                }`}
                style={{ 
                  background: color.bg,
                  borderColor: color.border,
                }}
                onClick={() => textMark.setCurrentColor(key as MarkColorType)}
                title={`${color.name} (按 ${Object.keys(MARK_COLORS).indexOf(key) + 1})`}
              />
            ))}
            <span className="text-xs text-gray-400 ml-2">
              当前: {MARK_COLORS[textMark.currentColor].name}
            </span>
          </div>
        )}
        
        {errorMsg && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {errorMsg}
          </div>
        )}
        {!isSubmitted ? (
          <>
            {answeredCount === 5 ? (
              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600"
                onClick={handleSubmit}
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
          onAskAI && currentBlank && (
            <Button
              variant="outline"
              className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={() => onAskAI(`请帮我详细解析七选五第${currentBlank - 40}空的选择技巧`)}
            >
              <span className="mr-1">🐱</span> 问AI助教
            </Button>
          )
        )}
      </div>
    </div>
  )
}
