'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Sun, Moon, Send, RotateCcw, Sparkles } from 'lucide-react'

interface WritingTask {
  id: string
  taskType: 'small' | 'big'  // 小作文/大作文
  title: string
  description: string
  requirements: string[]
  wordCount: { min: number; max: number }
  image?: string  // 大作文可能有图片
  sampleAnswer?: string
  tips?: string[]
}

interface WritingPanelProps {
  task: WritingTask
  userAnswer: string
  onAnswerChange: (answer: string) => void
  isSubmitted: boolean
  onAskAI?: (question: string) => void
}

export default function WritingPanel({
  task,
  userAnswer,
  onAnswerChange,
  isSubmitted,
  onAskAI,
}: WritingPanelProps) {
  const [eyeCareMode, setEyeCareMode] = useState(true)
  const [showSample, setShowSample] = useState(false)
  
  const wordCount = userAnswer.trim().split(/\s+/).filter(w => w).length
  const isWordCountValid = wordCount >= task.wordCount.min && wordCount <= task.wordCount.max
  
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
          <div className="flex items-center gap-2">
            <Badge 
              className={task.taskType === 'small' ? 'bg-blue-500' : 'bg-purple-500'}
            >
              {task.taskType === 'small' ? '小作文' : '大作文'}
            </Badge>
            <h2 
              className="text-lg font-bold"
              style={{ color: eyeCareMode ? '#2E7D32' : '#111827' }}
            >
              {task.title}
            </h2>
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
        
        {/* 字数统计 */}
        <div className="flex items-center gap-2 text-sm">
          <span style={{ color: eyeCareMode ? '#558B2F' : '#6b7280' }}>
            字数: {wordCount}
          </span>
          <span style={{ color: isWordCountValid ? '#10b981' : '#ef4444' }}>
            (要求: {task.wordCount.min}-{task.wordCount.max}词)
          </span>
        </div>
      </div>
      
      {/* 题目要求 */}
      <div 
        className="p-4 border-b flex-shrink-0"
        style={{ 
          background: eyeCareMode ? 'rgba(255,255,255,0.5)' : '#f9fafb',
          borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
        }}
      >
        <div className="text-sm mb-2" style={{ color: eyeCareMode ? '#33691E' : '#374151' }}>
          {task.description}
        </div>
        
        {/* 要求列表 */}
        <ul className="text-sm space-y-1" style={{ color: eyeCareMode ? '#558B2F' : '#6b7280' }}>
          {task.requirements.map((req, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-emerald-500">•</span>
              {req}
            </li>
          ))}
        </ul>
        
        {/* 图片（大作文） */}
        {task.image && (
          <div className="mt-3 p-2 bg-white rounded-lg border">
            <img src={task.image} alt="作文图片" className="max-w-full h-auto" />
          </div>
        )}
        
        {/* 提示 */}
        {task.tips && task.tips.length > 0 && (
          <div className="mt-3 p-3 rounded-lg" style={{ background: eyeCareMode ? '#C8E6C9' : '#e0f2fe' }}>
            <div className="text-xs font-medium mb-1" style={{ color: eyeCareMode ? '#2E7D32' : '#0369a1' }}>
              写作提示
            </div>
            <ul className="text-xs space-y-1" style={{ color: eyeCareMode ? '#558B2F' : '#0c4a6e' }}>
              {task.tips.map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* 写作区域 */}
      <div 
        className="flex-1 p-4"
        style={{ minHeight: 0, overflowY: 'auto' }}
      >
        <Textarea
          value={userAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="在此输入你的作文..."
          disabled={isSubmitted}
          className="min-h-[300px] resize-none"
          style={{ 
            background: eyeCareMode ? 'rgba(255,255,255,0.8)' : '#ffffff',
            borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
          }}
        />
      </div>
      
      {/* 底部工具栏 */}
      <div 
        className="p-3 border-t flex-shrink-0"
        style={{ 
          background: eyeCareMode 
            ? 'linear-gradient(135deg, #C8E6C9 0%, #DCEDC8 100%)'
            : '#f9fafb',
          borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAnswerChange('')}
              disabled={isSubmitted}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              清空
            </Button>
            {task.sampleAnswer && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSample(!showSample)}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                {showSample ? '隐藏范文' : '查看范文'}
              </Button>
            )}
          </div>
          
          {onAskAI && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAskAI(`请帮我分析这篇作文的优缺点，并给出改进建议：\n\n${userAnswer || '（还未写作）'}`)}
              className="text-emerald-600 border-emerald-200"
            >
              <span className="mr-1">🐱</span>
              AI批改
            </Button>
          )}
        </div>
        
        {/* 范文展示 */}
        {showSample && task.sampleAnswer && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="text-xs font-medium text-amber-700 mb-2">参考范文</div>
            <div className="text-sm text-amber-900 whitespace-pre-wrap">{task.sampleAnswer}</div>
          </div>
        )}
      </div>
    </div>
  )
}
