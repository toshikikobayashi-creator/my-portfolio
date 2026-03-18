'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CATEGORIES, STATUSES } from '@/lib/types'

export default function NewLeadPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    phone: '',
    email: '',
    website_url: '',
    facebook_url: '',
    category: [] as string[],
    area_prefecture: '',
    area_city: '',
    priority: '中',
    memo: '',
    source: 'csv_import',
    status: '未送信',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const toggleCategory = (cat: string) => {
    setForm((f) => ({
      ...f,
      category: f.category.includes(cat)
        ? f.category.filter((c) => c !== cat)
        : [...f.category, cat],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company_name.trim()) return alert('会社名は必須です')
    setSaving(true)
    const { error } = await supabase.from('leads').insert(form)
    setSaving(false)
    if (error) {
      alert('保存に失敗しました: ' + error.message)
    } else {
      router.push('/leads')
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">←</button>
        <h1 className="text-xl font-bold text-gray-800">リード手動追加</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">会社名 <span className="text-red-500">*</span></label>
          <input value={form.company_name} onChange={(e) => set('company_name', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">担当者名</label>
          <input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メール</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WebサイトURL</label>
          <input type="url" value={form.website_url} onChange={(e) => set('website_url', e.target.value)}
            placeholder="https://"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">代表者 Facebook（個人アカウントURL）</label>
          <input value={form.facebook_url} onChange={(e) => set('facebook_url', e.target.value)}
            placeholder="https://www.facebook.com/代表者のユーザー名"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p className="text-xs text-gray-400 mt-1">代表者の個人FacebookプロフィールページのURLを入力</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">都道府県</label>
            <input value={form.area_prefecture} onChange={(e) => set('area_prefecture', e.target.value)}
              placeholder="東京都"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">市区町村</label>
            <input value={form.area_city} onChange={(e) => set('area_city', e.target.value)}
              placeholder="新宿区"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ（複数選択可）</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button type="button" key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  form.category.includes(cat)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {['高','中','低'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
          <textarea value={form.memo} onChange={(e) => set('memo', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
            {saving ? '保存中...' : '保存する'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}
