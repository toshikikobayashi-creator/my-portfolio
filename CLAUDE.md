# 俊輝AI株式会社 - 組織ルール

---

## ヒューマンアド LP月次更新プロジェクト

### プロジェクト情報
- **プロジェクト名**: ヒューマンアド LP月次更新
- **LP URL**: https://toshikikobayashi-creator.github.io/my-portfolio/blog_ad_20260310.html
- **リポジトリ**: https://github.com/toshikikobayashi-creator/my-portfolio
- **サービス**: リュック型LEDディスプレイ（Jiatean JTA-WT32-BA、32インチ）を背負って歩行する広告
- **競争優位**: モバイル × 即時 × 低価格
- **運営**: Backstage Inc.

### 月次更新ワークフロー
1. **Researchフェーズ** (`.claude/agents/researcher`) — 競合調査・業界トレンド収集 → `research/YYYY-MM_research.md`
2. **Writingフェーズ** (`.claude/agents/writer`) — LP記事更新・SEO最適化 → `updates/YYYY-MM_changes.md`
3. **QAフェーズ** (`.claude/agents/qa-tester`) — Playwright MCPで品質テスト → `qa/YYYY-MM_test_report.md`

### ディレクトリ構成
```
my-portfolio/
├── blog_ad_20260310.html   # 対象LP
├── .claude/
│   ├── settings.json       # Agent Teams有効化
│   └── agents/
│       ├── researcher.md   # 競合調査エージェント
│       ├── writer.md       # LP更新エージェント
│       └── qa-tester.md    # QAテストエージェント
├── research/               # リサーチ出力 (YYYY-MM_research.md)
├── updates/                # 更新ログ (YYYY-MM_changes.md)
└── qa/                     # QAレポート (YYYY-MM_test_report.md)
```

---

## 組織構造
- 社長（俊輝）：最終承認・方針決定のみ。実作業はしない。
- 統括役員（COO）：全部署の管理・品質統括・クロスチェック。社長への最終報告。
- LP制作部：リーダー + リサーチャー + デザイナー + ライター + エンジニア + QA係
- コンテンツ制作部：リーダー + SEOリサーチャー + 構成ライター + 本文ライター + QA係
- データ分析部：リーダー + データ収集 + 分析担当 + レポートライター + QA係
- 自動化ツール部：リーダー + 要件定義 + 開発エンジニア + UI担当 + QA係

## 制作ルール
1. 変更する前に必ず何を変えるか説明し、承認を得ること
2. 日本語でコメントを書くこと
3. ファイルを作成・変更したら必ず報告すること
4. デザインはモダンでプロフェッショナルにすること
5. レスポンシブ対応は必須（スマホ・タブレット・PC）
6. 制作後は必ず品質チェックを実施すること
7. 品質チェックで不合格の場合は修正して再チェックすること
8. 3回修正しても不合格の場合はゼロから再制作すること

## ファイル命名規則
- LP: client_業種名_lp.html（例: sunrise_yoga_lp.html）
- ブログ: blog_テーマ_日付.html（例: blog_ai_20260307.html）
- ツール: tool_機能名.html（例: tool_sales_report.html）
- レポート: report_テーマ_日付.md（例: report_market_20260307.md）

## 品質チェック基準（部署QA係）
- HTML構造が正しいか
- CSSが正しく適用されているか
- スマホとPCの両方で表示が崩れないか
- 誤字脱字がないか
- リンクやボタンが正常に動作するか
- コンテンツの情報に根拠があるか
- SEO対応（title、meta description、見出し構造、alt属性）
- JavaScriptにエラーがないか

## 統括役員クロスチェック項目（部署QAとは別の視点）
- クライアントの要望に合っているか
- 競合と比較して見劣りしないか
- ブランドイメージに一貫性があるか
- ユーザー目線で使いやすいか
- ビジネス的に成果が出そうか（CTAの配置、導線設計）
- 各部署の成果物に矛盾がないか

## ワークフロー
1. 社長が案件を統括役員に指示
2. 統括役員が適切な部署に振り分け、期限を設定
3. エージェントチームで制作開始
4. 部署のQA係が品質チェック基準に基づき検証
5. 不合格なら修正→再チェック（最大3回）
6. 合格したら統括役員がクロスチェック
7. 統括役員が最終レポートを社長に提出
8. 社長が承認して納品

## 期限とノルマ
- LP制作：1件あたり最大2時間
- ブログ記事：1件あたり最大1時間
- 品質チェック：制作時間の30%以内
- 期限内に品質基準を満たせない場合は、新規で再制作する

## 大量生産サイクル
- 1日のLP制作目標：最低3件
- 制作したLPは1週間で成果を測定する
- 成果が出なければ改善版を制作、または別案件に切り替え
- 「完璧」より「まず出す」を優先し、改善は後から行う

## 部署間連携ルール
- 複数部署が関わる案件は統括役員が調整する
- 部署間でファイルの衝突が起きないよう、担当ファイルを明確に分ける
- 他部署の成果物を修正する場合は、その部署のリーダーに確認を取る

