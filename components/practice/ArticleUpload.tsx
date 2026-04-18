'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  FileText, 
  Plus, 
  Trash2,
  Save,
  Loader2,
  Sparkles
} from 'lucide-react'

interface QuestionInput {
  stem: string
  options: { A: string; B: string; C: string; D: string }
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  analysis: string
  questionType: string
}

interface ArticleUploadProps {
  onSave: (article: {
    title: string
    content: string
    source: string
    year: number
    category: string
    questions: QuestionInput[]
  }) => Promise<void>
}

const QUESTION_TYPES = [
  '主旨大意题',
  '细节理解题',
  '推理判断题',
  '词义猜测题',
  '态度观点题',
  '段落大意题',
]

export default function ArticleUpload({ onSave }: ArticleUploadProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [source, setSource] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [category, setCategory] = useState('')
  const [questions, setQuestions] = useState<QuestionInput[]>([
    {
      stem: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
      analysis: '',
      questionType: '细节理解题',
    },
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        stem: '',
        options: { A: '', B: '', C: '', D: '' },
        correctAnswer: 'A',
        analysis: '',
        questionType: '细节理解题',
      },
    ])
  }
  
  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }
  
  const updateQuestion = (index: number, field: keyof QuestionInput, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }
  
  const updateOption = (qIndex: number, optKey: string, value: string) => {
    const updated = [...questions]
    updated[qIndex].options = {
      ...updated[qIndex].options,
      [optKey]: value,
    }
    setQuestions(updated)
  }
  
  const handleParseContent = async () => {
    if (!content.trim()) return
    
    setIsParsing(true)
    try {
      const response = await fetch('/api/articles/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      
      const data = await response.json()
      if (data.questions) {
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error('Parse error:', error)
    } finally {
      setIsParsing(false)
    }
  }
  
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return
    
    setIsSaving(true)
    try {
      await onSave({
        title,
        content,
        source,
        year,
        category,
        questions,
      })
      
      // 重置表单
      setTitle('')
      setContent('')
      setSource('')
      setCategory('')
      setQuestions([
        {
          stem: '',
          options: { A: '', B: '', C: '', D: '' },
          correctAnswer: 'A',
          analysis: '',
          questionType: '细节理解题',
        },
      ])
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }
  
  const isValid = title.trim() && content.trim() && questions.every(q => 
    q.stem.trim() && 
    Object.values(q.options).every(opt => opt.trim())
  )

  return (
    <div className="space-y-6">
      {/* 文章基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            文章信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">文章标题</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入文章标题"
              />
            </div>
            <div>
              <Label htmlFor="source">来源</Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="如：2023年考研英语一"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">年份</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="category">分类</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="如：经济、科技、文化"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="content">文章内容</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleParseContent}
                disabled={!content.trim() || isParsing}
              >
                {isParsing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-1" />
                )}
                AI解析题目
              </Button>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="粘贴文章内容..."
              className="min-h-[300px]"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* 题目编辑 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              题目设置
              <Badge variant="secondary">{questions.length} 题</Badge>
            </CardTitle>
            <Button onClick={addQuestion} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              添加题目
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">题目 {qIndex + 1}</h4>
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
              
              <div>
                <Label>题干</Label>
                <Textarea
                  value={q.stem}
                  onChange={(e) => updateQuestion(qIndex, 'stem', e.target.value)}
                  placeholder="输入题目..."
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div key={opt}>
                    <Label>选项 {opt}</Label>
                    <Input
                      value={q.options[opt as keyof typeof q.options]}
                      onChange={(e) => updateOption(qIndex, opt, e.target.value)}
                      placeholder={`选项 ${opt} 内容`}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>正确答案</Label>
                  <div className="flex gap-2 mt-1">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => updateQuestion(qIndex, 'correctAnswer', opt)}
                        className={`
                          w-10 h-10 rounded-lg font-medium transition-all
                          ${q.correctAnswer === opt 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }
                        `}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>题型</Label>
                  <select
                    value={q.questionType}
                    onChange={(e) => updateQuestion(qIndex, 'questionType', e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg"
                  >
                    {QUESTION_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <Label>解析</Label>
                <Textarea
                  value={q.analysis}
                  onChange={(e) => updateQuestion(qIndex, 'analysis', e.target.value)}
                  placeholder="输入题目解析..."
                  className="mt-1"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!isValid || isSaving}
          size="lg"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          保存文章
        </Button>
      </div>
    </div>
  )
}
