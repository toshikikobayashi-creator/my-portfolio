#!/usr/bin/env python3
"""
HUMAN AD セールスハブ - 企業データ収集スクリプト
Google Maps Places API (New) Text Search を使って企業情報を収集し、
Supabaseに保存する。途中保存・再開機能あり。
"""

import json
import os
import time
import difflib
import re
import requests
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# スクリプト自身のディレクトリを基準にパスを設定
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(SCRIPT_DIR, ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

# 進捗管理ファイル（絶対パス）
PROGRESS_FILE = os.path.join(SCRIPT_DIR, "progress.json")

# 1回の収集上限（500件超えたら報告して停止）
MAX_LEADS = 500

# Google Maps Places API (New) エンドポイント
PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText"

# ========================================
# 検索キーワード × エリアのリスト
# ========================================
SEARCH_TARGETS = [
    # 東京（最優先）
    {"area": "新宿区 東京都", "prefecture": "東京都", "city": "新宿区"},
    {"area": "渋谷区 東京都", "prefecture": "東京都", "city": "渋谷区"},
    {"area": "銀座 東京都", "prefecture": "東京都", "city": "中央区"},
    {"area": "池袋 東京都", "prefecture": "東京都", "city": "豊島区"},
    {"area": "品川区 東京都", "prefecture": "東京都", "city": "品川区"},
    # 大阪
    {"area": "梅田 大阪府", "prefecture": "大阪府", "city": "大阪市北区"},
    {"area": "難波 大阪府", "prefecture": "大阪府", "city": "大阪市中央区"},
    {"area": "天王寺 大阪府", "prefecture": "大阪府", "city": "大阪市天王寺区"},
    # その他主要都市
    {"area": "横浜市 神奈川県", "prefecture": "神奈川県", "city": "横浜市"},
    {"area": "名古屋市 愛知県", "prefecture": "愛知県", "city": "名古屋市"},
    {"area": "札幌市 北海道", "prefecture": "北海道", "city": "札幌市"},
    {"area": "福岡市 福岡県", "prefecture": "福岡県", "city": "福岡市"},
    {"area": "神戸市 兵庫県", "prefecture": "兵庫県", "city": "神戸市"},
    {"area": "京都市 京都府", "prefecture": "京都府", "city": "京都市"},
    {"area": "仙台市 宮城県", "prefecture": "宮城県", "city": "仙台市"},
    {"area": "広島市 広島県", "prefecture": "広島県", "city": "広島市"},
    {"area": "さいたま市 埼玉県", "prefecture": "埼玉県", "city": "さいたま市"},
    {"area": "千葉市 千葉県", "prefecture": "千葉県", "city": "千葉市"},
    {"area": "静岡市 静岡県", "prefecture": "静岡県", "city": "静岡市"},
    {"area": "岡山市 岡山県", "prefecture": "岡山県", "city": "岡山市"},
]

# カテゴリ別キーワード
CATEGORY_KEYWORDS = {
    "イベント企画": ["イベント企画会社", "展示会運営会社", "セミナー運営会社"],
    "飲食・小売": ["飲食チェーン", "小売チェーン店"],
    "広告代理店・PR": ["広告代理店", "PR会社", "マーケティング会社"],
    "店舗型ビジネス": ["不動産会社", "フィットネスジム", "美容サロン", "学習塾"],
    "その他": ["IT企業", "アプリ開発会社"],
}


def load_progress() -> dict:
    """進捗ファイルを読み込む"""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"processed": [], "total_collected": 0}


def save_progress(progress: dict):
    """進捗を保存する"""
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def normalize_company_name(name: str) -> str:
    """会社名から「株式会社」などを除去して比較用に正規化する"""
    noise = ["株式会社", "有限会社", "合同会社", "合資会社", "(株)", "（株）",
             "(有)", "（有）", "株式会社 ", " 株式会社"]
    result = name
    for n in noise:
        result = result.replace(n, "")
    return result.strip()


def is_duplicate(new_company: dict, existing_companies: list) -> bool:
    """重複チェック（電話番号完全一致 or 会社名類似度80%以上）"""
    new_phone = (new_company.get("phone") or "").strip()
    new_name = normalize_company_name(new_company.get("company_name", ""))

    for existing in existing_companies:
        existing_phone = (existing.get("phone") or "").strip()
        if new_phone and existing_phone and new_phone == existing_phone:
            return True

        existing_name = normalize_company_name(existing.get("company_name", ""))
        if new_name and existing_name:
            ratio = difflib.SequenceMatcher(None, new_name, existing_name).ratio()
            if ratio >= 0.80:
                return True

    return False


