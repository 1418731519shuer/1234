'use client'

import { useState, useEffect, useCallback } from 'react'

// 标记数据结构
export interface TextMark {
  id: string
  region: 'article' | 'option'  // 文章区域还是选项区域
  optionKey?: string  // 如果是选项标记，记录是哪个选项
  start: number
  end: number
  text: string
}

// 标记颜色
export const MARK_COLOR = '#fef08a' // 黄色高亮

export function useTextMark(isSubmitted: boolean) {
  const [isMarkMode, setIsMarkMode] = useState(false)
  const [marks, setMarks] = useState<TextMark[]>([])
  
  // 提交后清除标记
  useEffect(() => {
    if (isSubmitted) {
      setMarks([])
    }
  }, [isSubmitted])
  
  // 监听Shift键切换模式
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && !isSubmitted) {
        setIsMarkMode(prev => !prev)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitted])
  
  // 添加标记
  const addMark = useCallback((region: 'article' | 'option', text: string, start: number, end: number, optionKey?: string) => {
    // 检查是否已有重叠标记
    const hasOverlap = marks.some(m => 
      m.region === region && 
      m.optionKey === optionKey &&
      ((m.start <= start && m.end > start) || (m.start < end && m.end >= end) || (start <= m.start && end >= m.end))
    )
    
    if (!hasOverlap) {
      const newMark: TextMark = {
        id: `${region}-${optionKey || ''}-${Date.now()}`,
        region,
        optionKey,
        start,
        end,
        text,
      }
      setMarks(prev => [...prev, newMark])
    }
  }, [marks])
  
  // 删除标记
  const removeMark = useCallback((markId: string) => {
    setMarks(prev => prev.filter(m => m.id !== markId))
  }, [])
  
  // 清除指定区域的标记
  const clearRegionMarks = useCallback((region: 'article' | 'option', optionKey?: string) => {
    setMarks(prev => prev.filter(m => {
      if (region === 'article') return m.region !== 'article'
      return !(m.region === 'option' && m.optionKey === optionKey)
    }))
  }, [])
  
  // 清除所有标记
  const clearAllMarks = useCallback(() => {
    setMarks([])
  }, [])
  
  // 获取指定区域的标记
  const getMarks = useCallback((region: 'article' | 'option', optionKey?: string) => {
    return marks.filter(m => {
      if (region === 'article') return m.region === 'article'
      return m.region === 'option' && m.optionKey === optionKey
    }).sort((a, b) => a.start - b.start)
  }, [marks])
  
  // 获取区域标记数量
  const getMarkCount = useCallback((region: 'article' | 'option', optionKey?: string) => {
    return marks.filter(m => {
      if (region === 'article') return m.region === 'article'
      return m.region === 'option' && m.optionKey === optionKey
    }).length
  }, [marks])
  
  return {
    isMarkMode,
    setIsMarkMode,
    marks,
    addMark,
    removeMark,
    clearRegionMarks,
    clearAllMarks,
    getMarks,
    getMarkCount,
  }
}
