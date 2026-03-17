// データ型定義

export type LeadStatus =
  | '未送信'
  | '初回DM送信済'
  | 'フォロー1回目'
  | 'フォロー2回目'
  | 'フォロー3回目（最終）'
  | '返信あり'
  | '商談中'
  | '成約'
  | 'NG'

export type LeadPriority = '高' | '中' | '低'

export type LeadSource = 'google_maps' | 'web_scraping' | 'public_db' | 'csv_import'

export interface Lead {
  id: string
  company_name: string
  contact_name?: string
  phone?: string
  email?: string
  website_url?: string
  facebook_url?: string
  category: string[]
  area_prefecture?: string
  area_city?: string
  priority: LeadPriority
  memo?: string
  source?: LeadSource
  status: LeadStatus
  first_sent_at?: string
  follow1_sent_at?: string
  follow2_sent_at?: string
  follow3_sent_at?: string
  next_follow_date?: string
  created_at: string
  updated_at: string
}

export interface DmHistory {
  id: string
  lead_id: string
  template_type: string
  message_text: string
  sent_at: string
  follow_number: number
}

// ステータスの表示色
export const STATUS_COLORS: Record<LeadStatus, string> = {
  '未送信': 'bg-gray-100 text-gray-700',
  '初回DM送信済': 'bg-blue-100 text-blue-700',
  'フォロー1回目': 'bg-yellow-100 text-yellow-700',
  'フォロー2回目': 'bg-orange-100 text-orange-700',
  'フォロー3回目（最終）': 'bg-red-100 text-red-700',
  '返信あり': 'bg-green-100 text-green-700',
  '商談中': 'bg-purple-100 text-purple-700',
  '成約': 'bg-emerald-100 text-emerald-700',
  'NG': 'bg-slate-100 text-slate-500',
}

// 優先度の表示色
export const PRIORITY_COLORS: Record<LeadPriority, string> = {
  '高': 'bg-red-100 text-red-700',
  '中': 'bg-yellow-100 text-yellow-700',
  '低': 'bg-gray-100 text-gray-600',
}

// カテゴリ選択肢
export const CATEGORIES = [
  'イベント企画',
  '飲食・小売',
  '広告代理店・PR',
  '店舗型ビジネス',
  'その他',
]

// ステータス選択肢
export const STATUSES: LeadStatus[] = [
  '未送信',
  '初回DM送信済',
  'フォロー1回目',
  'フォロー2回目',
  'フォロー3回目（最終）',
  '返信あり',
  '商談中',
  '成約',
  'NG',
]
