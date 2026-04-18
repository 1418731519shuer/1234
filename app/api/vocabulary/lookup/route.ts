import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import crypto from 'crypto'

const TENCENT_SECRET_ID = process.env.TENCENT_SECRET_ID || ''
const TENCENT_SECRET_KEY = process.env.TENCENT_SECRET_KEY || ''

// 腾讯翻译API签名
function generateSignature(params: Record<string, string>, secretKey: string): string {
  const sortedKeys = Object.keys(params).sort()
  const signStr = sortedKeys.map(key => `${key}=${encodeURIComponent(params[key])}`).join('&')
  return crypto.createHmac('sha1', secretKey).update(signStr).digest('base64')
}

// 调用腾讯翻译API
async function translateWithTencent(word: string): Promise<string> {
  const endpoint = 'tmt.tencentcloudapi.com'
  const action = 'TextTranslate'
  const version = '2018-03-21'
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = Math.random().toString(36).substring(2)
  
  const params: Record<string, string> = {
    Action: action,
    Version: version,
    Region: 'ap-beijing',
    Timestamp: timestamp,
    Nonce: nonce,
    SecretId: TENCENT_SECRET_ID,
    Source: 'en',
    Target: 'zh',
    SourceText: word,
    ProjectId: '0',
  }
  
  const signature = generateSignature(params, TENCENT_SECRET_KEY)
  
  const url = `https://${endpoint}?${Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}&Signature=${encodeURIComponent(signature)}`
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.Response && data.Response.TargetText) {
      return data.Response.TargetText
    }
    return '未找到释义'
  } catch (error) {
    console.error('Tencent translate error:', error)
    return '查询失败'
  }
}

// POST /api/vocabulary/lookup - 查询单词释义（优先从缓存读取）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word, articleId } = body
    
    if (!word) {
      return NextResponse.json({ error: '单词不能为空' }, { status: 400 })
    }
    
    // 清理单词
    const cleanWord = word.toLowerCase().replace(/[.,!?;:'"()]/g, '')
    
    // 1. 先查缓存
    const cached = await prisma.vocabulary.findUnique({
      where: { word: cleanWord },
    })
    
    if (cached) {
      return NextResponse.json({ 
        meaning: cached.meaning, 
        fromCache: true,
        vocabularyId: cached.id 
      })
    }
    
    // 2. 缓存没有，调用腾讯翻译API
    const meaning = await translateWithTencent(cleanWord)
    
    // 3. 存入缓存
    const vocabulary = await prisma.vocabulary.create({
      data: {
        word: cleanWord,
        meaning: meaning,
        articleId: articleId,
        category: 'word',
      },
    })
    
    return NextResponse.json({ 
      meaning, 
      fromCache: false,
      vocabularyId: vocabulary.id 
    })
  } catch (error) {
    console.error('Lookup word error:', error)
    return NextResponse.json({ meaning: '查询失败' })
  }
}

// GET /api/vocabulary/lookup - 批量预加载文章生词
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')
    const content = searchParams.get('content')
    
    if (!content) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }
    
    // 提取所有英文单词
    const words = content
      .match(/[a-zA-Z]+/g) || []
      .map(w => w.toLowerCase())
      .filter(w => w.length >= 3) // 过滤太短的词
    const uniqueWords = [...new Set(words)]
    
    // 查询已缓存的词
    const cached = await prisma.vocabulary.findMany({
      where: { word: { in: uniqueWords } },
    })
    const cachedWords = new Set(cached.map(c => c.word))
    
    // 找出未缓存的词（限制数量，避免一次性请求太多）
    const uncachedWords = uniqueWords.filter(w => !cachedWords.has(w)).slice(0, 50)
    
    // 批量查询未缓存的词
    const results: Record<string, string> = {}
    
    // 腾讯API支持批量翻译，用逗号分隔
    if (uncachedWords.length > 0) {
      const batchText = uncachedWords.join('\n')
      const endpoint = 'tmt.tencentcloudapi.com'
      const action = 'TextTranslateBatch'
      const version = '2018-03-21'
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const nonce = Math.random().toString(36).substring(2)
      
      const params: Record<string, string> = {
        Action: action,
        Version: version,
        Region: 'ap-beijing',
        Timestamp: timestamp,
        Nonce: nonce,
        SecretId: TENCENT_SECRET_ID,
        Source: 'en',
        Target: 'zh',
        SourceTextList: JSON.stringify(uncachedWords),
        ProjectId: '0',
      }
      
      const signature = generateSignature(params, TENCENT_SECRET_KEY)
      const url = `https://${endpoint}?${Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}&Signature=${encodeURIComponent(signature)}`
      
      try {
        const response = await fetch(url)
        const data = await response.json()
        
        if (data.Response && data.Response.TargetTextList) {
          // 保存到数据库
          for (let i = 0; i < uncachedWords.length; i++) {
            const word = uncachedWords[i]
            const meaning = data.Response.TargetTextList[i] || ''
            
            if (meaning) {
              try {
                await prisma.vocabulary.create({
                  data: {
                    word,
                    meaning,
                    articleId: articleId || undefined,
                    category: 'word',
                  },
                })
              } catch {
                // 可能已存在，忽略
              }
              results[word] = meaning
            }
          }
        }
      } catch (error) {
        console.error('Batch translate error:', error)
      }
    }
    
    // 返回所有单词的释义
    const allWords: Record<string, { meaning: string; cached: boolean }> = {}
    
    for (const c of cached) {
      allWords[c.word] = { meaning: c.meaning, cached: true }
    }
    
    for (const [word, meaning] of Object.entries(results)) {
      allWords[word] = { meaning, cached: false }
    }
    
    return NextResponse.json({ 
      words: allWords,
      total: uniqueWords.length,
      cached: cached.length,
      newlyLoaded: Object.keys(results).length
    })
  } catch (error) {
    console.error('Preload words error:', error)
    return NextResponse.json({ error: '预加载失败' }, { status: 500 })
  }
}
