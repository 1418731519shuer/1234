'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface WritingTask {
  id: string
  taskType: 'small' | 'big'
  title: string
  description: string
  requirements: string[]
  wordCount: { min: number; max: number }
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

interface WritingTaskPanelProps {
  tasks: WritingTask[]
  currentTaskIndex: number
  onSelectTask: (index: number) => void
  onSubmit: (withAIScore: boolean) => void
  isSubmitted: boolean
  userAnswers: Record<string, string>
  onAskAI?: (question: string) => void
  aiScores?: Record<string, WritingScore>
  isScoring?: boolean
}

export default function WritingTaskPanel({
  tasks,
  currentTaskIndex,
  onSelectTask,
  onSubmit,
  isSubmitted,
  userAnswers,
  onAskAI,
  aiScores,
  isScoring,
}: WritingTaskPanelProps) {
  const currentTask = tasks[currentTaskIndex]
  const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[k]?.trim()).length
  const allAnswered = answeredCount === tasks.length
  
  // 计算总分
  const totalScore = aiScores 
    ? Object.values(aiScores).reduce((sum, score) => sum + (score?.total || 0), 0)
    : 0
  const maxTotalScore = tasks.reduce((sum, task) => 
    sum + (task.taskType === 'small' ? 10 : 20), 0
  )
  
  return (
    <div className="h-full flex flex-col bg-slate-50" style={{ minHeight: 0 }}>
      {/* 题目导航 */}
      <div className="p-3 border-b bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-800">写作任务</h2>
          <Badge variant="outline" className="text-sm">
            {answeredCount}/{tasks.length} 已完成
          </Badge>
        </div>
        <div className="flex gap-2">
          {tasks.map((task, i) => {
            const hasAnswer = userAnswers[task.id]?.trim()
            const isCurrent = i === currentTaskIndex
            const hasScore = aiScores?.[task.id]
            
            return (
              <button
                key={task.id}
                className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border-2 flex items-center justify-center gap-2"
                style={{
                  background: isCurrent 
                    ? (task.taskType === 'small' ? '#dbeafe' : '#f3e8ff')
                    : hasScore
                      ? '#d1fae5'
                      : hasAnswer 
                        ? '#fef3c7' 
                        : '#f3f4f6',
                  borderColor: isCurrent 
                    ? (task.taskType === 'small' ? '#3b82f6' : '#a855f7')
                    : hasScore
                      ? '#10b981'
                      : hasAnswer 
                        ? '#f59e0b' 
                        : '#d1d5db',
                  color: isCurrent 
                    ? (task.taskType === 'small' ? '#1e40af' : '#7c3aed')
                    : '#374151',
                }}
                onClick={() => onSelectTask(i)}
              >
                <FileText className="w-4 h-4" />
                {task.taskType === 'small' ? '小作文' : '大作文'}
                {hasScore && (
                  <span className="text-xs">
                    {hasScore.total}分
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* 当前任务信息 */}
      <div className="flex-1 overflow-y-auto p-3" style={{ minHeight: 0 }}>
        {currentTask && (
          <div className="space-y-3">
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={currentTask.taskType === 'small' ? 'bg-blue-500' : 'bg-purple-500'}>
                  {currentTask.taskType === 'small' ? '小作文' : '大作文'}
                </Badge>
                <span className="font-medium text-slate-800">{currentTask.title}</span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{currentTask.description}</p>
              <div className="text-xs text-slate-500">
                字数要求: {currentTask.wordCount.min}-{currentTask.wordCount.max}词
              </div>
            </div>
            
            {/* 要求列表 */}
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-xs font-medium text-slate-500 mb-2">写作要求</div>
              <ul className="text-sm text-slate-700 space-y-1">
                {currentTask.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* 写作技巧 */}
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-xs font-medium text-emerald-700 mb-2">
                {currentTask.taskType === 'small' ? '小作文技巧' : '大作文技巧'}
              </div>
              <ul className="text-xs text-emerald-600 space-y-1">
                {currentTask.taskType === 'small' ? (
                  <>
                    <li>• 开头点明写作目的</li>
                    <li>• 中间分段阐述要点</li>
                    <li>• 结尾表达期望或感谢</li>
                    <li>• 注意书信格式规范</li>
                  </>
                ) : (
                  <>
                    <li>• 第一段描述图画内容</li>
                    <li>• 第二段分析深层含义</li>
                    <li>• 第三段发表个人观点</li>
                    <li>• 使用连接词增强逻辑</li>
                  </>
                )}
              </ul>
            </div>
            
            {/* 评分说明 */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs font-medium text-blue-700 mb-2">评分标准</div>
              <div className="text-xs text-blue-600 space-y-1">
                {currentTask.taskType === 'small' ? (
                  <>
                    <li>• 满分10分</li>
                    <li>• 内容完整度 3-4分</li>
                    <li>• 语言准确性 3-4分</li>
                    <li>• 格式规范性 2-3分</li>
                  </>
                ) : (
                  <>
                    <li>• 满分20分</li>
                    <li>• 内容与主题 6-8分</li>
                    <li>• 语言表达 6-8分</li>
                    <li>• 结构组织 4-6分</li>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 提交按钮 */}
      <div className="p-3 border-t bg-white flex-shrink-0">
        {isScoring ? (
          <div className="flex items-center justify-center gap-2 text-blue-600 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI评分中...</span>
          </div>
        ) : !isSubmitted ? (
          <div className="space-y-2">
            {/* 直接提交 */}
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600"
              disabled={!allAnswered}
              onClick={() => onSubmit(false)}
            >
              {allAnswered ? '提交作文' : `请完成所有写作任务 (${answeredCount}/${tasks.length})`}
            </Button>
            
            {/* AI评分提交 */}
            {allAnswered && (
              <Button
                variant="outline"
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => onSubmit(true)}
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                提交并AI评分
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* 总分显示 */}
            {Object.keys(aiScores || {}).length === tasks.length && (
              <div className="flex items-center justify-center gap-2 text-emerald-600 py-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">总分: {totalScore}/{maxTotalScore}分</span>
              </div>
            )}
            
            {/* AI详细批改 */}
            {onAskAI && (
              <Button
                variant="outline"
                className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={() => onAskAI(`请帮我详细分析这篇作文的优缺点，并给出改进建议。`)}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                AI详细批改
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
