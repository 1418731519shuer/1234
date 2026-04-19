'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  Sun, Moon, RotateCcw, Sparkles, CheckCircle2, AlertCircle, Loader2,
  AlignLeft, AlignRight, AlignCenter, FileText, Edit3, LayoutTemplate,
  ChevronDown, ChevronUp, Mail, Megaphone
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

// 信件模板
const LETTER_TEMPLATES = [
  {
    name: '建议信',
    icon: '💡',
    fixedParts: {
      greeting: 'Dear Sir/Madam,',
      closing: 'Yours sincerely,',
      signature: 'Li Ming'
    },
    contentTemplate: [
      { placeholder: 'I am writing to offer some suggestions regarding [主题].', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: 'First and foremost, it would be advisable to [建议1]. This is because [原因1].', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: 'Additionally, I suggest that [建议2]. By doing so, [好处].', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: 'I hope these suggestions will be taken into consideration. Thank you for your time.', editable: true },
    ]
  },
  {
    name: '投诉信',
    icon: '📝',
    fixedParts: {
      greeting: 'Dear Sir/Madam,',
      closing: 'Yours sincerely,',
      signature: 'Li Ming'
    },
    contentTemplate: [
      { placeholder: 'I am writing to express my dissatisfaction with [投诉对象].', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: 'The problem is that [具体问题]. This has caused [造成的影响].', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: 'I would appreciate it if you could [期望的解决方案]. I look forward to your prompt reply.', editable: true },
    ]
  },
  {
    name: '邀请信',
    icon: '✉️',
    fixedParts: {
      greeting: 'Dear [姓名],',
      closing: 'Yours sincerely,',
      signature: 'Li Ming'
    },
    contentTemplate: [
      { placeholder: 'I am writing to invite you to [活动名称].', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: 'The event will be held on [日期] at [地点]. It will start at [时间] and last for approximately [时长].', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: 'I would be honored if you could attend. Please let me know your availability by [日期].', editable: true },
    ]
  },
  {
    name: '感谢信',
    icon: '🙏',
    fixedParts: {
      greeting: 'Dear [姓名],',
      closing: 'Yours sincerely,',
      signature: 'Li Ming'
    },
    contentTemplate: [
      { placeholder: 'I am writing to express my sincere gratitude for [感谢的原因].', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: 'Your [帮助/支持] was invaluable to me. Thanks to your assistance, I was able to [达成的结果].', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: 'I truly appreciate your kindness and support.', editable: true },
    ]
  },
  {
    name: '道歉信',
    icon: '😔',
    fixedParts: {
      greeting: 'Dear [姓名],',
      closing: 'Yours sincerely,',
      signature: 'Li Ming'
    },
    contentTemplate: [
      { placeholder: 'I am writing to apologize for [道歉的原因].', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: 'I understand that this has caused [造成的影响]. I take full responsibility for my actions.', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: 'To make up for this, I will [补救措施]. I promise that this will not happen again.', editable: true },
    ]
  },
  {
    name: '申请信',
    icon: '📋',
    fixedParts: {
      greeting: 'Dear Sir/Madam,',
      closing: 'Yours sincerely,',
      signature: 'Li Ming'
    },
    contentTemplate: [
      { placeholder: 'I am writing to apply for [申请职位/项目].', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: 'I believe I am qualified for this position because [资格理由].', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: 'I am confident that I can [能做出的贡献]. I would welcome the opportunity to discuss my application.', editable: true },
    ]
  },
]

// 通知模板
const NOTICE_TEMPLATES = [
  {
    name: '活动通知',
    icon: '📢',
    fixedParts: {
      title: 'NOTICE',
      closing: '',
      signature: 'Student Union'
    },
    contentTemplate: [
      { placeholder: '[活动名称]即将举行，欢迎同学们积极参加。', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: '时间：[日期] [时间]', editable: true },
      { placeholder: '地点：[地点]', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: '活动内容：[具体内容]', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: '请有意参加的同学于[截止日期]前报名。', editable: true },
    ]
  },
  {
    name: '会议通知',
    icon: '📅',
    fixedParts: {
      title: 'NOTICE',
      closing: '',
      signature: 'Organizing Committee'
    },
    contentTemplate: [
      { placeholder: 'A meeting will be held to discuss [会议主题].', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: 'Time: [日期] [时间]', editable: true },
      { placeholder: 'Venue: [地点]', editable: true },
      { placeholder: 'Participants: [参会人员]', editable: true },
      { placeholder: '', editable: true, type: 'blank' },
      { placeholder: 'Please arrive on time.', editable: true },
    ]
  },
]

