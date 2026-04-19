'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Flag
} from 'lucide-react'
import { useTextMark, MARK_COLOR, TextMark } from '@/hooks/useTextMark'

interface Question {
  id: string
  questionNum: number
  stem: string
  questionType?: string
  options: Array<{
    id: string
    optionKey: string
    content: string
  }>
  correctAnswer: string
  analysis?: string
}

interface QuestionPanelProps {
  questions: Question[]
  currentIndex: number
  answers: Record<string, string>  // questionId -> answer
  isSubmitted: boolean
  onAnswer: (questionId: string, answer: string) => void
  onNavigate: (index: number) => void
  onSubmit: () => void
  startTime: Date
  textMark?: ReturnType<typeof useTextMark>
}

const COLORS = [
  { name: 'red', class: 'bg-red-500' },
  { name: 'blue', class: 'bg-blue-500' },
  { name: 'green', class: 'bg-green-500' },
  { name: 'yellow', class: 'bg-yellow-500' },
  { name: 'purple', class: 'bg-purple-500' },
]

export default function QuestionPanel({
  questions,
  currentIndex,
  answers,
  isSubmitted,
  onAnswer,
  onNavigate,
  onSubmit,
  startTime,
  textMark,
}: QuestionPanelProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const optionRefs = useRef<Record<string, HTMLSpanElement>>({})
  
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
  
  const currentQuestion = questions[currentIndex]
  const currentColor = COLORS[currentIndex % COLORS.length]
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === questions.length
  
  // 检查某个题目是否被标记（有答案）
  const isQuestionMarked = (index: number) => {
    const q = questions[index]
    return !!answers[q.id]
  }
  
  // 检查答案是否正确
  const isCorrect = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    return question && answers[questionId] === question.correctAnswer
  }
  
  // 处理选项文本选择（标记模式）
  const handleOptionMouseUp = useCallback((questionId: string, optionKey: string, e: React.MouseEvent) => {
    if (!textMark?.isMarkMode || isSubmitted) return
    
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    
    const selectedText = selection.toString().trim()
    if (!selectedText) return
    
    const refKey = `${questionId}-${optionKey}`
    const container = optionRefs.current[refKey]
    if (!container) return
    
    const range = selection.getRangeAt(0)
    
    // 获取选中文本在容器内的位置
    const preSelectionRange = document.createRange()
    preSelectionRange.selectNodeContents(container)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const start = preSelectionRange.toString().length
    
    const end = start + selectedText.length
    
    textMark.addMark('option', selectedText, start, end, refKey)
    selection.removeAllRanges()
  }, [textMark, isSubmitted])
  
  // 点击标记删除
  const handleMarkClick = useCallback((mark: TextMark, e: React.MouseEvent) => {
    e.stopPropagation()
    textMark?.removeMark(mark.id)
  }, [textMark])
  
  // 渲染带标记的选项内容
  const renderMarkedOption = (questionId: string, optionKey: string, content: string) => {
    const refKey = `${questionId}-${optionKey}`
    
    if (!textMark) return <span>{content}</span>
    
    const optionMarks = textMark.getMarks('option', refKey)
    if (optionMarks.length === 0) return <span>{content}</span>
    
    const elements: React.ReactNode[] = []
    let lastIndex = 0
    
    optionMarks.forEach((mark, i) => {
      if (mark.start > lastIndex) {
        elements.push(
          <span key={`text-${i}`}>{content.slice(lastIndex, mark.start)}</span>
        )
      }
      elements.push(
        <span
          key={`mark-${mark.id}`}
          className="cursor-pointer rounded px-0.5"
          style={{ background: MARK_COLOR }}
          onClick={(e) => handleMarkClick(mark, e)}
          title="点击删除标记"
        >
          {content.slice(mark.start, mark.end)}
        </span>
      )
      lastIndex = mark.end
    })
    
    if (lastIndex < content.length) {
      elements.push(<span key="text-end">{content.slice(lastIndex)}</span>)
    }
    
    return elements
  }

  return (
    <div className="h-full flex flex-col bg-white" style={{ minHeight: 0 }}>
      {/* 顶部状态栏 */}
      <div className="p-4 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              <Clock className="w-3 h-3 mr-1" />
              {formatTime(elapsedTime)}
            </Badge>
            <Badge variant="secondary">
              进度: {answeredCount}/{questions.length}
            </Badge>
          </div>
          {!isSubmitted && (
            <Button
              onClick={onSubmit}
              disabled={!allAnswered}
              size="sm"
            >
              提交答案
            </Button>
          )}
        </div>
      </div>
      
      {/* 题目导航 */}
      <div className="p-3 border-b flex-shrink-0">
        <div className="flex gap-2 justify-center flex-wrap">
          {questions.map((q, index) => {
            const color = COLORS[index % COLORS.length]
            const isCurrent = index === currentIndex
            const isMarked = isQuestionMarked(index)
            
            return (
              <button
                key={q.id}
                onClick={() => onNavigate(index)}
                className={`
                  w-10 h-10 rounded-lg font-medium transition-all relative
                  ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                  ${isSubmitted 
                    ? isCorrect(q.id) 
                      ? 'bg-green-100 text-green-700 border-2 border-green-400'
                      : 'bg-red-100 text-red-700 border-2 border-red-400'
                    : isMarked
                      ? `${color.class} text-white`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {index + 1}
                {isSubmitted && (
                  <span className="absolute -top-1 -right-1">
                    {isCorrect(q.id) 
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-red-500" />
                    }
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* 当前题目 */}
      <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0, flexShrink: 1 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${currentColor.class} text-white flex items-center justify-center font-bold`}>
                {currentQuestion.questionNum}
              </div>
              <CardTitle className="text-lg">
                {currentQuestion.stem}
              </CardTitle>
            </div>
            {currentQuestion.questionType && (
              <Badge variant="outline" className="w-fit mt-2">
                {currentQuestion.questionType}
              </Badge>
            )}
          </CardHeader>
          
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => {
                if (textMark?.isMarkMode) return // 标记模式下不选择
                onAnswer(currentQuestion.id, value)
                // 选择后自动跳到下一题（如果不是最后一题）
                if (currentIndex < questions.length - 1) {
                  setTimeout(() => onNavigate(currentIndex + 1), 300)
                }
              }}
              disabled={isSubmitted}
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id] === option.optionKey
                const isCorrectOption = option.optionKey === currentQuestion.correctAnswer
                const refKey = `${currentQuestion.id}-${option.optionKey}`
                const optionMarkCount = textMark?.getMarkCount('option', refKey) || 0
                
                let optionClass = 'border-gray-200'
                if (isSubmitted) {
                  if (isCorrectOption) {
                    optionClass = 'border-green-400 bg-green-50'
                  } else if (isSelected && !isCorrectOption) {
                    optionClass = 'border-red-400 bg-red-50'
                  }
                } else if (isSelected) {
                  optionClass = 'border-blue-400 bg-blue-50'
                }
                
                return (
                  <div
                    key={option.id}
                    className={`
                      flex items-center space-x-3 p-3 rounded-lg border-2 transition-all relative
                      ${optionClass}
                      ${!isSubmitted && !textMark?.isMarkMode && 'hover:bg-gray-50 cursor-pointer'}
                      ${textMark?.isMarkMode ? 'cursor-text' : ''}
                    `}
                  >
                    <RadioGroupItem value={option.optionKey} id={option.id} />
                    <Label 
                      htmlFor={option.id} 
                      className={`flex-1 ${textMark?.isMarkMode ? '' : 'cursor-pointer'} ${isSubmitted && isCorrectOption ? 'font-medium text-green-700' : ''}`}
                    >
                      <span className="font-medium mr-2">{option.optionKey}.</span>
                      <span
                        ref={(el) => { if (el) optionRefs.current[refKey] = el }}
                        onMouseUp={(e) => handleOptionMouseUp(currentQuestion.id, option.optionKey, e)}
                      >
                        {renderMarkedOption(currentQuestion.id, option.optionKey, option.content)}
                      </span>
                    </Label>
                    {optionMarkCount > 0 && !isSubmitted && (
                      <span 
                        className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 cursor-pointer hover:bg-yellow-200"
                        onClick={(e) => {
                          e.stopPropagation()
                          textMark?.clearRegionMarks('option', refKey)
                        }}
                        title="点击清除标记"
                      >
                        {optionMarkCount} 标记
                      </span>
                    )}
                    {isSubmitted && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {isSubmitted && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )
              })}
            </RadioGroup>
            
            {/* 解析 */}
            {isSubmitted && currentQuestion.analysis && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">解析</h4>
                <p className="text-sm text-blue-700">{currentQuestion.analysis}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* 底部导航 */}
      <div className="p-4 border-t bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => onNavigate(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            上一题
          </Button>
          
          <div className="text-sm text-gray-500">
            {currentIndex + 1} / {questions.length}
          </div>
          
          <Button
            variant="outline"
            onClick={() => onNavigate(currentIndex + 1)}
            disabled={currentIndex === questions.length - 1}
          >
            下一题
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
