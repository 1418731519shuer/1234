'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Home, 
  Search, 
  Star, 
  BookOpen, 
  Trash2, 
  Volume2,
  Clock,
  TrendingUp,
  X
} from 'lucide-react'

interface VocabularyItem {
  id: string
  word: string
  phonetic?: string
  pos?: string
  meaning: string
  isFavorite: boolean
  reviewCount: number
  lastReviewAt?: string
  createdAt: string
}

export default function VocabularyPage() {
  const [vocabularies, setVocabularies] = useState<VocabularyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  
  useEffect(() => {
    fetchVocabularies()
  }, [filter])
  
  const fetchVocabularies = async () => {
    try {
      const url = filter === 'favorites' 
        ? '/api/vocabulary?favorites=true'
        : '/api/vocabulary'
      const response = await fetch(url)
      const data = await response.json()
      setVocabularies(data.vocabularies || [])
    } catch (error) {
      console.error('Fetch vocabulary error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const toggleFavorite = async (word: string, currentStatus: boolean) => {
    try {
      await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, isFavorite: !currentStatus }),
      })
      
      // 重新获取数据以更新计数
      fetchVocabularies()
    } catch (error) {
      console.error('Toggle favorite error:', error)
    }
  }
  
  const deleteWord = async (id: string) => {
    try {
      await fetch(`/api/vocabulary?id=${id}`, { method: 'DELETE' })
      setVocabularies(prev => prev.filter(v => v.id !== id))
      setSelectedWord(null)
    } catch (error) {
      console.error('Delete vocabulary error:', error)
    }
  }
  
  // 批量删除
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredVocabularies.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredVocabularies.map(v => v.id)))
    }
  }
  
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }
  
  const deleteSelected = async () => {
    if (selectedIds.size === 0) return
    try {
      await fetch('/api/vocabulary', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      setVocabularies(prev => prev.filter(v => !selectedIds.has(v.id)))
      setSelectedIds(new Set())
      setIsDeleteMode(false)
    } catch (error) {
      console.error('Batch delete error:', error)
    }
  }
  
  const deleteAll = async () => {
    if (!confirm('确定要删除全部词汇吗？此操作不可恢复。')) return
    try {
      const allIds = vocabularies.map(v => v.id)
      await fetch('/api/vocabulary', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: allIds }),
      })
      setVocabularies([])
      setSelectedIds(new Set())
      setIsDeleteMode(false)
    } catch (error) {
      console.error('Delete all error:', error)
    }
  }
  
  // 过滤搜索结果
  const filteredVocabularies = vocabularies.filter(v => 
    v.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // 统计
  const totalCount = vocabularies.length
  const favoriteCount = vocabularies.filter(v => v.isFavorite).length
  const reviewedCount = vocabularies.filter(v => v.reviewCount > 0).length
  
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* 左侧边栏 */}
      <aside className="w-[200px] border-r flex flex-col shrink-0" style={{ borderColor: 'var(--bd)', background: 'var(--bg)' }}>
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--bd)' }}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--m)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 2.5c.8 0 1.5.7 1.5 1.5S8.8 7.5 8 7.5 6.5 6.8 6.5 6 7.2 4.5 8 4.5zm0 7.5c-1.5 0-2.8-.8-3.6-2 .02-1.2 2.4-1.85 3.6-1.85 1.19 0 3.58.65 3.6 1.85-.8 1.2-2.1 2-3.6 2z" fill="white"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--tx)' }}>备考英语</div>
              <div className="text-[10px]" style={{ color: 'var(--tx2)' }}>KaoYan English</div>
            </div>
          </Link>
        </div>
        
        <div className="flex-1 py-3">
          <div className="text-[10px] px-5 pb-2 uppercase tracking-wider" style={{ color: 'var(--tx3)' }}>词汇管理</div>
          
          <div 
            className="flex items-center gap-3 px-5 py-2.5 text-sm cursor-pointer"
            style={{ 
              color: filter === 'all' ? 'var(--m)' : 'var(--tx2)', 
              background: filter === 'all' ? 'var(--m1)' : 'transparent'
            }}
            onClick={() => setFilter('all')}
          >
            <BookOpen className="w-4 h-4" />
            <span>全部词汇</span>
            <span className="ml-auto text-xs" style={{ color: 'var(--tx3)' }}>{totalCount}</span>
          </div>
          
          <div 
            className="flex items-center gap-3 px-5 py-2.5 text-sm cursor-pointer"
            style={{ 
              color: filter === 'favorites' ? 'var(--m)' : 'var(--tx2)', 
              background: filter === 'favorites' ? 'var(--m1)' : 'transparent'
            }}
            onClick={() => setFilter('favorites')}
          >
            <Star className="w-4 h-4" />
            <span>收藏词汇</span>
            <span className="ml-auto text-xs" style={{ color: 'var(--tx3)' }}>{favoriteCount}</span>
          </div>
        </div>
        
        <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--bd)' }}>
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>
        </div>
      </aside>
      
      {/* 主内容区 */}
      <main className="flex-1 flex flex-col" style={{ background: 'var(--bg2)' }}>
        {/* 顶部搜索栏 */}
        <div className="px-6 py-4 border-b" style={{ background: 'var(--bg)', borderColor: 'var(--bd)' }}>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--tx3)' }} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索单词或释义..."
                className="pl-10"
              />
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              {isDeleteMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setIsDeleteMode(false); setSelectedIds(new Set()) }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    取消
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    disabled={filteredVocabularies.length === 0}
                  >
                    {selectedIds.size === filteredVocabularies.length ? '取消全选' : '全选'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteSelected}
                    disabled={selectedIds.size === 0}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    删除 ({selectedIds.size})
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteAll}
                    disabled={vocabularies.length === 0}
                  >
                    全部删除
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteMode(true)}
                  disabled={vocabularies.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  批量删除
                </Button>
              )}
            </div>
            
            {/* 统计卡片 */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="text-center">
                <div className="text-2xl font-light" style={{ color: 'var(--m)' }}>{totalCount}</div>
                <div className="text-[10px]" style={{ color: 'var(--tx3)' }}>总词汇</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light" style={{ color: '#f59e0b' }}>{favoriteCount}</div>
                <div className="text-[10px]" style={{ color: 'var(--tx3)' }}>已收藏</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light" style={{ color: '#3b82f6' }}>{reviewedCount}</div>
                <div className="text-[10px]" style={{ color: 'var(--tx3)' }}>已复习</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 词汇列表 */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-12" style={{ color: 'var(--tx2)' }}>加载中...</div>
          ) : filteredVocabularies.length === 0 ? (
            <div className="text-center py-12 rounded-xl border" style={{ borderColor: 'var(--bd)', background: 'var(--bg)' }}>
              <div className="text-4xl mb-3">📚</div>
              <div className="text-sm mb-2" style={{ color: 'var(--tx)' }}>
                {searchQuery ? '未找到匹配的词汇' : '暂无词汇'}
              </div>
              <div className="text-xs" style={{ color: 'var(--tx3)' }}>
                在阅读文章时双击单词可添加到生词本
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredVocabularies.map((vocab) => (
                <div
                  key={vocab.id}
                  className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-md border relative"
                  style={{ 
                    background: selectedIds.has(vocab.id) ? 'var(--m1)' : 'var(--bg)', 
                    borderColor: selectedIds.has(vocab.id) ? 'var(--m)' : 'var(--bd)' 
                  }}
                  onClick={() => {
                    if (isDeleteMode) {
                      toggleSelect(vocab.id)
                    } else {
                      setSelectedWord(vocab)
                    }
                  }}
                >
                  {isDeleteMode && (
                    <div className="absolute top-3 right-3">
                      <Checkbox 
                        checked={selectedIds.has(vocab.id)}
                        onCheckedChange={() => toggleSelect(vocab.id)}
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-bold text-lg" style={{ color: 'var(--tx)' }}>{vocab.word}</span>
                      {vocab.phonetic && (
                        <span className="ml-2 text-sm" style={{ color: 'var(--tx3)' }}>/{vocab.phonetic}/</span>
                      )}
                    </div>
                    {!isDeleteMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(vocab.word, vocab.isFavorite)
                        }}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <Star 
                          className="w-5 h-5" 
                          style={{ color: vocab.isFavorite ? '#f59e0b' : 'var(--tx3)' }}
                          fill={vocab.isFavorite ? '#f59e0b' : 'none'}
                        />
                      </button>
                    )}
                  </div>
                  
                  {vocab.pos && (
                    <Badge variant="outline" className="text-xs mb-2">
                      {vocab.pos}
                    </Badge>
                  )}
                  
                  <div className="text-sm line-clamp-2" style={{ color: 'var(--tx2)' }}>
                    {vocab.meaning.split('\\n')[0]}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--tx3)' }}>
                    {vocab.reviewCount > 0 && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        复习 {vocab.reviewCount} 次
                      </span>
                    )}
                    {vocab.lastReviewAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(vocab.lastReviewAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* 右侧详情面板 */}
      {selectedWord && (
        <aside 
          className="w-[300px] border-l flex flex-col shrink-0"
          style={{ borderColor: 'var(--bd)', background: 'var(--bg)' }}
        >
          <div className="p-4 border-b" style={{ borderColor: 'var(--bd)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold" style={{ color: 'var(--tx)' }}>词汇详情</h2>
              <button
                onClick={() => setSelectedWord(null)}
                className="text-sm"
                style={{ color: 'var(--tx3)' }}
              >
                关闭
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--tx)' }}>
                {selectedWord.word}
              </div>
              {selectedWord.phonetic && (
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--tx3)' }}>/{selectedWord.phonetic}/</span>
                  <button className="p-1 rounded hover:bg-gray-100">
                    <Volume2 className="w-4 h-4" style={{ color: 'var(--m)' }} />
                  </button>
                </div>
              )}
            </div>
            
            {selectedWord.pos && (
              <Badge variant="outline" className="mb-3">
                {selectedWord.pos}
              </Badge>
            )}
            
            <div className="mb-4">
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--tx3)' }}>释义</div>
              <div className="text-sm leading-relaxed" style={{ color: 'var(--tx)' }}>
                {selectedWord.meaning.split('\\n').map((line, i) => (
                  <div key={i} className="mb-1">{line}</div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2 text-xs" style={{ color: 'var(--tx3)' }}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                添加时间: {new Date(selectedWord.createdAt).toLocaleDateString()}
              </div>
              {selectedWord.reviewCount > 0 && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  复习次数: {selectedWord.reviewCount}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 border-t space-y-2" style={{ borderColor: 'var(--bd)' }}>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toggleFavorite(selectedWord.word, selectedWord.isFavorite)}
            >
              <Star className="w-4 h-4 mr-2" fill={selectedWord.isFavorite ? '#f59e0b' : 'none'} style={{ color: selectedWord.isFavorite ? '#f59e0b' : 'currentColor' }} />
              {selectedWord.isFavorite ? '取消收藏' : '收藏'}
            </Button>
            
            <Button
              variant="outline"
              className="w-full text-red-500 border-red-200 hover:bg-red-50"
              onClick={() => deleteWord(selectedWord.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </Button>
          </div>
        </aside>
      )}
      
      {/* 全局CSS变量 */}
      <style jsx global>{`
        :root {
          --m: #18a06a;
          --m1: #e6f8f0;
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
