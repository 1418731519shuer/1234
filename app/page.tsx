'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PracticeStorage, type LocalPracticeRecord } from '@/lib/localStorage'

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

const QUESTION_TYPES = [
  { key: 'reading', label: '阅读理解', icon: '📖' },
  { key: 'cloze', label: '完型填空', icon: '📝' },
  { key: 'sevenFive', label: '七选五', icon: '🔗' },
  { key: 'translation', label: '翻译', icon: '🌐' },
  { key: 'writing', label: '写作', icon: '✍️' },
]

// 烟花粒子组件 - 简洁好看的爆炸效果
const Firework = ({ x, y }: { x: number; y: number }) => {
  // 黄色系颜色
  const colors = ['#ffd700', '#ffa500', '#ffec8b', '#ffc107', '#ffb347', '#ff8c00']
  
  // 简单的粒子爆炸
  const particles = Array.from({ length: 12 }, (_, i) => ({
    angle: (i * 30) * Math.PI / 180,
    color: colors[i % colors.length],
    distance: 35 + Math.random() * 20,
    size: 5 + Math.random() * 4
  }))

  return (
    <div 
      className="fixed pointer-events-none"
      style={{ left: x, top: y, zIndex: 9999 }}
    >
      {particles.map((p, i) => (
        <div
          key={i}
          className="firework-particle"
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            '--tx': `${Math.cos(p.angle) * p.distance}px`,
            '--ty': `${Math.sin(p.angle) * p.distance}px`
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// 鼠标样式选项
const MOUSE_STYLES = [
  { key: 'line', label: '蓝色线条', path: '/mouse/line.svg' },
  { key: 'tech', label: '科技感', path: '/mouse/tech.svg' },
  { key: 'geometric', label: '简约几何', path: '/mouse/geometric.svg' },
  { key: 'cute', label: '可爱水滴', path: '/mouse/cute.svg' },
]

export default function Home() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null)
  const [practiceRecords, setPracticeRecords] = useState<Record<string, LocalPracticeRecord>>({})
  const [loading, setLoading] = useState(true)
  const [examType, setExamType] = useState<'english1' | 'english2'>('english1')
  const [activeType, setActiveType] = useState<string>('reading')
  const [streak, setStreak] = useState(14)
  const [catCoins, setCatCoins] = useState(348)
  const [mounted, setMounted] = useState(false)
  const [fireworks, setFireworks] = useState<{ id: number; x: number; y: number }[]>([])
  const [mouseStyle, setMouseStyle] = useState('line')
  
  const examDate = new Date('2026-12-21')
  const today = new Date()
  const daysLeft = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  const getGreeting = () => {
    const hour = today.getHours()
    if (hour < 6) return '夜深了'
    if (hour < 9) return '早上好'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    if (hour < 22) return '晚上好'
    return '夜深了'
  }
  
  // 点击烟花特效 + 震动
  const handleClick = useCallback((e: React.MouseEvent) => {
    const x = e.clientX
    const y = e.clientY
    const id = Date.now()
    
    setFireworks(prev => [...prev, { id, x, y }])
    
    // 震动触感
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    // 移除烟花
    setTimeout(() => {
      setFireworks(prev => prev.filter(f => f.id !== id))
    }, 400)
  }, [])
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // 动态更新鼠标样式
  useEffect(() => {
    const style = MOUSE_STYLES.find(s => s.key === mouseStyle)
    if (style) {
      document.documentElement.style.setProperty('--mouse-cursor', `url('${style.path}') 0 0, auto`)
    }
  }, [mouseStyle])
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 只获取文章列表（题目数据存在数据库中）
        const articlesRes = await fetch(`/api/articles?questionType=${activeType}&examType=${examType}`)
        const articlesData = await articlesRes.json()
        setArticles(articlesData.articles || [])
        
        // 从 localStorage 读取今日统计
        const stats = PracticeStorage.getTodayStats()
        setTodayStats({
          articlesRead: stats.articlesRead,
          totalQuestions: stats.questionsAnswered,
          totalCorrect: stats.correctCount,
          totalTime: stats.totalTime,
        })
        
        // 从 localStorage 读取练习记录
        const records = PracticeStorage.getAll()
        const recordMap: Record<string, LocalPracticeRecord> = {}
        records.forEach(r => {
          recordMap[r.articleId] = r
        })
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
        score: `${record.totalCorrect} / ${record.totalQuestions}`,
        time: formatTime(record.duration)
      }
    }
    return { done: false, score: null, time: null }
  }

  const getTypeLabel = (type: string) => {
    return QUESTION_TYPES.find(t => t.key === type)?.label || type
  }

  return (
    <div className="min-h-screen flex relative" onClick={handleClick} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      {/* 烟花特效 */}
      {fireworks.map(f => (
        <Firework key={f.id} x={f.x} y={f.y} />
      ))}
      
      {/* 背景图片 - 全屏 */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('/bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* 左侧边栏 - 玻璃质感，精确六分之一宽度 */}
      <aside 
        className={`border-r flex flex-col shrink-0 relative z-20 transition-all duration-500 ${
          mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
        }`}
        style={{ 
          width: 'calc(100vw / 6)',
          minWidth: '200px',
          maxWidth: '300px',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          background: 'linear-gradient(-45deg, rgba(225, 235, 255, .6), rgba(225, 235, 255, .9), rgba(225, 235, 255, .9), rgba(225, 235, 255, .6))',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)'
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}>
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
          <div className="mt-4 flex rounded-lg p-1" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
            <button
              className="flex-1 py-1.5 text-xs rounded-md transition-all duration-300"
              style={{ 
                background: examType === 'english1' ? 'var(--m)' : 'transparent',
                color: examType === 'english1' ? 'white' : 'var(--tx2)',
                boxShadow: examType === 'english1' ? '0 2px 8px rgba(24, 160, 106, 0.3)' : 'none'
              }}
              onClick={() => setExamType('english1')}
            >
              英语一
            </button>
            <button
              className="flex-1 py-1.5 text-xs rounded-md transition-all duration-300"
              style={{ 
                background: examType === 'english2' ? 'var(--m)' : 'transparent',
                color: examType === 'english2' ? 'white' : 'var(--tx2)',
                boxShadow: examType === 'english2' ? '0 2px 8px rgba(24, 160, 106, 0.3)' : 'none'
              }}
              onClick={() => setExamType('english2')}
            >
              英语二
            </button>
          </div>
        </div>
        
        {/* 题型导航 */}
        <div className="flex-1 py-3 overflow-y-auto">
          <div className="text-[10px] px-5 pb-2 uppercase tracking-wider font-medium" style={{ color: 'var(--tx3)' }}>题型练习</div>
          {QUESTION_TYPES.map((type) => (
            <div 
              key={type.key}
              className="flex items-center gap-3 px-5 py-2.5 text-sm cursor-pointer transition-all duration-300 rounded-lg mx-2"
              style={{ 
                color: activeType === type.key ? 'var(--m)' : 'var(--tx2)', 
                background: activeType === type.key ? 'rgba(255, 255, 255, 0.6)' : 'transparent',
                transform: activeType === type.key ? 'translateX(4px)' : 'translateX(0)',
                fontWeight: activeType === type.key ? 500 : 400
              }}
              onClick={() => setActiveType(type.key)}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </div>
          ))}
          
          <div className="text-[10px] px-5 pt-4 pb-2 uppercase tracking-wider font-medium" style={{ color: 'var(--tx3)' }}>学习工具</div>
          <Link href="/wrong">
            <div className="flex items-center gap-3 px-5 py-2.5 text-sm cursor-pointer transition-all duration-300 hover:bg-white/40 rounded-lg mx-2" style={{ color: 'var(--tx2)' }}>
              <span>📕</span>
              <span>错题本</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255, 248, 236, 0.9)', color: 'var(--cat)' }}>12</span>
            </div>
          </Link>
          <Link href="/vocabulary">
            <div className="flex items-center gap-3 px-5 py-2.5 text-sm cursor-pointer transition-all duration-300 hover:bg-white/40 rounded-lg mx-2" style={{ color: 'var(--tx2)' }}>
              <span>📚</span>
              <span>词汇库</span>
            </div>
          </Link>
          <Link href="/knowledge">
            <div className="flex items-center gap-3 px-5 py-2.5 text-sm cursor-pointer transition-all duration-300 hover:bg-white/40 rounded-lg mx-2" style={{ color: 'var(--tx2)' }}>
              <span>💡</span>
              <span>知识库</span>
            </div>
          </Link>
          <Link href="/stats">
            <div className="flex items-center gap-3 px-5 py-2.5 text-sm cursor-pointer transition-all duration-300 hover:bg-white/40 rounded-lg mx-2" style={{ color: 'var(--tx2)' }}>
              <span>📊</span>
              <span>统计分析</span>
            </div>
          </Link>
        </div>
        
        {/* 底部 - 鼠标样式选择 + 连续学习 */}
        <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}>
          {/* 鼠标样式选择 */}
          <div className="text-[10px] mb-2 font-medium" style={{ color: 'var(--tx3)' }}>鼠标样式</div>
          <div className="grid grid-cols-4 gap-1 mb-3">
            {MOUSE_STYLES.map(style => (
              <button
                key={style.key}
                className="p-1.5 rounded-lg transition-all duration-200"
                style={{
                  background: mouseStyle === style.key ? 'rgba(24, 160, 106, 0.2)' : 'rgba(255, 255, 255, 0.4)',
                  border: mouseStyle === style.key ? '2px solid var(--m)' : '2px solid transparent'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setMouseStyle(style.key)
                }}
                title={style.label}
              >
                <img src={style.path} alt={style.label} className="w-5 h-5 mx-auto" />
              </button>
            ))}
          </div>
          
          {/* 连续学习 */}
          <div 
            className="rounded-xl p-3 flex items-center gap-3 transition-all duration-300 hover:shadow-lg"
            style={{ 
              background: 'linear-gradient(-45deg, rgba(225, 235, 255, .6), rgba(225, 235, 255, .9), rgba(225, 235, 255, .9), rgba(225, 235, 255, .6))',
              boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)'
            }}
          >
            <div className="text-2xl font-light" style={{ color: 'var(--m)', lineHeight: 1 }}>{streak}</div>
            <div className="text-[11px]" style={{ color: 'var(--m)', lineHeight: 1.4 }}>
              连续学习天数<br/>明天继续加油
            </div>
          </div>
        </div>
      </aside>
      
      {/* 主内容区 */}
      <main 
        className="flex-1 overflow-y-auto relative z-10"
        style={{ background: 'transparent' }}
      >
        {/* 顶部条 - 玻璃质感 */}
        <div 
          className={`px-6 py-4 flex items-center justify-between transition-all duration-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
          style={{ 
            background: 'linear-gradient(-45deg, rgba(225, 235, 255, .6), rgba(225, 235, 255, .9), rgba(225, 235, 255, .9), rgba(225, 235, 255, .6))',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          <div>
            <div className="text-lg font-medium" style={{ color: 'var(--tx)' }}>
              {getGreeting()}，<span style={{ color: 'var(--m)' }}>今天继续</span>
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--tx2)' }}>
              距考研 {daysLeft} 天 · 今日已完成 {todayStats?.articlesRead || 0} 篇
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 hover:shadow-md"
              style={{ 
                background: 'linear-gradient(-45deg, rgba(255, 248, 236, .6), rgba(255, 248, 236, .9), rgba(255, 248, 236, .9), rgba(255, 248, 236, .6))',
              }}
            >
              <span>🐱</span>
              <span className="text-sm font-medium" style={{ color: 'var(--cat)' }}>{catCoins}</span>
            </div>
            <div 
              className="text-right px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-lg"
              style={{ 
                background: 'linear-gradient(-45deg, rgba(225, 235, 255, .6), rgba(225, 235, 255, .9), rgba(225, 235, 255, .9), rgba(225, 235, 255, .6))',
                boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)'
              }}
            >
              <div className="text-2xl font-light" style={{ color: 'var(--m)', lineHeight: 1 }}>{daysLeft}</div>
              <div className="text-[10px]" style={{ color: 'var(--tx3)' }}>天后考研</div>
            </div>
          </div>
        </div>
        
        <div className="p-5">
          {/* 统计卡片 - 玻璃质感 */}
          <div 
            className={`grid grid-cols-4 gap-3 mb-5 transition-all duration-700 delay-100 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div 
              className="rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ 
                background: 'linear-gradient(-45deg, rgba(225, 235, 255, .6), rgba(225, 235, 255, .9), rgba(225, 235, 255, .9), rgba(225, 235, 255, .6))',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <div className="w-8 h-1 rounded-full mb-3" style={{ background: 'var(--m)' }} />
              <div className="text-[10px] uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--tx3)' }}>今日文章</div>
              <div className="text-2xl font-light" style={{ color: 'var(--tx)', lineHeight: 1 }}>
                {todayStats?.articlesRead || 0}<span className="text-xs ml-1" style={{ color: 'var(--tx3)' }}>篇</span>
              </div>
              <div className="text-[10px] mt-2" style={{ color: 'var(--m)' }}>还差 1 篇达成目标</div>
            </div>
            <div 
              className="rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ 
                background: 'linear-gradient(-45deg, rgba(255, 248, 236, .6), rgba(255, 248, 236, .9), rgba(255, 248, 236, .9), rgba(255, 248, 236, .6))',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(245, 166, 35, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <div className="w-8 h-1 rounded-full mb-3" style={{ background: 'var(--cat)' }} />
              <div className="text-[10px] uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--tx3)' }}>正确率</div>
              <div className="text-2xl font-light" style={{ color: 'var(--tx)', lineHeight: 1 }}>
                {accuracy}<span className="text-xs ml-1" style={{ color: 'var(--tx3)' }}>%</span>
              </div>
              <div className="text-[10px] mt-2" style={{ color: 'var(--cat)' }}>↑ 较昨日 +5%</div>
            </div>
            <div 
              className="rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ 
                background: 'linear-gradient(-45deg, rgba(240, 236, 252, .6), rgba(240, 236, 252, .9), rgba(240, 236, 252, .9), rgba(240, 236, 252, .6))',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(139, 111, 212, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <div className="w-8 h-1 rounded-full mb-3" style={{ background: 'var(--pu)' }} />
              <div className="text-[10px] uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--tx3)' }}>猫猫币</div>
              <div className="text-2xl font-light" style={{ color: 'var(--tx)', lineHeight: 1 }}>
                {catCoins}<span className="text-xs ml-1" style={{ color: 'var(--tx3)' }}>枚</span>
              </div>
              <div className="text-[10px] mt-2" style={{ color: 'var(--pu)' }}>今日获得 +25</div>
            </div>
            <div 
              className="rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ 
                background: 'linear-gradient(-45deg, rgba(224, 247, 250, .6), rgba(224, 247, 250, .9), rgba(224, 247, 250, .9), rgba(224, 247, 250, .6))',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(91, 200, 232, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <div className="w-8 h-1 rounded-full mb-3" style={{ background: '#5bc8e8' }} />
              <div className="text-[10px] uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--tx3)' }}>学习时长</div>
              <div className="text-2xl font-light" style={{ color: 'var(--tx)', lineHeight: 1 }}>
                {Math.floor((todayStats?.totalTime || 0) / 60)}<span className="text-xs ml-1" style={{ color: 'var(--tx3)' }}>分</span>
              </div>
              <div className="text-[10px] mt-2" style={{ color: '#5bc8e8' }}>专注度良好</div>
            </div>
          </div>
          
          {/* 文章列表 */}
          <div 
            className={`flex flex-col gap-2 transition-all duration-700 delay-200 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {loading ? (
              <div className="text-center py-12" style={{ color: 'var(--tx2)' }}>加载中...</div>
            ) : articles.length === 0 ? (
              <div 
                className="text-center py-12 rounded-xl transition-all duration-300"
                style={{ 
                  background: 'linear-gradient(-45deg, rgba(225, 235, 255, .6), rgba(225, 235, 255, .9), rgba(225, 235, 255, .9), rgba(225, 235, 255, .6))',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <div className="text-4xl mb-3">📚</div>
                <div className="text-sm mb-2 font-medium" style={{ color: 'var(--tx)' }}>暂无{getTypeLabel(activeType)}题目</div>
                <div className="text-xs" style={{ color: 'var(--tx3)' }}>请先导入真题数据</div>
              </div>
            ) : (
              articles.map((article) => {
                const status = getArticleStatus(article)
                
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
                      className="rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                      style={{ 
                        background: 'linear-gradient(-45deg, rgba(225, 235, 255, .6), rgba(225, 235, 255, .9), rgba(225, 235, 255, .9), rgba(225, 235, 255, .6))',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      <div 
                        className="text-xs font-medium px-3 py-1 rounded-lg flex-shrink-0 transition-all duration-300"
                        style={{ 
                          background: status.done ? 'rgba(230, 248, 240, 0.9)' : 'var(--m)',
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
                      <div className="text-lg transition-transform duration-300 group-hover:translate-x-1" style={{ color: 'var(--tx3)' }}>›</div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </main>
      
      {/* 全局CSS变量和自定义鼠标 */}
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
        
        /* 自定义鼠标指针 - 锚点在左上角 */
        * {
          cursor: var(--mouse-cursor, url('/mouse/line.svg') 0 0, auto) !important;
        }
        
        /* 悬停链接/按钮时的鼠标指针 */
        a:hover,
        button:hover,
        [role="button"]:hover {
          cursor: var(--mouse-cursor, url('/mouse/line.svg') 0 0, pointer) !important;
        }
        
        /* 悬停输入框时的鼠标指针 */
        input:hover,
        textarea:hover {
          cursor: var(--mouse-cursor, url('/mouse/line.svg') 0 0, text) !important;
        }
        
        /* 文本选择样式 */
        ::selection {
          background: rgba(24, 160, 106, 0.3);
          color: var(--tx);
        }
        
        /* 滚动条样式 */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(24, 160, 106, 0.3);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(24, 160, 106, 0.5);
        }
        
        /* 平滑滚动 */
        html {
          scroll-behavior: smooth;
        }
        
        /* 烟花粒子动画 - 快速炸开 */
        .firework-particle {
          animation: firework-explode 0.4s ease-out forwards;
        }
        
        @keyframes firework-explode {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(0.5);
          }
        }
      `}</style>
    </div>
  )
}
