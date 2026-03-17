#!/usr/bin/env python3
"""
HUMAN AD セールスハブ - Facebook URL自動収集スクリプト
Supabase内のfacebook_urlが空のリードに対して、
Googleで「会社名 Facebook」を検索してFBページURLを取得・保存する。
"""

import os
import re
import time
import asyncio
from supabase import create_client
from dotenv import load_dotenv
from playwright.async_api import async_playwright

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# 検索間隔（秒）- レート制限対策
SEARCH_INTERVAL = 7


async def search_facebook_url(page, company_name: str) -> str | None:
    """Googleで「会社名 Facebook」を検索してFBページURLを抽出する"""
    query = f"{company_name} Facebook ページ"

    try:
        # Google検索（日本語）
        await page.goto(f"https://www.google.com/search?q={query}&hl=ja", timeout=15000)
        await page.wait_for_load_state("domcontentloaded")
        await asyncio.sleep(2)

        # 検索結果からfacebook.comのURLを探す
        links = await page.eval_on_selector_all(
            "a[href]",
            "els => els.map(el => el.href)"
        )

        for link in links:
            # facebook.comのURLかつページURLであることを確認
            if re.search(r'facebook\.com/(?!search|share|sharer|login|pg/)', link):
                # クリーンなURLに変換
                clean = re.sub(r'\?.*$', '', link)  # クエリパラメータ除去
                clean = clean.rstrip('/')
                if clean and 'facebook.com' in clean:
                    # グーグルのリダイレクトURLを除外
                    if 'google.com' not in clean:
                        return clean

    except Exception as e:
        print(f"  ⚠️ 検索エラー ({company_name}): {e}")

    return None


async def main():
    print("=" * 50)
    print("HUMAN AD - Facebook URL収集")
    print("=" * 50)

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # facebook_urlが空のリードを取得
    result = supabase.table("leads").select("id, company_name").is_("facebook_url", "null").execute()
    leads = result.data or []

    print(f"対象: {len(leads)}件（Facebook URL未設定）")

    if not leads:
        print("全リードにFacebook URLが設定済みです。")
        return

    found_count = 0
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Googleの検出を避けるためUser-Agentを設定
        await page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })

        for i, lead in enumerate(leads, 1):
            company_name = lead["company_name"]
            print(f"[{i}/{len(leads)}] {company_name}")

            fb_url = await search_facebook_url(page, company_name)

            if fb_url:
                # Supabaseに保存
                supabase.table("leads").update({"facebook_url": fb_url}).eq("id", lead["id"]).execute()
                found_count += 1
                print(f"  ✅ 取得: {fb_url}")
            else:
                print(f"  - 見つからず（スキップ）")

            # レート制限対策
            if i < len(leads):
                await asyncio.sleep(SEARCH_INTERVAL)

        await browser.close()

    print(f"\n✅ 完了: {found_count}/{len(leads)}件 Facebook URLを取得（精度約{int(found_count/len(leads)*100) if leads else 0}%）")


if __name__ == "__main__":
    asyncio.run(main())
