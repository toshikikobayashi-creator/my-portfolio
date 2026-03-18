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
 * Facebook個人アカウントURLをMessenger DM用URLに変換する
 * 代表者の個人アカウントURL → 直接DMを開けるリンクに変換
 */
export function toMessengerUrl(facebookUrl: string): { url: string; isDirect: boolean } {
  if (!facebookUrl) return { url: '', isDirect: false }

  try {
    // profile.php?id=XXXXXXX 形式（数字ID）→ m.me/XXXXXXX
    const profileMatch = facebookUrl.match(/profile\.php\?id=(\d+)/)
    if (profileMatch) {
      return { url: `https://m.me/${profileMatch[1]}`, isDirect: true }
    }

    // /people/NAME/ID 形式 → m.me/ID
    const peopleMatch = facebookUrl.match(/\/people\/[^/]+\/(\d+)/)
    if (peopleMatch) {
      return { url: `https://m.me/${peopleMatch[1]}`, isDirect: true }
    }

    // グループは対象外
    if (facebookUrl.includes('/groups/')) {
      return { url: facebookUrl, isDirect: false }
    }

    // facebook.com/username 形式 → m.me/username
    const normalized = facebookUrl
      .replace(/^https?:\/\/(www\.)?facebook\.com\//, '')
      .replace(/\/$/, '')
      .split('?')[0]

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
