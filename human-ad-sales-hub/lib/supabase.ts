import { createClient } from '@supabase/supabase-js'

// 環境変数からSupabaseの接続情報を読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// フロントエンド・サーバー両用クライアント（anon key使用）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