// 行格式类型
interface LineFormat {
  text: string
  align: 'left' | 'right' | 'center'
  indent: number
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
  
  // 写作模式：'choose' | 'template' | 'free'
  const [writeMode, setWriteMode] = useState<'choose' | 'template' | 'free'>('choose')
  const [templateType, setTemplateType] = useState<'letter' | 'notice' | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<typeof LETTER_TEMPLATES[0] | typeof NOTICE_TEMPLATES[0] | null>(null)
  
  // 模板模式下的内容
  const [templateContent, setTemplateContent] = useState<string[]>([])
  const [templateGreeting, setTemplateGreeting] = useState('')
  
  // 自由写作模式的行格式
  const [lineFormats, setLineFormats] = useState<LineFormat[]>([])
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null)
  
  const wordCount = userAnswer.trim().split(/\s+/).filter(w => w).length
  const isWordCountValid = wordCount >= task.wordCount.min && wordCount <= task.wordCount.max
  const maxScore = task.taskType === 'small' ? 10 : 20
  
  // 解析用户答案为行格式（自由写作模式）
  const parsedLines = useMemo(() => {
    if (!userAnswer) return []
    return userAnswer.split('\n').map((text, index) => {
      let align: 'left' | 'right' | 'center' = 'left'
      let indent = 0
      let cleanText = text
      
      // 解析格式标记
      if (text.startsWith('>>')) {
        cleanText = text.slice(2) // 保留原始空格，不trim
        align = 'right'
      } else if (text.startsWith('><')) {
        cleanText = text.slice(2)
        align = 'center'
      } else if (text.startsWith('>')) {
        cleanText = text.slice(1)
        indent = 2
      }
      
      return { text: cleanText, align, indent, index }
    })
  }, [userAnswer])
  
  // 选择模板
  const handleSelectTemplate = (template: typeof LETTER_TEMPLATES[0] | typeof NOTICE_TEMPLATES[0]) => {
    setSelectedTemplate(template)
    setTemplateGreeting('greeting' in template.fixedParts ? template.fixedParts.greeting : '')
    setTemplateContent(template.contentTemplate.map(t => t.placeholder))
    setWriteMode('template')
  }
  
  // 生成最终文本（模板模式）
  const generateTemplateText = useCallback(() => {
    if (!selectedTemplate) return ''
    
    const lines: string[] = []
    
    // 标题（通知）
    if ('title' in selectedTemplate.fixedParts && selectedTemplate.fixedParts.title) {
      lines.push(`><${selectedTemplate.fixedParts.title}`)
      lines.push('')
    }
    
    // 称呼（信件）
    if (templateGreeting) {
      lines.push(templateGreeting)
      lines.push('')
    }
    
    // 内容
    templateContent.forEach(line => {
      if (line) {
        lines.push(line)
      }
    })
    
    // 结尾
    lines.push('')
    if (selectedTemplate.fixedParts.closing) {
      lines.push(selectedTemplate.fixedParts.closing)
    }
    if (selectedTemplate.fixedParts.signature) {
      lines.push(`>>${selectedTemplate.fixedParts.signature}`)
    }
    
    return lines.join('\n')
  }, [selectedTemplate, templateGreeting, templateContent])
  
  // 应用模板内容到答案
  const applyTemplate = () => {
    const text = generateTemplateText()
    onAnswerChange(text)
    setWriteMode('free') // 切换到自由编辑模式
  }
  
  // 更新模板内容
  const updateTemplateContent = (index: number, value: string) => {
    const newContent = [...templateContent]
    newContent[index] = value
    setTemplateContent(newContent)
  }
  
  // 自由写作模式：设置行格式
  const setLineFormat = (index: number, format: Partial<LineFormat>) => {
    const lines = userAnswer.split('\n')
    const line = lines[index]
    
    // 解析当前格式，保留原始空格
    let cleanText = line
    
    if (line.startsWith('>>')) {
      cleanText = line.slice(2)
    } else if (line.startsWith('><')) {
      cleanText = line.slice(2)
    } else if (line.startsWith('>')) {
      cleanText = line.slice(1)
    }
    
    // 应用新格式
    let prefix = ''
    const newAlign = format.align
    
    if (newAlign === 'right') {
      prefix = '>>'
    } else if (newAlign === 'center') {
      prefix = '><'
    }
    
    lines[index] = prefix + cleanText
    onAnswerChange(lines.join('\n'))
  }
  
  // 渲染模式选择界面
  if (writeMode === 'choose' && task.taskType === 'small' && !isSubmitted) {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500">小作文</Badge>
              <h2 className="text-lg font-bold" style={{ color: eyeCareMode ? '#2E7D32' : '#111827' }}>
                选择写作方式
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEyeCareMode(!eyeCareMode)}
            >
              {eyeCareMode ? <Sun className="w-4 h-4 text-amber-600" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        {/* 模式选择 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* 题目要求 */}
            <div 
              className="p-4 rounded-xl border"
              style={{ 
                background: eyeCareMode ? 'rgba(255,255,255,0.7)' : '#f9fafb',
                borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
              }}
            >
              <div className="text-sm mb-2" style={{ color: eyeCareMode ? '#33691E' : '#374151' }}>
                {task.description}
              </div>
              <div className="text-xs" style={{ color: eyeCareMode ? '#558B2F' : '#6b7280' }}>
                字数要求: {task.wordCount.min}-{task.wordCount.max}词
              </div>
            </div>
            
            {/* 两种模式 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 模板模式 */}
              <button
                className="p-6 rounded-xl border-2 text-left transition-all hover:scale-[1.02]"
                style={{ 
                  background: eyeCareMode ? 'rgba(255,255,255,0.9)' : '#ffffff',
                  borderColor: eyeCareMode ? '#81C784' : '#e5e7eb'
                }}
                onClick={() => setTemplateType('letter')}
              >
                <LayoutTemplate className="w-8 h-8 mb-3 text-blue-500" />
                <div className="font-bold text-lg mb-2" style={{ color: eyeCareMode ? '#2E7D32' : '#111827' }}>
                  模板写作
                </div>
                <div className="text-sm" style={{ color: eyeCareMode ? '#558B2F' : '#6b7280' }}>
                  适合新手，选择模板后填空即可
                </div>
              </button>
              
              {/* 自由写作 */}
              <button
                className="p-6 rounded-xl border-2 text-left transition-all hover:scale-[1.02]"
                style={{ 
                  background: eyeCareMode ? 'rgba(255,255,255,0.9)' : '#ffffff',
                  borderColor: eyeCareMode ? '#81C784' : '#e5e7eb'
                }}
                onClick={() => setWriteMode('free')}
              >
                <Edit3 className="w-8 h-8 mb-3 text-purple-500" />
                <div className="font-bold text-lg mb-2" style={{ color: eyeCareMode ? '#2E7D32' : '#111827' }}>
                  自由写作
                </div>
                <div className="text-sm" style={{ color: eyeCareMode ? '#558B2F' : '#6b7280' }}>
                  适合熟练者，实时预览格式效果
                </div>
              </button>
            </div>
            
            {/* 模板类型选择 */}
            {templateType && (
              <div 
                className="p-4 rounded-xl border animate-in fade-in"
                style={{ 
                  background: eyeCareMode ? 'rgba(255,255,255,0.9)' : '#ffffff',
                  borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
                }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant={templateType === 'letter' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTemplateType('letter')}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    信件
                  </Button>
                  <Button
                    variant={templateType === 'notice' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTemplateType('notice')}
                  >
                    <Megaphone className="w-4 h-4 mr-1" />
                    通知
                  </Button>
                </div>
                
                {/* 模板列表 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(templateType === 'letter' ? LETTER_TEMPLATES : NOTICE_TEMPLATES).map((template, i) => (
                    <button
                      key={i}
                      className="p-3 rounded-lg border text-left hover:bg-gray-50 transition-colors"
                      style={{ borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb' }}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <span className="text-lg mr-2">{template.icon}</span>
                      <span className="text-sm font-medium">{template.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // 渲染模板编辑界面
  if (writeMode === 'template' && selectedTemplate && !isSubmitted) {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setWriteMode('choose')}>
                ← 返回
              </Button>
              <Badge className="bg-blue-500">
                {selectedTemplate.icon} {selectedTemplate.name}
              </Badge>
            </div>
            <Button onClick={applyTemplate} className="bg-emerald-500 hover:bg-emerald-600">
              应用模板
            </Button>
          </div>
        </div>
        
        {/* 模板编辑区 */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* 称呼（信件） */}
            {'greeting' in selectedTemplate.fixedParts && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">称呼</label>
                <Input
                  value={templateGreeting}
                  onChange={(e) => setTemplateGreeting(e.target.value)}
                  placeholder="Dear Sir/Madam,"
                  className="font-medium"
                />
              </div>
            )}
            
            {/* 标题（通知） */}
            {'title' in selectedTemplate.fixedParts && selectedTemplate.fixedParts.title && (
              <div className="text-center py-2 border-b-2 border-gray-300">
                <span className="text-lg font-bold tracking-widest">{selectedTemplate.fixedParts.title}</span>
              </div>
            )}
            
            {/* 内容区域 */}
            <div className="space-y-3">
              {templateContent.map((line, index) => (
                <div key={index}>
                  {selectedTemplate.contentTemplate[index]?.type === 'blank' ? (
                    <div className="h-4" /> // 空行
                  ) : (
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">第 {index + 1} 段</label>
                      <Textarea
                        value={line}
                        onChange={(e) => updateTemplateContent(index, e.target.value)}
                        placeholder={selectedTemplate.contentTemplate[index]?.placeholder}
                        className="min-h-[60px] resize-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* 落款预览 */}
            <div className="mt-6 pt-4 border-t text-right">
              {selectedTemplate.fixedParts.closing && (
                <div className="text-gray-600">{selectedTemplate.fixedParts.closing}</div>
              )}
              <div className="text-gray-800 font-medium">{selectedTemplate.fixedParts.signature}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // 自由写作模式（左右分栏实时预览）
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
            {task.taskType === 'small' && writeMode !== 'choose' && (
              <Button variant="ghost" size="sm" onClick={() => setWriteMode('choose')}>
                ← 重选
              </Button>
            )}
            <Badge className={task.taskType === 'small' ? 'bg-blue-500' : 'bg-purple-500'}>
              {task.taskType === 'small' ? '小作文' : '大作文'}
            </Badge>
            <h2 className="text-lg font-bold" style={{ color: eyeCareMode ? '#2E7D32' : '#111827' }}>
              {task.title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEyeCareMode(!eyeCareMode)}
          >
            {eyeCareMode ? <Sun className="w-4 h-4 text-amber-600" /> : <Moon className="w-4 h-4" />}
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
        className="p-3 border-b flex-shrink-0"
        style={{ 
          background: eyeCareMode ? 'rgba(255,255,255,0.5)' : '#f9fafb',
          borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
        }}
      >
        <div className="text-sm" style={{ color: eyeCareMode ? '#33691E' : '#374151' }}>
          {task.description}
        </div>
        {task.image && (
          <div className="mt-2 p-2 bg-white rounded-lg border inline-block">
            <img src={task.image} alt="作文图片" className="max-h-32" />
          </div>
        )}
      </div>
      
      {/* 左右分栏：编辑 + 预览 */}
      <div className="flex-1 flex min-h-0">
        {/* 左侧：编辑区 */}
        <div className="w-1/2 border-r flex flex-col" style={{ borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb' }}>
          {/* 格式工具栏 */}
          {!isSubmitted && (
            <div 
              className="p-2 border-b flex-shrink-0 flex items-center gap-1"
              style={{ 
                background: eyeCareMode ? 'rgba(255,255,255,0.6)' : '#f3f4f6',
                borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
              }}
            >
              <span className="text-xs text-gray-400 mr-2">选中行格式：</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedLineIndex !== null) {
                    setLineFormat(selectedLineIndex, { align: 'left' })
                  }
                }}
                className="h-7 w-7 p-0"
                title="左对齐"
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedLineIndex !== null) {
                    setLineFormat(selectedLineIndex, { align: 'center' })
                  }
                }}
                className="h-7 w-7 p-0"
                title="居中"
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedLineIndex !== null) {
                    setLineFormat(selectedLineIndex, { align: 'right' })
                  }
                }}
                className="h-7 w-7 p-0"
                title="右对齐（落款）"
              >
                <AlignRight className="w-4 h-4" />
              </Button>
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
          
          {/* 编辑区 */}
          <div className="flex-1 p-3 overflow-y-auto">
            <Textarea
              value={userAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="在此输入作文内容..."
              disabled={isSubmitted}
              className="h-full resize-none font-mono text-sm"
              style={{ 
                background: eyeCareMode ? 'rgba(255,255,255,0.8)' : '#ffffff',
                borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
              }}
              onClick={(e) => {
                const textarea = e.target as HTMLTextAreaElement
                const lines = userAnswer.substring(0, textarea.selectionStart).split('\n')
                setSelectedLineIndex(lines.length - 1)
              }}
            />
          </div>
        </div>
        
        {/* 右侧：实时预览 */}
        <div className="w-1/2 flex flex-col">
          <div 
            className="p-2 border-b text-xs text-gray-500 flex-shrink-0"
            style={{ 
              background: eyeCareMode ? 'rgba(255,255,255,0.6)' : '#f3f4f6',
              borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb'
            }}
          >
            实时预览
          </div>
          <div 
            className="flex-1 p-6 overflow-y-auto"
            style={{ background: eyeCareMode ? 'rgba(255,255,255,0.9)' : '#fafafa', whiteSpace: 'pre-wrap' }}
          >
            {parsedLines.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                在左侧输入内容，这里将实时显示格式效果
              </div>
            ) : (
              <div className="space-y-0.5 leading-relaxed">
                {parsedLines.map((line, index) => (
                  <div
                    key={index}
                    className={`py-0.5 px-1 rounded cursor-pointer transition-colors w-full ${
                      selectedLineIndex === index ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                    style={{ 
                      textAlign: line.align,
                      paddingLeft: line.align === 'left' && line.indent ? `${line.indent}em` : undefined,
                    }}
                    onClick={() => setSelectedLineIndex(index)}
                  >
                    {line.text || '\u00A0'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* AI 评分结果 */}
      {aiScore && (
        <div 
          className="p-4 border-t flex-shrink-0"
          style={{ borderColor: eyeCareMode ? '#A5D6A7' : '#e5e7eb' }}
        >
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-center">
              <div className="text-xs text-blue-600">内容</div>
              <div className="text-lg font-bold text-blue-700">{aiScore.content}</div>
            </div>
            <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-center">
              <div className="text-xs text-green-600">语言</div>
              <div className="text-lg font-bold text-green-700">{aiScore.language}</div>
            </div>
            <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-center">
              <div className="text-xs text-purple-600">结构</div>
              <div className="text-lg font-bold text-purple-700">{aiScore.structure}</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-center">
              <div className="text-xs text-amber-600">总分</div>
              <div className="text-lg font-bold text-amber-700">{aiScore.total}/{maxScore}</div>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border text-sm text-gray-600">
            {aiScore.feedback}
          </div>
        </div>
      )}
      
      {/* 参考范文 */}
      {isSubmitted && task.sampleAnswer && (
        <div className="p-3 border-t flex-shrink-0">
          <button
            className="flex items-center gap-2 text-xs font-medium text-amber-600"
            onClick={() => setShowSample(!showSample)}
          >
            <Sparkles className="w-4 h-4" />
            {showSample ? '隐藏范文' : '查看范文'}
          </button>
          {showSample && (
            <div className="mt-2 p-3 rounded-lg bg-amber-50 border text-sm whitespace-pre-wrap">
              {task.sampleAnswer}
            </div>
          )}
        </div>
      )}
      
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
            点击预览区行可选中，再点击工具栏设置格式
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
              onClick={() => onAskAI(`请帮我分析这篇作文的优缺点：\n\n${userAnswer}`)}
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
