'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Sparkles, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  BookOpen,
  FileQuestion,
  Save,
  Send
} from 'lucide-react'
import type { QuestionType, ParsedResult, ReadingSubmit, ClozeSubmit, SevenFiveSubmit, TranslationSubmit, WritingTaskSubmit } from '@/types/submit'

const QUESTION_TYPES: { key: QuestionType; label: string; icon: string }[] = [
  { key: 'reading', label: '阅读理解', icon: '📖' },
  { key: 'cloze', label: '完型填空', icon: '📝' },
  { key: 'sevenFive', label: '七选五', icon: '🔗' },
  { key: 'translation', label: '翻译', icon: '🌐' },
  { key: 'writing', label: '写作', icon: '✍️' },
]

// 模板格式示例
const TEMPLATES: Record<QuestionType, string> = {
  reading: `【标题】文章标题
【来源】2023年英语一
【难度】3

【文章正文】
这里是文章的正文内容...

【题目1】
题干：这道题问的是什么？
A. 选项A内容
B. 选项B内容
C. 选项C内容
D. 选项D内容
【答案】A
【解析】这道题考查的是...

【题目2】
题干：第二道题...
...`,

  cloze: `【标题】完型填空标题
【来源】2023年英语一
【难度】3

【文章正文】
在需要填空的位置用 [1][2]...[20] 标记
例如：The study [1] that...`,

  sevenFive: `【标题】七选五标题
【来源】2023年英语一
【难度】3

【文章正文】
在需要填入段落的位置用 [1][2]...[5] 标记

【选项】
A. 第一个段落内容...
B. 第二个段落内容...
C. 第三个段落内容...
D. 第四个段落内容...
E. 第五个段落内容...
F. 第六个段落内容...
G. 第七个段落内容...

【答案】1-A, 2-C, 3-E, 4-B, 5-G`,

  translation: `【标题】翻译文章标题
【来源】2023年英语一
【难度】3

【文章正文】
完整文章内容，划线句子会标注

【句子1】
英文：The first sentence to translate.
译文：第一句的翻译。

【句子2】
英文：The second sentence.
译文：第二句的翻译。`,

  writing: `【标题】写作题目
【类型】小作文/大作文
【来源】2023年英语一
【字数要求】100-120词

【写作要求】
Directions: Write a letter to...

【范文】
Dear Sir/Madam,
I am writing to...
Yours sincerely,
Li Ming`,
}

