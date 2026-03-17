// ヘルパー関数集

/**
 * 日付をJST（日本標準時）のYYYY-MM-DD形式に変換
 */
export function toJSTDateString(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date).replace(/\//g, '-')
}

/**
 * 今日のJST日付を返す
 */
export function todayJST(): string {
  return toJSTDateString(new Date())
}

/**
 * N日後のJST日付を返す
 */
export function addDaysJST(date: Date, days: number): string {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return toJSTDateString(result)
}

/**
 * FacebookページURLをm.me形式に変換する
 */
export function toMessengerUrl(facebookUrl: string): { url: string; isDirect: boolean } {
  if (!facebookUrl) return { url: '', isDirect: false }

  // 変換不可パターン
  if (
    facebookUrl.includes('profile.php') ||
    facebookUrl.includes('/people/') ||
    facebookUrl.includes('/groups/')
  ) {
    return { url: facebookUrl, isDirect: false }
  }

  try {
    // URLを正規化してページ名を抽出
    const normalized = facebookUrl
      .replace(/^https?:\/\/(www\.)?facebook\.com\//, '')
      .replace(/\/$/, '')

    if (normalized && !normalized.includes('/')) {
      return { url: `https://m.me/${normalized}`, isDirect: true }
    }
  } catch {
    // パース失敗時はそのまま返す
  }

  return { url: facebookUrl, isDirect: false }
}

/**
 * フォロー回数に応じた次回フォロー日数を返す（JST基準）
 * 0=初回送信後3日, 1=フォロー1後4日, 2=フォロー2後7日
 */
export function getNextFollowDays(followNumber: number): number {
  const daysMap: Record<number, number> = { 0: 3, 1: 4, 2: 7 }
  return daysMap[followNumber] ?? 0
}
