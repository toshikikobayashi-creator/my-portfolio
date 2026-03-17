import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { STATUSES } from '@/lib/types'

// ダッシュボードはサーバーコンポーネントでSupabaseからデータ取得
export default async function DashboardPage() {
  // ステータス別集計
  const { data: leads } = await supabaseAdmin
    .from('leads')
    .select('status, next_follow_date')

  const counts: Record<string, number> = {}
  for (const status of STATUSES) counts[status] = 0

  let totalSent = 0
  for (const lead of leads ?? []) {
    counts[lead.status] = (counts[lead.status] ?? 0) + 1
    if (lead.status !== '未送信' && lead.status !== 'NG') totalSent++
  }

  const total = leads?.length ?? 0

  // 今日のフォロー対象（next_follow_dateが今日以前）
  const today = new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).replace(/\//g, '-')

  const todayFollows = (leads ?? []).filter(
    (l) => l.next_follow_date && l.next_follow_date <= today
  ).length

  const statCards = [
    { label: '総リード数', value: total, color: 'bg-blue-500', href: '/leads' },
    { label: '未送信', value: counts['未送信'], color: 'bg-gray-400', href: '/leads?status=未送信' },
    { label: '送信済み', value: totalSent, color: 'bg-blue-400', href: '/leads' },
    { label: '返信あり', value: counts['返信あり'], color: 'bg-green-500', href: '/leads?status=返信あり' },
    { label: '商談中', value: counts['商談中'], color: 'bg-purple-500', href: '/leads?status=商談中' },
    { label: '成約', value: counts['成約'], color: 'bg-emerald-500', href: '/leads?status=成約' },
    { label: 'NG', value: counts['NG'], color: 'bg-slate-400', href: '/leads?status=NG' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-6">ダッシュボード</h1>

      {/* 今日のフォローアラート */}
      {todayFollows > 0 && (
        <Link href="/leads?filter=follow_today">
          <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between hover:bg-amber-100 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <div className="font-semibold text-amber-800">今日のフォロー対象</div>
                <div className="text-sm text-amber-600">フォローアップが必要なリードがあります</div>
              </div>
            </div>
            <div className="bg-amber-500 text-white text-lg font-bold rounded-full w-10 h-10 flex items-center justify-center">
              {todayFollows}
            </div>
          </div>
        </Link>
      )}

      {/* 集計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`w-2 h-2 rounded-full ${card.color} mb-2`} />
              <div className="text-2xl font-bold text-gray-800">{card.value}</div>
              <div className="text-xs text-gray-500 mt-1">{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* クイックアクション */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">クイックアクション</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link href="/leads/new">
          <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">➕</div>
            <div>
              <div className="font-medium text-gray-800">リード追加</div>
              <div className="text-xs text-gray-500">企業情報を手動入力</div>
            </div>
          </div>
        </Link>
        <Link href="/dm">
          <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">✉️</div>
            <div>
              <div className="font-medium text-gray-800">DM作成</div>
              <div className="text-xs text-gray-500">AIがDM文面を自動生成</div>
            </div>
          </div>
        </Link>
        <Link href="/import">
          <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">📥</div>
            <div>
              <div className="font-medium text-gray-800">CSVインポート</div>
              <div className="text-xs text-gray-500">企業リストを一括追加</div>
            </div>
          </div>
        </Link>
      </div>

      {/* CSV出力 */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-8 mb-3">データ出力</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <a href="/api/export-csv">
          <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-xl">📊</div>
            <div>
              <div className="font-medium text-gray-800">全データCSV出力</div>
              <div className="text-xs text-gray-500">全{total}件をダウンロード</div>
            </div>
          </div>
        </a>
        <a href="/api/export-csv?status=未送信">
          <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">📋</div>
            <div>
              <div className="font-medium text-gray-800">未送信のみCSV出力</div>
              <div className="text-xs text-gray-500">{counts['未送信']}件をダウンロード</div>
            </div>
          </div>
        </a>
      </div>
    </div>
  )
}
