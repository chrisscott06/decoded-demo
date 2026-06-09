#!/usr/bin/env python3
"""
scrape_heroes.py — Fetch hero photos for each IVG village from inspiredvillages.co.uk.

For each operational site in sites.json:
  1. Fetch the village marketing page
  2. Extract og:image meta tag (primary) or first large body image (fallback)
  3. Download, resize to 2000px longest side, save as public/sites/{site_id}/hero.jpg
  4. Write/update _meta.json with provenance

Run from repo root:
    python scripts/scrape_heroes.py
    python scripts/scrape_heroes.py --site millfield-green  # single site
    python scripts/scrape_heroes.py --dry-run                # don't write files

Dependencies: requests, beautifulsoup4, Pillow
    pip install requests beautifulsoup4 Pillow
"""

from __future__ import annotations

import argparse
import io
import json
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
SITES_JSON = REPO_ROOT / "src" / "data" / "sites.json"
PUBLIC_SITES = REPO_ROOT / "public" / "sites"

USER_AGENT = "ivg-esg-tool/0.1 (internal tool; +https://github.com/chrisscott06/ivg-esg-tool)"
MAX_DIMENSION = 2000
JPEG_QUALITY = 85


def load_sites() -> list[dict]:
    with open(SITES_JSON) as f:
        data = json.load(f)
    return [s for s in data["sites"] if s["status"] == "operational"]


def fetch_html(url: str) -> str:
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
    resp.raise_for_status()
    return resp.text


def find_hero_url(html: str, base_url: str) -> str | None:
    """Find the canonical hero image URL on a village page.

    Priority:
      1. <meta property="og:image" content="...">
      2. <meta name="twitter:image" content="...">
      3. First <img> with width >= 800 not in /nav-images/ or /logo
    """
    soup = BeautifulSoup(html, "html.parser")

    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        return urljoin(base_url, og["content"])

    tw = soup.find("meta", attrs={"name": "twitter:image"})
    if tw and tw.get("content"):
        return urljoin(base_url, tw["content"])

    for img in soup.find_all("img"):
        src = img.get("src", "")
        if not src:
            continue
        if "/nav-images/" in src or "logo" in src.lower():
            continue
        # Width may be specified inline or via attribute
        width = img.get("width")
        try:
            width = int(width) if width else 0
        except ValueError:
            width = 0
        if width >= 800 or "hero" in src.lower():
            return urljoin(base_url, src)

    return None


def download_and_resize(url: str) -> bytes:
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=60)
    resp.raise_for_status()

    img = Image.open(io.BytesIO(resp.content))
    img = img.convert("RGB")

    w, h = img.size
    if max(w, h) > MAX_DIMENSION:
        if w >= h:
            new_w = MAX_DIMENSION
            new_h = int(h * MAX_DIMENSION / w)
        else:
            new_h = MAX_DIMENSION
            new_w = int(w * MAX_DIMENSION / h)
        img = img.resize((new_w, new_h), Image.LANCZOS)

    out = io.BytesIO()
    img.save(out, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return out.getvalue()


def process_site(site: dict, dry_run: bool = False) -> dict:
    site_id = site["site_id"]
    url = site.get("ivg_url")

    result = {
        "site_id": site_id,
        "ok": False,
        "hero_url": None,
        "error": None,
    }

    if not url:
        result["error"] = "No ivg_url"
        return result

    try:
        html = fetch_html(url)
    except Exception as e:
        result["error"] = f"fetch_html failed: {e}"
        return result

    hero_url = find_hero_url(html, url)
    if not hero_url:
        result["error"] = "No hero image found in page"
        return result

    result["hero_url"] = hero_url

    if dry_run:
        result["ok"] = True
        result["note"] = "dry-run, no file written"
        return result

    try:
        jpeg_bytes = download_and_resize(hero_url)
    except Exception as e:
        result["error"] = f"download_and_resize failed: {e}"
        return result

    out_dir = PUBLIC_SITES / site_id
    out_dir.mkdir(parents=True, exist_ok=True)
    hero_path = out_dir / "hero.jpg"
    hero_path.write_bytes(jpeg_bytes)

    meta_path = out_dir / "_meta.json"
    meta = {}
    if meta_path.exists():
        meta = json.loads(meta_path.read_text())
    meta["hero"] = {
        "source_page": url,
        "source_image_url": hero_url,
        "captured_at": date.today().isoformat(),
        "attribution": "© Inspired Villages Group — used internally for ESG tool",
        "file": "hero.jpg",
        "bytes": len(jpeg_bytes),
    }
    meta_path.write_text(json.dumps(meta, indent=2))

    result["ok"] = True
    result["bytes"] = len(jpeg_bytes)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", help="Process a single site_id only")
    parser.add_argument("--dry-run", action="store_true", help="Don't write files")
    args = parser.parse_args()

    sites = load_sites()
    if args.site:
        sites = [s for s in sites if s["site_id"] == args.site]
        if not sites:
            print(f"No site with id={args.site}", file=sys.stderr)
            sys.exit(1)

    print(f"Processing {len(sites)} sites...\n")

    results = []
    for site in sites:
        print(f"  {site['site_id']:25s} ", end="", flush=True)
        result = process_site(site, dry_run=args.dry_run)
        results.append(result)
        if result["ok"]:
            size_kb = result.get("bytes", 0) // 1024
            note = result.get("note", f"{size_kb} KB")
            print(f"OK   {note}")
        else:
            print(f"FAIL  {result['error']}")

    n_ok = sum(1 for r in results if r["ok"])
    n_fail = len(results) - n_ok
    print(f"\nDone: {n_ok} ok, {n_fail} failed")
    if n_fail:
        sys.exit(1)


if __name__ == "__main__":
    main()
