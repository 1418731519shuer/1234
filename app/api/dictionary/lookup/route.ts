import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import prisma from '@/lib/db'
import path from 'path'

// 本地词典数据库路径
const DICT_DB_PATH = path.join(process.cwd(), 'data', 'dictionary.db')

// 查询本地词典
function queryLocalDictionary(word: string): {
  word: string
  phonetic: string
  translation: string
  pos: string
  tag: string
  exchange: string
} | null {
  try {
    const db = new Database(DICT_DB_PATH, { readonly: true, fileMustExist: false })
    
    const stmt = db.prepare('SELECT word, phonetic, translation, pos, tag, exchange FROM dictionary WHERE word = ?')
    const result = stmt.get(word.toLowerCase()) as any
    
    db.close()
    return result || null
  } catch (error) {
    console.error('Query dictionary error:', error)
    return null
  }
}

// POST /api/dictionary/lookup - 查询单词
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word, articleId } = body
    
    if (!word) {
      return NextResponse.json({ error: '单词不能为空' }, { status: 400 })
    }
    
    const cleanWord = word.toLowerCase().replace(/[.,!?;:'"()]/g, '')
    
    // 查本地词典
    const dictResult = queryLocalDictionary(cleanWord)
    
    if (dictResult && dictResult.translation) {
      // 检查是否已缓存
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
      
      // 存入缓存
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

// GET /api/dictionary/lookup - 批量预加载
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const content = searchParams.get('content')
    
    console.log('GET request received, content length:', content?.length)
    
    if (!content) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }
    
    // 提取单词
    const wordMatches = content.match(/[a-zA-Z]+/g) || []
    const words = wordMatches.map(w => w.toLowerCase()).filter(w => w.length >= 3)
    const uniqueWords = [...new Set(words)]
    
    console.log('Unique words found:', uniqueWords.length)
    
    if (uniqueWords.length === 0) {
      return NextResponse.json({ words: {}, total: 0, found: 0 })
    }
    
    // 查询本地词典
    let db
    try {
      db = new Database(DICT_DB_PATH, { readonly: true })
    } catch (e) {
      console.error('Failed to open database:', e)
      return NextResponse.json({ error: '无法打开词典数据库' }, { status: 500 })
    }
    
    const placeholders = uniqueWords.map(() => '?').join(',')
    const sql = `SELECT word, phonetic, translation, pos, tag FROM dictionary WHERE word IN (${placeholders})`
    
    let dictResults: any[] = []
    try {
      const stmt = db.prepare(sql)
      dictResults = stmt.all(...uniqueWords)
    } catch (e) {
      console.error('Query error:', e)
    }
    
    db.close()
    
    console.log('Dict results:', dictResults.length)
    
    // 查询已收藏的词
    let favoriteWords = new Set<string>()
    try {
      const favorites = await prisma.vocabulary.findMany({
        where: { 
          word: { in: uniqueWords },
          isFavorite: true 
        },
      })
      favoriteWords = new Set(favorites.map(f => f.word))
    } catch (e) {
      console.error('Favorites query error:', e)
    }
    
    // 构建结果
    const results: Record<string, any> = {}
    
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
    return NextResponse.json({ error: '预加载失败: ' + (error as Error).message }, { status: 500 })
  }
}
