"""Brief 27 (NZA 26003-EPC-01) - EPC acquisition + coverage pipeline.

Subcommands:

    probe   - Connectivity probe against the legacy
              `epc.opendatacommunities.org` API. Detects whether the
              service is still live (returns JSON 401 / 200) or has
              been retired (returns HTML 200 after redirect to the
              GOV.UK One Login service). Writes a JSON report to
              `pipeline/dist/eir/epc_probe.json` and exits non-zero if
              the legacy is retired (intentional - prompts the human
              operator to drop bulk files manually via One Login).

    parse   - Read EPC bulk ZIP files from
              `pipeline/source-data/epc/raw/*.zip`, decompress, locate
              the certificates CSV inside each, normalise columns per
              the brief's retained field list, concatenate across all
              files, and write a Parquet table at
              `pipeline/source-data/epc/processed/epc_certificates.parquet`.

    match   - (Phase 2, blocked) Joins normalised EPCs against the
              IVG property reference extract; produces match report.

    coverage- (Phase 2, blocked) Computes per-site + portfolio EPC
              coverage ratios and writes the BC2 asset table.

Per Brief 27 + CLAUDE.md path note, file locations differ from the
brief literal:

    brief says                                     project layout
    /data/raw/epc/                                  pipeline/source-data/epc/raw/
    /data/processed/epc_certificates.parquet        pipeline/source-data/epc/processed/...
    .env at project root                            C:/Users/ChrisScott/Dev/ivg-esg-tool/.env

Both `pipeline/source-data/epc/` subdirectories are gitignored. The
final coverage JSON output (Phase 2) lands at
`pipeline/dist/eir/epc.json` for the eir shell to consume.

Idempotent: probe is read-only; parse is read-once-write-once over
the cached raw/ ZIPs (re-running with the same inputs produces an
identical Parquet).
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

import pandas as pd
import requests
from dotenv import load_dotenv


# ---------- Project paths ----------
ROOT = Path(__file__).resolve().parents[2]
DOTENV_PATH = ROOT / ".env"
SOURCE_DATA_EPC = ROOT / "pipeline" / "source-data" / "epc"
RAW_DIR = SOURCE_DATA_EPC / "raw"
PROCESSED_DIR = SOURCE_DATA_EPC / "processed"
DIST_DIR = ROOT / "pipeline" / "dist" / "eir"
PROBE_REPORT = DIST_DIR / "epc_probe.json"
CERTIFICATES_PARQUET = PROCESSED_DIR / "epc_certificates.parquet"


# ---------- Brief step 3 - retained fields ----------
# Per brief: UPRN, LMK_KEY, ADDRESS, POSTCODE, CURRENT_ENERGY_RATING,
# CURRENT_ENERGY_EFFICIENCY, TOTAL_FLOOR_AREA, LODGEMENT_DATE,
# INSPECTION_DATE, certificate validity/expiry.
#
# Note on validity/expiry: the certificates CSV does NOT carry an
# explicit expiry column. Standard EPC lifetime is 10 years from
# lodgement (England & Wales). We compute `EXPIRY_DATE` =
# LODGEMENT_DATE + 10 years downstream. The raw LODGEMENT_DATE +
# INSPECTION_DATE are retained verbatim so any later vintage rule
# (e.g. inspection-based instead of lodgement-based) can be applied
# without re-parsing.
RETAINED_COLUMNS = [
    "UPRN",
    "LMK_KEY",
    "ADDRESS",
    "POSTCODE",
    "CURRENT_ENERGY_RATING",
    "CURRENT_ENERGY_EFFICIENCY",
    "TOTAL_FLOOR_AREA",
    "LODGEMENT_DATE",
    "INSPECTION_DATE",
]

EPC_LIFETIME_YEARS = 10  # England & Wales standard


# ---------- Subcommand: probe ----------

LEGACY_PROBE_URL = (
    "https://epc.opendatacommunities.org/api/v1/domestic/search"
    "?postcode=NG12%205AB&size=5"
)
PROBE_TIMEOUT_SECONDS = 15


def cmd_probe(args: argparse.Namespace) -> int:
    """Run the connectivity probe described in brief step 1.

    Authenticated GET if .env carries EPC_EMAIL + EPC_API_KEY;
    unauthenticated otherwise. Detects JSON vs HTML response and
    classifies the service state. Writes a JSON report and prints a
    concise summary.

    Exit codes:
      0  legacy API reachable and returned JSON (live)
      1  legacy API retired (HTML response after redirect)
      2  network error / unexpected response shape
    """
    load_dotenv(DOTENV_PATH)
    email = os.environ.get("EPC_EMAIL")
    api_key = os.environ.get("EPC_API_KEY")

    headers = {"Accept": "application/json"}
    auth_state = "unauthenticated"
    if email and api_key:
        token = base64.b64encode(
            f"{email}:{api_key}".encode("utf-8")
        ).decode("ascii")
        headers["Authorization"] = f"Basic {token}"
        auth_state = "authenticated"

    report = {
        "probed_at": datetime.now(timezone.utc).isoformat(),
        "probe_url": LEGACY_PROBE_URL,
        "auth_state": auth_state,
        "request_headers": {k: v for k, v in headers.items() if k != "Authorization"},
    }

    try:
        resp = requests.get(
            LEGACY_PROBE_URL,
            headers=headers,
            allow_redirects=True,
            timeout=PROBE_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        report["status"] = "network_error"
        report["error"] = str(exc)
        _write_probe_report(report)
        print(f"[probe] NETWORK ERROR: {exc}")
        return 2

    report["http_status"] = resp.status_code
    report["final_url"] = resp.url
    report["content_type"] = resp.headers.get("Content-Type", "")
    report["bytes"] = len(resp.content)

    content_type = report["content_type"].lower()
    is_html = "text/html" in content_type
    is_json = "application/json" in content_type

    # Final URL difference indicates a redirect happened (CDN or
    # GOV.UK service redirect).
    redirected = resp.url != LEGACY_PROBE_URL

    if is_html and redirected:
        # The legacy domain 301-redirects to the GOV.UK One Login
        # service - this is the documented retirement signature.
        report["status"] = "retired"
        report["classification"] = (
            "Legacy epc.opendatacommunities.org returns HTML after "
            "redirect - retired. Switch to GOV.UK One Login bulk "
            "download at https://get-energy-performance-data."
            "communities.gov.uk/ . Drop downloaded ZIPs at "
            f"{RAW_DIR.relative_to(ROOT)} and run `python "
            "pipeline/readers/read_epc.py parse`."
        )
        _write_probe_report(report)
        print("[probe] Legacy API RETIRED (301 -> GOV.UK One Login).")
        print(f"[probe] Action: drop bulk ZIPs at {RAW_DIR.relative_to(ROOT)}/, then `parse`.")
        print(f"[probe] Report written to {PROBE_REPORT.relative_to(ROOT)}.")
        return 1

    if is_json:
        # Either a valid JSON payload or a JSON error (e.g. 401
        # Unauthorized) - in both cases the service is alive.
        try:
            body = resp.json()
        except ValueError:
            body = None
        report["status"] = "live" if resp.ok else "live-but-needs-auth"
        report["json_keys_preview"] = list(body.keys())[:5] if isinstance(body, dict) else None
        _write_probe_report(report)
        print(f"[probe] Legacy API LIVE (HTTP {resp.status_code}, JSON payload).")
        if not resp.ok:
            print("[probe] Auth required - supply EPC_EMAIL + EPC_API_KEY in .env.")
        return 0

    # Unknown shape - bail rather than mis-classify
    report["status"] = "unknown"
    report["body_preview"] = resp.text[:500]
    _write_probe_report(report)
    print(f"[probe] UNKNOWN response shape (HTTP {resp.status_code}, {content_type}).")
    print(f"[probe] Body preview saved to {PROBE_REPORT.relative_to(ROOT)}.")
    return 2


def _write_probe_report(report: dict) -> None:
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    PROBE_REPORT.write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


# ---------- Subcommand: parse ----------

# EPC bulk-file ZIPs from the GOV.UK One Login service typically
# contain a `certificates.csv` (and a `recommendations.csv`). The
# legacy MHCLG service used the same naming. We detect the
# certificates CSV inside each ZIP by filename pattern - any CSV
# whose basename matches `certificates*.csv` is treated as a
# certificate file.
CERTIFICATE_CSV_NAME_PATTERN = re.compile(r"certificates.*\.csv$", re.IGNORECASE)


def cmd_parse(args: argparse.Namespace) -> int:
    """Read raw ZIPs, normalise certificate CSVs, write Parquet.

    Idempotent: re-running with the same `raw/*.zip` set produces the
    same Parquet output.
    """
    if not RAW_DIR.exists():
        print(f"[parse] {RAW_DIR.relative_to(ROOT)}/ does not exist - create it and drop bulk ZIPs.")
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        print(f"[parse] Directory created. Place ZIPs and re-run.")
        return 1

    zip_paths = sorted(RAW_DIR.glob("*.zip"))
    if not zip_paths:
        print(f"[parse] No ZIPs found in {RAW_DIR.relative_to(ROOT)}/.")
        print(f"[parse] Drop bulk EPC ZIPs (from GOV.UK One Login) and re-run.")
        return 1

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    frames: list[pd.DataFrame] = []
    log: list[str] = []

    for zip_path in zip_paths:
        log.append(f"  {zip_path.name}:")
        try:
            zf = zipfile.ZipFile(zip_path)
        except zipfile.BadZipFile as exc:
            log.append(f"    SKIP: bad ZIP ({exc})")
            continue

        # Detect domestic / non-domestic by filename - convention is
        # `domestic-{LA-code}.zip` / `non-domestic-{LA-code}.zip` but
        # we don't enforce it; we just record what we find.
        zip_kind = _detect_kind(zip_path.name)

        certificate_members = [
            m for m in zf.namelist()
            if CERTIFICATE_CSV_NAME_PATTERN.search(Path(m).name)
        ]
        if not certificate_members:
            log.append(f"    SKIP: no certificates.csv inside")
            zf.close()
            continue

        for member in certificate_members:
            with zf.open(member) as fh:
                # dtype=str across the board avoids pandas inferring
                # numeric types on UPRN (12-digit string) etc.
                df = pd.read_csv(fh, dtype=str, low_memory=False)

            # Normalise: keep only retained columns (intersect with
            # what the CSV actually has; the brief's column list is
            # the domestic-CSV schema, non-domestic schema differs
            # slightly).
            present = [c for c in RETAINED_COLUMNS if c in df.columns]
            missing = [c for c in RETAINED_COLUMNS if c not in df.columns]
            df = df.loc[:, present].copy()
            df["SOURCE_ZIP"] = zip_path.name
            df["SOURCE_KIND"] = zip_kind  # 'domestic' / 'non-domestic' / 'unknown'

            # Coerce types post-keep
            if "TOTAL_FLOOR_AREA" in df.columns:
                df["TOTAL_FLOOR_AREA"] = pd.to_numeric(
                    df["TOTAL_FLOOR_AREA"], errors="coerce"
                )
            if "CURRENT_ENERGY_EFFICIENCY" in df.columns:
                df["CURRENT_ENERGY_EFFICIENCY"] = pd.to_numeric(
                    df["CURRENT_ENERGY_EFFICIENCY"], errors="coerce"
                )
            for date_col in ("LODGEMENT_DATE", "INSPECTION_DATE"):
                if date_col in df.columns:
                    df[date_col] = pd.to_datetime(
                        df[date_col], errors="coerce", utc=False
                    )

            # Derived expiry per the EPC 10-year lifetime
            if "LODGEMENT_DATE" in df.columns:
                df["EXPIRY_DATE"] = df["LODGEMENT_DATE"] + pd.DateOffset(years=EPC_LIFETIME_YEARS)

            frames.append(df)
            log.append(
                f"    {member}: {len(df):,} rows; kept {len(present)}/{len(RETAINED_COLUMNS)} retained cols"
                + (f"; missing {missing}" if missing else "")
            )

        zf.close()

    if not frames:
        print("[parse] No certificate rows parsed.")
        print("\n".join(log))
        return 1

    combined = pd.concat(frames, ignore_index=True)
    combined.to_parquet(CERTIFICATES_PARQUET, index=False)

    print(f"[parse] {len(zip_paths)} ZIP(s) -> {len(combined):,} certificate rows")
    print(f"[parse] Wrote {CERTIFICATES_PARQUET.relative_to(ROOT)}")
    print()
    print("Per-ZIP detail:")
    for line in log:
        print(line)
    print()
    print(f"Combined columns: {list(combined.columns)}")
    if "SOURCE_KIND" in combined.columns:
        print("By source kind:")
        for kind, sub in combined.groupby("SOURCE_KIND"):
            print(f"  {kind:<15s} {len(sub):>10,d} rows")

    return 0


def _detect_kind(name: str) -> str:
    """Classify a ZIP filename as domestic / non-domestic / unknown."""
    n = name.lower()
    if "non-domestic" in n or "non_domestic" in n or "nondomestic" in n:
        return "non-domestic"
    if "domestic" in n:
        return "domestic"
    return "unknown"


# ---------- Subcommand: match (Phase 2 stub) ----------

def cmd_match(args: argparse.Namespace) -> int:
    print("[match] Phase 2 - blocked on Chris's data delivery.")
    print("[match] Needs: IVG property reference extract from Luke Kibble")
    print("[match]        (UPRN + ADDRESS + POSTCODE + GFA m² per dwelling + per communal).")
    print("[match] See docs/briefs/active/27_EPC-01_acquisition.md §Phase 2.")
    return 1


# ---------- Subcommand: coverage (Phase 2 stub) ----------

def cmd_coverage(args: argparse.Namespace) -> int:
    print("[coverage] Phase 2 - blocked on Chris's data delivery.")
    print("[coverage] Needs: matched units + LA codes + Scotland confirmation.")
    print("[coverage] See docs/briefs/active/27_EPC-01_acquisition.md §Phase 2.")
    return 1


# ---------- CLI ----------

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="read_epc",
        description="Brief 27 (NZA 26003-EPC-01) - EPC acquisition + coverage pipeline.",
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    sp_probe = sub.add_parser("probe", help="Probe the legacy EPC API for live/retired status.")
    sp_probe.set_defaults(func=cmd_probe)

    sp_parse = sub.add_parser("parse", help="Parse raw bulk ZIPs into a normalised Parquet table.")
    sp_parse.set_defaults(func=cmd_parse)

    sp_match = sub.add_parser("match", help="(Phase 2) Match IVG units to EPCs.")
    sp_match.set_defaults(func=cmd_match)

    sp_cov = sub.add_parser("coverage", help="(Phase 2) Compute per-site EPC coverage + BC2 asset table.")
    sp_cov.set_defaults(func=cmd_coverage)

    return p


def main(argv: list[str] | None = None) -> int:
    p = build_parser()
    args = p.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
