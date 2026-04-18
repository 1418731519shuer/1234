'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Highlighter, 
  Languages,
  Loader2,
  Eye,
  Sun,
  Moon
} from 'lucide-react'

interface ReadingPanelProps {
  content: string
  title: string
  highlights: Array<{
    id?: string
    text: string
    color: string
    questionNum: number
    note?: string
  }>
  currentQuestion: number
  onHighlight: (text: string, color: string, questionNum: number) => void
  onRemoveHighlight?: (text: string) => void
  onUpdateHighlight?: (text: string, color: string) => void
  onTextSelect?: (text: string) => void
  translation?: Array<{english: string, chinese: string}>
  onTranslate?: () => void
  isTranslating?: boolean
}

// 4种护眼柔和颜色
const COLORS = [
  { id: 'red', name: '红色', bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-700', mark: 'bg-rose-200/70' },
  { id: 'blue', name: '蓝色', bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-700', mark: 'bg-sky-200/70' },
  { id: 'green', name: '绿色', bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700', mark: 'bg-emerald-200/70' },
  { id: 'yellow', name: '黄色', bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700', mark: 'bg-amber-200/70' },
]

// 快捷键映射
const COLOR_SHORTCUTS: Record<string, string> = {
  '1': 'red',
  '2': 'blue',
  '3': 'green',
  '4': 'yellow',
}

export default function ReadingPanel({
  content,
  title,
  highlights,
  currentQuestion,
  onHighlight,
  onRemoveHighlight,
  onUpdateHighlight,
  onTextSelect,
  translation,
  onTranslate,
  isTranslating,
}: ReadingPanelProps) {
  const [activeColor, setActiveColor] = useState<string>('red')
  const [hoveredHighlight, setHoveredHighlight] = useState<string | null>(null)
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(null)
  const [isMarkingMode, setIsMarkingMode] = useState(true)
  const [showTranslation, setShowTranslation] = useState(false)
  const [eyeCareMode, setEyeCareMode] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1-4 切换颜色
      if (e.key >= '1' && e.key <= '4') {
        const colorId = COLOR_SHORTCUTS[e.key]
        if (colorId) {
          setActiveColor(colorId)
        }
      }
      // Backspace 删除选中的高亮
      if (e.key === 'Backspace' && selectedHighlight) {
        onRemoveHighlight?.(selectedHighlight)
        setSelectedHighlight(null)
      }
      // Escape 取消选中
      if (e.key === 'Escape') {
        setSelectedHighlight(null)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedHighlight, onRemoveHighlight])

  // 鼠标滑过文本时自动标记
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isMarkingMode) return
    
    const selection = window.getSelection()
    const text = selection?.toString().trim()
    
    if (text && text.length > 0) {
      // 检查是否已有相同文本的高亮
      const existingHighlight = highlights.find(h => h.text === text)
      
      if (existingHighlight) {
        // 更新颜色
        onUpdateHighlight?.(text, activeColor)
      } else {
        // 新增高亮
        onHighlight(text, activeColor, currentQuestion)
      }
      
      // 清除选择
      selection?.removeAllRanges()
      onTextSelect?.(text)
    }
  }, [isMarkingMode, activeColor, currentQuestion, highlights, onHighlight, onUpdateHighlight, onTextSelect])

  const getColorClass = (colorId: string) => {
    return COLORS.find(c => c.id === colorId) || COLORS[0]
  }

  // 渲染带高亮的文章内容
  const renderContent = () => {
    const paragraphs = content.split('\n\n')
    
    return paragraphs.map((paragraph, pIndex) => {
      const highlightsInParagraph = highlights.filter(h => paragraph.includes(h.text))
      
      if (highlightsInParagraph.length > 0) {
        const elements: React.ReactNode[] = []
        let lastIndex = 0
        const sortedHighlights = [...highlightsInParagraph].sort((a, b) => 
          paragraph.indexOf(a.text) - paragraph.indexOf(b.text)
        )
        
        sortedHighlights.forEach((h, hIndex) => {
          const index = paragraph.indexOf(h.text, lastIndex)
          if (index > lastIndex) {
            elements.push(
              <span key={`text-${pIndex}-${hIndex}`}>
                {paragraph.slice(lastIndex, index)}
              </span>
            )
          }
          
          const colorClass = getColorClass(h.color)
          const isHovered = hoveredHighlight === h.text
          const isSelected = selectedHighlight === h.text
          
          elements.push(
            <span
              key={`highlight-${pIndex}-${hIndex}`}
              className={`
                ${colorClass.mark} border-b-2 ${colorClass.border} px-0.5 rounded 
                cursor-pointer transition-all duration-150
                ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                ${isHovered ? 'ring-1 ring-offset-1 ring-gray-400' : ''}
              `}
              onMouseEnter={() => setHoveredHighlight(h.text)}
              onMouseLeave={() => setHoveredHighlight(null)}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedHighlight(h.text)
              }}
              title={`Q${h.questionNum} - ${colorClass.name}标记 (点击后按Backspace删除)`}
            >
              {h.text}
            </span>
          )
          lastIndex = index + h.text.length
        })
        
        if (lastIndex < paragraph.length) {
          elements.push(
            <span key={`text-end-${pIndex}`}>
              {paragraph.slice(lastIndex)}
            </span>
          )
        }
        
        return (
          <p key={pIndex} className="mb-6 leading-loose text-[17px]">
            {elements}
          </p>
        )
      }
      
      return (
        <p key={pIndex} className="mb-6 leading-loose text-[17px]">
          {paragraph}
        </p>
      )
    })
  }

  // 渲染翻译内容（逐句对照）
  const renderTranslation = () => {
    if (!translation || translation.length === 0) return null
    
    return (
      <div className="space-y-4">
        {translation.map((sentence, i) => (
          <div key={i} className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
            <p className="text-sm text-gray-600 leading-relaxed mb-2">{sentence.english}</p>
            <p className="text-[15px] text-gray-800 leading-relaxed">
              {sentence.chinese}
            </p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col transition-colors duration-300 ${
      eyeCareMode 
        ? 'bg-[#f7f3e3]' 
        : 'bg-white'
    }`}>
      {/* 文章标题 */}
      <div className={`p-4 border-b ${eyeCareMode ? 'bg-[#f0ebe0]' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEyeCareMode(!eyeCareMode)}
              title={eyeCareMode ? '关闭护眼模式' : '开启护眼模式'}
            >
              {eyeCareMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant={showTranslation ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (translation.length === 0 && onTranslate) {
                  onTranslate()
                }
                setShowTranslation(!showTranslation)
              }}
              disabled={isTranslating}
            >
              {isTranslating ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Languages className="w-4 h-4 mr-1" />
              )}
              {showTranslation ? '隐藏翻译' : '全文翻译'}
            </Button>
          </div>
        </div>
        
        {/* 颜色选择器 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">标记笔:</span>
          {COLORS.map((color, index) => (
            <button
              key={color.id}
              onClick={() => setActiveColor(color.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all duration-200
                ${activeColor === color.id 
                  ? `${color.bg} ${color.border} shadow-sm scale-105` 
                  : 'bg-white/50 border-gray-200 hover:bg-gray-50'
                }
              `}
              title={`快捷键: ${index + 1}`}
            >
              <div className={`w-3 h-3 rounded-full ${color.mark} border ${color.border}`} />
              <span className="text-xs font-medium">{index + 1}</span>
            </button>
          ))}
          
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={isMarkingMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsMarkingMode(!isMarkingMode)}
            >
              <Highlighter className="w-4 h-4 mr-1" />
              {isMarkingMode ? '标记中' : '仅阅读'}
            </Button>
          </div>
        </div>
        
        {/* 当前题目提示 */}
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            当前: Q{currentQuestion}
          </Badge>
          <Badge className={`${getColorClass(activeColor).bg} ${getColorClass(activeColor).text} text-xs border ${getColorClass(activeColor).border}`}>
            {getColorClass(activeColor).name}笔
          </Badge>
          {isMarkingMode && (
            <span className="text-xs text-gray-400">滑过文本自动标记</span>
          )}
        </div>
      </div>
      
      {/* 文章内容 */}
      <ScrollArea className={`flex-1 p-6 ${eyeCareMode ? 'bg-[#f7f3e3]' : 'bg-white'}`}>
        <div
          className={`prose prose-sm max-w-none select-text ${isMarkingMode ? 'cursor-crosshair' : 'cursor-text'} ${eyeCareMode ? 'text-[#3d3d3d]' : 'text-gray-800'}`}
          onMouseUp={handleMouseUp}
        >
          {showTranslation && translation.length > 0 ? renderTranslation() : renderContent()}
        </div>
      </ScrollArea>
      
      {/* 底部工具栏 */}
      <div className={`p-3 border-t ${eyeCareMode ? 'bg-[#f0ebe0]' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Highlighter className="w-4 h-4" />
              {isMarkingMode ? '滑过文本标记' : '仅阅读模式'}
            </span>
            <span className="text-gray-300">|</span>
            <span>快捷键: 1-4 切换颜色 | Backspace 删除</span>
          </div>
          <div className="flex items-center gap-2">
            {COLORS.map((color) => {
              const count = highlights.filter(h => h.color === color.id).length
              return (
                <div key={color.id} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${color.mark} border ${color.border}`} />
                  <span className="text-xs text-gray-500">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
