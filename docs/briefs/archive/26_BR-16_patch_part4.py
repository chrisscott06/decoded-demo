"""Brief 26 (BR-16) Part 4 patch script - Section D meta updates.

Replaces the gresb.json `meta` block fields per brief Section D.
Preserves any keys not specified in the brief (defensive merge).
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
GRESB_PATH = REPO / "eir" / "src" / "data" / "gresb.json"

# Brief Section D - meta block updates, verbatim from brief.
NEW_META = {
    "version": "P11 / v1.5.0 (verified data patch from GRESB source documents)",
    "lastUpdated": "2026-06-08",
    "submissionDeadline": "2026-07-01",
    "entityName": "Inspired Villages Group",
    "trackerSource": "26003-NZA-IVG-XX-SH-2000_P11",
    "notes": (
        "All weights, scores, and validation decisions sourced directly from "
        "(a) GRESB 2026 RE Standard Updates, (b) IVG 2025 GRESB Benchmark "
        "Report (portal report 70100), (c) SharePoint /GRESB_Audit_Trail/. "
        "Previous v1.4.3 contained errors from phantom residential "
        "reweightings and incorrect RES6 modelling - fully replaced in this "
        "version."
    ),
    "toolPurpose": (
        "This page is the central source of truth for IVG's GRESB "
        "submission. As policies are confirmed, evidence collected and data "
        "lands, this view updates dynamically."
    ),
}


def main() -> int:
    g = json.loads(GRESB_PATH.read_text(encoding="utf-8"))
    log: list[str] = []

    meta = g.setdefault("meta", {})
    for k, new_val in NEW_META.items():
        old_val = meta.get(k)
        meta[k] = new_val
        log.append(f"  meta.{k}: {fmt(old_val)} -> {fmt(new_val)}")

    GRESB_PATH.write_text(
        json.dumps(g, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print("Brief 26 (BR-16) Part 4 - Section D applied:")
    print()
    for line in log:
        print(line)
    print()
    print(f"Wrote {GRESB_PATH}")
    return 0


def fmt(v) -> str:
    if isinstance(v, str):
        return repr(v) if len(v) < 60 else repr(v[:57] + "...")
    return repr(v)


if __name__ == "__main__":
    sys.exit(main())