## 納品ルール
- 納品物：HTMLファイル一式 + 品質チェックレポート
- 納品前にブラウザで最終表示確認を必ず実施
- クライアントへの説明文（変更点・使い方）を添付する

## エラー対応ルール
- エラーが発生したら即座に作業を止めて原因を報告する
- 自力で解決できない場合は統括役員にエスカレーションする
- 同じエラーが2回起きたら、CLAUDE.mdに防止策を追記する

## 成果物管理ルール
- 制作中のファイルはdraft_フォルダに保存
- QA合格後のファイルはready_フォルダに移動
- 納品済みのファイルはdelivered_フォルダに移動
- 各ファイルの状態一覧をstatus.mdで管理する

## 営業アウトリーチ部門（sales-outreach）

### 部門概要
企業の問い合わせフォーム経由で営業をかけるための文章自動生成・管理部門。
HUMAN AD（ヒューマンアド）とアドトラックの2サービスに対応。

### 起動コマンド
- 「営業文を作って」
- 「アタックリストを読み込んで」
- 「〇〇社に営業文を書いて」
- 「リストの未着手企業に順番に文章を作って」
- 「送信レポートを見せて」
- 「アタックリストを更新して」

### ワークフロー
リスト読込 → Webリサーチ → サービス選定 → 文章生成 → 日程提案 → ユーザー確認 → 記録更新

### スキルファイル
sales-outreach/SKILL.md を起点に、以下を必要に応じて参照：
- references/pain-points.md — カテゴリ別ペインポイント辞書
- references/message-rules.md — 文章生成ルール
- references/service-info.md — サービス情報・料金・選定基準
- templates/examples.md — 文章サンプル
- scripts/tracker.py — リスト管理スクリプト

### 送信者情報
```
株式会社HUMAN AD
プロジェクトマネージャー 小林俊輝
TEL: 070-2156-0103
Email: toshiki.kobayashi@wein.co.jp
```

### 品質チェック（文章生成後に必ず確認）
- 企業固有の情報がフックに入っているか
- カテゴリ別の「恐れ」を突いているか
- 300〜500文字以内か
- 日程候補が3つあるか
- 「突然のご連絡失礼します」で始めていないか
- 「ご検討いただけますと幸いです」で終わっていないか
# HUMAN AD セールスハブ

## プロジェクト概要
ヒューマンアド（LEDバックパック広告）とアドトラック（LED搭載トラック広告）の
Facebook DM営業を効率化するオールインワンWebアプリ。
UIは全て日本語。タイムゾーンは全てJST（Asia/Tokyo）。

## リポジトリ
既存の my-portfolio リポジトリ内の human-ad-sales-hub/ ディレクトリに構築。
GitHubユーザー名: toshikikobayashi-creator
Vercelデプロイ時は Root Directory を human-ad-sales-hub に設定。

## 3つのコア機能
1. **アタックリスト自動収集** - Google Maps Places API (New) Text Search / Webスクレイピング / 公開DB / CSVインポートで500件以上生成 + Google「会社名+Facebook」自動検索でFB URL取得
2. **AI DMジェネレーター** - Claude API（claude-sonnet-4-20250514）で相手の企業情報に合わせたDMを自動生成→コピーしてFacebookに貼り付け（料金はDMに入れない）
3. **営業管理ダッシュボード** - ステータス管理・3回フォロー・一括操作・チーム共有・CSV入出力

## 技術スタック
- フロントエンド: Next.js 14 (App Router) + React 18 + Tailwind CSS 3
- Node.js: v20 LTS
- DB: Supabase (PostgreSQL)
- AI DM生成: Anthropic Claude API（/api/generate-dm、サーバーサイドのみ、レート制限あり）
- データ収集: Python 3.11+（Google Maps API + Playwright + 公開DB）
- デプロイ: Vercel（Root Dir: human-ad-sales-hub, Node.js 20.x）
- 認証: Supabase Auth（簡易パスワード）

## 環境変数（.env.local）※絶対にGitHubにpushしない
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_MAPS_API_KEY
- ANTHROPIC_API_KEY（サーバーサイドのみ。Max planとは別、console.anthropic.comで別途クレジット追加が必要）

## Python依存関係（requirements.txt）
googlemaps>=4.10.0, supabase>=2.0.0, playwright>=1.40.0, python-dotenv>=1.0.0
※ difflib は標準ライブラリのためrequirements.txtに含めない

## npmパッケージ
@supabase/supabase-js, @anthropic-ai/sdk, papaparse（CSVパース用）

## Pythonスクリプト配置
human-ad-sales-hub/scripts/ に配置:
collect_leads.py, import_csv.py, search_facebook.py, requirements.txt, .env

## ページ構成（App Router）
/           → ダッシュボード（集計数値・フォローアラート）
/login      → ログイン画面
/leads      → リスト一覧（フィルター・ソート・一括操作・ページネーション）
/leads/[id] → リード詳細・編集
/leads/new  → リード手動追加
/dm         → DM生成画面（種別選択・AI生成）
/dm/[leadId]→ 特定リードへのDM生成
/import     → CSVインポート画面
/api/generate-dm → Claude API呼び出し（サーバーサイド）
ナビゲーション: ダッシュボード / リスト一覧 / DM作成 / CSVインポート

