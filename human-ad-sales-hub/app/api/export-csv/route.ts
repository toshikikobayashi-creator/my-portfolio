import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// CSV出力API（全件 or フィルター済み）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? ''
  const category = searchParams.get('category') ?? ''
  const prefecture = searchParams.get('prefecture') ?? ''

  let query = supabaseAdmin
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (category) query = query.contains('category', [category])
  if (prefecture) query = query.eq('area_prefecture', prefecture)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // CSV ヘッダー
  const headers = [
    'id', 'company_name', 'contact_name', 'phone', 'email',
    'website_url', 'facebook_url', 'category', 'area_prefecture', 'area_city',
    'priority', 'status', 'memo', 'source',
    'first_sent_at', 'follow1_sent_at', 'follow2_sent_at', 'follow3_sent_at',
    'next_follow_date', 'created_at', 'updated_at',
  ]

  const escape = (v: unknown): string => {
    if (v == null) return ''
    const str = Array.isArray(v) ? v.join(', ') : String(v)
    // ダブルクォートやカンマ・改行を含む場合はクォート
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const rows = [
    headers.join(','),
    ...(data ?? []).map((row) =>
      headers.map((h) => escape(row[h as keyof typeof row])).join(',')
    ),
  ]

  const csv = '\uFEFF' + rows.join('\n') // BOMを付けてExcelで文字化けを防止
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
  const filename = `HUMAN_AD_リスト_${today}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
