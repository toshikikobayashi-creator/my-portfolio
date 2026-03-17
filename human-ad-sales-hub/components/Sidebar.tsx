'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: 'ダッシュボード', icon: '📊' },
  { href: '/leads', label: 'リスト一覧', icon: '📋' },
  { href: '/dm', label: 'DM作成', icon: '✉️' },
  { href: '/import', label: 'CSVインポート', icon: '📥' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 z-10">
      {/* ロゴ */}
      <div className="p-4 border-b border-gray-200">
        <div className="text-sm font-bold text-blue-600">HUMAN AD</div>
        <div className="text-xs text-gray-500">セールスハブ</div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* フッター */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-400">株式会社HUMAN AD</div>
      </div>
    </aside>
  )
}
