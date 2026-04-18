'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ArrowLeft, 
  Brain, 
  MessageSquare,
  BookOpen,
  Calendar,
  Trash2
} from 'lucide-react'

interface KnowledgeItem {
  id: string
  title: string
  content: string
  category: string | null
  createdAt: string
}

export default function KnowledgePage() {
  const router = useRouter()
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchKnowledge = async () => {
      try {
        const response = await fetch('/api/knowledge')
        const data = await response.json()
        setItems(data.items || [])
      } catch (error) {
        console.error('Fetch knowledge error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchKnowledge()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
      setItems(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            知识库
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">暂无问答记录</p>
            <p className="text-sm text-gray-400">在刷题时使用AI助教，问答会自动保存到这里</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      {item.title || '问答记录'}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {item.category && (
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-48">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
