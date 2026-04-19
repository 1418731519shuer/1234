'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Clock, Send, ChevronUp, ChevronDown, MessageCircle, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

interface TranslationSentence {
  id: string
  sentenceNum: number
  englishText: string
  referenceCn?: string
  keyVocabulary?: string  // JSON: [{word, meaning, score}]
  grammarPoints?: string
  scoringRules?: string
  userAnswer?: string
  aiScore?: {
    vocabScore: number
    fluencyScore: number
    totalScore: number
    feedback: string
    keyWordsCorrect: string[]
    keyWordsMissing: string[]
  }
}

interface TranslationQuestionPanelProps {
  sentences: TranslationSentence[]
  currentIndex: number
  onAnswerChange: (sentenceId: string, answer: string) => void
  onSubmit: () => void
  isSubmitted: boolean
  startTime: Date
  onAskAI?: (question: string) => void
  onAIScore?: (sentenceId: string, score: TranslationSentence['aiScore']) => void
}

export default function TranslationQuestionPanel({
  sentences,
  currentIndex,
  onAnswerChange,
  onSubmit,
  isSubmitted,
  startTime,
  onAskAI,
  onAIScore,
}: TranslationQuestionPanelProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isScoring, setIsScoring] = useState(false)
  const [showKeyVocab, setShowKeyVocab] = useState(true)
  
  const currentSentence = sentences[currentIndex]
  const answeredCount = sentences.filter(s => s.userAnswer && s.userAnswer.trim()).length
  const allAnswered = answeredCount === sentences.length
  
  // 计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // 解析重点词汇
  const parseKeyVocabulary = (keyVocab?: string) => {
    if (!keyVocab) return []
    try {
      return JSON.parse(keyVocab)
    } catch {
      return []
    }
  }
  
  const keyVocabList = parseKeyVocabulary(currentSentence.keyVocabulary)
  
  // AI 评分
  const handleAIScore = async () => {
    if (!currentSentence.userAnswer || !onAIScore) return
    
    setIsScoring(true)
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `请对以下翻译进行评分：

【英文原句】
${currentSentence.englishText}

【参考译文】
${currentSentence.referenceCn || '暂无'}

【用户翻译】
${currentSentence.userAnswer}

【重点词汇】
${keyVocabList.map((v: any) => `${v.word}: ${v.meaning}`).join('\n')}

请按以下格式返回JSON：
{
  "vocabScore": 词汇得分(0-1分),
  "fluencyScore": 语义通顺度得分(0-1分),
  "totalScore": 总分(0-2分),
  "feedback": "详细反馈",
  "keyWordsCorrect": ["翻译正确的关键词"],
  "keyWordsMissing": ["遗漏或翻译错误的关键词"]
}

评分标准：
- 词汇得分：重点词汇翻译是否正确
- 语义通顺度：译文是否通顺、符合中文表达习惯
- 总分 = 词汇得分 + 语义通顺度得分`
          }]
        })
      })
      
      const data = await response.json()
      
      // 尝试解析 AI 返回的 JSON
      let scoreData
      try {
        // 尝试从 markdown 代码块中提取 JSON
        const jsonMatch = data.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                          data.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          scoreData = JSON.parse(jsonMatch[1] || jsonMatch[0])
        } else {
          scoreData = JSON.parse(data.content)
        }
      } catch {
        // 如果解析失败，使用默认评分
        scoreData = {
          vocabScore: 0.5,
          fluencyScore: 0.5,
          totalScore: 1,
          feedback: data.content,
          keyWordsCorrect: [],
          keyWordsMissing: []
        }
      }
      
      onAIScore(currentSentence.id, scoreData)
    } catch (error) {
      console.error('AI scoring error:', error)
    } finally {
      setIsScoring(false)
    }
  }
  
  if (!currentSentence) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        暂无翻译内容
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* 标题栏 */}
      <div className="p-3 border-b bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              第 {currentSentence.sentenceNum} / {sentences.length} 句
            </Badge>
            <Badge variant="outline" className="text-sm text-blue-600">
              {answeredCount}/{sentences.length} 已翻译
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </div>
      
      {/* 翻译内容 */}
      <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
        {/* 英文原句 */}
        <div className="mb-4">
          <div className="text-xs font-medium text-slate-500 mb-2">英文原句（划线部分）</div>
          <div className="p-4 rounded-xl bg-yellow-50 border-2 border-yellow-300">
            <p className="text-base text-gray-800 leading-relaxed">{currentSentence.englishText}</p>
          </div>
        </div>
        
        {/* 重点词汇 */}
        {keyVocabList.length > 0 && (
          <div className="mb-4">
            <button
              className="flex items-center gap-2 text-xs font-medium text-amber-600 mb-2"
              onClick={() => setShowKeyVocab(!showKeyVocab)}
            >
              <span>重点词汇 ({keyVocabList.length})</span>
              {showKeyVocab ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showKeyVocab && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex flex-wrap gap-2">
                  {keyVocabList.map((vocab: any, i: number) => (
                    <div key={i} className="px-2 py-1 rounded bg-white border border-amber-200 text-sm">
                      <span className="font-medium text-amber-700">{vocab.word}</span>
                      <span className="text-gray-600 ml-1">{vocab.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 翻译输入 */}
        <div className="mb-4">
          <div className="text-xs font-medium text-slate-500 mb-2">你的翻译</div>
          <Textarea
            value={currentSentence.userAnswer || ''}
            onChange={(e) => onAnswerChange(currentSentence.id, e.target.value)}
            placeholder="请输入中文翻译..."
            disabled={isSubmitted}
            className="min-h-[100px] resize-none"
          />
          <div className="text-xs text-slate-400 mt-1">
            建议字数：20-50字
          </div>
        </div>
        
        {/* AI 评分结果 */}
        {currentSentence.aiScore && (
          <div className="mb-4 space-y-3">
            <div className="text-xs font-medium text-slate-500">AI 评分结果</div>
            
            {/* 分数展示 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                <div className="text-xs text-blue-600 mb-1">词汇得分</div>
                <div className="text-xl font-bold text-blue-700">
                  {currentSentence.aiScore.vocabScore.toFixed(1)}
                </div>
                <div className="text-xs text-blue-500">/ 1分</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
                <div className="text-xs text-green-600 mb-1">通顺度</div>
                <div className="text-xl font-bold text-green-700">
                  {currentSentence.aiScore.fluencyScore.toFixed(1)}
                </div>
                <div className="text-xs text-green-500">/ 1分</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-center">
                <div className="text-xs text-purple-600 mb-1">总分</div>
                <div className="text-xl font-bold text-purple-700">
                  {currentSentence.aiScore.totalScore.toFixed(1)}
                </div>
                <div className="text-xs text-purple-500">/ 2分</div>
              </div>
            </div>
            
            {/* 关键词反馈 */}
            {currentSentence.aiScore.keyWordsCorrect && currentSentence.aiScore.keyWordsCorrect.length > 0 && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="text-xs font-medium text-green-700 mb-1">✓ 翻译正确的关键词</div>
                <div className="flex flex-wrap gap-1">
                  {currentSentence.aiScore.keyWordsCorrect.map((word, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {currentSentence.aiScore.keyWordsMissing && currentSentence.aiScore.keyWordsMissing.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="text-xs font-medium text-red-700 mb-1">✗ 遗漏或错误的关键词</div>
                <div className="flex flex-wrap gap-1">
                  {currentSentence.aiScore.keyWordsMissing.map((word, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* 详细反馈 */}
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-1">详细反馈</div>
              <p className="text-sm text-gray-600 leading-relaxed">{currentSentence.aiScore.feedback}</p>
            </div>
          </div>
        )}
        
        {/* 参考译文（提交后显示） */}
        {isSubmitted && currentSentence.referenceCn && (
          <div className="mb-4">
            <div className="text-xs font-medium text-emerald-600 mb-2">参考译文</div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-base text-emerald-900 leading-relaxed">{currentSentence.referenceCn}</p>
            </div>
          </div>
        )}
        
        {/* AI助教按钮 */}
        {onAskAI && (
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAskAI(`请帮我分析这句话的翻译要点：\n\n${currentSentence.englishText}\n\n我的翻译：${currentSentence.userAnswer || '（还未翻译）'}`)}
              className="text-emerald-600 border-emerald-200"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              🐱 AI助教点评
            </Button>
          </div>
        )}
      </div>
      
      {/* 底部导航 */}
      <div className="p-3 border-t bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-slate-500">
            {currentIndex + 1} / {sentences.length}
          </span>
        </div>
        
        {/* 提交按钮 */}
        {!isSubmitted ? (
          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600"
            disabled={!allAnswered}
            onClick={onSubmit}
          >
            {allAnswered ? (
              <>
                <Send className="w-4 h-4 mr-1" />
                提交翻译
              </>
            ) : (
              `还有 ${sentences.length - answeredCount} 句未翻译`
            )}
          </Button>
        ) : (
          <div className="space-y-2">
            {/* AI 评分按钮 */}
            {!currentSentence.aiScore && (
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={handleAIScore}
                disabled={isScoring || !currentSentence.userAnswer}
              >
                {isScoring ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    AI 评分中...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-1" />
                    AI 评分
                  </>
                )}
              </Button>
            )}
            
            {currentSentence.aiScore && (
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">已完成评分</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
