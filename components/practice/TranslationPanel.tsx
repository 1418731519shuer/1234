'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sun, Moon, BookPlus, X, Loader2, Languages, ChevronUp, ChevronDown } from 'lucide-react'
import { useTextMark, MARK_COLORS, TextMark, MarkColorType } from '@/hooks/useTextMark'

interface TranslationSentence {
  id: string
  sentenceNum: number
  englishText: string
  referenceCn?: string
  keyVocabulary?: string
  grammarPoints?: string
  scoringRules?: string
  userAnswer?: string
  aiScore?: {
    vocabScore: number
    fluencyScore: number
    totalScore: number
    feedback: string
  }
}

interface TranslationPanelProps {
  content: string
  title: string
  sentences: TranslationSentence[]
  currentIndex: number
  onSelectSentence: (index: number) => void
  isSubmitted: boolean
  textMark?: ReturnType<typeof useTextMark>
  onAskAI?: (question: string) => void
  articleId?: string
  savedTranslation?: string  // 已保存的翻译
}

export default function TranslationPanel({
  content,
  title,
  sentences,
  currentIndex,
  onSelectSentence,
  isSubmitted,
  textMark,
  onAskAI,
  articleId,
  savedTranslation,
}: TranslationPanelProps) {
  const [eyeCareMode, setEyeCareMode] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // 全文翻译
  const [showFullTranslation, setShowFullTranslation] = useState(false)
  const [fullTranslation, setFullTranslation] = useState<string>(savedTranslation || '')
  const [translationSentences, setTranslationSentences] = useState<Array<{english: string, chinese: string}>>([])
  const [isTranslating, setIsTranslating] = useState(false)
  
  // 生词功能
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [wordMeaning, setWordMeaning] = useState<string>('')
  const [wordPhonetic, setWordPhonetic] = useState<string>('')
  const [wordPos, setWordPos] = useState<string>('')
  const [isLoadingMeaning, setIsLoadingMeaning] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set())
  
  // 同步已保存的翻译
  useEffect(() => {
    if (savedTranslation) {
      setFullTranslation(savedTranslation)
    }
  }, [savedTranslation])
  
  // 全文翻译
  const handleFullTranslation = async () => {
    if (showFullTranslation) {
      setShowFullTranslation(false)
      return
    }
    
    // 如果已有翻译句子数据，直接显示
    if (translationSentences.length > 0) {
      setShowFullTranslation(true)
      return
    }
    
    // 如果有已保存的翻译文本，尝试解析
    if (savedTranslation) {
      try {
        const parsed = JSON.parse(savedTranslation)
        if (Array.isArray(parsed)) {
          setTranslationSentences(parsed)
          setShowFullTranslation(true)
          return
        }
      } catch {
        // 不是JSON格式，按行解析
        const lines = savedTranslation.split('\n\n').filter(l => l.trim())
        const sentences: Array<{english: string, chinese: string}> = []
        for (const line of lines) {
          const parts = line.split('\n')
          if (parts.length >= 2) {
            sentences.push({ english: parts[0], chinese: parts[1] })
          }
        }
        if (sentences.length > 0) {
          setTranslationSentences(sentences)
          setShowFullTranslation(true)
          return
        }
      }
    }
    
    if (!articleId || !content) return
    
    setIsTranslating(true)
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          content: content.slice(0, 5000), // 限制长度
        }),
      })
      const data = await response.json()
      
      if (data.sentences && Array.isArray(data.sentences)) {
        setTranslationSentences(data.sentences)
        setFullTranslation(JSON.stringify(data.sentences))
      } else if (data.translation) {
        setFullTranslation(data.translation)
      }
      
      setShowFullTranslation(true)
    } catch (error) {
      console.error('Translation error:', error)
    } finally {
      setIsTranslating(false)
    }
  }
  
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
        body: JSON.stringify({ word: cleanWord }),
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
  }, [isSubmitted])
  
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
      
      if (markStart > lastIndex) {
        elements.push(
          <span key={`text-${i}`}>{text.slice(lastIndex, markStart)}</span>
        )
      }
      const colorStyle = textMark.getMarkColorStyle(mark.color)
      elements.push(
        <span
          key={`mark-${mark.id}`}
          className="cursor-pointer rounded px-0.5"
          style={{ background: colorStyle.bg }}
          onClick={(e) => handleArticleMarkClick(mark, e)}
          title="点击删除标记"
        >
          {text.slice(markStart, markEnd)}
        </span>
      )
      lastIndex = markEnd
    })
    
    if (lastIndex < text.length) {
      elements.push(<span key="text-end">{text.slice(lastIndex)}</span>)
    }
    
    return elements
  }
  
  // 渲染文章内容，标记划线句子
  const renderContent = () => {
    // 构建句子位置映射
    const sentencePositions: { start: number; end: number; sentence: TranslationSentence }[] = []
    
    sentences.forEach(sentence => {
      const index = content.indexOf(sentence.englishText)
      if (index !== -1) {
        sentencePositions.push({
          start: index,
          end: index + sentence.englishText.length,
          sentence
        })
      }
    })
    
    // 按位置排序
    sentencePositions.sort((a, b) => a.start - b.start)
    
    const elements: React.ReactNode[] = []
    let globalOffset = 0
    
    // 处理段落
    const paragraphs = content.split('\n\n')
    
    paragraphs.forEach((paragraph, pIndex) => {
      const paragraphStart = globalOffset
      const paragraphEnd = globalOffset + paragraph.length
      
      // 找出当前段落中的划线句子
      const sentencesInParagraph = sentencePositions.filter(sp => 
        sp.start >= paragraphStart && sp.start < paragraphEnd
      )
      
      if (sentencesInParagraph.length > 0) {
        const paragraphElements: React.ReactNode[] = []
        let pLastIndex = 0
        
        sentencesInParagraph.forEach((sp, sIndex) => {
          const localStart = sp.start - paragraphStart
          const localEnd = sp.end - paragraphStart
          const sentenceIndex = sentences.findIndex(s => s.id === sp.sentence.id)
          const isCurrent = sentenceIndex === currentIndex
          const hasAnswer = !!sp.sentence.userAnswer
          
          // 添加前面的文本
          if (localStart > pLastIndex) {
            const textBefore = paragraph.slice(pLastIndex, localStart)
            paragraphElements.push(
              <span key={`text-${pIndex}-${sIndex}`}>
                {renderMarkedText(textBefore, paragraphStart + pLastIndex)}
              </span>
            )
          }
          
          // 添加划线句子
          paragraphElements.push(
            <span
              key={`sentence-${sp.sentence.id}`}
              className={`
                cursor-pointer px-1 rounded transition-all
                ${isCurrent ? 'ring-2 ring-blue-500 bg-blue-100' : 'bg-yellow-100'}
                ${hasAnswer && !isSubmitted ? 'border-b-2 border-blue-400' : ''}
              `}
              style={{
                textDecoration: 'underline',
                textDecorationColor: isCurrent ? '#3b82f6' : '#eab308',
                textDecorationThickness: '2px',
                textUnderlineOffset: '3px',
              }}
              onClick={() => onSelectSentence(sentenceIndex)}
            >
              {sp.sentence.englishText}
              <span className="ml-1 text-xs text-blue-500 font-medium">
                ({sp.sentence.sentenceNum})
              </span>
            </span>
          )
          
          pLastIndex = localEnd
        })
        
        // 添加剩余文本
        if (pLastIndex < paragraph.length) {
          const textAfter = paragraph.slice(pLastIndex)
          paragraphElements.push(
            <span key={`text-end-${pIndex}`}>
              {renderMarkedText(textAfter, paragraphStart + pLastIndex)}
            </span>
          )
        }
        
        elements.push(
          <p key={`p-${pIndex}`} className="mb-6 leading-loose text-[17px]">
            {paragraphElements}
          </p>
        )
      } else {
        // 没有划线句子的段落
        elements.push(
          <p key={`p-${pIndex}`} className="mb-6 leading-loose text-[17px]">
            {renderMarkedText(paragraph, paragraphStart)}
          </p>
        )
      }
      
      globalOffset = paragraphEnd + 2
    })
    
    return elements
  }
  
  // 计算统计
  const answeredCount = sentences.filter(s => s.userAnswer && s.userAnswer.trim()).length

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
          <div className="flex items-center gap-2">
            {/* 全文翻译按钮 */}
            {isSubmitted && (
              <Button
                variant={showFullTranslation ? "default" : "outline"}
                size="sm"
                onClick={handleFullTranslation}
                disabled={isTranslating}
                style={eyeCareMode ? { 
                  borderColor: '#81C784',
                  background: showFullTranslation ? '#66BB6A' : 'rgba(255,255,255,0.7)'
                } : {}}
              >
                {isTranslating ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Languages className="w-4 h-4 mr-1" />
                )}
                {fullTranslation ? (showFullTranslation ? '隐藏翻译' : '全文翻译') : '全文翻译'}
              </Button>
            )}
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
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className="text-xs"
            style={eyeCareMode ? { borderColor: '#81C784', color: '#388E3C' } : {}}
          >
            英译汉
          </Badge>
          <Badge 
            className="text-xs"
            style={eyeCareMode ? { background: '#C8E6C9', color: '#2E7D32' } : { background: '#fef3c7', color: '#92400e' }}
          >
            {answeredCount}/{sentences.length} 已翻译
          </Badge>
          <span className="text-xs ml-2" style={{ color: eyeCareMode ? '#689F38' : '#9ca3af' }}>
            点击划线句子翻译
          </span>
        </div>
      </div>
      
      {/* 全文翻译内容 */}
      {showFullTranslation && translationSentences.length > 0 && (
        <div 
          className="p-4 border-b flex-shrink-0 max-h-[40%] overflow-y-auto"
          style={{ 
            background: eyeCareMode ? '#E8F5E9' : '#f0f9ff',
            borderColor: eyeCareMode ? '#A5D6A7' : '#bfdbfe'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: eyeCareMode ? '#2E7D32' : '#1e40af' }}>
              全文翻译（逐句对照）
            </span>
            <button
              className="text-xs text-slate-400 hover:text-slate-600"
              onClick={() => setShowFullTranslation(false)}
            >
              收起
            </button>
          </div>
          <div className="space-y-3">
            {translationSentences.map((sentence, i) => (
              <div 
                key={i} 
                className="p-3 rounded-lg bg-amber-50/50 border border-amber-100"
                style={eyeCareMode ? { background: 'rgba(255,255,255,0.6)', borderColor: '#A5D6A7' } : {}}
              >
                <p className="text-sm text-gray-600 leading-relaxed mb-2">{sentence.english}</p>
                <p className="text-[15px] leading-relaxed" style={{ color: eyeCareMode ? '#33691E' : '#374151' }}>
                  {sentence.chinese}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
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
      
      {/* 底部句子导航 */}
      <div 
        className="p-3 border-t flex-shrink-0"
        style={{ 
          background: eyeCareMode 
            ? 'linear-gradient(135deg, #C8E6C9 0%, #DCEDC8 100%)'
            : '#f9fafb',
          borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
        }}
      >
        {/* 标记模式颜色选择器 */}
        {textMark?.isMarkMode && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b" style={{ borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb' }}>
            <span className="text-xs" style={{ color: eyeCareMode ? '#558B2F' : '#6b7280' }}>
              标记颜色：
            </span>
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
          </div>
        )}
        
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: eyeCareMode ? '#558B2F' : '#6b7280' }}>
            划线句子：
          </span>
          {sentences.map((sentence, index) => {
            const isCurrent = index === currentIndex
            const hasAnswer = !!sentence.userAnswer
            
            return (
              <button
                key={sentence.id}
                onClick={() => onSelectSentence(index)}
                className={`
                  w-8 h-8 rounded-lg font-medium text-sm transition-all
                  ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                  ${isSubmitted && sentence.aiScore
                    ? sentence.aiScore.totalScore >= 1.5 
                      ? 'bg-green-100 text-green-700 border-2 border-green-400'
                      : 'bg-red-100 text-red-700 border-2 border-red-400'
                    : hasAnswer
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {sentence.sentenceNum}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
