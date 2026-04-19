'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Sun,
  Moon,
  BookPlus,
  X,
  Loader2
} from 'lucide-react'
import { useTextMark, MARK_COLOR, TextMark } from '@/hooks/useTextMark'

interface SevenFivePanelProps {
  content: string
  title: string
  options: Array<{ key: string; content: string }>  // A-G段落
  blanks: number[]  // 空位编号 [41, 42, 43, 44, 45]
  answers: Record<number, string>  // 空位 -> 选项
  isSubmitted: boolean
  correctAnswers?: Record<number, string>
  articleId?: string
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

export default function SevenFivePanel({
  content,
  title,
  options,
  blanks,
  answers,
  isSubmitted,
  correctAnswers,
  articleId,
  onAskAI,
  textMark,
}: SevenFivePanelProps) {
  const [eyeCareMode, setEyeCareMode] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // 生词功能
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [wordMeaning, setWordMeaning] = useState<string>('')
  const [wordPhonetic, setWordPhonetic] = useState<string>('')
  const [wordPos, setWordPos] = useState<string>('')
  const [isLoadingMeaning, setIsLoadingMeaning] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set())
  
  // 处理文章区域的文本选择（标记模式）
  const handleArticleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!textMark?.isMarkMode || isSubmitted) return
    
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    
    const selectedText = selection.toString().trim()
    if (!selectedText) return
    
    const range = selection.getRangeAt(0)
    const container = contentRef.current
    if (!container) return
    
    // 获取选中文本在容器内的位置
    const preSelectionRange = document.createRange()
    preSelectionRange.selectNodeContents(container)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const start = preSelectionRange.toString().length
    
    const end = start + selectedText.length
    
    textMark.addMark('article', selectedText, start, end)
    selection.removeAllRanges()
  }, [textMark, isSubmitted])
  
  // 点击文章中的标记删除
  const handleArticleMarkClick = useCallback((mark: TextMark, e: React.MouseEvent) => {
    e.stopPropagation()
    textMark?.removeMark(mark.id)
  }, [textMark])
  
  // 处理单词点击
  const handleWordClick = useCallback(async (word: string, e: React.MouseEvent) => {
    if (!isSubmitted) return
    
    const cleanWord = word.replace(/[.,!?;:'"()]/g, '').toLowerCase()
    if (!cleanWord || cleanWord.length < 2) return
    
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setPopupPosition({ x: rect.left, y: rect.bottom + 5 })
    setSelectedWord(cleanWord)
    
    setIsLoadingMeaning(true)
    try {
      const response = await fetch('/api/dictionary/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: cleanWord, articleId }),
      })
      const data = await response.json()
      setWordMeaning(data.meaning || '未找到释义')
      setWordPhonetic(data.phonetic || '')
      setWordPos(data.pos || '')
    } catch (error) {
      setWordMeaning('获取释义失败')
    } finally {
      setIsLoadingMeaning(false)
    }
  }, [isSubmitted, articleId])
  
  // 收藏到生词本
  const addToVocabulary = async () => {
    if (!selectedWord || !wordMeaning) return
    try {
      await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: selectedWord, isFavorite: true }),
      })
      setAddedWords(prev => new Set(prev).add(selectedWord))
    } catch (error) {
      console.error('收藏失败:', error)
    }
  }
  
  // 渲染带标记的文本
  const renderMarkedText = (text: string, globalOffset: number) => {
    if (!textMark) return <span>{text}</span>
    
    const articleMarks = textMark.getMarks('article')
    if (articleMarks.length === 0) return <span>{text}</span>
    
    // 找出当前文本范围内的标记
    const textStart = globalOffset
    const textEnd = globalOffset + text.length
    
    const relevantMarks = articleMarks.filter(m => 
      m.start < textEnd && m.end > textStart
    )
    
    if (relevantMarks.length === 0) return <span>{text}</span>
    
    const elements: React.ReactNode[] = []
    let lastIndex = 0
    
    relevantMarks.forEach((mark, i) => {
      const markStart = Math.max(0, mark.start - textStart)
      const markEnd = Math.min(text.length, mark.end - textStart)
      
      // 未标记部分
      if (markStart > lastIndex) {
        elements.push(
          <span key={`text-${i}`}>{text.slice(lastIndex, markStart)}</span>
        )
      }
      // 标记部分
      elements.push(
        <span
          key={`mark-${mark.id}`}
          className="cursor-pointer rounded px-0.5"
          style={{ background: MARK_COLOR }}
          onClick={(e) => handleArticleMarkClick(mark, e)}
          title="点击删除标记"
        >
          {text.slice(markStart, markEnd)}
        </span>
      )
      lastIndex = markEnd
    })
    
    // 剩余部分
    if (lastIndex < text.length) {
      elements.push(<span key="text-end">{text.slice(lastIndex)}</span>)
    }
    
    return elements
  }
  
  // 渲染文章内容，标记空位
  const renderContent = () => {
    const paragraphs = content.split('\n\n')
    let globalOffset = 0 // 全局字符偏移
    
    return paragraphs.map((paragraph, pIndex) => {
      // 匹配空位标记
      const gapPattern = /\((\d+)\)|\[(\d+)\]|_{2,}(\d+)_{2,}|（(\d+)）/g
      const elements: React.ReactNode[] = []
      let lastIndex = 0
      let match
      
      while ((match = gapPattern.exec(paragraph)) !== null) {
        const gapNum = parseInt(match[1] || match[2] || match[3] || match[4])
        
        // 只处理41-45的空位
        if (gapNum >= 41 && gapNum <= 45) {
          const matchStart = match.index
          const matchEnd = matchStart + match[0].length
          
          // 添加前面的文本（带标记）
          if (matchStart > lastIndex) {
            const textBefore = paragraph.slice(lastIndex, matchStart)
            elements.push(
              <span key={`text-${pIndex}-${lastIndex}`}>
                {renderMarkedText(textBefore, globalOffset + lastIndex)}
              </span>
            )
          }
          
          const answer = answers[gapNum]
          const isCorrect = isSubmitted && correctAnswers && answer === correctAnswers[gapNum]
          const isWrong = isSubmitted && correctAnswers && answer && answer !== correctAnswers[gapNum]
          const colorStyle = answer ? OPTION_COLORS[answer] : null
          
          elements.push(
            <span
              key={`gap-${pIndex}-${gapNum}`}
              className="inline-flex items-center mx-1"
            >
              <span
                className="px-4 py-2 rounded-lg font-medium text-sm border-2 transition-all"
                style={{
                  background: isSubmitted 
                    ? (isCorrect ? '#d1fae5' : isWrong ? '#fee2e2' : colorStyle?.light || '#f3f4f6')
                    : colorStyle?.light || '#f3f4f6',
                  borderColor: isSubmitted 
                    ? (isCorrect ? '#10b981' : isWrong ? '#ef4444' : colorStyle?.border || '#d1d5db')
                    : colorStyle?.border || '#d1d5db',
                  color: colorStyle?.text || '#6b7280',
                }}
              >
                {answer ? `[${answer}]` : `(${gapNum - 40})`}
                {isSubmitted && isWrong && correctAnswers && (
                  <span className="ml-2 text-xs opacity-70">正确: {correctAnswers[gapNum]}</span>
                )}
              </span>
            </span>
          )
          
          lastIndex = matchEnd
        }
      }
      
      // 添加剩余文本（带标记）
      if (lastIndex < paragraph.length) {
        const textAfter = paragraph.slice(lastIndex)
        elements.push(
          <span key={`text-end-${pIndex}`}>
            {renderMarkedText(textAfter, globalOffset + lastIndex)}
          </span>
        )
      }
      
      // 更新全局偏移（包括段落分隔符）
      globalOffset += paragraph.length + 2 // +2 for '\n\n'
      
      if (elements.length > 0) {
        return (
          <p key={pIndex} className="mb-6 leading-loose text-[17px]">
            {elements}
          </p>
        )
      }
      
      return (
        <p key={pIndex} className="mb-6 leading-loose text-[17px]">
          {renderMarkedText(paragraph, globalOffset - paragraph.length - 2)}
        </p>
      )
    })
  }
  
  // 计算统计
  const answeredCount = Object.keys(answers).length
  const correctCount = isSubmitted && correctAnswers
    ? blanks.filter(b => answers[b] === correctAnswers[b]).length 
    : 0

  return (
    <div 
      className="h-full flex flex-col transition-all duration-300"
      style={{ 
        background: eyeCareMode 
          ? 'linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 50%, #FFF8E1 100%)'
          : '#ffffff',
        filter: eyeCareMode ? 'sepia(0.1) saturate(1.1)' : 'none'
      }}
    >
      {/* 标题栏 */}
      <div 
        className="p-4 border-b flex-shrink-0"
        style={{ 
          background: eyeCareMode 
            ? 'linear-gradient(135deg, #C8E6C9 0%, #DCEDC8 100%)'
            : '#ffffff',
          borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 
            className="text-xl font-bold"
            style={{ color: eyeCareMode ? '#2E7D32' : '#111827' }}
          >
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEyeCareMode(!eyeCareMode)}
            style={{ background: eyeCareMode ? 'rgba(255,255,255,0.5)' : 'transparent' }}
          >
            {eyeCareMode ? (
              <div className="flex items-center gap-1">
                <span className="text-xs">护眼</span>
                <Sun className="w-4 h-4 text-amber-600" />
              </div>
            ) : (
              <Moon className="w-4 h-4 text-gray-500" />
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className="text-xs"
            style={eyeCareMode ? { borderColor: '#81C784', color: '#388E3C' } : {}}
          >
            七选五
          </Badge>
          <Badge 
            className="text-xs"
            style={eyeCareMode ? { background: '#C8E6C9', color: '#2E7D32' } : { background: '#d1fae5', color: '#065f46' }}
          >
            {answeredCount}/5 已选
          </Badge>
          {isSubmitted && (
            <Badge 
              className="text-white text-xs"
              style={{ background: correctCount === 5 ? '#10b981' : '#ef4444' }}
            >
              正确 {correctCount}/5
            </Badge>
          )}
        </div>
      </div>
      
      {/* 文章内容 */}
      <div 
        className="relative p-6"
        style={{ 
          flex: '1 1 0%', 
          minHeight: 0, 
          overflowY: 'auto',
          background: eyeCareMode 
            ? 'linear-gradient(180deg, #F1F8E9 0%, #FFFDE7 100%)'
            : '#ffffff',
          cursor: textMark?.isMarkMode ? 'text' : 'default'
        }}
        ref={contentRef}
        onMouseUp={handleArticleMouseUp}
      >
        <div
          className="prose prose-sm max-w-none select-text"
          style={{ color: eyeCareMode ? '#33691E' : '#374151' }}
          onDoubleClick={(e) => {
            const selection = window.getSelection()
            const word = selection?.toString().trim()
            if (word && isSubmitted) {
              handleWordClick(word, e)
            }
          }}
        >
          {renderContent()}
        </div>
        
        {/* 生词弹窗 */}
        {selectedWord && isSubmitted && (
          <div 
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 max-h-80"
            style={{ 
              left: Math.min(popupPosition.x, window.innerWidth - 300),
              top: Math.min(popupPosition.y, window.innerHeight - 350)
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-bold text-lg text-gray-900">{selectedWord}</span>
                {wordPhonetic && <span className="ml-2 text-sm text-gray-500">/{wordPhonetic}/</span>}
              </div>
              <button onClick={() => setSelectedWord(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            {wordPos && (
              <div className="mb-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{wordPos}</span>
              </div>
            )}
            {isLoadingMeaning ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>查询中...</span>
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-700 mb-3 leading-relaxed max-h-40 overflow-y-auto">
                  {wordMeaning.split('\\n').map((line, i) => (
                    <div key={i} className="mb-1">{line}</div>
                  ))}
                </div>
                <Button 
                  size="sm" 
                  onClick={addToVocabulary}
                  disabled={addedWords.has(selectedWord)}
                  className="w-full"
                  variant={addedWords.has(selectedWord) ? "secondary" : "default"}
                >
                  <BookPlus className="w-4 h-4 mr-1" />
                  {addedWords.has(selectedWord) ? '已收藏' : '收藏到生词本'}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* 底部已选答案汇总 */}
      <div 
        className="p-3 border-t flex-shrink-0"
        style={{ 
          background: eyeCareMode 
            ? 'linear-gradient(135deg, #C8E6C9 0%, #DCEDC8 100%)'
            : '#f9fafb',
          borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {blanks.sort((a, b) => a - b).map(blankNum => {
            const answer = answers[blankNum]
            const colorStyle = answer ? OPTION_COLORS[answer] : null
            const isCorrect = isSubmitted && correctAnswers && answer === correctAnswers[blankNum]
            const isWrong = isSubmitted && correctAnswers && answer && answer !== correctAnswers[blankNum]
            
            return (
              <div
                key={blankNum}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border-2"
                style={{
                  background: isSubmitted 
                    ? (isCorrect ? '#d1fae5' : isWrong ? '#fee2e2' : colorStyle?.light || '#f3f4f6')
                    : colorStyle?.light || '#f3f4f6',
                  borderColor: isSubmitted 
                    ? (isCorrect ? '#10b981' : isWrong ? '#ef4444' : colorStyle?.border || '#d1d5db')
                    : colorStyle?.border || '#d1d5db',
                  color: colorStyle?.text || '#6b7280',
                }}
              >
                <span className="text-xs opacity-70">{blankNum - 40}.</span>
                <span>{answer || '_'}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
