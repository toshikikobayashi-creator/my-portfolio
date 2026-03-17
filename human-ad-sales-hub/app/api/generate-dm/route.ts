import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// レート制限: IP単位で1分間に最大10回まで
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

// DM種別の説明
const DM_TYPE_LABELS: Record<string, string> = {
  A: 'ヒューマンアド提案（LEDバックパック広告）',
  B: 'アドトラック提案（LED搭載トラック広告）',
  C: 'セット提案（両サービス組み合わせ）',
  D: 'フォロー1回目（軽いリマインド）',
  E: 'フォロー2回目（価値提供型）',
  F: 'フォロー3回目（ラストチャンス型）',
}

export async function POST(req: NextRequest) {
  // IPベースのレート制限
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: '少し待ってから再度お試しください（1分間に10回まで）' },
      { status: 429 }
    )
  }

  let body: {
    company_name: string
    contact_name?: string
    category?: string[]
    area_prefecture?: string
    area_city?: string
    website_url?: string
    dm_type: string
    date1?: string
    date2?: string
    date3?: string
    extra_instructions?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'リクエストの形式が正しくありません' }, { status: 400 })
  }

  const {
    company_name, contact_name, category, area_prefecture, area_city,
    website_url, dm_type, date1, date2, date3, extra_instructions,
  } = body

  const systemPrompt = `あなたは株式会社HUMAN ADの営業担当です。
Facebook DMで企業にアプローチするためのメッセージを作成してください。

【HUMAN ADのサービス】
・ヒューマンアド: LEDバックパック（Jiatean JTA-WT32-BA）を背負ったウォーカーが街中を歩く移動型広告サービス。歩行者への直接的なアプローチが可能。
・アドトラック: 大型LEDビジョンを搭載したトラックによる走行広告サービス。動画・静止画で圧倒的なインパクトのあるPRが可能。走行ルート・スケジュールは柔軟にカスタマイズ可能。

【メッセージルール】
・200〜350文字で作成（この文字数を厳守すること）
・冒頭は「{担当者名}様」または「ご担当者様」で始める
・「突然のご連絡失礼いたします。株式会社HUMAN ADの小林と申します。」を必ず入れる
・相手の会社名と事業内容に必ず触れる
・料金は絶対に記載しない（「詳細は打ち合わせでご説明いたします」とする）
・候補日時を3つ入れる
・嘘や架空の実績は絶対に入れない
・丁寧だが堅すぎない、親しみやすいトーンで
・最後は「何卒よろしくお願いいたします。」で締める

【フォローの場合】
・フォロー1回目: 前回の連絡に軽く触れる。しつこくしない。
・フォロー2回目: 新しい情報や事例を提供する形で。
・フォロー3回目: 最後の連絡であることを伝え、今後も機会があればと締める。`

  const userMessage = `【送信先情報】
会社名: ${company_name}
担当者名: ${contact_name || '（未入力）'}
業種: ${category?.join(', ') || '（未入力）'}
エリア: ${area_prefecture || ''} ${area_city || ''}
Webサイト: ${website_url || '（未入力）'}

【DM種別】${DM_TYPE_LABELS[dm_type] ?? dm_type}
【候補日時】${date1 || '未入力'}, ${date2 || '未入力'}, ${date3 || '未入力'}
【追加指示】${extra_instructions || 'なし'}

上記情報を踏まえて、DMメッセージを1通作成してください。
【重要】文字数は必ず200文字以上350文字以内にすること。300文字前後を目標にしてください。`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: userMessage }],
      system: systemPrompt,
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ message: text })

  } catch (err: unknown) {
    const error = err as { status?: number; message?: string }
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'APIが混み合っています。30秒後に再試行してください' },
        { status: 429 }
      )
    }
    return NextResponse.json(
      { error: '一時的なエラーです。しばらく待って再試行してください' },
      { status: 500 }
    )
  }
}
