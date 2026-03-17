import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'HUMAN AD セールスハブ',
  description: 'ヒューマンアド・アドトラック 営業DM管理システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 md:ml-56 min-h-screen pb-20 md:pb-0">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