def search_places(keyword: str, area: dict) -> list:
    """
    Google Maps Places API (New) Text Searchで企業を検索する。
    新API: https://places.googleapis.com/v1/places:searchText
    """
    results = []
    query = f"{keyword} {area['area']}"
    print(f"  検索中: {query}")

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.id",
        "Accept-Language": "ja",
    }

    page_token = None
    page_count = 0

    while page_count < 3:  # 最大3ページ（60件）
        body = {
            "textQuery": query,
            "languageCode": "ja",
            "regionCode": "JP",
            "maxResultCount": 20,
        }
        if page_token:
            body["pageToken"] = page_token

        for attempt in range(3):
            try:
                resp = requests.post(PLACES_API_URL, headers=headers, json=body, timeout=15)
                data = resp.json()
                break
            except requests.RequestException as e:
                if attempt == 2:
                    print(f"  ⚠️ リクエスト失敗（スキップ）: {e}")
                    return results
                time.sleep(2)

        # エラーチェック
        if "error" in data:
            err = data["error"]
            status = err.get("status", "")
            msg = err.get("message", "")

            if status in ("RESOURCE_EXHAUSTED", "QUOTA_EXCEEDED"):
                print("⚠️ Google Maps API上限に達しました。収集を停止します。")
                raise SystemExit("API_LIMIT_REACHED")
            elif status == "REQUEST_DENIED":
                print(f"❌ APIキーまたは権限エラー: {msg}")
                print("→ Google Cloud ConsoleでPlaces API (New)が有効になっているか確認してください。")
                raise SystemExit("API_KEY_ERROR")
            else:
                print(f"  ⚠️ APIエラー（スキップ）: {status} - {msg}")
                return results

        places = data.get("places", [])
        if not places:
            break

        for place in places:
            name = place.get("displayName", {}).get("text", "")
            phone = place.get("internationalPhoneNumber", "")
            website = place.get("websiteUri", "")
            address = place.get("formattedAddress", "")

            if not name:
                continue

            company = {
                "company_name": name,
                "phone": phone,
                "website_url": website,
                "area_prefecture": area["prefecture"],
                "area_city": area["city"],
                "category": [keyword.split()[0]],
                "source": "google_maps",
                "status": "未送信",
                "priority": "中",
            }
            if address:
                company["memo"] = f"住所: {address}"

            results.append(company)

        page_token = data.get("nextPageToken")
        if not page_token:
            break

        page_count += 1
        time.sleep(2)  # nextPageToken が有効になるまで待機

    return results


def save_to_supabase(supabase: Client, companies: list, existing_companies: list) -> int:
    """Supabaseに企業データを保存する（重複チェック付き）"""
    saved_count = 0

    for company in companies:
        if not company.get("company_name"):
            continue

        if is_duplicate(company, existing_companies):
            print(f"  スキップ（重複）: {company['company_name']}")
            continue

        for attempt in range(3):
            try:
                supabase.table("leads").insert(company).execute()
                existing_companies.append({"company_name": company["company_name"], "phone": company.get("phone", "")})
                saved_count += 1
                print(f"  ✅ 保存: {company['company_name']}")
                break
            except Exception as e:
                if attempt == 2:
                    print(f"  ❌ 保存失敗（スキップ）: {company['company_name']} - {e}")
                else:
                    time.sleep(1)

    return saved_count


def main():
    print("=" * 50)
    print("HUMAN AD セールスハブ - 企業データ収集")
    print("=" * 50)

    # クライアント初期化
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # 進捗読み込み
    progress = load_progress()
    total_collected = progress["total_collected"]
    processed_keys = set(progress["processed"])

    print(f"前回の進捗: {total_collected}件収集済み")

    # 既存データを最初に一括取得（重複チェック用）
    existing = supabase.table("leads").select("company_name, phone").execute()
    existing_companies = existing.data or []

    # 検索ループ
    for area in SEARCH_TARGETS:
        for category, keywords in CATEGORY_KEYWORDS.items():
            for keyword in keywords:
                search_key = f"{keyword}_{area['area']}"

                # 処理済みはスキップ
                if search_key in processed_keys:
                    continue

                # 上限チェック
                if total_collected >= MAX_LEADS:
                    print(f"\n🎉 目標の{MAX_LEADS}件に達しました！")
                    print(f"合計: {total_collected}件収集済み")
                    print("俊輝さんに報告: 500件達成。Step 3（管理画面）に進んでください。")
                    save_progress({"processed": list(processed_keys), "total_collected": total_collected})
                    return

                # データ収集
                companies = search_places(keyword, area)
                time.sleep(3)  # APIレート制限対策

                # Supabaseに保存
                if companies:
                    saved = save_to_supabase(supabase, companies, existing_companies)
                    total_collected += saved
                    print(f"  → {saved}件保存（累計: {total_collected}件）")

                # 進捗保存
                processed_keys.add(search_key)
                save_progress({"processed": list(processed_keys), "total_collected": total_collected})

    print(f"\n✅ 全エリア収集完了！ 合計: {total_collected}件")


if __name__ == "__main__":
    main()