export default function SubmitPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'paste' | 'template' | 'upload'>('paste')
  const [selectedType, setSelectedType] = useState<QuestionType>('reading')
  const [rawContent, setRawContent] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parseResult, setParseResult] = useState<ParsedResult | null>(null)
  const [editedData, setEditedData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  // AI智能解析
  const handleParse = useCallback(async () => {
    if (!rawContent.trim()) return

    setIsParsing(true)
    try {
      const response = await fetch('/api/submit/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: rawContent,
          questionType: activeTab === 'template' ? selectedType : undefined,
          generateSuggestion: true,
        }),
      })

      const result = await response.json()
      setParseResult(result)
      setEditedData(result.data)
    } catch (error) {
      console.error('Parse error:', error)
    } finally {
      setIsParsing(false)
    }
  }, [rawContent, activeTab, selectedType])

  // 使用模板
  const handleUseTemplate = (type: QuestionType) => {
    setSelectedType(type)
    setRawContent(TEMPLATES[type])
    setActiveTab('paste')
  }

  // 保存草稿
  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      // TODO: 保存到数据库或localStorage
      const draft = {
        id: `draft_${Date.now()}`,
        questionType: parseResult?.questionType,
        data: editedData,
        createdAt: new Date().toISOString(),
      }
      
      // 暂存到localStorage
      const drafts = JSON.parse(localStorage.getItem('submit_drafts') || '[]')
      drafts.unshift(draft)
      localStorage.setItem('submit_drafts', JSON.stringify(drafts.slice(0, 20)))

      alert('草稿已保存')
    } catch (error) {
      console.error('Save draft error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // 提交发布
  const handleSubmit = async () => {
    if (!editedData) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editedData,
          questionType: parseResult?.questionType,
        }),
      })

      if (response.ok) {
        alert('提交成功！')
        router.push('/')
      } else {
        alert('提交失败，请重试')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('提交失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-500" />
              文章提交
            </h1>
          </div>
          {parseResult?.success && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
                <Save className="w-4 h-4 mr-1" />
                保存草稿
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                <Send className="w-4 h-4 mr-1" />
                提交发布
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-2 gap-4 h-[calc(100vh-120px)]">
          {/* 左侧 - 输入区 */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="paste">快速粘贴</TabsTrigger>
                  <TabsTrigger value="template">模板格式</TabsTrigger>
                  <TabsTrigger value="upload">文件上传</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              {activeTab === 'paste' && (
                <>
                  <Textarea
                    placeholder="粘贴任意格式的文章内容，AI会自动识别题型和结构..."
                    value={rawContent}
                    onChange={(e) => setRawContent(e.target.value)}
                    className="flex-1 min-h-[300px] resize-none"
                  />
                  <Button 
                    onClick={handleParse} 
                    disabled={!rawContent.trim() || isParsing}
                    className="mt-3"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        AI解析中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-1" />
                        AI智能解析
                      </>
                    )}
                  </Button>
                </>
              )}

              {activeTab === 'template' && (
                <>
                  <div className="mb-3">
                    <p className="text-sm text-gray-500 mb-2">选择题型模板：</p>
                    <div className="flex flex-wrap gap-2">
                      {QUESTION_TYPES.map((type) => (
                        <Badge
                          key={type.key}
                          variant={selectedType === type.key ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => setSelectedType(type.key)}
                        >
                          {type.icon} {type.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    placeholder={`按照${QUESTION_TYPES.find(t => t.key === selectedType)?.label}模板格式粘贴内容...`}
                    value={rawContent}
                    onChange={(e) => setRawContent(e.target.value)}
                    className="flex-1 min-h-[250px] resize-none font-mono text-sm"
                  />
                  <Button 
                    onClick={handleParse} 
                    disabled={!rawContent.trim() || isParsing}
                    className="mt-3"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        解析中...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-1" />
                        解析模板
                      </>
                    )}
                  </Button>
                </>
              )}

              {activeTab === 'upload' && (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">拖拽文件到此处，或点击上传</p>
                  <p className="text-sm text-gray-400 mb-4">支持 .txt, .docx 格式</p>
                  <Input type="file" accept=".txt,.docx" className="max-w-xs" />
                  <div className="mt-4 text-xs text-gray-400">
                    <p>提示：PDF解析功能开发中</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 右侧 - 解析结果预览 */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                {parseResult?.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    解析结果
                    <Badge variant="outline" className="ml-auto">
                      置信度 {Math.round((parseResult?.confidence || 0) * 100)}%
                    </Badge>
                  </>
                ) : parseResult ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    解析失败
                  </>
                ) : (
                  <>
                    <FileQuestion className="w-4 h-4 text-gray-400" />
                    等待解析
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {!parseResult ? (
                <div className="text-center py-12 text-gray-400">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>粘贴内容后点击"AI智能解析"</p>
                  <p className="text-sm mt-2">或选择模板格式</p>
                </div>
              ) : parseResult.success && editedData ? (
                <div className="space-y-4">
                  {/* 基本信息 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">标题</label>
                      <Input
                        value={editedData.title || ''}
                        onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">年份</label>
                      <Input
                        type="number"
                        value={editedData.year || ''}
                        onChange={(e) => setEditedData({ ...editedData, year: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">题型</label>
                      <Badge>{QUESTION_TYPES.find(t => t.key === parseResult.questionType)?.label}</Badge>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">考试类型</label>
                      <select
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={editedData.examType || 'english1'}
                        onChange={(e) => setEditedData({ ...editedData, examType: e.target.value })}
                      >
                        <option value="english1">英语一</option>
                        <option value="english2">英语二</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">难度</label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={editedData.difficulty || 3}
                        onChange={(e) => setEditedData({ ...editedData, difficulty: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* 文章内容 */}
                  <div>
                    <label className="text-xs text-gray-500">文章内容</label>
                    <Textarea
                      value={editedData.content || ''}
                      onChange={(e) => setEditedData({ ...editedData, content: e.target.value })}
                      className="min-h-[150px]"
                    />
                  </div>

                  {/* 题目列表（阅读理解） */}
                  {parseResult.questionType === 'reading' && editedData.questions && (
                    <div>
                      <label className="text-xs text-gray-500 mb-2 block">
                        题目 ({editedData.questions.length}道)
                      </label>
                      <div className="space-y-2 max-h-[200px] overflow-auto">
                        {editedData.questions.map((q: any, i: number) => (
                          <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                            <div className="font-medium">Q{q.questionNum}: {q.stem}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              答案: {q.correctAnswer}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 完型填空空位 */}
                  {parseResult.questionType === 'cloze' && editedData.blanks && (
                    <div>
                      <label className="text-xs text-gray-500 mb-2 block">
                        空位 ({editedData.blanks.length}个)
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {editedData.blanks.map((b: any) => (
                          <div key={b.blankNum} className="text-center p-1 bg-gray-50 rounded text-xs">
                            <div className="font-medium">#{b.blankNum}</div>
                            <div className="text-green-600">{b.correctAnswer}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI建议 */}
                  {parseResult.suggestions && (
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-1 text-purple-600 text-sm font-medium mb-2">
                        <Sparkles className="w-4 h-4" />
                        AI出题建议
                      </div>
                      <div className="text-xs text-purple-700">
                        {parseResult.suggestions[0]}
                      </div>
                    </div>
                  )}

                  {/* 错误信息 */}
                  {parseResult.errors && parseResult.errors.length > 0 && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-red-600 text-sm">
                        {parseResult.errors.map((e, i) => (
                          <div key={i}>• {e}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-red-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                  <p>解析失败</p>
                  {parseResult.errors?.map((e, i) => (
                    <p key={i} className="text-sm">{e}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 快速模板选择 */}
        <Card className="mt-4">
          <CardContent className="py-3">
            <p className="text-sm text-gray-500 mb-2">快速使用模板：</p>
            <div className="flex gap-2">
              {QUESTION_TYPES.map((type) => (
                <Button
                  key={type.key}
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseTemplate(type.key)}
                >
                  {type.icon} {type.label}模板
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
