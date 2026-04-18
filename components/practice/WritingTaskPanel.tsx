'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Sparkles } from 'lucide-react'

interface WritingTask {
  id: string
  taskType: 'small' | 'big'
  title: string
  description: string
  requirements: string[]
  wordCount: { min: number; max: number }
}

interface WritingTaskPanelProps {
  tasks: WritingTask[]
  currentTaskIndex: number
  onSelectTask: (index: number) => void
  onSubmit: () => void
  isSubmitted: boolean
  userAnswers: Record<string, string>
  onAskAI?: (question: string) => void
}

export default function WritingTaskPanel({
  tasks,
  currentTaskIndex,
  onSelectTask,
  onSubmit,
  isSubmitted,
  userAnswers,
  onAskAI,
}: WritingTaskPanelProps) {
  const currentTask = tasks[currentTaskIndex]
  const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[k]?.trim()).length
  
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
            
            return (
              <button
                key={task.id}
                className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border-2 flex items-center justify-center gap-2"
                style={{
                  background: isCurrent 
                    ? (task.taskType === 'small' ? '#dbeafe' : '#f3e8ff')
                    : hasAnswer 
                      ? '#d1fae5' 
                      : '#f3f4f6',
                  borderColor: isCurrent 
                    ? (task.taskType === 'small' ? '#3b82f6' : '#a855f7')
                    : hasAnswer 
                      ? '#10b981' 
                      : '#d1d5db',
                  color: isCurrent 
                    ? (task.taskType === 'small' ? '#1e40af' : '#7c3aed')
                    : '#374151',
                }}
                onClick={() => onSelectTask(i)}
              >
                <FileText className="w-4 h-4" />
                {task.taskType === 'small' ? '小作文' : '大作文'}
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
          </div>
        )}
      </div>
      
      {/* 提交按钮 */}
      <div className="p-3 border-t bg-white flex-shrink-0">
        {!isSubmitted ? (
          <>
            {answeredCount === tasks.length ? (
              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600"
                onClick={onSubmit}
              >
                提交作文
              </Button>
            ) : (
              <div className="text-center text-sm text-slate-500">
                请完成所有写作任务 ({answeredCount}/{tasks.length})
              </div>
            )}
          </>
        ) : (
          onAskAI && (
            <Button
              variant="outline"
              className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={() => onAskAI(`请帮我详细分析这篇作文的优缺点，并给出改进建议。`)}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              AI详细批改
            </Button>
          )
        )}
      </div>
    </div>
  )
}
