'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// 特定リードへのDM作成は/dm?leadId=XXXXにリダイレクト
export default function DmLeadPage({ params }: { params: { leadId: string } }) {
  const router = useRouter()
  useEffect(() => {
    router.replace(`/dm?leadId=${params.leadId}`)
  }, [params.leadId, router])
  return <div className="p-8 text-center text-gray-400">DM作成画面に移動中...</div>
}
