'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sun, Moon, BookPlus, X, Loader2 } from 'lucide-react'

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

interface ClozePanelProps {
  content: string
  title: string
  blanks: ClozeBlank[]
  answers: Record<number, string>  // blankNum -> optionKey
  currentBlank: number | null
  onSelectBlank: (blankNum: number) => void
  isSubmitted: boolean
  articleId?: string
}

// 护眼模式颜色
const OPTION_COLORS: Record<string, string> = {
  'A': '#fef3c7',
  'B': '#dbeafe',
  'C': '#dcfce7',
  'D': '#fce7f3',
}

export default function ClozePanel({
  content,
  title,
  blanks,
  answers,
  currentBlank,
  onSelectBlank,
  isSubmitted,
  articleId,
}: ClozePanelProps) {
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
  
  // 渲染文章内容，标记空位
  const renderContent = () => {
    const gapPattern = /\[(\d+)\]|\((\d+)\)|_{2,}(\d+)_{2,}|（(\d+)）/g
    const elements: React.ReactNode[] = []
    let lastIndex = 0
    let match
    
    while ((match = gapPattern.exec(content)) !== null) {
      const blankNum = parseInt(match[1] || match[2] || match[3] || match[4])
      const matchStart = match.index
      const matchEnd = matchStart + match[0].length
      
      // 添加前面的文本
      if (matchStart > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>{content.slice(lastIndex, matchStart)}</span>
        )
      }
      
      const answer = answers[blankNum]
      const blank = blanks.find(b => b.blankNum === blankNum)
      const isCorrect = isSubmitted && blank && answer === blank.correctAnswer
      const isWrong = isSubmitted && blank && answer && answer !== blank.correctAnswer
      const isCurrent = currentBlank === blankNum
      
      elements.push(
        <span
          key={`blank-${blankNum}`}
          className="inline-flex items-center mx-0.5 cursor-pointer"
          onClick={() => !isSubmitted && onSelectBlank(blankNum)}
        >
          <span
            className="px-3 py-1 rounded-lg font-medium text-sm border-2 transition-all min-w-[50px] text-center"
            style={{
              background: isSubmitted 
                ? (isCorrect ? '#d1fae5' : isWrong ? '#fee2e2' : answer ? OPTION_COLORS[answer] : '#f3f4f6')
                : isCurrent ? '#bfdbfe' : answer ? OPTION_COLORS[answer] : '#f3f4f6',
              borderColor: isSubmitted 
                ? (isCorrect ? '#10b981' : isWrong ? '#ef4444' : answer ? '#3b82f6' : '#d1d5db')
                : isCurrent ? '#3b82f6' : answer ? '#3b82f6' : '#d1d5db',
              color: answer ? '#1e3a5f' : '#6b7280',
              boxShadow: isCurrent ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none',
            }}
          >
            {answer || `[${blankNum}]`}
          </span>
        </span>
      )
      
      lastIndex = matchEnd
    }
    
    // 添加剩余文本
    if (lastIndex < content.length) {
      elements.push(
        <span key={`text-end`}>{content.slice(lastIndex)}</span>
      )
    }
    
    // 按段落分割
    const fullText = elements.length > 0 ? elements : [content]
    const paragraphs: React.ReactNode[] = []
    let currentParagraph: React.ReactNode[] = []
    let pKey = 0
    
    fullText.forEach((el, i) => {
      if (typeof el === 'string' && el.includes('\n\n')) {
        const parts = el.split('\n\n')
        parts.forEach((part, j) => {
          if (j > 0 && currentParagraph.length > 0) {
            paragraphs.push(
              <p key={`p-${pKey++}`} className="mb-6 leading-loose text-[17px]">
                {currentParagraph}
              </p>
            )
            currentParagraph = []
          }
          if (part) currentParagraph.push(<span key={`part-${i}-${j}`}>{part}</span>)
        })
      } else {
        currentParagraph.push(el)
      }
    })
    
    if (currentParagraph.length > 0) {
      paragraphs.push(
        <p key={`p-${pKey}`} className="mb-6 leading-loose text-[17px]">
          {currentParagraph}
        </p>
      )
    }
    
    return paragraphs.length > 0 ? paragraphs : (
      <p className="mb-6 leading-loose text-[17px]">{fullText}</p>
    )
  }
  
  // 计算统计
  const answeredCount = Object.keys(answers).length
  const correctCount = isSubmitted 
    ? blanks.filter(b => answers[b.blankNum] === b.correctAnswer).length 
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
            完型填空
          </Badge>
          <Badge 
            className="text-xs"
            style={eyeCareMode ? { background: '#C8E6C9', color: '#2E7D32' } : { background: '#d1fae5', color: '#065f46' }}
          >
            {answeredCount}/20 已选
          </Badge>
          {isSubmitted && (
            <Badge 
              className="text-white text-xs"
              style={{ background: correctCount >= 12 ? '#10b981' : '#ef4444' }}
            >
              正确 {correctCount}/20
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
            : '#ffffff'
        }}
        ref={contentRef}
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
        <div className="flex items-center gap-1 flex-wrap">
          {blanks.sort((a, b) => a.blankNum - b.blankNum).map(blank => {
            const answer = answers[blank.blankNum]
            const isCorrect = isSubmitted && answer === blank.correctAnswer
            const isWrong = isSubmitted && answer && answer !== blank.correctAnswer
            const isCurrent = currentBlank === blank.blankNum
            
            return (
              <div
                key={blank.blankNum}
                className="flex items-center gap-0.5 px-2 py-1 rounded text-xs font-medium border transition-all cursor-pointer"
                style={{
                  background: isSubmitted 
                    ? (isCorrect ? '#d1fae5' : isWrong ? '#fee2e2' : answer ? OPTION_COLORS[answer] : '#f3f4f6')
                    : isCurrent ? '#bfdbfe' : answer ? OPTION_COLORS[answer] : '#f3f4f6',
                  borderColor: isSubmitted 
                    ? (isCorrect ? '#10b981' : isWrong ? '#ef4444' : answer ? '#3b82f6' : '#d1d5db')
                    : isCurrent ? '#3b82f6' : answer ? '#3b82f6' : '#d1d5db',
                  color: answer ? '#1e3a5f' : '#6b7280',
                }}
                onClick={() => !isSubmitted && onSelectBlank(blank.blankNum)}
              >
                <span className="opacity-60">{blank.blankNum}.</span>
                <span>{answer || '_'}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
