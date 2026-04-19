import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/db'

// 腾讯翻译API配置 - 从环境变量读取
const SECRET_ID = process.env.TENCENT_SECRET_ID
const SECRET_KEY = process.env.TENCENT_SECRET_KEY
const REGION = 'ap-beijing'
const SERVICE = 'tmt'
const HOST = 'tmt.tencentcloudapi.com'
const ACTION = 'TextTranslate'
const VERSION = '2018-03-21'

// 检查密钥是否存在
if (!SECRET_ID || !SECRET_KEY) {
  console.warn('警告: 腾讯翻译API密钥未配置，请设置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY 环境变量')
}

// 生成腾讯云API签名
function generateSignature(payload: string, timestamp: number): string {
  const date = new Date(timestamp * 1000).toISOString().split('T')[0]
  
  // 步骤1：拼接规范请求串
  const httpRequestMethod = 'POST'
  const canonicalUri = '/'
  const canonicalQueryString = ''
  const canonicalHeaders = `content-type:application/json\nhost:${HOST}\n`
  const signedHeaders = 'content-type;host'
  const hashedRequestPayload = crypto.createHash('sha256').update(payload).digest('hex')
  const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`
  
  // 步骤2：拼接待签名字符串
  const algorithm = 'TC3-HMAC-SHA256'
  const credentialScope = `${date}/${SERVICE}/tc3_request`
  const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`
  
  // 步骤3：计算签名
  const secretDate = crypto.createHmac('sha256', `TC3${SECRET_KEY}`).update(date).digest()
  const secretService = crypto.createHmac('sha256', secretDate).update(SERVICE).digest()
  const secretSigning = crypto.createHmac('sha256', secretService).update('tc3_request').digest()
  const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign).digest('hex')
  
  // 步骤4：拼接 Authorization
  const authorization = `${algorithm} Credential=${SECRET_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  
  return authorization
}

// 调用腾讯翻译API
async function translateWithTencent(text: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000)
  
  const body = {
    Source: 'auto',
    SourceText: text,
    Target: 'zh',
    ProjectId: 0,
  }
  
  const payload = JSON.stringify(body)
  const authorization = generateSignature(payload, timestamp)
  
  const response = await fetch(`https://${HOST}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': HOST,
      'X-TC-Action': ACTION,
      'X-TC-Version': VERSION,
      'X-TC-Region': REGION,
      'X-TC-Timestamp': timestamp.toString(),
      'Authorization': authorization,
    },
    body: payload,
  })
  
  const data = await response.json()
  
  if (data.Response?.Error) {
    throw new Error(data.Response.Error.Message)
  }
  
  return data.Response?.TargetText || ''
}

// 按句子分割文章
function splitIntoSentences(text: string): string[] {
  // 按句号、问号、感叹号分割，保留标点
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim())
  return sentences
}

// POST /api/translate - 翻译文章（逐句对照）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articleId, content } = body
    
    // 检查是否已有翻译
    if (articleId) {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: { translation: true },
      })
      
      if (article?.translation) {
        // 尝试解析为JSON格式
        try {
          const parsed = JSON.parse(article.translation)
          if (Array.isArray(parsed)) {
            return NextResponse.json({ sentences: parsed })
          }
        } catch {
          // 旧格式，返回原始文本
        }
      }
    }
    
    // 分割句子
    const englishSentences = splitIntoSentences(content)
    
    // 使用腾讯翻译API翻译每个句子
    const translationSentences = []
    
    for (const sentence of englishSentences) {
      try {
        const chinese = await translateWithTencent(sentence)
        translationSentences.push({
          english: sentence,
          chinese: chinese,
        })
        
        // 避免请求过快，添加延迟
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error('Translation error for sentence:', sentence, error)
        translationSentences.push({
          english: sentence,
          chinese: '[翻译失败]',
        })
      }
    }
    
    // 保存翻译到数据库
    if (articleId && translationSentences.length > 0) {
      await prisma.article.update({
        where: { id: articleId },
        data: { translation: JSON.stringify(translationSentences) },
      })
    }
    
    return NextResponse.json({ sentences: translationSentences })
  } catch (error) {
    console.error('Translate error:', error)
    return NextResponse.json(
      { error: '翻译失败', sentences: [] },
      { status: 500 }
    )
  }
}
