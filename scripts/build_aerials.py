#!/usr/bin/env python3
"""
build_aerials.py — Generate satellite/aerial images for each IVG site.

For each site in sites.json:
  1. Geocode `postcode_approx` via postcodes.io (free, no auth)
  2. Update sites.json with lat/long
  3. Fetch a satellite tile via Esri World Imagery (free for non-commercial / internal use)
     OR Google Static Maps if GOOGLE_MAPS_API_KEY is in environment
  4. Save as public/sites/{site_id}/aerial.png

Run from repo root:
    python scripts/build_aerials.py
    python scripts/build_aerials.py --site millfield-green
    python scripts/build_aerials.py --geocode-only          # just update lat/long in sites.json

Dependencies: requests, Pillow, mercantile
    pip install requests Pillow mercantile

The Esri tile method composes a 4x4 grid of 256px tiles at zoom 18 = ~1024x1024px image.
For Google Static Maps (recommended if a key is available), output is sharper at the
same coverage and you get attribution baked in.
"""

from __future__ import annotations

import argparse
import io
import json
import os
import sys
from datetime import date
from pathlib import Path

import requests
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
SITES_JSON = REPO_ROOT / "src" / "data" / "sites.json"
PUBLIC_SITES = REPO_ROOT / "public" / "sites"

POSTCODES_API = "https://api.postcodes.io/postcodes/"
ESRI_TILE_URL = (
    "https://server.arcgisonline.com/ArcGIS/rest/services/"
    "World_Imagery/MapServer/tile/{z}/{y}/{x}"
)
GOOGLE_STATIC = "https://maps.googleapis.com/maps/api/staticmap"

USER_AGENT = "ivg-esg-tool/0.1 (internal tool)"
DEFAULT_ZOOM = 18
DEFAULT_SIZE = "1200x900"


def load_sites_data() -> dict:
    with open(SITES_JSON) as f:
        return json.load(f)


def save_sites_data(data: dict) -> None:
    with open(SITES_JSON, "w") as f:
        json.dump(data, f, indent=2)


def geocode(postcode: str) -> tuple[float, float] | None:
    if not postcode:
        return None
    pc = postcode.replace(" ", "")
    resp = requests.get(POSTCODES_API + pc, headers={"User-Agent": USER_AGENT}, timeout=15)
    if resp.status_code != 200:
        return None
    data = resp.json()
    if data.get("status") != 200:
        return None
    r = data["result"]
    return (r["latitude"], r["longitude"])


# ---------- Google Static Maps path ----------
def fetch_google(lat: float, lon: float, api_key: str) -> bytes:
    params = {
        "center": f"{lat},{lon}",
        "zoom": DEFAULT_ZOOM,
        "size": DEFAULT_SIZE,
        "scale": 2,
        "maptype": "satellite",
        "key": api_key,
    }
    resp = requests.get(GOOGLE_STATIC, params=params, timeout=30)
    resp.raise_for_status()
    return resp.content


