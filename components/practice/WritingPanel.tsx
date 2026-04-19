'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Sun, Moon, RotateCcw, Sparkles, CheckCircle2, AlertCircle, Loader2,
  AlignLeft, AlignRight, AlignCenter, Indent, Outdent, Eye, Edit3, FileText
} from 'lucide-react'

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
  content: number
  language: number
  structure: number
  total: number
  feedback: string
  suggestions: string[]
  grammarErrors: { text: string; correction: string; explanation: string }[]
}

// 书信模板
const LETTER_TEMPLATES = [
  {
    name: '建议信',
    template: `Dear Sir/Madam,

I am writing to offer some suggestions regarding [主题].

First and foremost, it would be advisable to [建议1]. This is because [原因1].

Additionally, I suggest that [建议2]. By doing so, [好处2].

I hope these suggestions will be taken into consideration. Thank you for your time and attention.

Yours sincerely,
Li Ming`
  },
  {
    name: '投诉信',
    template: `Dear Sir/Madam,

I am writing to express my dissatisfaction with [投诉对象/事件].

The problem is that [具体问题]. This has caused [造成的影响].

I would appreciate it if you could [期望的解决方案]. I look forward to your prompt reply.

Yours sincerely,
Li Ming`
  },
  {
    name: '邀请信',
    template: `Dear [姓名],

I am writing to invite you to [活动名称], which will be held on [日期] at [地点].

The event will start at [时间] and last for approximately [时长]. During the event, [活动内容].

I would be honored if you could attend. Please let me know your availability by [回复截止日期].

Looking forward to your reply.

Yours sincerely,
Li Ming`
  },
  {
    name: '感谢信',
    template: `Dear [姓名],

I am writing to express my sincere gratitude for [感谢的原因].

Your [帮助/支持] was invaluable to me. Thanks to your assistance, I was able to [达成的结果].

I truly appreciate your kindness and support. I hope to have the opportunity to repay your kindness in the future.

Yours sincerely,
Li Ming`
  },
  {
    name: '道歉信',
    template: `Dear [姓名],

I am writing to apologize for [道歉的原因].

I understand that this has caused [造成的影响]. I take full responsibility for my actions.

To make up for this, I will [补救措施]. I promise that this will not happen again.

Please accept my sincere apologies.

Yours sincerely,
Li Ming`
  },
  {
    name: '申请信',
    template: `Dear Sir/Madam,

I am writing to apply for [申请职位/项目].

I believe I am qualified for this position because [资格理由1]. Additionally, I have [资格理由2].

I am confident that I can [能做出的贡献]. I would welcome the opportunity to discuss my application with you.

Thank you for considering my application. I look forward to hearing from you.

Yours sincerely,
Li Ming`
  }
]

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
  const [showPreview, setShowPreview] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  
  const wordCount = userAnswer.trim().split(/\s+/).filter(w => w).length
  const isWordCountValid = wordCount >= task.wordCount.min && wordCount <= task.wordCount.max
  
  // 小作文满分10分，大作文满分20分
  const maxScore = task.taskType === 'small' ? 10 : 20
  
  // 格式化预览内容
  const previewContent = useMemo(() => {
    if (!userAnswer) return []
    
    return userAnswer.split('\n').map((line, index) => {
      // 检测格式标记
      let formattedLine = line
      let align: 'left' | 'right' | 'center' = 'left'
      let indent = 0
      
      // 右对齐标记：>> 开头
      if (line.startsWith('>>')) {
        formattedLine = line.slice(2).trim()
        align = 'right'
      }
      // 居中标记：>< 开头
      else if (line.startsWith('><')) {
        formattedLine = line.slice(2).trim()
        align = 'center'
      }
      // 缩进标记：> 开头（不是>>）
      else if (line.startsWith('>') && !line.startsWith('>>')) {
        formattedLine = line.slice(1).trim()
        indent = 2
      }
      // 多重缩进：多个 > 开头
      else if (/^>+/.test(line)) {
        const match = line.match(/^(>+)/)
        if (match) {
          const arrowCount = match[1].length
          formattedLine = line.slice(arrowCount).trim()
          if (line.startsWith('>>')) {
            align = 'right'
          } else {
            indent = arrowCount * 2
          }
        }
      }
      
      return {
        text: formattedLine,
        align,
        indent,
        key: index
      }
    })
  }, [userAnswer])
  
  // 插入格式标记
  const insertFormat = (format: 'indent' | 'outdent' | 'left' | 'right' | 'center') => {
    if (isSubmitted) return
    
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = userAnswer.substring(start, end)
    
    // 获取当前行的开始位置
    const lineStart = userAnswer.lastIndexOf('\n', start - 1) + 1
    const currentLine = userAnswer.substring(lineStart, userAnswer.indexOf('\n', start) || userAnswer.length)
    
    let newLine = currentLine
    let newAnswer = userAnswer
    
    switch (format) {
      case 'indent':
        // 添加缩进标记
        if (currentLine.startsWith('>')) {
          newLine = '>' + currentLine
        } else {
          newLine = '>' + currentLine
        }
        newAnswer = userAnswer.substring(0, lineStart) + newLine + userAnswer.substring(lineStart + currentLine.length)
        break
        
      case 'outdent':
        // 移除缩进标记
        if (currentLine.startsWith('>')) {
          newLine = currentLine.slice(1)
          newAnswer = userAnswer.substring(0, lineStart) + newLine + userAnswer.substring(lineStart + currentLine.length)
        }
        break
        
      case 'right':
        // 设置右对齐
        if (currentLine.startsWith('>')) {
          // 已有标记，替换为右对齐
          const cleanLine = currentLine.replace(/^>+/, '')
          newLine = '>>' + cleanLine
        } else {
          newLine = '>>' + currentLine
        }
        newAnswer = userAnswer.substring(0, lineStart) + newLine + userAnswer.substring(lineStart + currentLine.length)
        break
        
      case 'left':
        // 移除所有格式标记
        newLine = currentLine.replace(/^>+/, '')
        newAnswer = userAnswer.substring(0, lineStart) + newLine + userAnswer.substring(lineStart + currentLine.length)
        break
        
      case 'center':
        // 设置居中
        if (currentLine.startsWith('>')) {
          const cleanLine = currentLine.replace(/^>+/, '')
          newLine = '><' + cleanLine
        } else {
          newLine = '><' + currentLine
        }
        newAnswer = userAnswer.substring(0, lineStart) + newLine + userAnswer.substring(lineStart + currentLine.length)
        break
    }
    
    onAnswerChange(newAnswer)
    
    // 恢复光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 1, end + 1)
    }, 0)
  }
  
  // 应用模板
  const applyTemplate = (template: string) => {
    if (isSubmitted) return
    onAnswerChange(template)
    setShowTemplates(false)
    setShowPreview(true)
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
          <div className="flex items-center gap-2">
            {/* 编辑/预览切换 */}
            <Button
              variant={showPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              style={eyeCareMode ? { 
                borderColor: '#81C784',
                background: showPreview ? '#66BB6A' : 'rgba(255,255,255,0.7)'
              } : {}}
            >
              {showPreview ? <Eye className="w-4 h-4 mr-1" /> : <Edit3 className="w-4 h-4 mr-1" />}
              {showPreview ? '预览' : '编辑'}
            </Button>
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
        
        {/* 字数统计 */}
        <div className="flex items-center gap-2 text-sm">
          <span style={{ color: eyeCareMode ? '#558B2F' : '#6b7280' }}>
            字数: {wordCount}
          </span>
          <span style={{ color: isWordCountValid ? '#10b981' : '#ef4444' }}>
            (要求: {task.wordCount.min}-{task.wordCount.max}词)
          </span>
          {!isSubmitted && showPreview && (
            <span className="text-xs ml-2" style={{ color: eyeCareMode ? '#689F38' : '#9ca3af' }}>
              格式标记: {`>`}缩进 {`>>`}右对齐 {`><`}居中
            </span>
          )}
        </div>
      </div>
      
      {/* 题目要求 */}
      <div 
        className="p-3 border-b flex-shrink-0"
        style={{ 
          background: eyeCareMode ? 'rgba(255,255,255,0.5)' : '#f9fafb',
          borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
        }}
      >
        <div className="text-sm" style={{ color: eyeCareMode ? '#33691E' : '#374151' }}>
          {task.description}
        </div>
        
        {/* 图片（大作文） */}
        {task.image && (
          <div className="mt-2 p-2 bg-white rounded-lg border inline-block">
            <img src={task.image} alt="作文图片" className="max-h-32" />
          </div>
        )}
      </div>
      
      {/* 格式工具栏 + 模板选择 */}
      {!isSubmitted && (
        <div 
          className="p-2 border-b flex-shrink-0 flex items-center gap-2 flex-wrap"
          style={{ 
            background: eyeCareMode ? 'rgba(255,255,255,0.6)' : '#f3f4f6',
            borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
          }}
        >
          {/* 格式按钮 */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormat('indent')}
              title="缩进 (>)"
              className="h-8 w-8 p-0"
            >
              <Indent className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormat('outdent')}
              title="取消缩进"
              className="h-8 w-8 p-0"
            >
              <Outdent className="w-4 h-4" />
            </Button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormat('left')}
              title="左对齐"
              className="h-8 w-8 p-0"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormat('center')}
              title="居中 (><)"
              className="h-8 w-8 p-0"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormat('right')}
              title="右对齐 (>>)"
              className="h-8 w-8 p-0"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* 书信模板（仅小作文） */}
          {task.taskType === 'small' && (
            <>
              <div className="w-px h-5 bg-gray-300 mx-1" />
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-xs"
                  style={eyeCareMode ? { borderColor: '#81C784', background: 'rgba(255,255,255,0.7)' } : {}}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  书信模板
                </Button>
                
                {showTemplates && (
                  <div 
                    className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border p-2 min-w-[200px]"
                    style={{ borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb' }}
                  >
                    {LETTER_TEMPLATES.map((t, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
                        onClick={() => applyTemplate(t.template)}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAnswerChange('')}
              className="text-xs text-gray-500"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              清空
            </Button>
          </div>
        </div>
      )}
      
      {/* 写作区域 */}
      <div 
        className="flex-1 p-4"
        style={{ minHeight: 0, overflowY: 'auto' }}
      >
        {showPreview ? (
          /* 预览模式 */
          <div 
            className="min-h-[200px] p-4 rounded-lg border"
            style={{ 
              background: eyeCareMode ? 'rgba(255,255,255,0.9)' : '#ffffff',
              borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
            }}
          >
            {previewContent.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                暂无内容，请先输入作文
              </div>
            ) : (
              <div className="space-y-1">
                {previewContent.map((line) => (
                  <div 
                    key={line.key}
                    style={{ 
                      textAlign: line.align,
                      paddingLeft: line.align === 'left' ? `${line.indent}em` : 0,
                      paddingRight: line.align === 'right' ? '0' : 0,
                    }}
                    className="leading-relaxed"
                  >
                    {line.text || '\u00A0'}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 编辑模式 */
          <Textarea
            value={userAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder={"在此输入你的作文...\n\n格式标记说明：\n> 行首添加 > 表示缩进\n>> 行首添加 >> 表示右对齐（用于落款）\n>< 行首添加 >< 表示居中\n\n示例：\nDear Sir/Madam,\n\n>I am writing to...\n\nYours sincerely,\n>>Li Ming"}
            disabled={isSubmitted}
            className="min-h-[200px] resize-none font-mono"
            style={{ 
              background: eyeCareMode ? 'rgba(255,255,255,0.8)' : '#ffffff',
              borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
            }}
          />
        )}
        
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
            ? 'linear-gradient(135deg, #C8E6C9 0%, #DCEDC8 100%)'
            : '#f9fafb',
          borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-xs" style={{ color: eyeCareMode ? '#558B2F' : '#6b7280' }}>
            按 Tab 键跳转下一任务
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
