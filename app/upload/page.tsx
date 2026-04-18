'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ArticleUpload from '@/components/practice/ArticleUpload'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  
  const handleSave = async (article: any) => {
    setSaving(true)
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article),
      })
      
      if (response.ok) {
        router.push('/')
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
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
          <h1 className="text-xl font-bold">上传文章</h1>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ArticleUpload onSave={handleSave} />
      </main>
    </div>
  )
}
