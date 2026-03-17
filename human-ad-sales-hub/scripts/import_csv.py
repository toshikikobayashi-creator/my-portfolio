#!/usr/bin/env python3
"""
HUMAN AD セールスハブ - CSVインポートスクリプト
既存の企業リスト（CSVファイル）をSupabaseに一括インポートする。
UTF-8とShift_JIS両対応。重複チェック付き。
"""

import csv
import difflib
import io
import os
import re
import sys
import time
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# 列名の自動マッピング辞書
COLUMN_MAPPING = {
    "company_name": ["会社名", "企業名", "company_name", "company", "名称", "法人名"],
    "contact_name": ["担当者", "担当者名", "contact", "name", "氏名"],
    "phone": ["電話", "電話番号", "TEL", "tel", "phone"],
    "email": ["メール", "メールアドレス", "email", "mail", "Email"],
    "website_url": ["URL", "サイト", "HP", "ホームページ", "website", "url"],
    "facebook_url": ["Facebook", "FB", "facebook", "fb_url"],
    "category": ["業種", "カテゴリ", "category", "分類"],
    "area_prefecture": ["都道府県", "県", "prefecture", "所在地"],
    "area_city": ["市区町村", "市", "city", "住所"],
}


def detect_encoding(filepath: str) -> str:
    """ファイルのエンコーディングを検出する（UTF-8 or Shift_JIS）"""
    with open(filepath, "rb") as f:
        raw = f.read(4096)
    try:
        raw.decode("utf-8")
        return "utf-8"
    except UnicodeDecodeError:
        return "shift_jis"


def auto_map_columns(headers: list) -> dict:
    """CSVのヘッダーを自動でフィールドにマッピングする"""
    mapping = {}
    for field, candidates in COLUMN_MAPPING.items():
        for header in headers:
            if header.strip() in candidates or header.strip().lower() in [c.lower() for c in candidates]:
                mapping[header.strip()] = field
                break
    return mapping


def normalize_company_name(name: str) -> str:
    """会社名を正規化（株式会社等を除去）"""
    noise = ["株式会社", "有限会社", "合同会社", "(株)", "（株）", "(有)", "（有）"]
    result = name
    for n in noise:
        result = result.replace(n, "")
    return result.strip()


def is_duplicate(new_company: dict, existing_companies: list) -> bool:
    """重複チェック"""
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


def import_csv(filepath: str):
    """CSVファイルをSupabaseにインポートする"""
    print(f"ファイル: {filepath}")

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # エンコーディング検出
    encoding = detect_encoding(filepath)
    print(f"エンコーディング: {encoding}")

    with open(filepath, encoding=encoding, errors="replace") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = list(reader)

    print(f"列数: {len(headers)}, 行数: {len(rows)}")
    print(f"列名: {headers}")

    # 列名の自動マッピング
    column_map = auto_map_columns(headers)
    print("\n自動マッピング結果:")
    for csv_col, field in column_map.items():
        print(f"  「{csv_col}」→ {field}")

    # マッピングされなかった列
    unmapped = [h for h in headers if h not in column_map]
    if unmapped:
        print(f"マッピング外（スキップ）: {unmapped}")

    # ユーザー確認
    confirm = input("\nこのマッピングでインポートしますか？ (y/n): ")
    if confirm.lower() != "y":
        print("インポートをキャンセルしました。")
        return

    # 既存データを取得（重複チェック用）
    existing = supabase.table("leads").select("company_name, phone").execute()
    existing_companies = existing.data or []

    # インポート実行
    saved_count = 0
    skip_count = 0
    error_count = 0

    for i, row in enumerate(rows, 1):
        company = {"source": "csv_import", "status": "未送信", "priority": "中"}

        for csv_col, field in column_map.items():
            value = row.get(csv_col, "").strip()
            if value:
                if field == "category":
                    # カテゴリは配列として保存
                    company[field] = [value]
                else:
                    company[field] = value

        if not company.get("company_name"):
            skip_count += 1
            continue

        if is_duplicate(company, existing_companies):
            print(f"[{i}] スキップ（重複）: {company['company_name']}")
            skip_count += 1
            continue

        for attempt in range(3):
            try:
                supabase.table("leads").insert(company).execute()
                existing_companies.append(company)
                saved_count += 1
                print(f"[{i}] ✅ {company['company_name']}")
                break
            except Exception as e:
                if attempt == 2:
                    print(f"[{i}] ❌ エラー: {company['company_name']} - {e}")
                    error_count += 1
                else:
                    time.sleep(1)

    print(f"\n完了: 保存={saved_count}件, スキップ={skip_count}件, エラー={error_count}件")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使用方法: python import_csv.py <CSVファイルパス>")
        print("例: python import_csv.py ~/Downloads/companies.csv")
        sys.exit(1)

    csv_path = os.path.expanduser(sys.argv[1])
    if not os.path.exists(csv_path):
        print(f"エラー: ファイルが見つかりません: {csv_path}")
        sys.exit(1)

    import_csv(csv_path)
