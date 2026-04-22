// 文件解析服务 - 支持 PDF、Word、TXT

import mammoth from 'mammoth'

// 解析结果
export interface FileParseResult {
  success: boolean
  content: string
  error?: string
  metadata?: {
    pages?: number
    wordCount?: number
    format?: string
  }
}

// 解析 TXT 文件
export async function parseTXT(buffer: Buffer): Promise<FileParseResult> {
  try {
    const content = buffer.toString('utf-8')
    return {
      success: true,
      content,
      metadata: {
        wordCount: content.split(/\s+/).filter(Boolean).length,
        format: 'txt',
      },
    }
  } catch (error) {
    return {
      success: false,
      content: '',
      error: 'TXT文件解析失败',
    }
  }
}

// 解析 Word 文件
export async function parseWord(buffer: Buffer): Promise<FileParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    const content = result.value
    
    return {
      success: true,
      content,
      metadata: {
        wordCount: content.split(/\s+/).filter(Boolean).length,
        format: 'docx',
      },
    }
  } catch (error) {
    console.error('Word parse error:', error)
    return {
      success: false,
      content: '',
      error: 'Word文件解析失败，请确保文件格式正确',
    }
  }
}

// 解析 PDF 文件 - 使用动态导入避免构建问题
export async function parsePDF(buffer: Buffer): Promise<FileParseResult> {
  try {
    // 动态导入 pdf-parse (CommonJS 模块)
    // @ts-ignore
    const pdfParse = await import('pdf-parse').then(m => m.default || m)
    
    const data = await pdfParse(buffer, {
      max: 0, // 不限制页数
    })
    
    const content = data.text
    
    return {
      success: true,
      content,
      metadata: {
        pages: data.numpages,
        wordCount: content.split(/\s+/).filter(Boolean).length,
        format: 'pdf',
      },
    }
  } catch (error) {
    console.error('PDF parse error:', error)
    return {
      success: false,
      content: '',
      error: 'PDF文件解析失败，如果是扫描件请尝试使用OCR服务',
    }
  }
}

// 使用百度文档解析API（更强大的解析能力）
export async function parseWithBaiduAPI(fileBuffer: Buffer, filename: string): Promise<FileParseResult> {
  try {
    // 百度文档解析API
    const apiUrl = 'https://aip.baidubce.com/rest/2.0/document/v1/convert'
    
    // 获取access token（需要配置百度云API）
    const apiKey = process.env.BAIDU_API_KEY
    const secretKey = process.env.BAIDU_SECRET_KEY
    
    if (!apiKey || !secretKey) {
      // 如果没有配置百度API，回退到本地解析
      return {
        success: false,
        content: '',
        error: '百度API未配置，使用本地解析',
      }
    }
    
    // 获取access token
    const tokenResponse = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`
    )
    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    
    if (!accessToken) {
      throw new Error('获取百度API token失败')
    }
    
    // 上传文件解析
    const formData = new FormData()
    formData.append('file', new Blob([new Uint8Array(fileBuffer)]), filename)
    
    const parseResponse = await fetch(`${apiUrl}?access_token=${accessToken}`, {
      method: 'POST',
      body: formData,
    })
    
    const parseData = await parseResponse.json()
    
    if (parseData.error_code) {
      throw new Error(parseData.error_msg || '百度API解析失败')
    }
    
    return {
      success: true,
      content: parseData.content || parseData.text || '',
      metadata: {
        format: 'pdf',
      },
    }
  } catch (error) {
    console.error('Baidu API parse error:', error)
    return {
      success: false,
      content: '',
      error: '百度API解析失败，尝试本地解析',
    }
  }
}

// 统一解析入口
export async function parseFile(buffer: Buffer, filename: string): Promise<FileParseResult> {
  const ext = filename.toLowerCase().split('.').pop()
  
  switch (ext) {
    case 'txt':
      return parseTXT(buffer)
    
    case 'doc':
    case 'docx':
      return parseWord(buffer)
    
    case 'pdf':
      // 先尝试百度API（更强大），失败则回退到本地解析
      const baiduResult = await parseWithBaiduAPI(buffer, filename)
      if (baiduResult.success) {
        return baiduResult
      }
      // 回退到本地解析
      return parsePDF(buffer)
    
    default:
      return {
        success: false,
        content: '',
        error: `不支持的文件格式: .${ext}`,
      }
  }
}
