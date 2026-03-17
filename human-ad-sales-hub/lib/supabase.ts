import { createClient } from '@supabase/supabase-js'

// 環境変数からSupabaseの接続情報を読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// フロントエンド用クライアント（anon key使用）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// サーバーサイド用クライアント（service_role key使用）
// ※ サーバーサイド（API Route）でのみ使用すること
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
