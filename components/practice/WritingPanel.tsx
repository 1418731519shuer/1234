'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Sun, Moon, RotateCcw, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface WritingTask {
  id: string
  taskType: 'small' | 'big'
  title: string
  description: string
  requirements: string[]
  wordCount: { min: number; max: number }
  image?: string
  sampleAnswer?: string
  tips?: string[]
}

interface WritingScore {
  content: number       // 内容分 0-10
  language: number      // 语言分 0-10
  structure: number     // 结构分 0-10
  total: number         // 总分 0-30（小作文）或 0-20（大作文实际是15分）
  feedback: string
  suggestions: string[]
  grammarErrors: { text: string; correction: string; explanation: string }[]
}

interface WritingPanelProps {
  task: WritingTask
  userAnswer: string
  onAnswerChange: (answer: string) => void
  isSubmitted: boolean
  onAskAI?: (question: string) => void
  aiScore?: WritingScore
  isScoring?: boolean
}

export default function WritingPanel({
  task,
  userAnswer,
  onAnswerChange,
  isSubmitted,
  onAskAI,
  aiScore,
  isScoring,
}: WritingPanelProps) {
  const [eyeCareMode, setEyeCareMode] = useState(true)
  const [showSample, setShowSample] = useState(false)
  
  const wordCount = userAnswer.trim().split(/\s+/).filter(w => w).length
  const isWordCountValid = wordCount >= task.wordCount.min && wordCount <= task.wordCount.max
  
  // 小作文满分10分，大作文满分20分
  const maxScore = task.taskType === 'small' ? 10 : 20
  
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
          className="min-h-[200px] resize-none"
          style={{ 
            background: eyeCareMode ? 'rgba(255,255,255,0.8)' : '#ffffff',
            borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
          }}
        />
        
        {/* AI 评分结果 */}
        {aiScore && (
          <div className="mt-4 space-y-3">
            <div className="text-xs font-medium text-slate-500">AI 评分结果</div>
            
            {/* 分数展示 */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                <div className="text-xs text-blue-600 mb-1">内容</div>
                <div className="text-lg font-bold text-blue-700">{aiScore.content}</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
                <div className="text-xs text-green-600 mb-1">语言</div>
                <div className="text-lg font-bold text-green-700">{aiScore.language}</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-center">
                <div className="text-xs text-purple-600 mb-1">结构</div>
                <div className="text-lg font-bold text-purple-700">{aiScore.structure}</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
                <div className="text-xs text-amber-600 mb-1">总分</div>
                <div className="text-lg font-bold text-amber-700">{aiScore.total}</div>
                <div className="text-xs text-amber-500">/ {maxScore}</div>
              </div>
            </div>
            
            {/* 详细反馈 */}
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-1">详细反馈</div>
              <p className="text-sm text-gray-600 leading-relaxed">{aiScore.feedback}</p>
            </div>
            
            {/* 改进建议 */}
            {aiScore.suggestions && aiScore.suggestions.length > 0 && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="text-xs font-medium text-emerald-700 mb-1">改进建议</div>
                <ul className="text-sm text-emerald-600 space-y-1">
                  {aiScore.suggestions.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* 语法错误 */}
            {aiScore.grammarErrors && aiScore.grammarErrors.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="text-xs font-medium text-red-700 mb-2">语法错误</div>
                <div className="space-y-2">
                  {aiScore.grammarErrors.map((err, i) => (
                    <div key={i} className="text-sm">
                      <div className="text-red-600 line-through">{err.text}</div>
                      <div className="text-green-600">→ {err.correction}</div>
                      <div className="text-gray-500 text-xs">{err.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 参考范文（提交后显示） */}
        {isSubmitted && task.sampleAnswer && (
          <div className="mt-4">
            <button
              className="flex items-center gap-2 text-xs font-medium text-amber-600 mb-2"
              onClick={() => setShowSample(!showSample)}
            >
              <Sparkles className="w-4 h-4" />
              <span>{showSample ? '隐藏范文' : '查看范文'}</span>
            </button>
            {showSample && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="text-xs font-medium text-amber-700 mb-2">参考范文</div>
                <div className="text-sm text-amber-900 whitespace-pre-wrap">{task.sampleAnswer}</div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 底部工具栏 */}
      <div 
        className="p-3 border-t flex-shrink-0"
        style={{ 
          background: eyeCareMode 
            ? 'linear-gradient(135deg, #C8E6C9 0%, #DCEDC28 100%)'
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
          </div>
          
          {isScoring ? (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">AI评分中...</span>
            </div>
          ) : aiScore ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">已评分: {aiScore.total}/{maxScore}分</span>
            </div>
          ) : onAskAI && isSubmitted && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAskAI(`请帮我分析这篇作文的优缺点，并给出改进建议：\n\n${userAnswer || '（还未写作）'}`)}
              className="text-emerald-600 border-emerald-200"
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              AI评分
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
