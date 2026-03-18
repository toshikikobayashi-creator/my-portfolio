import { createBrowserClient } from '@supabase/ssr'

// ブラウザ用クライアント（SSR対応、cookieでセッション管理）
// ミドルウェアと同じcookieベースのセッションを使用するため createBrowserClient を利用
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