# ---------- Esri tile composition path ----------
def deg2tile(lat: float, lon: float, zoom: int) -> tuple[int, int, float, float]:
    """Return (x_tile, y_tile, x_frac, y_frac) — the latter for sub-tile centering."""
    import math
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    x = (lon + 180.0) / 360.0 * n
    y = (1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n
    xt, yt = int(x), int(y)
    return xt, yt, x - xt, y - yt


def fetch_esri_tiles(lat: float, lon: float, zoom: int = DEFAULT_ZOOM,
                     out_px: int = 1024) -> bytes:
    """Compose an out_px-square image precisely centered on lat/lon.

    Works in global web-mercator pixel space: finds the exact pixel for the
    coordinate, fetches every 256px tile covering the desired window, then
    crops a centered window so the site sits dead-center (not offset by up to
    a full tile, which the earlier tile-grid approach did).
    """
    import math

    n = 2.0 ** zoom
    lat_rad = math.radians(lat)
    x = (lon + 180.0) / 360.0 * n
    y = (1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n
    cx, cy = x * 256.0, y * 256.0  # global pixel of the coordinate

    left, top = cx - out_px / 2.0, cy - out_px / 2.0
    tx0, ty0 = int(left // 256), int(top // 256)
    tx1, ty1 = int((left + out_px) // 256), int((top + out_px) // 256)

    big = Image.new("RGB", ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256), "white")
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            url = ESRI_TILE_URL.format(z=zoom, x=tx, y=ty)
            resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
            resp.raise_for_status()
            tile = Image.open(io.BytesIO(resp.content))
            big.paste(tile, ((tx - tx0) * 256, (ty - ty0) * 256))

    ox, oy = int(round(left - tx0 * 256)), int(round(top - ty0 * 256))
    crop = big.crop((ox, oy, ox + out_px, oy + out_px))

    out = io.BytesIO()
    crop.save(out, format="PNG", optimize=True)
    return out.getvalue()


def process_site(site: dict, api_key: str | None, geocode_only: bool = False) -> dict:
    site_id = site["site_id"]
    result = {"site_id": site_id, "ok": False, "error": None}

    # Use existing coords or geocode from postcode
    lat = site.get("latitude")
    lon = site.get("longitude")
    if lat is None or lon is None:
        coords = geocode(site.get("postcode_approx", ""))
        if not coords:
            result["error"] = f"Could not geocode {site.get('postcode_approx')!r}"
            return result
        lat, lon = coords
        site["latitude"] = lat
        site["longitude"] = lon
        result["geocoded"] = True

    if geocode_only:
        result["ok"] = True
        result["lat"] = lat
        result["lon"] = lon
        return result

    try:
        if api_key:
            png_bytes = fetch_google(lat, lon, api_key)
            source = "Google Static Maps"
        else:
            png_bytes = fetch_esri_tiles(lat, lon)
            source = "Esri World Imagery"
    except Exception as e:
        result["error"] = f"tile fetch failed: {e}"
        return result

    out_dir = PUBLIC_SITES / site_id
    out_dir.mkdir(parents=True, exist_ok=True)
    aerial_path = out_dir / "aerial.png"
    aerial_path.write_bytes(png_bytes)

    meta_path = out_dir / "_meta.json"
    meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
    meta["aerial"] = {
        "source": source,
        "lat": lat,
        "lon": lon,
        "zoom": DEFAULT_ZOOM,
        "captured_at": date.today().isoformat(),
        "file": "aerial.png",
        "bytes": len(png_bytes),
    }
    meta_path.write_text(json.dumps(meta, indent=2))

    result["ok"] = True
    result["bytes"] = len(png_bytes)
    result["lat"] = lat
    result["lon"] = lon
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", help="Process a single site_id only")
    parser.add_argument("--geocode-only", action="store_true", help="Update lat/long only")
    args = parser.parse_args()

    data = load_sites_data()
    sites = [s for s in data["sites"] if s["status"] in ("operational", "head_office")]
    if args.site:
        sites = [s for s in sites if s["site_id"] == args.site]
        if not sites:
            print(f"No site with id={args.site}", file=sys.stderr)
            sys.exit(1)

    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if api_key:
        print(f"Using Google Static Maps (key {api_key[:8]}...)\n")
    else:
        print("No GOOGLE_MAPS_API_KEY in env — falling back to Esri World Imagery tiles\n")

    print(f"Processing {len(sites)} sites...\n")

    n_ok = 0
    for site in sites:
        print(f"  {site['site_id']:25s} ", end="", flush=True)
        result = process_site(site, api_key, geocode_only=args.geocode_only)
        if result["ok"]:
            n_ok += 1
            if args.geocode_only:
                print(f"OK   lat={result['lat']:.5f} lon={result['lon']:.5f}")
            else:
                kb = result.get("bytes", 0) // 1024
                print(f"OK   {kb} KB  ({result['lat']:.5f}, {result['lon']:.5f})")
        else:
            print(f"FAIL {result['error']}")

    # Persist any newly geocoded lat/long
    save_sites_data(data)

    n_fail = len(sites) - n_ok
    print(f"\nDone: {n_ok} ok, {n_fail} failed")
    if n_fail:
        sys.exit(1)


if __name__ == "__main__":
    main()
