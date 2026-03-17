'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Lead, LeadStatus, STATUSES, CATEGORIES } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import PriorityBadge from '@/components/PriorityBadge'

const PAGE_SIZE = 50

const PREFECTURES = [
  '東京都','神奈川県','大阪府','愛知県','北海道','福岡県','兵庫県','京都府',
  '宮城県','広島県','埼玉県','千葉県','静岡県','岡山県',
]

function LeadsInner() {
  const searchParams = useSearchParams()
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // フィルター（URLパラメータから初期値設定）
  const [searchQ, setSearchQ] = useState('')
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') ?? '')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPref, setFilterPref] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [sortBy, setSortBy] = useState('created_at_desc')
  // 今日のフォロー対象フィルター
  const [followTodayOnly, setFollowTodayOnly] = useState(
    searchParams.get('filter') === 'follow_today'
  )

  // 一括操作
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<LeadStatus | ''>('')
  const [bulkAction, setBulkAction] = useState('')

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())

    let query = supabase.from('leads').select('*', { count: 'exact' })

    // フィルター
    if (searchQ) {
      query = query.or(`company_name.ilike.%${searchQ}%,contact_name.ilike.%${searchQ}%,memo.ilike.%${searchQ}%`)
    }
    if (filterStatus) query = query.eq('status', filterStatus)
    if (filterCategory) query = query.contains('category', [filterCategory])
    if (filterPref) query = query.eq('area_prefecture', filterPref)
    if (filterPriority) query = query.eq('priority', filterPriority)
    // 今日のフォロー対象（next_follow_dateが今日以前）
    if (followTodayOnly) {
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
      query = query.lte('next_follow_date', today).not('next_follow_date', 'is', null)
    }

    // ソート
    const sortMap: Record<string, { col: string; asc: boolean }> = {
      'created_at_desc': { col: 'created_at', asc: false },
      'created_at_asc': { col: 'created_at', asc: true },
      'updated_at_desc': { col: 'updated_at', asc: false },
      'company_name_asc': { col: 'company_name', asc: true },
      'next_follow_asc': { col: 'next_follow_date', asc: true },
    }
    const sort = sortMap[sortBy] ?? { col: 'created_at', asc: false }
    query = query.order(sort.col, { ascending: sort.asc })

    // ページネーション
    const from = (page - 1) * PAGE_SIZE
    query = query.range(from, from + PAGE_SIZE - 1)

    const { data, count, error } = await query
    if (!error) {
      setLeads(data as Lead[])
      setTotal(count ?? 0)
    }
    setLoading(false)
  }, [searchQ, filterStatus, filterCategory, filterPref, filterPriority, sortBy, page, followTodayOnly])

  useEffect(() => {
    setPage(1)
  }, [searchQ, filterStatus, filterCategory, filterPref, filterPriority, sortBy, followTodayOnly])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // ステータス個別変更
  const updateStatus = async (id: string, status: LeadStatus) => {
    await supabase.from('leads').update({ status }).eq('id', id)
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l))
  }

  // 一括操作
  const applyBulkAction = async () => {
    if (selected.size === 0) return
    const ids = Array.from(selected)

    if (bulkAction === 'status' && bulkStatus) {
      await supabase.from('leads').update({ status: bulkStatus }).in('id', ids)
      await fetchLeads()
    } else if (bulkAction === 'delete') {
      if (!confirm(`${ids.length}件のリードを削除しますか？この操作は取り消せません。`)) return
      await supabase.from('leads').delete().in('id', ids)
      await fetchLeads()
    }
    setBulkAction('')
    setBulkStatus('')
  }

  // 全選択
  const toggleSelectAll = () => {
    if (selected.size === leads.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(leads.map((l) => l.id)))
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const startItem = (page - 1) * PAGE_SIZE + 1
  const endItem = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="p-4 md:p-6">
      {/* 今日のフォロー対象バナー */}
      {followTodayOnly && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800">
            <span>🔔</span>
            <span className="font-medium text-sm">今日のフォロー対象を表示中</span>
          </div>
          <button onClick={() => setFollowTodayOnly(false)} className="text-amber-600 text-xs underline">
            全件表示に戻す
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">リスト一覧</h1>
        <Link href="/leads/new">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            ＋ リード追加
          </button>
        </Link>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
        {/* 検索 */}
        <input
          type="text"
          placeholder="会社名・担当者名・メモで検索..."
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* フィルター行 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">ステータス全て</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">カテゴリ全て</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterPref} onChange={(e) => setFilterPref(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">都道府県全て</option>
            {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">優先度全て</option>
            {['高','中','低'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="created_at_desc">収集日（新しい順）</option>
            <option value="created_at_asc">収集日（古い順）</option>
            <option value="updated_at_desc">最終更新順</option>
            <option value="company_name_asc">会社名（あいうえお）</option>
            <option value="next_follow_asc">フォロー期限順</option>
          </select>
        </div>
      </div>

      {/* 一括操作バー */}
      {selected.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-blue-700">{selected.size}件選択中</span>
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}
            className="border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
            <option value="">操作を選択...</option>
            <option value="status">ステータス変更</option>
            <option value="delete">削除</option>
          </select>
          {bulkAction === 'status' && (
            <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as LeadStatus)}
              className="border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
              <option value="">ステータス選択</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <button onClick={applyBulkAction}
            disabled={!bulkAction || (bulkAction === 'status' && !bulkStatus)}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors">
            実行
          </button>
          <button onClick={() => setSelected(new Set())}
            className="text-blue-600 text-sm hover:underline">
            選択解除
          </button>
        </div>
      )}

      {/* 件数表示 */}
      <div className="text-sm text-gray-500 mb-3">
        {total > 0 ? `${startItem}〜${endItem}件目 / 全${total}件` : '0件'}
      </div>

      {/* PC: テーブル表示 */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">読み込み中...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-gray-400">該当するリードがありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input type="checkbox" checked={selected.size === leads.length && leads.length > 0}
                    onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">会社名</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">エリア</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ステータス</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">優先度</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">次回フォロー</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <tr key={lead.id} className={`hover:bg-gray-50 ${selected.has(lead.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(lead.id)}
                      onChange={(e) => {
                        const s = new Set(selected)
                        if (e.target.checked) s.add(lead.id); else s.delete(lead.id)
                        setSelected(s)
                      }} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-medium text-blue-600 hover:underline">
                      {lead.company_name}
                    </Link>
                    {lead.contact_name && <div className="text-xs text-gray-500">{lead.contact_name}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {lead.area_prefecture}<br />{lead.area_city}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={lead.priority} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {lead.next_follow_date ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/dm/${lead.id}`}>
                        <button className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-100 transition-colors">
                          DM
                        </button>
                      </Link>
                      <Link href={`/leads/${lead.id}`}>
                        <button className="text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                          詳細
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* スマホ: カード表示 */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-gray-400">読み込み中...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-gray-400">該当するリードがありません</div>
        ) : leads.map((lead) => (
          <div key={lead.id} className={`bg-white rounded-xl border p-4 ${selected.has(lead.id) ? 'border-blue-400' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={selected.has(lead.id)}
                  onChange={(e) => {
                    const s = new Set(selected)
                    if (e.target.checked) s.add(lead.id); else s.delete(lead.id)
                    setSelected(s)
                  }} className="rounded mt-0.5" />
                <div>
                  <Link href={`/leads/${lead.id}`} className="font-medium text-blue-600">
                    {lead.company_name}
                  </Link>
                  {lead.area_prefecture && (
                    <div className="text-xs text-gray-500">{lead.area_prefecture} {lead.area_city}</div>
                  )}
                </div>
              </div>
              <PriorityBadge priority={lead.priority} />
            </div>
            <div className="flex items-center justify-between">
              <StatusBadge status={lead.status} />
              <div className="flex gap-2">
                <Link href={`/dm/${lead.id}`}>
                  <button className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded">DM</button>
                </Link>
                <Link href={`/leads/${lead.id}`}>
                  <button className="text-xs bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1 rounded">詳細</button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
            前へ
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = page <= 4 ? i + 1 : page - 3 + i
            if (p < 1 || p > totalPages) return null
            return (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-2 text-sm rounded-lg ${p === page ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
                {p}
              </button>
            )
          })}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
            次へ
          </button>
        </div>
      )}
    </div>
  )
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">読み込み中...</div>}>
      <LeadsInner />
    </Suspense>
  )
}
