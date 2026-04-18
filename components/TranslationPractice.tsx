'use client'

import { useState } from 'react'

interface TranslationQuestion {
  id: string
  questionNum: number
  stem: string
  correctAnswer: string
}

interface TranslationPracticeProps {
  content: string
  questions: TranslationQuestion[]
  onSubmit: (answers: Record<number, string>) => void
  isSubmitted: boolean
}

export default function TranslationPractice({ 
  content, 
  questions, 
  onSubmit, 
  isSubmitted 
}: TranslationPracticeProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // 提取需要翻译的句子（从题目中）
  const sentences = questions.map(q => ({
    num: q.questionNum,
    english: q.stem,
    reference: q.correctAnswer,
  }))
  
  const currentSentence = sentences[currentIndex]
  const currentAnswer = answers[currentSentence?.num] || ''
  
  const handleAnswerChange = (value: string) => {
    if (!currentSentence) return
    setAnswers(prev => ({ ...prev, [currentSentence.num]: value }))
  }
  
  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }
  
  const answeredCount = Object.values(answers).filter(a => a.trim()).length
  
  // AI评分（模拟）
  const getScore = (answer: string, reference: string) => {
    if (!answer.trim()) return 0
    // 简单的关键词匹配评分
    const refWords = reference.toLowerCase().split(/\s+/)
    const ansWords = answer.toLowerCase().split(/\s+/)
    const matchCount = refWords.filter(w => ansWords.includes(w)).length
    return Math.min(100, Math.round((matchCount / refWords.length) * 100))
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* 原文区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose max-w-none leading-relaxed text-base mb-6" style={{ lineHeight: '2' }}>
          {content}
        </div>
        
        {/* 句子导航 */}
        <div className="flex gap-2 mb-4">
          {sentences.map((s, i) => (
            <button
              key={s.num}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: currentIndex === i ? 'var(--m)' : answers[s.num]?.trim() ? 'var(--m1)' : 'var(--bg2)',
                color: currentIndex === i ? 'white' : answers[s.num]?.trim() ? 'var(--m)' : 'var(--tx2)',
                border: `1px solid ${currentIndex === i ? 'var(--m)' : 'var(--bd)'}`,
              }}
              onClick={() => setCurrentIndex(i)}
            >
              {s.num}
            </button>
          ))}
        </div>
        
        {/* 当前句子 */}
        {currentSentence && (
          <div className="rounded-xl p-4 border mb-4" style={{ borderColor: 'var(--bd)', background: 'var(--bg)' }}>
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--tx3)' }}>
              句子 {currentSentence.num}
            </div>
            <div className="text-base leading-relaxed" style={{ color: 'var(--tx)' }}>
              {currentSentence.english}
            </div>
          </div>
        )}
        
        {/* 翻译输入 */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2" style={{ color: 'var(--tx)' }}>你的翻译</div>
          <textarea
            className="w-full h-32 p-4 rounded-xl border resize-none text-sm"
            style={{ 
              borderColor: 'var(--bd)', 
              background: 'var(--bg2)',
              color: 'var(--tx)',
            }}
            placeholder="请将上述英文句子翻译成中文..."
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            disabled={isSubmitted}
          />
        </div>
        
        {/* 参考译文（提交后显示） */}
        {isSubmitted && currentSentence && (
          <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--m)', background: 'var(--m1)' }}>
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--m)' }}>
              参考译文
            </div>
            <div className="text-base leading-relaxed" style={{ color: 'var(--tx)' }}>
              {currentSentence.reference || '暂无参考译文'}
            </div>
            
            {/* 评分 */}
            <div className="mt-3 flex items-center gap-3">
              <div className="text-sm" style={{ color: 'var(--tx2)' }}>AI评分:</div>
              <div 
                className="text-lg font-bold"
                style={{ color: getScore(currentAnswer, currentSentence.reference) >= 60 ? 'var(--m)' : '#ef4444' }}
              >
                {getScore(currentAnswer, currentSentence.reference)}分
              </div>
            </div>
          </div>
        )}
        
        {/* 导航按钮 */}
        <div className="flex justify-between mt-4">
          <button
            className="px-4 py-2 rounded-lg text-sm transition-all"
            style={{ 
              background: 'var(--bg2)', 
              color: 'var(--tx2)',
              opacity: currentIndex === 0 ? 0.5 : 1,
            }}
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            ← 上一句
          </button>
          <button
            className="px-4 py-2 rounded-lg text-sm transition-all"
            style={{ 
              background: 'var(--bg2)', 
              color: 'var(--tx2)',
              opacity: currentIndex === sentences.length - 1 ? 0.5 : 1,
            }}
            onClick={handleNext}
            disabled={currentIndex === sentences.length - 1}
          >
            下一句 →
          </button>
        </div>
      </div>
      
      {/* 底部状态栏 */}
      <div className="border-t p-4" style={{ borderColor: 'var(--bd)', background: 'var(--bg)' }}>
        <div className="flex items-center justify-between">
          <div className="text-sm" style={{ color: 'var(--tx2)' }}>
            已完成 {answeredCount}/{sentences.length} 句
          </div>
          {!isSubmitted && answeredCount === sentences.length && (
            <button
              className="px-6 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90"
              style={{ background: 'var(--m)' }}
              onClick={() => onSubmit(answers)}
            >
              提交答案
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