## DB設計（Supabase）

### leads テーブル
id(UUID PK), company_name(TEXT NOT NULL), contact_name, phone, email,
website_url, facebook_url, category(TEXT[]), area_prefecture, area_city,
priority(TEXT DEFAULT '中'), memo, source, status(TEXT DEFAULT '未送信'),
first_sent_at, follow1_sent_at, follow2_sent_at, follow3_sent_at, next_follow_date,
created_at, updated_at（トリガーで自動更新）

### dm_history テーブル
id(UUID PK), lead_id(UUID FK ON DELETE CASCADE), template_type, message_text,
sent_at, follow_number(INT DEFAULT 0)

### 実行SQL: 【開発指示書 セクション3-2】に完全なCREATE TABLE文・トリガー・インデックスあり
### RLS: 開発中は無効、デプロイ時にauthenticated_accessポリシー有効化

## Google Maps全国検索戦略
Places API (New) Text Searchで「{キーワード} {都市名}」検索。
順序: 東京5エリア→大阪3エリア→横浜→名古屋→札幌→福岡→...（人口順）
500件超えたら一旦停止して報告。

## AI DM生成
- /api/generate-dm（サーバーサイド）、レート制限: 1ユーザー10回/分
- DM種別: A.ヒューマンアド B.アドトラック C.セット D.フォロー1 E.フォロー2 F.フォロー3
- フロー: 相手選択→情報自動入力→種別選択→追加指示→候補日時3つ→AI生成→編集→コピー→手動送信
- エラー時: エラーメッセージ + 「手動入力に切り替える」ボタン（AIなしでも営業は止まらない）
- 文字数: 350〜550文字（緑=OK、赤=範囲外）、再生成ボタンあり
- 料金は絶対にDMに入れない（プロンプトで制御）

## Facebook DM導線
- FB URLあり → m.me/{ページ名} に変換してリンク
  - 変換不可（profile.php?id=XX / /people/ / /groups/）→ 元URLで「Facebookページを開く」リンク
- FB URLなし → 「Facebook未登録」+ facebook.com/search/pages/?q={会社名} 検索リンク

## CSVインポートのフォーマット
- 列名自動判定（日本語/英語両対応）: 会社名→company_name, 電話→phone 等
- アップロード後にマッピングプレビュー表示→手動修正可→インポート実行
- UTF-8とShift_JIS両方に対応

## 候補日時
- v1: 手動入力（テキスト×3）
- v2（将来）: Googleカレンダー連携（n8n経由）
- UIに「Googleカレンダー連携（準備中）」グレーアウトボタン配置

## ステータスフロー
未送信→初回DM送信済→フォロー1(3日後)→フォロー2(4日後)→フォロー3/最終(7日後)
→手動でNG判断（自動NG化しない、遅れて返信が来る場合があるため）
いずれの段階でも→返信あり→商談中→成約

## リード管理操作
個別: 追加・編集・削除（確認ダイアログ付き、dm_historyもCASCADE削除）
一括: チェックボックス複数選択→ステータス/カテゴリ/優先度変更、一括削除

## 重複排除
電話番号完全一致→重複。会社名類似度80%以上（difflib.SequenceMatcher、「株式会社」等除去後比較）→重複候補。重複時は情報多い方を残しマージ。

## 既存データ統合
AdTruck Lead Finder 300社: my-portfolio内と~/Downloads検索→なければ聞く→なければスキップ。UIにCSVインポート機能あり。

## エラー処理
データ収集: 途中保存・再開可、API上限→Webスクレイピング切替、3回リトライ失敗→スキップ+ログ
AI生成: タイムアウト/429/500→日本語エラー表示+手動入力フォールバック

## ページネーション
50件/ページ、ページ番号方式、「231〜280件目 / 全523件」表示

## モバイル対応
PC: テーブル / スマホ（768px以下）: カード型UI

## チーム共有
俊輝+溝口さん+将来チーム追加。全員閲覧・編集可。

## 禁止事項
- Facebook自動送信禁止（BAN確定）
- DM手動送信のみ。捏造情報禁止。料金DM記載禁止
- .env.localのGitHub公開禁止。ANTHROPIC_API_KEYクライアント側露出禁止

## 開発ステップ
1. 初期化+Supabase（Next.js 14+Tailwind3、テーブル+トリガー+インデックス+RLS無効）
2. データ収集Python（Places API New Text Search、500件+FB URL+300社インポート）
3. 管理画面（リスト・フィルター・ソート・ページネーション・削除・一括操作・レスポンシブ）
4. AI DMジェネレーター（Claude API+レート制限・種別A〜F・エラーフォールバック・文字数チェック・コピー・FB導線・送信記録）
5. フォローアップ（JST自動計算・アラート・種別自動推薦・手動NG判断）
6. ダッシュボード・CSV出力・CSVインポートUI
7. Vercelデプロイ（Root Dir+Node.js20.x+環境変数5つ）・RLS有効化・チーム共有

## 開発ルール
- 各Step完了→俊輝に確認→次へ
- 説明は小学生レベル
- エラーは原因+対処法を日本語で
