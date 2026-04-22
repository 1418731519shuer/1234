'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Brain, 
  MessageSquare,
  BookOpen,
  Calendar,
  Trash2,
  Search,
  Sparkles,
  Tag,
  Clock,
  TrendingUp
} from 'lucide-react'
import { AIChatStorage, type LocalAIChat } from '@/lib/localStorage'

export default function KnowledgePage() {
  const router = useRouter()
  const [items, setItems] = useState<LocalAIChat[]>([])
  const [filteredItems, setFilteredItems] = useState<LocalAIChat[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<LocalAIChat | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    // 从 localStorage 读取AI对话
    const chats = AIChatStorage.getAll()
    setItems(chats)
    setFilteredItems(chats)
    setCategories(AIChatStorage.getCategories())
    setLoading(false)
  }, [])

  useEffect(() => {
    let filtered = items
    
    // 搜索过滤
    if (searchQuery.trim()) {
      filtered = AIChatStorage.search(searchQuery)
    }
    
    // 分类过滤
    if (selectedCategory) {
      filtered = filtered.filter(c => c.category === selectedCategory)
    }
    
    setFilteredItems(filtered)
  }, [searchQuery, selectedCategory, items])

  const handleDelete = (id: string) => {
    AIChatStorage.remove(id)
    setItems(prev => prev.filter(item => item.id !== id))
    if (selectedItem?.id === id) {
      setSelectedItem(null)
    }
  }

  const handleSelectItem = (item: LocalAIChat) => {
    setSelectedItem(item)
  }

  // 提取关键词（简单实现）
  const extractKeywords = (text: string): string[] => {
    const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || []
    const stopWords = ['的', '是', '在', '了', '和', '与', '或', '这', '那', '有', '为', '以', '及']
    return [...new Set(words.filter(w => w.length > 1 && !stopWords.includes(w)))].slice(0, 5)
  }

  // 统计信息
  const stats = {
    total: items.length,
    thisWeek: items.filter(i => {
      const date = new Date(i.createdAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return date > weekAgo
    }).length,
    categories: categories.length,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            知识库
          </h1>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* 左栏 - 问题列表 */}
        <div className="w-1/2 border-r bg-white flex flex-col">
          {/* 搜索栏 */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索问题..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* 分类标签 */}
            {categories.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge
                  variant={selectedCategory === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(null)}
                >
                  全部
                </Badge>
                {categories.map(cat => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 统计信息 */}
          <div className="px-4 py-2 bg-slate-50 border-b flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              共 {stats.total} 条
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              本周 {stats.thisWeek} 条
            </span>
          </div>

          {/* 问题列表 */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="text-center py-12 text-gray-500">加载中...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="mb-2">暂无问答记录</p>
                <p className="text-sm text-gray-400">在刷题时使用AI助教，问答会自动保存</p>
              </div>
            ) : (
              <div className="p-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                      selectedItem?.id === item.id 
                        ? 'bg-purple-50 border border-purple-200' 
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                    onClick={() => handleSelectItem(item)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-gray-800 line-clamp-2">
                        {item.userMessage}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(item.id)
                        }}
                        className="text-gray-400 hover:text-red-500 h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {item.category && (
                        <Badge variant="outline" className="text-xs py-0">
                          {item.category}
                        </Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* 右栏 - 问题分析 */}
        <div className="w-1/2 bg-slate-50 flex flex-col">
          {selectedItem ? (
            <>
              {/* 问题详情头部 */}
              <div className="p-4 bg-white border-b">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600">问题分析</span>
                </div>
                <h2 className="text-lg font-medium text-gray-800">
                  {selectedItem.userMessage}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  {selectedItem.category && (
                    <Badge variant="secondary">
                      <Tag className="w-3 h-3 mr-1" />
                      {selectedItem.category}
                    </Badge>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(selectedItem.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* AI回答 */}
              <ScrollArea className="flex-1 p-4">
                <Card className="border-0 shadow-none bg-white">
                  <CardContent className="p-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedItem.aiResponse}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 关键词标签 */}
                {selectedItem.keywords && selectedItem.keywords.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">关键词</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.keywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 自动提取的关键词 */}
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">相关词汇</p>
                  <div className="flex flex-wrap gap-2">
                    {extractKeywords(selectedItem.userMessage + ' ' + selectedItem.aiResponse).map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-xs cursor-pointer hover:bg-purple-100"
                        onClick={() => setSearchQuery(kw)}>
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Brain className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <p className="mb-2">选择一个问题查看分析</p>
                <p className="text-sm">点击左侧问题列表中的任意问题</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
