import { createClient } from '@supabase/supabase-js'

// サーバーサイド専用クライアント（service_role key使用）
// ※ サーバーコンポーネント・API Routeでのみimportすること（クライアントコンポーネント禁止）
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
