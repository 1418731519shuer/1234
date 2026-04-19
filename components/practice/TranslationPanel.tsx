'use client'

import { useState, useRef, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sun, Moon, MessageCircle } from 'lucide-react'
import { TextMark } from '@/hooks/useTextMark'

interface TranslationSentence {
  id: string
  sentenceNum: number
  english: string
  chinese?: string
  userAnswer?: string
  analysis?: string
}

interface TextMarkHook {
  isMarkMode: boolean
  setIsMarkMode: (v: boolean) => void
  marks: TextMark[]
  addMark: (region: 'article' | 'option', text: string, start: number, end: number, optionKey?: string) => void
  removeMark: (id: string) => void
  clearRegionMarks: (region: 'article' | 'option', optionKey?: string) => void
  clearAllMarks: () => void
  getMarks: (region: 'article' | 'option', optionKey?: string) => TextMark[]
  getMarkCount: (region: 'article' | 'option', optionKey?: string) => number
}

interface TranslationPanelProps {
  sentences: TranslationSentence[]
  currentIndex: number
  onSelectSentence: (index: number) => void
  isSubmitted: boolean
  textMark: TextMarkHook
  onAskAI?: (question: string) => void
}

export default function TranslationPanel({
  sentences,
  currentIndex,
  onSelectSentence,
  isSubmitted,
  textMark,
  onAskAI,
}: TranslationPanelProps) {
  const [eyeCareMode, setEyeCareMode] = useState(true)
  const contentRefs = useRef<Record<string, HTMLSpanElement | null>>({})
  
  const handleMouseUp = useCallback((sentenceId: string) => {
    if (!textMark.isMarkMode) return
    
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    
    const selectedText = selection.toString().trim()
    if (!selectedText) return
    
    const contentEl = contentRefs.current[sentenceId]
    if (!contentEl) return
    
    const range = selection.getRangeAt(0)
    const preSelectionRange = document.createRange()
    preSelectionRange.selectNodeContents(contentEl)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const start = preSelectionRange.toString().length
    const end = start + selectedText.length
    
    textMark.addMark('article', selectedText, start, end, sentenceId)
    selection.removeAllRanges()
  }, [textMark])
  
  // 获取文章区域的标记
  const articleMarks = textMark.getMarks('article')
  
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
        className="p-4 border-b flex-shrink-0 flex items-center justify-between"
        style={{ 
          background: eyeCareMode 
            ? 'linear-gradient(135deg, #C8E6C9 0%, #DCEDC8 100%)'
            : '#ffffff',
          borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
        }}
      >
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-500 text-white">英文原文</Badge>
          <span className="text-sm" style={{ color: eyeCareMode ? '#558B2F' : '#6b7280' }}>
            共 {sentences.length} 句待翻译
          </span>
        </div>
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
      
      {/* 句子列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
        {sentences.map((sentence, index) => {
          const isActive = index === currentIndex
          const hasAnswer = !!sentence.userAnswer
          
          // 获取当前句子的标记
          const sentenceMarks = articleMarks.filter(m => 
            m.optionKey === sentence.id
          )
          
          return (
            <div
              key={sentence.id}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                isActive ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ 
                background: isActive 
                  ? (eyeCareMode ? 'rgba(255,255,255,0.9)' : '#f0f9ff')
                  : (eyeCareMode ? 'rgba(255,255,255,0.5)' : '#ffffff'),
                border: `1px solid ${isActive ? '#3b82f6' : (eyeCareMode ? '#A5D6A7' : '#e5e7eb')}`,
                boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none'
              }}
              onClick={() => onSelectSentence(index)}
            >
              {/* 句子编号 */}
              <div className="flex items-center gap-2 mb-2">
                <span 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ 
                    background: hasAnswer 
                      ? (isSubmitted ? '#10b981' : '#3b82f6')
                      : '#9ca3af'
                  }}
                >
                  {sentence.sentenceNum}
                </span>
                {hasAnswer && !isSubmitted && (
                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                    已翻译
                  </Badge>
                )}
                {isSubmitted && sentence.chinese && (
                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                    已完成
                  </Badge>
                )}
              </div>
              
              {/* 英文原文 */}
              <div 
                className="text-base leading-relaxed"
                style={{ color: eyeCareMode ? '#2E7D32' : '#1f2937' }}
              >
                <span
                  ref={el => { contentRefs.current[sentence.id] = el }}
                  onMouseUp={() => handleMouseUp(sentence.id)}
                  className="cursor-text"
                >
                  {sentence.english}
                </span>
              </div>
              
              {/* 标记显示 */}
              {sentenceMarks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {sentenceMarks.map(mark => (
                    <span
                      key={mark.id}
                      className="px-2 py-0.5 rounded text-xs cursor-pointer hover:opacity-80 bg-yellow-200 text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        textMark.removeMark(mark.id)
                      }}
                    >
                      {mark.text}
                    </span>
                  ))}
                </div>
              )}
              
              {/* 参考译文（提交后显示） */}
              {isSubmitted && sentence.chinese && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="text-xs font-medium text-emerald-700 mb-1">参考译文</div>
                  <div className="text-sm text-emerald-900">{sentence.chinese}</div>
                </div>
              )}
              
              {/* 用户翻译（提交后显示） */}
              {isSubmitted && sentence.userAnswer && (
                <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-xs font-medium text-blue-700 mb-1">你的翻译</div>
                  <div className="text-sm text-blue-900">{sentence.userAnswer}</div>
                </div>
              )}
              
              {/* 问AI按钮 */}
              {onAskAI && (
                <div className="mt-3">
                  <button
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAskAI(`请帮我分析这句话的翻译要点：\n\n${sentence.english}`)
                    }}
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>🐱 问AI助教</span>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* 标记工具栏 */}
      {textMark.isMarkMode && (
        <div 
          className="p-3 border-t flex-shrink-0"
          style={{ 
            background: eyeCareMode ? '#C8E6C9' : '#f9fafb',
            borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: eyeCareMode ? '#558B2F' : '#6b7280' }}>
              标记模式已开启，选择文本即可标记
            </span>
            {textMark.marks.length > 0 && (
              <button
                className="text-xs text-red-500 hover:text-red-600"
                onClick={() => textMark.clearAllMarks()}
              >
                清除全部 ({textMark.marks.length})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
