'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Lead, DmHistory, CATEGORIES, STATUSES } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import { toMessengerUrl } from '@/lib/utils'
import Link from 'next/link'

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [history, setHistory] = useState<DmHistory[]>([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Lead>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [fetchingRep, setFetchingRep] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('leads').select('*').eq('id', params.id).single()
      if (data) { setLead(data as Lead); setForm(data as Lead) }
      const { data: hist } = await supabase.from('dm_history').select('*').eq('lead_id', params.id).order('sent_at', { ascending: false })
      if (hist) setHistory(hist as DmHistory[])
    }
    fetch()
  }, [params.id])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const toggleCategory = (cat: string) => {
    const current = form.category ?? []
    setForm((f) => ({
      ...f,
      category: current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat],
    }))
  }

  const handleSave = async () => {
    if (!form.company_name?.trim()) return alert('会社名は必須です')
    setSaving(true)
    const { error } = await supabase.from('leads').update(form).eq('id', params.id)
    setSaving(false)
    if (error) { alert('保存失敗: ' + error.message); return }
    setLead(form as Lead)
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm(`「${lead?.company_name}」を削除しますか？\nDM履歴も全て削除されます。`)) return
    setDeleting(true)
    await supabase.from('leads').delete().eq('id', params.id)
    router.push('/leads')
  }

  if (!lead) return <div className="p-8 text-center text-gray-400">読み込み中...</div>

  const { url: messengerUrl } = lead.facebook_url
    ? toMessengerUrl(lead.facebook_url)
    : { url: '' }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">←</button>
        <h1 className="text-xl font-bold text-gray-800 flex-1">{lead.company_name}</h1>
        <StatusBadge status={lead.status} />
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link href={`/dm/${lead.id}`}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
          ✉️ DM作成
        </Link>
        {lead.facebook_url ? (
          <button
            onClick={() => window.open(messengerUrl, '_blank')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            💬 Facebook DM
          </button>
        ) : (
          <>
            {/* Facebook：名前＋会社名で検索 */}
            <button
              onClick={() => {
                const q = lead.contact_name
                  ? `${lead.contact_name} ${lead.company_name}`
                  : lead.company_name
                window.open(`https://www.facebook.com/search/people?q=${encodeURIComponent(q)}`, '_blank')
              }}
              className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              📘 FB検索
            </button>
            {/* Google検索 */}
            <button
              onClick={() => {
                const q = lead.contact_name
                  ? `${lead.contact_name} ${lead.company_name} facebook`
                  : `${lead.company_name} 代表者 facebook`
                window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank')
              }}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              🔍 Google
            </button>
          </>
        )}
        <button onClick={() => setEditing(!editing)}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          {editing ? 'キャンセル' : '編集'}
        </button>
        <button onClick={handleDelete} disabled={deleting}
          className="border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-40">
          削除
        </button>
      </div>

      {/* 詳細・編集フォーム */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">会社名 *</label>
              <input value={form.company_name ?? ''} onChange={(e) => set('company_name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">担当者名（代表者）</label>
                <div className="flex gap-1">
                  <input value={form.contact_name ?? ''} onChange={(e) => set('contact_name', e.target.value)}
                    placeholder="例: 田中太郎"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {/* AIで代表者名を自動取得 */}
                  <button
                    type="button"
                    disabled={fetchingRep}
                    onClick={async () => {
                      setFetchingRep(true)
                      try {
                        const res = await fetch('/api/fetch-representative', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            company_name: form.company_name,
                            website_url: form.website_url,
                          }),
                        })
                        const data = await res.json()
                        if (data.name && data.name !== '不明') {
                          set('contact_name', data.name)
                        } else {
                          alert('代表者名を取得できませんでした。手動で入力してください。')
                        }
                      } catch {
                        alert('取得に失敗しました')
                      } finally {
                        setFetchingRep(false)
                      }
                    }}
                    className="px-2 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                    title="AIでWebサイトから代表者名を自動取得"
                  >
                    {fetchingRep ? '取得中...' : '🤖 AI取得'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                <input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">代表者 Facebook（個人アカウントURL）</label>
              <input value={form.facebook_url ?? ''} onChange={(e) => set('facebook_url', e.target.value)}
                placeholder="https://www.facebook.com/代表者のユーザー名"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">代表者の個人FacebookプロフィールページのURLを入力</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WebサイトURL</label>
              <input value={form.website_url ?? ''} onChange={(e) => set('website_url', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                <select value={form.status ?? '未送信'} onChange={(e) => set('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
                <select value={form.priority ?? '中'} onChange={(e) => set('priority', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['高','中','低'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button type="button" key={cat} onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      (form.category ?? []).includes(cat)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
              <textarea value={form.memo ?? ''} onChange={(e) => set('memo', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={handleSave} disabled={saving}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        ) : (
          <dl className="space-y-3 text-sm">
            {[
              ['会社名', lead.company_name],
              ['担当者名', lead.contact_name],
              ['電話番号', lead.phone],
              ['メール', lead.email],
              ['WebサイトURL', lead.website_url],
              ['代表者Facebook', lead.facebook_url],
              ['都道府県', lead.area_prefecture],
              ['市区町村', lead.area_city],
              ['カテゴリ', lead.category?.join(', ')],
              ['優先度', lead.priority],
              ['収集ソース', lead.source],
              ['メモ', lead.memo],
              ['次回フォロー', lead.next_follow_date],
              ['初回送信日', lead.first_sent_at?.slice(0, 10)],
            ].map(([k, v]) => v ? (
              <div key={k} className="flex gap-3">
                <dt className="text-gray-500 w-28 shrink-0">{k}</dt>
                <dd className="text-gray-800 break-all">{v}</dd>
              </div>
            ) : null)}
          </dl>
        )}
      </div>

      {/* DM送信履歴 */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">DM送信履歴</h2>
          <div className="space-y-4">
            {history.map((h) => (
              <div key={h.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{h.template_type}</span>
                  <span className="text-xs text-gray-400">{h.sent_at?.slice(0, 10)}</span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{h.message_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
