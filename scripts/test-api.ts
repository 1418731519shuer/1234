// 简单测试DeepSeek API
const API_KEY = 'sk-864e66eafdc648a6ba27607b1518f9bc'

async function testAPI() {
  console.log('Testing DeepSeek API...')
  
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Say hello in Chinese' }],
        max_tokens: 100,
      }),
    })
    
    console.log('Status:', response.status)
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error:', error)
  }
}

testAPI()
