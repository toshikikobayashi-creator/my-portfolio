'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Lead, LeadStatus } from '@/lib/types'
import { toMessengerUrl, addDaysJST } from '@/lib/utils'
import { Suspense } from 'react'

const DM_TYPES = [
  { id: 'A', label: 'ヒューマンアド提案', desc: 'LEDバックパック広告の新規提案' },
  { id: 'B', label: 'アドトラック提案', desc: 'LED搭載トラック広告の新規提案' },
  { id: 'C', label: 'セット提案', desc: '両サービスの組み合わせ提案' },
  { id: 'D', label: 'フォロー1回目', desc: '軽いリマインド' },
  { id: 'E', label: 'フォロー2回目', desc: '価値提供型フォロー' },
  { id: 'F', label: 'フォロー3回目（最終）', desc: 'ラストチャンス型' },
]

// 文字数に応じた色
function charCountColor(len: number) {
  if (len >= 200 && len <= 350) return 'text-green-600'
  return 'text-red-500'
}

function DmForm() {
  const searchParams = useSearchParams()
  const leadIdParam = searchParams.get('leadId')

  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [dmType, setDmType] = useState('A')
  const [date1, setDate1] = useState('')
  const [date2, setDate2] = useState('')
  const [date3, setDate3] = useState('')
  const [extraInstructions, setExtraInstructions] = useState('')
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // リード一覧を取得
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('leads')
        .select('id, company_name, contact_name, category, area_prefecture, area_city, website_url, facebook_url, status')
        .order('company_name')
      if (data) setLeads(data as Lead[])
    }
    fetch()
  }, [])

  // URLパラメータでリード指定
  useEffect(() => {
    if (leadIdParam && leads.length > 0) {
      const lead = leads.find((l) => l.id === leadIdParam)
      if (lead) setSelectedLead(lead)
    }
  }, [leadIdParam, leads])

  // DMタイプを自動推薦（フォロー回数から）
  useEffect(() => {
    if (!selectedLead) return
    const statusToType: Record<string, string> = {
      '初回DM送信済': 'D',
      'フォロー1回目': 'E',
      'フォロー2回目': 'F',
    }
    const suggested = statusToType[selectedLead.status]
    if (suggested) setDmType(suggested)
  }, [selectedLead])

  const handleGenerate = async () => {
    if (!selectedLead) { setError('送信先を選択してください'); return }
    setGenerating(true)
    setError('')
    setGeneratedMessage('')
    setSaved(false)

    try {
      const res = await fetch('/api/generate-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: selectedLead.company_name,
          contact_name: selectedLead.contact_name,
          category: selectedLead.category,
          area_prefecture: selectedLead.area_prefecture,
          area_city: selectedLead.area_city,
          website_url: selectedLead.website_url,
          dm_type: dmType,
          date1, date2, date3,
          extra_instructions: extraInstructions,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'DM生成に失敗しました。手動で文面を入力してください')
        setManualMode(true)
      } else {
        setGeneratedMessage(data.message)
        setManualMode(false)
      }
    } catch {
      setError('通信エラーが発生しました。手動で文面を入力してください')
      setManualMode(true)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // DM送信を記録してステータス更新
  const handleSaveRecord = async () => {
    if (!selectedLead || !generatedMessage) return
    setSaving(true)

    // DM種別ラベル
    const typeLabel = DM_TYPES.find((t) => t.id === dmType)?.label ?? dmType

    // フォロー回数
    const followMap: Record<string, number> = { A: 0, B: 0, C: 0, D: 1, E: 2, F: 3 }
    const followNumber = followMap[dmType] ?? 0

    // 次回フォロー日計算
    const daysMap: Record<number, number> = { 0: 3, 1: 4, 2: 7 }
    const nextFollowDays = daysMap[followNumber]
    const nextFollowDate = nextFollowDays ? addDaysJST(new Date(), nextFollowDays) : null

    // ステータス更新
    const newStatusMap: Record<string, LeadStatus> = {
      A: '初回DM送信済', B: '初回DM送信済', C: '初回DM送信済',
      D: 'フォロー1回目', E: 'フォロー2回目', F: 'フォロー3回目（最終）',
    }
    const newStatus = newStatusMap[dmType]

    // 送信日時フィールド
    const sentAtField: Record<string, string> = {
      A: 'first_sent_at', B: 'first_sent_at', C: 'first_sent_at',
      D: 'follow1_sent_at', E: 'follow2_sent_at', F: 'follow3_sent_at',
    }

    // dm_historyに保存
    await supabase.from('dm_history').insert({
      lead_id: selectedLead.id,
      template_type: typeLabel,
      message_text: generatedMessage,
      follow_number: followNumber,
    })

    // leadsのステータスと送信日時を更新
    const updateData: Record<string, unknown> = {
      status: newStatus,
      ...(nextFollowDate ? { next_follow_date: nextFollowDate } : {}),
      [sentAtField[dmType]]: new Date().toISOString(),
    }
    await supabase.from('leads').update(updateData).eq('id', selectedLead.id)

    setSaving(false)
    setSaved(true)
    setSelectedLead((l) => l ? { ...l, status: newStatus } : l)
  }

  const msgLength = generatedMessage.length
  const fbInfo = selectedLead?.facebook_url
    ? toMessengerUrl(selectedLead.facebook_url)
    : null

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-6">DM作成</h1>

      {/* STEP 1: 送信先選択 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">① 送信先を選択</h2>
        <select
          value={selectedLead?.id ?? ''}
          onChange={(e) => {
            const lead = leads.find((l) => l.id === e.target.value) ?? null
            setSelectedLead(lead)
            setSaved(false)
            setGeneratedMessage('')
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">企業を選択してください...</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.company_name}{l.area_prefecture ? ` (${l.area_prefecture})` : ''}
            </option>
          ))}
        </select>
        {selectedLead && (
          <div className="mt-2 text-xs text-gray-500 space-y-0.5">
            <div>現在のステータス: <span className="font-medium text-gray-700">{selectedLead.status}</span></div>
            {selectedLead.contact_name && <div>担当者: {selectedLead.contact_name}</div>}
            {selectedLead.area_prefecture && <div>エリア: {selectedLead.area_prefecture} {selectedLead.area_city}</div>}
          </div>
        )}
      </div>

      {/* STEP 2: DM種別選択 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">② DM種別を選択</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {DM_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setDmType(type.id)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                dmType === type.id
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300 text-gray-600'
              }`}
            >
              <div className="font-medium text-sm">{type.id}. {type.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 3: 候補日時 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">③ 候補日時（3つ入力）</h2>
        <div className="space-y-2">
          {[
            { val: date1, set: setDate1, placeholder: '例: 来週火曜 14:00' },
            { val: date2, set: setDate2, placeholder: '例: 来週水曜 11:00' },
            { val: date3, set: setDate3, placeholder: '例: 来週木曜 15:00' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-4">{i + 1}.</span>
              <input
                value={item.val}
                onChange={(e) => item.set(e.target.value)}
                placeholder={item.placeholder}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
        {/* Googleカレンダー連携（準備中） */}
        <button disabled className="mt-3 w-full border border-gray-200 text-gray-400 py-2 rounded-lg text-sm cursor-not-allowed">
          📅 Googleカレンダー連携（準備中）
        </button>
      </div>

      {/* STEP 4: 追加指示 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">④ 追加指示（任意）</h2>
        <textarea
          value={extraInstructions}
          onChange={(e) => setExtraInstructions(e.target.value)}
          placeholder="例: イベント集客に焦点を当てて / 新規出店の話題に触れて"
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 生成ボタン */}
      <button
        onClick={handleGenerate}
        disabled={generating || !selectedLead}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-base hover:bg-blue-700 disabled:opacity-50 transition-colors mb-4"
      >
        {generating ? '🤖 AIが生成中...' : '🤖 AIで生成する'}
      </button>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-red-700 text-sm mb-2">{error}</p>
          <button onClick={() => setManualMode(true)} className="text-sm text-red-600 underline">
            手動入力に切り替える →
          </button>
        </div>
      )}

      {/* 生成結果 / 手動入力エリア */}
      {(generatedMessage || manualMode) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">
              {manualMode && !generatedMessage ? '手動入力' : 'DM文面'}
            </h2>
            <div className="flex items-center gap-3">
              {/* 文字数カウンター */}
              <span className={`text-sm font-medium ${charCountColor(msgLength)}`}>
                {msgLength}文字
                {msgLength >= 200 && msgLength <= 350
                  ? ' ✅'
                  : msgLength < 200
                  ? ' （短すぎ）'
                  : ' （長すぎ）'}
              </span>
              <span className="text-xs text-gray-400">目安: 200〜350文字</span>
            </div>
          </div>

          <textarea
            value={generatedMessage}
            onChange={(e) => { setGeneratedMessage(e.target.value); setSaved(false) }}
            rows={10}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2 mt-3 flex-wrap">
            {/* コピーボタン */}
            <button
              onClick={handleCopy}
              className="flex-1 bg-gray-800 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-gray-900 transition-colors"
            >
              {copied ? '✅ コピーしました！' : '📋 コピー'}
            </button>

            {/* 再生成ボタン */}
            {!manualMode && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                再生成
              </button>
            )}

            {/* 送信記録ボタン */}
            <button
              onClick={handleSaveRecord}
              disabled={saving || saved || !generatedMessage}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                saved
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
              }`}
            >
              {saved ? '✅ 送信記録済み' : saving ? '記録中...' : '送信済みとして記録'}
            </button>
          </div>
        </div>
      )}

      {/* Facebook DM導線 */}
      {selectedLead && (generatedMessage || manualMode) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-800 mb-2">📱 Facebookで送信</h3>
          {fbInfo ? (
            <a href={fbInfo.url} target="_blank" rel="noopener noreferrer">
              <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors">
                {fbInfo.isDirect ? '💬 FacebookでDMを開く' : '🔗 Facebookページを開く'}
              </button>
            </a>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-blue-700">Facebook未登録</p>
              <a
                href={`https://www.facebook.com/search/pages/?q=${encodeURIComponent(selectedLead.company_name)}`}
                target="_blank" rel="noopener noreferrer"
              >
                <button className="w-full bg-blue-100 text-blue-700 py-2.5 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                  🔍 Facebookで検索する
                </button>
              </a>
            </div>
          )}
          <p className="text-xs text-blue-600 mt-2">
            ※ 上でコピーしたDMを貼り付けて手動送信してください（自動送信は行いません）
          </p>
        </div>
      )}
    </div>
  )
}

export default function DmPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">読み込み中...</div>}>
      <DmForm />
    </Suspense>
  )
}
