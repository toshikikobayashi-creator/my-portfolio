import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// 代表者情報が載りやすいサブページのパス候補
const SUB_PAGES = ['/company', '/about', '/about-us', '/profile', '/company/about', '/corporate', '/staff', '/greeting']

// HTMLタグを除去
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// 代表者関連キーワード周辺のテキストだけ抽出（精度向上）
function extractRepresentativeContext(text: string): string {
  const keywords = ['代表取締役', '代表者', '社長', 'オーナー', '店長', '代表', '経営者', 'CEO', '取締役', '挨拶', 'ご挨拶']
  const results: string[] = []

  for (const kw of keywords) {
    let idx = 0
    while ((idx = text.indexOf(kw, idx)) !== -1) {
      // キーワード前後200文字を抽出
      const start = Math.max(0, idx - 100)
      const end = Math.min(text.length, idx + 200)
      results.push(text.slice(start, end))
      idx += kw.length
    }
  }

  // キーワードが見つからない場合は先頭3000文字
  return results.length > 0 ? results.slice(0, 10).join(' ... ') : text.slice(0, 3000)
}

// URLをフェッチしてテキストを返す
async function fetchPageText(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en;q=0.9',
      },
    })
    clearTimeout(timeout)
    if (!res.ok) return ''
    const html = await res.text()
    return stripHtml(html)
  } catch {
    clearTimeout(timeout)
    return ''
  }
}

export async function POST(req: NextRequest) {
  let body: { company_name: string; website_url?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'リクエストが不正です' }, { status: 400 })
  }

  const { company_name, website_url } = body
  if (!company_name) {
    return NextResponse.json({ error: '会社名が必要です' }, { status: 400 })
  }

  let contextText = ''

  if (website_url) {
    // ベースURLを取得
    let baseUrl = ''
    try {
      const u = new URL(website_url)
      baseUrl = `${u.protocol}//${u.host}`
    } catch {
      baseUrl = ''
    }

    // Step1: トップページをフェッチ
    const topText = await fetchPageText(website_url)
    if (topText) {
      contextText += extractRepresentativeContext(topText)
    }

    // Step2: 代表者関連キーワードが少ない場合はサブページも試す
    const REP_KEYWORDS = ['代表取締役', '代表者', '社長', 'オーナー', '店長', 'CEO']
    const hasRepInfo = REP_KEYWORDS.some(kw => contextText.includes(kw))

    if (!hasRepInfo && baseUrl) {
      for (const path of SUB_PAGES) {
        const subText = await fetchPageText(baseUrl + path)
        if (subText) {
          const extracted = extractRepresentativeContext(subText)
          if (REP_KEYWORDS.some(kw => extracted.includes(kw))) {
            contextText += ' ' + extracted
            break // 見つかったら終了
          }
        }
      }
    }
  }

  // Claudeで代表者名を抽出
  const prompt = contextText.trim()
    ? `「${company_name}」のウェブサイトから抽出したテキストです。
代表者・社長・オーナー・店長の【氏名のみ】を答えてください。

抽出テキスト:
${contextText.slice(0, 6000)}

---
回答ルール:
- 氏名だけを返す（例: 田中 太郎）
- 役職名は含めない
- 複数いる場合は代表取締役・社長を優先
- 見つからない場合のみ「不明」と返す
- 説明不要、名前だけ`
    : `「${company_name}」の代表者名はWebサイトが取得できなかったため不明です。「不明」と返してください。`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [{ role: 'user', content: prompt }],
    })

    const name = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : '不明'

    return NextResponse.json({
      name,
      found: name !== '不明',
      source: contextText ? 'website' : 'unknown',
    })
  } catch (err: unknown) {
    const error = err as { message?: string }
    return NextResponse.json(
      { error: `AI解析エラー: ${error?.message ?? '不明'}` },
      { status: 500 }
    )
  }
}
