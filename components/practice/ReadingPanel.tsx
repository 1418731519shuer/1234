'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Highlighter, 
  Languages,
  Loader2,
  Eye,
  Sun,
  Moon,
  BookPlus,
  X
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
  articleId?: string
  isSubmitted?: boolean
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
  articleId,
  isSubmitted = false,
}: ReadingPanelProps) {
  const [activeColor, setActiveColor] = useState<string>('red')
  const [hoveredHighlight, setHoveredHighlight] = useState<string | null>(null)
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(null)
  const [isMarkingMode, setIsMarkingMode] = useState(true)
  const [showTranslation, setShowTranslation] = useState(false)
  const [eyeCareMode, setEyeCareMode] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // 生词功能状态
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [wordMeaning, setWordMeaning] = useState<string>('')
  const [wordPhonetic, setWordPhonetic] = useState<string>('')
  const [wordPos, setWordPos] = useState<string>('')
  const [isLoadingMeaning, setIsLoadingMeaning] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set())
  
  // 生词缓存（预加载后存储）
  const [wordCache, setWordCache] = useState<Record<string, { meaning: string; phonetic?: string; pos?: string }>>({})
  const [isPreloading, setIsPreloading] = useState(false)

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
  
  // 提交后预加载文章所有生词
  useEffect(() => {
    if (isSubmitted && articleId && content) {
      setIsPreloading(true)
      fetch(`/api/dictionary/lookup?articleId=${articleId}&content=${encodeURIComponent(content.slice(0, 5000))}`)
        .then(res => res.json())
        .then(data => {
          if (data.words) {
            const cache: Record<string, { meaning: string; phonetic?: string; pos?: string }> = {}
            for (const [word, info] of Object.entries(data.words)) {
              const item = info as { meaning: string; phonetic?: string; pos?: string }
              cache[word] = {
                meaning: item.meaning,
                phonetic: item.phonetic,
                pos: item.pos,
              }
            }
            setWordCache(cache)
          }
        })
        .catch(console.error)
        .finally(() => setIsPreloading(false))
    }
  }, [isSubmitted, articleId, content])

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
  
  // 处理单词点击（提交后可用）- 优先从缓存读取
  const handleWordClick = useCallback(async (word: string, e: React.MouseEvent) => {
    if (!isSubmitted) return
    
    // 清理单词（去除标点）
    const cleanWord = word.replace(/[.,!?;:'"()]/g, '').toLowerCase()
    if (!cleanWord || cleanWord.length < 2) return
    
    // 设置弹窗位置
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setPopupPosition({ x: rect.left, y: rect.bottom + 5 })
    setSelectedWord(cleanWord)
    
    // 优先从缓存读取
    if (wordCache[cleanWord]) {
      setWordMeaning(wordCache[cleanWord].meaning)
      setWordPhonetic(wordCache[cleanWord].phonetic || '')
      setWordPos(wordCache[cleanWord].pos || '')
      setIsLoadingMeaning(false)
      return
    }
    
    // 缓存没有，调用本地词典API
    setWordMeaning('')
    setWordPhonetic('')
    setWordPos('')
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
      // 更新缓存
      if (data.meaning) {
        setWordCache(prev => ({ 
          ...prev, 
          [cleanWord]: { 
            meaning: data.meaning, 
            phonetic: data.phonetic, 
            pos: data.pos 
          } 
        }))
      }
    } catch (error) {
      setWordMeaning('获取释义失败')
    } finally {
      setIsLoadingMeaning(false)
    }
  }, [isSubmitted, wordCache, articleId])
  
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
    <div 
      className="h-full flex flex-col transition-all duration-300"
      style={{ 
        background: eyeCareMode 
          ? 'linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 50%, #FFF8E1 100%)'
          : '#ffffff',
        filter: eyeCareMode ? 'sepia(0.1) saturate(1.1)' : 'none'
      }}
    >
      {/* 文章标题 */}
      <div 
        className="p-4 border-b"
        style={{ 
          background: eyeCareMode 
            ? 'linear-gradient(135deg, #C8E6C9 0%, #DCEDC8 100%)'
            : '#ffffff',
          borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 
            className="text-xl font-bold"
            style={{ color: eyeCareMode ? '#2E7D32' : '#111827' }}
          >
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEyeCareMode(!eyeCareMode)}
              title={eyeCareMode ? '关闭护眼模式' : '开启护眼模式'}
              style={{ 
                background: eyeCareMode ? 'rgba(255,255,255,0.5)' : 'transparent'
              }}
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
            <Button
              variant={showTranslation ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if ((translation?.length ?? 0) === 0 && onTranslate) {
                  onTranslate()
                }
                setShowTranslation(!showTranslation)
              }}
              disabled={isTranslating}
              style={eyeCareMode ? { 
                borderColor: '#81C784',
                background: showTranslation ? '#66BB6A' : 'rgba(255,255,255,0.7)'
              } : {}}
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
          <span 
            className="text-sm"
            style={{ color: eyeCareMode ? '#558B2F' : '#6b7280' }}
          >
            标记笔:
          </span>
          {COLORS.map((color, index) => (
            <button
              key={color.id}
              onClick={() => setActiveColor(color.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all duration-200
                ${activeColor === color.id 
                  ? `${color.bg} ${color.border} shadow-sm scale-105` 
                  : eyeCareMode 
                    ? 'bg-white/60 border-green-200 hover:bg-white/80'
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
              style={eyeCareMode && !isMarkingMode ? { 
                borderColor: '#81C784',
                background: 'rgba(255,255,255,0.7)'
              } : eyeCareMode && isMarkingMode ? {
                background: '#66BB6A'
              } : {}}
            >
              <Highlighter className="w-4 h-4 mr-1" />
              {isMarkingMode ? '标记中' : '仅阅读'}
            </Button>
          </div>
        </div>
        
        {/* 当前题目提示 */}
        <div className="mt-3 flex items-center gap-2">
          <Badge 
            variant="outline" 
            className="text-xs"
            style={eyeCareMode ? { borderColor: '#81C784', color: '#388E3C' } : {}}
          >
            当前: Q{currentQuestion}
          </Badge>
          <Badge 
            className={`${getColorClass(activeColor).bg} ${getColorClass(activeColor).text} text-xs border ${getColorClass(activeColor).border}`}
          >
            {getColorClass(activeColor).name}笔
          </Badge>
          {isMarkingMode && (
            <span 
              className="text-xs"
              style={{ color: eyeCareMode ? '#689F38' : '#9ca3af' }}
            >
              滑过文本自动标记
            </span>
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
          className={`prose prose-sm max-w-none select-text ${isMarkingMode ? 'cursor-crosshair' : 'cursor-text'}`}
          style={{ color: eyeCareMode ? '#33691E' : '#374151' }}
          onMouseUp={handleMouseUp}
          onDoubleClick={(e) => {
            const selection = window.getSelection()
            const word = selection?.toString().trim()
            if (word && isSubmitted) {
              handleWordClick(word, e)
            }
          }}
        >
          {showTranslation && (translation?.length ?? 0) > 0 ? renderTranslation() : renderContent()}
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
                {wordPhonetic && (
                  <span className="ml-2 text-sm text-gray-500">/{wordPhonetic}/</span>
                )}
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
      
      {/* 底部工具栏 */}
      <div 
        className="p-3 border-t"
        style={{ 
          background: eyeCareMode 
            ? 'linear-gradient(135deg, #C8E6C9 0%, #DCEDC8 100%)'
            : '#f9fafb',
          borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
        }}
      >
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-4 text-sm"
            style={{ color: eyeCareMode ? '#558B2F' : '#6b7280' }}
          >
            <span className="flex items-center gap-1">
              <Highlighter className="w-4 h-4" />
              {isMarkingMode ? '滑过文本标记' : '仅阅读模式'}
            </span>
            <span style={{ color: eyeCareMode ? '#81C784' : '#d1d5db' }}>|</span>
            <span>快捷键: 1-4 切换颜色 | Backspace 删除</span>
          </div>
          <div className="flex items-center gap-2">
            {COLORS.map((color) => {
              const count = highlights.filter(h => h.color === color.id).length
              return (
                <div key={color.id} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${color.mark} border ${color.border}`} />
                  <span 
                    className="text-xs"
                    style={{ color: eyeCareMode ? '#689F38' : '#6b7280' }}
                  >
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
