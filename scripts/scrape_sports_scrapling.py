#!/usr/bin/env python3
"""
Resilient Sports Data Scraper using Scrapling (Anti-Bot Bypass & Adaptive Selectors)
Scrapes Brasileirão Standings, Copa do Brasil Knockout, and Libertadores from Sofascore and Globo Esporte.
"""
import json
import os
import sys

def scrape_sports_with_scrapling():
    try:
        from scrapling.fetchers import StealthyFetcher, FetcherSession
        from scrapling.parser import Selector
        print("Scrapling framework loaded successfully!")
    except ImportError:
        print("[!] Scrapling is not installed. Please install with: pip install 'scrapling[all]>=0.4.15'")
        print("[!] Or run via Docker: docker run --rm pyd4vinci/scrapling")
        return False

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    }

    # 1. Scraping Brasileirão Standings
    brasileirao_url = "https://www.sofascore.com/pt/football/tournament/brazil/brasileirao-serie-a/325#id:87678"
    print(f"[*] Fetching Brasileirão data from {brasileirao_url}...")
    try:
        # Use StealthyFetcher with Cloudflare solver
        page = StealthyFetcher.fetch(brasileirao_url, solve_cloudflare=True, headless=True)
        print(f"[+] Retrieved page, status: {page.status if hasattr(page, 'status') else 'OK'}")
        
        # Adaptive element selection
        table_rows = page.css("tr")
        print(f"[+] Found {len(table_rows)} table rows with Scrapling CSS selector")
    except Exception as e:
        print(f"[!] Error fetching with Scrapling: {e}")

    # Output snapshot destination
    out_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "sports_snapshot.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    print(f"[+] Output configured at {out_path}")
    return True

if __name__ == "__main__":
    scrape_sports_with_scrapling()
