'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Papa from 'papaparse'

// 列名の自動マッピング辞書
const COLUMN_MAPPING: Record<string, string[]> = {
  company_name: ['会社名', '企業名', 'company_name', 'company', '名称', '法人名'],
  contact_name: ['担当者', '担当者名', 'contact', 'name', '氏名'],
  phone: ['電話', '電話番号', 'TEL', 'tel', 'phone'],
  email: ['メール', 'メールアドレス', 'email', 'mail', 'Email'],
  website_url: ['URL', 'サイト', 'HP', 'ホームページ', 'website', 'url'],
  facebook_url: ['Facebook', 'FB', 'facebook', 'fb_url'],
  category: ['業種', 'カテゴリ', 'category', '分類'],
  area_prefecture: ['都道府県', '県', 'prefecture', '所在地'],
  area_city: ['市区町村', '市', 'city', '住所'],
}

const FIELD_LABELS: Record<string, string> = {
  company_name: '会社名',
  contact_name: '担当者名',
  phone: '電話番号',
  email: 'メール',
  website_url: 'WebサイトURL',
  facebook_url: 'Facebook URL',
  category: 'カテゴリ',
  area_prefecture: '都道府県',
  area_city: '市区町村',
}

function autoMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  for (const [field, candidates] of Object.entries(COLUMN_MAPPING)) {
    for (const header of headers) {
      if (candidates.some((c) => c.toLowerCase() === header.trim().toLowerCase())) {
        mapping[header.trim()] = field
        break
      }
    }
  }
  return mapping
}

