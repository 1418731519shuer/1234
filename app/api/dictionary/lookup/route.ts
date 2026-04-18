import { NextRequest, NextResponse } from 'next/server'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import prisma from '@/lib/db'

// 本地词典数据库路径
const DICT_DB_PATH = 'data/dictionary.db'

// 查询本地词典
async function queryLocalDictionary(word: string): Promise<{
  word: string
  phonetic: string
  translation: string
  pos: string
  tag: string
  exchange: string
} | null> {
  try {
    const db = await open({
      filename: DICT_DB_PATH,
      driver: sqlite3.Database
    })
    
    const result = await db.get(
      'SELECT word, phonetic, translation, pos, tag, exchange FROM dictionary WHERE word = ?',
      word.toLowerCase()
    )
    
    await db.close()
    return result || null
  } catch (error) {
    console.error('Query dictionary error:', error)
    return null
  }
}

// POST /api/dictionary/lookup - 查询单词（优先本地词典，然后缓存）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word, articleId } = body
    
    if (!word) {
      return NextResponse.json({ error: '单词不能为空' }, { status: 400 })
    }
    
    // 清理单词
    const cleanWord = word.toLowerCase().replace(/[.,!?;:'"()]/g, '')
    
    // 1. 先查本地词典
    const dictResult = await queryLocalDictionary(cleanWord)
    
    if (dictResult && dictResult.translation) {
      // 2. 检查是否已缓存到Vocabulary表
      const cached = await prisma.vocabulary.findUnique({
        where: { word: cleanWord },
      })
      
      if (cached) {
        return NextResponse.json({
          word: cleanWord,
          phonetic: dictResult.phonetic || '',
          meaning: dictResult.translation,
          pos: dictResult.pos || '',
          tag: dictResult.tag || '',
          exchange: dictResult.exchange || '',
          fromCache: true,
          isFavorite: cached.isFavorite,
        })
      }
      
      // 3. 存入缓存
      await prisma.vocabulary.create({
        data: {
          word: cleanWord,
          meaning: dictResult.translation,
          articleId: articleId,
          category: 'word',
        },
      })
      
      return NextResponse.json({
        word: cleanWord,
        phonetic: dictResult.phonetic || '',
        meaning: dictResult.translation,
        pos: dictResult.pos || '',
        tag: dictResult.tag || '',
        exchange: dictResult.exchange || '',
        fromLocalDict: true,
        isFavorite: false,
      })
    }
    
    // 本地词典没有找到
    return NextResponse.json({
      word: cleanWord,
      meaning: '未找到释义',
      notFound: true,
    })
  } catch (error) {
    console.error('Lookup word error:', error)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}

// GET /api/dictionary/lookup - 批量预加载文章生词
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
      .filter(w => w.length >= 3)
    const uniqueWords = [...new Set(words)]
    
    // 查询本地词典
    const db = await open({
      filename: DICT_DB_PATH,
      driver: sqlite3.Database
    })
    
    const placeholders = uniqueWords.map(() => '?').join(',')
    const dictResults = await db.all(
      `SELECT word, phonetic, translation, pos, tag FROM dictionary WHERE word IN (${placeholders})`,
      uniqueWords
    )
    
    await db.close()
    
    // 查询已收藏的词
    const favorites = await prisma.vocabulary.findMany({
      where: { 
        word: { in: uniqueWords },
        isFavorite: true 
      },
    })
    const favoriteWords = new Set(favorites.map(f => f.word))
    
    // 构建结果
    const results: Record<string, {
      phonetic: string
      meaning: string
      pos: string
      tag: string
      isFavorite: boolean
    }> = {}
    
    for (const item of dictResults) {
      if (item.translation) {
        results[item.word] = {
          phonetic: item.phonetic || '',
          meaning: item.translation,
          pos: item.pos || '',
          tag: item.tag || '',
          isFavorite: favoriteWords.has(item.word),
        }
      }
    }
    
    return NextResponse.json({
      words: results,
      total: uniqueWords.length,
      found: Object.keys(results).length,
    })
  } catch (error) {
    console.error('Preload words error:', error)
    return NextResponse.json({ error: '预加载失败' }, { status: 500 })
  }
}
