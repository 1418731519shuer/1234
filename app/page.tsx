'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Article {
  id: string
  title: string
  source: string
  year: number | null
  category: string | null
  difficulty: number
  questionType: string
  examType: string
  _count: { questions: number }
}

interface TodayStats {
  articlesRead: number
  totalQuestions: number
  totalCorrect: number
  totalTime: number
}

interface PracticeRecord {
  articleId: string
  correctCount: number
  totalQuestions: number
  duration: number
}

const QUESTION_TYPES = [
  { key: 'reading', label: '阅读理解', icon: '📖' },
  { key: 'cloze', label: '完型填空', icon: '📝' },
  { key: 'sevenFive', label: '七选五', icon: '🔗' },
  { key: 'translation', label: '翻译', icon: '🌐' },
  { key: 'writing', label: '写作', icon: '✍️' },
]

export default function Home() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null)
  const [practiceRecords, setPracticeRecords] = useState<Record<string, PracticeRecord>>({})
  const [loading, setLoading] = useState(true)
  const [examType, setExamType] = useState<'english1' | 'english2'>('english1')
  const [activeType, setActiveType] = useState<string>('reading')
  const [streak, setStreak] = useState(14)
  const [catCoins, setCatCoins] = useState(348)
  
  // 考研倒计时
  const examDate = new Date('2026-12-21')
  const today = new Date()
  const daysLeft = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articlesRes, statsRes, recordsRes] = await Promise.all([
          fetch(`/api/articles?questionType=${activeType}&examType=${examType}`),
          fetch('/api/practice?type=today'),
          fetch('/api/practice'),
        ])
        
        const articlesData = await articlesRes.json()
        const statsData = await statsRes.json()
        const recordsData = await recordsRes.json()
        
        setArticles(articlesData.articles || [])
        setTodayStats(statsData)
        
        const recordMap: Record<string, PracticeRecord> = {}
        if (recordsData.records) {
          recordsData.records.forEach((r: PracticeRecord & { article: { id: string } }) => {
            recordMap[r.articleId || r.article?.id] = r
          })
        }
        setPracticeRecords(recordMap)
      } catch (error) {
        console.error('Fetch error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [activeType, examType])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} 分钟`
  }
  
  const accuracy = todayStats?.totalQuestions 
    ? Math.round((todayStats.totalCorrect / todayStats.totalQuestions) * 100) 
    : 0

  const getArticleStatus = (article: Article) => {
    const record = practiceRecords[article.id]
    if (record) {
      return {
        done: true,
        score: `${record.correctCount} / ${record.totalQuestions}`,
        time: formatTime(record.duration)
      }
    }
    return { done: false, score: null, time: null }
  }

  const getTypeLabel = (type: string) => {
    return QUESTION_TYPES.find(t => t.key === type)?.label || type
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* 左侧边栏 */}
      <aside className="w-[200px] border-r flex flex-col shrink-0" style={{ borderColor: 'var(--bd)', background: 'var(--bg)' }}>
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--bd)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--m)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 2.5c.8 0 1.5.7 1.5 1.5S8.8 7.5 8 7.5 6.5 6.8 6.5 6 7.2 4.5 8 4.5zm0 7.5c-1.5 0-2.8-.8-3.6-2 .02-1.2 2.4-1.85 3.6-1.85 1.19 0 3.58.65 3.6 1.85-.8 1.2-2.1 2-3.6 2z" fill="white"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--tx)' }}>备考英语</div>
              <div className="text-[10px]" style={{ color: 'var(--tx2)' }}>KaoYan English</div>
            </div>
          </div>
          
          {/* 英语一/二切换 */}
          <div className="mt-4 flex rounded-lg p-1" style={{ background: 'var(--bg2)' }}>
            <button
              className="flex-1 py-1.5 text-xs rounded-md transition-all"
              style={{ 
                background: examType === 'english1' ? 'var(--m)' : 'transparent',
                color: examType === 'english1' ? 'white' : 'var(--tx2)'
              }}
              onClick={() => setExamType('english1')}
            >
              英语一
            </button>
            <button
              className="flex-1 py-1.5 text-xs rounded-md transition-all"
              style={{ 
                background: examType === 'english2' ? 'var(--m)' : 'transparent',
                color: examType === 'english2' ? 'white' : 'var(--tx2)'
              }}
              onClick={() => setExamType('english2')}
            >
              英语二
            </button>
          </div>
        </div>
        
        {/* 题型导航 */}
        <div className="flex-1 py-3">
          <div className="text-[10px] px-5 pb-2 uppercase tracking-wider" style={{ color: 'var(--tx3)' }}>题型练习</div>
          {QUESTION_TYPES.map((type) => (
            <div 
              key={type.key}
              className="flex items-center gap-3 px-5 py-2.5 text-sm cursor-pointer transition-colors"
              style={{ 
                color: activeType === type.key ? 'var(--m)' : 'var(--tx2)', 
                background: activeType === type.key ? 'var(--m1)' : 'transparent'
              }}
              onClick={() => setActiveType(type.key)}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </div>
          ))}
          
          <div className="text-[10px] px-5 pt-4 pb-2 uppercase tracking-wider" style={{ color: 'var(--tx3)' }}>学习工具</div>
          <Link href="/wrong">
            <div className="flex items-center gap-3 px-5 py-2.5 text-sm cursor-pointer transition-colors hover:bg-gray-50" style={{ color: 'var(--tx2)' }}>
              <span>📕</span>
              <span>错题本</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--cat1)', color: 'var(--cat)' }}>12</span>
            </div>
          </Link>
          <Link href="/vocabulary">
            <div className="flex items-center gap-3 px-5 py-2.5 text-sm cursor-pointer transition-colors hover:bg-gray-50" style={{ color: 'var(--tx2)' }}>
              <span>📚</span>
              <span>词汇库</span>
            </div>
          </Link>
          <Link href="/knowledge">
            <div className="flex items-center gap-3 px-5 py-2.5 text-sm cursor-pointer transition-colors hover:bg-gray-50" style={{ color: 'var(--tx2)' }}>
              <span>💡</span>
              <span>知识库</span>
            </div>
          </Link>
          <Link href="/stats">
            <div className="flex items-center gap-3 px-5 py-2.5 text-sm cursor-pointer transition-colors hover:bg-gray-50" style={{ color: 'var(--tx2)' }}>
              <span>📊</span>
              <span>统计分析</span>
            </div>
          </Link>
        </div>
        
        {/* 底部连续学习 */}
        <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--bd)' }}>
          <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'var(--m1)' }}>
            <div className="text-2xl font-light" style={{ color: 'var(--m)', lineHeight: 1 }}>{streak}</div>
            <div className="text-[11px]" style={{ color: 'var(--m)', lineHeight: 1.4 }}>
              连续学习天数<br/>明天继续加油
            </div>
          </div>
        </div>
      </aside>
      
      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg2)' }}>
        {/* 顶部条 */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--bd)' }}>
          <div>
            <div className="text-lg font-medium" style={{ color: 'var(--tx)' }}>
              {getTypeLabel(activeType)}
              <span className="text-sm font-normal ml-2" style={{ color: 'var(--tx3)' }}>
                · {examType === 'english1' ? '英语一' : '英语二'}
              </span>
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--tx2)' }}>
              距考研 {daysLeft} 天 · 今日已完成 {todayStats?.articlesRead || 0} 篇
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--cat1)' }}>
              <span>🐱</span>
              <span className="text-sm font-medium" style={{ color: 'var(--cat)' }}>{catCoins}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-light" style={{ color: 'var(--m)', lineHeight: 1 }}>{daysLeft}</div>
              <div className="text-[10px]" style={{ color: 'var(--tx3)' }}>天后考研</div>
            </div>
          </div>
        </div>
        
        <div className="p-5">
          {/* 统计卡片 */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl p-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--tx3)' }}>今日文章</div>
              <div className="text-2xl font-light" style={{ color: 'var(--tx)', lineHeight: 1 }}>
                {todayStats?.articlesRead || 0}<span className="text-xs ml-1" style={{ color: 'var(--tx3)' }}>篇</span>
              </div>
            </div>
            <div className="rounded-xl p-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--tx3)' }}>正确率</div>
              <div className="text-2xl font-light" style={{ color: 'var(--tx)', lineHeight: 1 }}>
                {accuracy}<span className="text-xs ml-1" style={{ color: 'var(--tx3)' }}>%</span>
              </div>
            </div>
            <div className="rounded-xl p-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--tx3)' }}>学习时长</div>
              <div className="text-2xl font-light" style={{ color: 'var(--tx)', lineHeight: 1 }}>
                {Math.floor((todayStats?.totalTime || 0) / 60)}<span className="text-xs ml-1" style={{ color: 'var(--tx3)' }}>分</span>
              </div>
            </div>
            <div className="rounded-xl p-4 border" style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--tx3)' }}>总题数</div>
              <div className="text-2xl font-light" style={{ color: 'var(--tx)', lineHeight: 1 }}>
                {todayStats?.totalQuestions || 0}<span className="text-xs ml-1" style={{ color: 'var(--tx3)' }}>题</span>
              </div>
            </div>
          </div>
          
          {/* 文章列表 */}
          <div className="flex flex-col gap-2">
            {loading ? (
              <div className="text-center py-12" style={{ color: 'var(--tx2)' }}>加载中...</div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12 rounded-xl border" style={{ borderColor: 'var(--bd)', background: 'var(--bg)' }}>
                <div className="text-4xl mb-3">📚</div>
                <div className="text-sm mb-2" style={{ color: 'var(--tx)' }}>暂无{getTypeLabel(activeType)}题目</div>
                <div className="text-xs" style={{ color: 'var(--tx3)' }}>请先导入真题数据</div>
              </div>
            ) : (
              articles.map((article, index) => {
                const status = getArticleStatus(article)
                
                // 根据题型跳转到不同的练习页面
                const getPracticeUrl = () => {
                  switch (article.questionType) {
                    case 'sevenFive':
                      return `/practice/seven-five/${article.id}`
                    case 'cloze':
                      return `/practice/cloze/${article.id}`
                    case 'translation':
                      return `/practice/translation/${article.id}`
                    case 'writing':
                      return `/practice/writing/${article.id}`
                    default:
                      return `/practice/${article.id}`
                  }
                }
                
                return (
                  <Link key={article.id} href={getPracticeUrl()}>
                    <div 
                      className="rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md"
                      style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}
                    >
                      <div 
                        className="text-xs font-medium px-3 py-1 rounded-lg flex-shrink-0"
                        style={{ 
                          background: status.done ? 'var(--m1)' : 'var(--m)',
                          color: status.done ? 'var(--m)' : 'white'
                        }}
                      >
                        {article.year || '真题'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--tx)' }}>
                          {article.title}
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--tx3)' }}>
                          {article._count.questions} 题 · {article.category || '综合'} · {'★'.repeat(article.difficulty)}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium" style={{ color: status.done ? 'var(--m)' : 'var(--tx2)' }}>
                          {status.done ? status.score : '待开始'}
                        </div>
                        <div className="text-[10px]" style={{ color: 'var(--tx3)' }}>
                          {status.done ? '已完成' : '点击开始'}
                        </div>
                      </div>
                      <div className="text-lg" style={{ color: 'var(--tx3)' }}>›</div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </main>
      
      {/* 全局CSS变量 */}
      <style jsx global>{`
        :root {
          --m: #18a06a;
          --m1: #e6f8f0;
          --m2: #b2e8d2;
          --m3: #6dcba8;
          --cat: #f5a623;
          --cat1: #fff8ec;
          --pu: #8b6fd4;
          --pu1: #f0ecfc;
          --tx: #1a2e24;
          --tx2: #6b8a7a;
          --tx3: #a8c0b4;
          --bg: #ffffff;
          --bg2: #f6faf8;
          --bd: #e8f2ed;
        }
      `}</style>
    </div>
  )
}
