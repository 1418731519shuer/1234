'use client'

import { useState } from 'react'

interface WritingTask {
  id: string
  taskType: string
  instructions: string
  wordCount: number
  sampleAnswer?: string
}

interface WritingPracticeProps {
  title: string
  task: WritingTask
  onSubmit: (content: string) => void
  isSubmitted: boolean
}

export default function WritingPractice({ title, task, onSubmit, isSubmitted }: WritingPracticeProps) {
  const [content, setContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiFeedback, setAiFeedback] = useState('')
  
  // 字数统计
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const isWordCountOk = wordCount >= task.wordCount * 0.8 && wordCount <= task.wordCount * 1.2
  
  // AI评分和反馈
  const handleGetFeedback = async () => {
    if (!content.trim()) return
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `请批改以下${task.taskType === 'small' ? '小' : '大'}作文，给出评分（满分${task.taskType === 'small' ? '10' : '20'}分）和改进建议：\n\n${content}`,
          context: `题目要求：${task.instructions}`,
        }),
      })
      const data = await response.json()
      setAiFeedback(data.response || '生成失败，请重试')
    } catch (error) {
      setAiFeedback('生成失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }
  
  // 生成范文
  const handleGenerateSample = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `请根据以下题目要求写一篇${task.taskType === 'small' ? '100词左右的小作文' : '160-200词的大作文'}：\n\n${task.instructions}`,
        }),
      })
      const data = await response.json()
      setContent(data.response || '生成失败，请重试')
    } catch (error) {
      console.error('Generate sample error:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* 题目区域 */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--bd)', background: 'var(--bg)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span 
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ background: task.taskType === 'small' ? 'var(--m1)' : 'var(--pu1)', color: task.taskType === 'small' ? 'var(--m)' : 'var(--pu)' }}
          >
            {task.taskType === 'small' ? '小作文' : '大作文'}
          </span>
          <span className="text-sm" style={{ color: 'var(--tx)' }}>{title}</span>
        </div>
        <div className="text-sm leading-relaxed" style={{ color: 'var(--tx2)' }}>
          {task.instructions}
        </div>
        <div className="mt-2 text-xs" style={{ color: 'var(--tx3)' }}>
          建议字数：{task.wordCount} 词
        </div>
      </div>
      
      {/* 写作区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium" style={{ color: 'var(--tx)' }}>你的作文</div>
            <div className="flex items-center gap-3">
              <span 
                className="text-sm"
                style={{ color: isWordCountOk ? 'var(--m)' : wordCount < task.wordCount * 0.5 ? '#ef4444' : 'var(--tx2)' }}
              >
                {wordCount} 词
              </span>
              {!isSubmitted && (
                <button
                  className="text-xs px-3 py-1 rounded-lg transition-all"
                  style={{ background: 'var(--bg2)', color: 'var(--tx2)' }}
                  onClick={handleGenerateSample}
                  disabled={isGenerating}
                >
                  {isGenerating ? '生成中...' : 'AI 生成范文'}
                </button>
              )}
            </div>
          </div>
          <textarea
            className="w-full h-64 p-4 rounded-xl border resize-none text-sm leading-relaxed"
            style={{ 
              borderColor: 'var(--bd)', 
              background: 'var(--bg)',
              color: 'var(--tx)',
            }}
            placeholder="在此输入你的作文..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitted}
          />
        </div>
        
        {/* AI反馈 */}
        {(isSubmitted || aiFeedback) && (
          <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--m)', background: 'var(--m1)' }}>
            <div className="text-sm font-medium mb-2" style={{ color: 'var(--m)' }}>AI 批改反馈</div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--tx)' }}>
              {aiFeedback || '正在生成反馈...'}
            </div>
          </div>
        )}
        
        {/* 参考范文 */}
        {isSubmitted && task.sampleAnswer && (
          <div className="mt-4 rounded-xl p-4 border" style={{ borderColor: 'var(--bd)', background: 'var(--bg)' }}>
            <div className="text-sm font-medium mb-2" style={{ color: 'var(--tx)' }}>参考范文</div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--tx2)' }}>
              {task.sampleAnswer}
            </div>
          </div>
        )}
      </div>
      
      {/* 底部操作栏 */}
      <div className="border-t p-4" style={{ borderColor: 'var(--bd)', background: 'var(--bg)' }}>
        <div className="flex items-center justify-between">
          <div className="text-sm" style={{ color: 'var(--tx2)' }}>
            {wordCount < task.wordCount * 0.8 
              ? `字数不足，还需 ${task.wordCount - wordCount} 词` 
              : wordCount > task.wordCount * 1.2 
                ? `字数超出 ${wordCount - task.wordCount} 词` 
                : '字数符合要求'}
          </div>
          <div className="flex gap-2">
            {!isSubmitted && content.trim() && (
              <button
                className="px-4 py-2 rounded-lg text-sm transition-all"
                style={{ background: 'var(--bg2)', color: 'var(--tx2)' }}
                onClick={handleGetFeedback}
                disabled={isGenerating}
              >
                {isGenerating ? '分析中...' : '获取AI反馈'}
              </button>
            )}
            {!isSubmitted && wordCount >= task.wordCount * 0.5 && (
              <button
                className="px-6 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90"
                style={{ background: 'var(--m)' }}
                onClick={() => onSubmit(content)}
              >
                提交作文
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