export default function ImportPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [columnMap, setColumnMap] = useState<Record<string, string>>({})
  const [progress, setProgress] = useState({ saved: 0, skipped: 0, error: 0, total: 0 })
  const [fileName, setFileName] = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (result) => {
        const parsed = result.data as Record<string, string>[]
        if (parsed.length === 0) { alert('データが空です'); return }
        const hdrs = Object.keys(parsed[0])
        setHeaders(hdrs)
        setRows(parsed)
        setColumnMap(autoMapColumns(hdrs))
        setStep('preview')
      },
      error: () => {
        // Shift_JIS フォールバック
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          encoding: 'Shift_JIS',
          complete: (result) => {
            const parsed = result.data as Record<string, string>[]
            if (parsed.length === 0) { alert('データが空です'); return }
            const hdrs = Object.keys(parsed[0])
            setHeaders(hdrs)
            setRows(parsed)
            setColumnMap(autoMapColumns(hdrs))
            setStep('preview')
          },
        })
      },
    })
  }

  const handleImport = async () => {
    setStep('importing')
    const total = rows.length
    let saved = 0, skipped = 0, error = 0

    // 既存の電話番号・会社名を取得（重複チェック用）
    const { data: existing } = await supabase.from('leads').select('company_name, phone')
    const existingPhones = new Set((existing ?? []).map((e) => e.phone).filter(Boolean))
    const existingNames = (existing ?? []).map((e) => e.company_name ?? '')

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const record: Record<string, unknown> = {
        source: 'csv_import',
        status: '未送信',
        priority: '中',
      }

      for (const [csvCol, field] of Object.entries(columnMap)) {
        const val = row[csvCol]?.trim()
        if (!val) continue
        if (field === 'category') record[field] = [val]
        else record[field] = val
      }

      if (!record.company_name) { skipped++; setProgress({ saved, skipped, error, total }); continue }

      // 重複チェック（電話番号完全一致）
      if (record.phone && existingPhones.has(record.phone as string)) {
        skipped++; setProgress({ saved, skipped, error, total }); continue
      }

      // 会社名の簡易重複チェック
      const isDuplicate = existingNames.some((n) => n === record.company_name)
      if (isDuplicate) { skipped++; setProgress({ saved, skipped, error, total }); continue }

      const { error: err } = await supabase.from('leads').insert(record)
      if (err) { error++ } else {
        saved++
        existingPhones.add(record.phone as string)
        existingNames.push(record.company_name as string)
      }
      setProgress({ saved, skipped, error, total })

      // 10件ごとに少し待つ（レート制限対策）
      if (i % 10 === 9) await new Promise((r) => setTimeout(r, 100))
    }

    setStep('done')
    setProgress({ saved, skipped, error, total })
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">←</button>
        <h1 className="text-xl font-bold text-gray-800">CSVインポート</h1>
      </div>

      {/* アップロード */}
      {step === 'upload' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-4">
            企業リストのCSVファイルをアップロードしてください。<br />
            UTF-8・Shift_JIS両対応。列名は自動判定します。
          </p>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <div className="text-4xl mb-2">📥</div>
            <div className="text-gray-600 font-medium">クリックしてファイルを選択</div>
            <div className="text-xs text-gray-400 mt-1">.csv ファイル対応</div>
          </div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </div>
      )}

      {/* プレビュー・マッピング確認 */}
      {step === 'preview' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">列マッピング確認</h2>
            <span className="text-sm text-gray-500">{fileName} / {rows.length}行</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            CSVの列名を自動判定しました。間違っていたら手動で修正してください。
          </p>

          <div className="space-y-2 mb-6">
            {headers.map((header) => (
              <div key={header} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-40 shrink-0 truncate" title={header}>
                  「{header}」
                </span>
                <span className="text-gray-400 text-sm">→</span>
                <select
                  value={columnMap[header] ?? ''}
                  onChange={(e) => setColumnMap((m) => ({ ...m, [header]: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">（スキップ）</option>
                  {Object.entries(FIELD_LABELS).map(([field, label]) => (
                    <option key={field} value={field}>{label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* プレビュー（先頭3行） */}
          <details className="mb-6">
            <summary className="text-sm text-blue-600 cursor-pointer mb-2">データプレビュー（先頭3行）</summary>
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="border border-gray-200 px-2 py-1 bg-gray-50 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 3).map((row, i) => (
                    <tr key={i}>
                      {headers.map((h) => (
                        <td key={h} className="border border-gray-200 px-2 py-1 truncate max-w-24">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <div className="flex gap-3">
            <button onClick={handleImport}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              インポート実行（{rows.length}件）
            </button>
            <button onClick={() => { setStep('upload'); setRows([]); setHeaders([]) }}
              className="px-4 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              やり直す
            </button>
          </div>
        </div>
      )}

      {/* インポート中 */}
      {step === 'importing' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
          <h2 className="font-semibold text-gray-800 mb-2">インポート中...</h2>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress.total ? (progress.saved + progress.skipped + progress.error) / progress.total * 100 : 0}%` }}
            />
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>処理中: {progress.saved + progress.skipped + progress.error} / {progress.total}件</div>
            <div className="text-green-600">保存: {progress.saved}件</div>
            <div className="text-yellow-600">スキップ（重複）: {progress.skipped}件</div>
            {progress.error > 0 && <div className="text-red-600">エラー: {progress.error}件</div>}
          </div>
        </div>
      )}

      {/* 完了 */}
      {step === 'done' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="font-semibold text-gray-800 mb-4">インポート完了！</h2>
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2 mb-6">
            <div className="flex justify-between"><span className="text-gray-600">合計</span><span className="font-medium">{progress.total}件</span></div>
            <div className="flex justify-between"><span className="text-green-600">保存</span><span className="font-medium text-green-600">{progress.saved}件</span></div>
            <div className="flex justify-between"><span className="text-yellow-600">スキップ（重複）</span><span className="font-medium text-yellow-600">{progress.skipped}件</span></div>
            {progress.error > 0 && <div className="flex justify-between"><span className="text-red-600">エラー</span><span className="font-medium text-red-600">{progress.error}件</span></div>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/leads')}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              リスト一覧を見る
            </button>
            <button onClick={() => { setStep('upload'); setRows([]); setHeaders([]) }}
              className="px-4 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              続けてインポート
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
