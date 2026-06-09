"""Brief 26 (BR-16) Part 3 patch script - Section C aspect-level max2026 recompute.

After Part 1, two aspect.max2026 values diverged from the sum of their
per-indicator max2026 fields:
- Tenants & Community: 13.5 hand-coded -> 13 (per-indicator sum is 13)
- Residential Component: 3.5 hand-coded -> 0 (after RES6.max=0)

All other aspects already match. Per the brief Section C table the
authoritative totals are computed from per-indicator maxes (with the
note that BC1.1+BC1.2 combined cap at 8.5 is a display-time concern,
not stored on the aspect).

For safety we recompute and rewrite every aspect.max2026 from the
per-indicator sum (idempotent for the already-correct ones).
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
GRESB_PATH = REPO / "eir" / "src" / "data" / "gresb.json"


def main() -> int:
    g = json.loads(GRESB_PATH.read_text(encoding="utf-8"))
    log: list[str] = []

    for aspect in g.get("aspects", []):
        per_indicator_sum = 0.0
        for ind in aspect.get("indicators", []):
            v = ind.get("max2026")
            if isinstance(v, (int, float)):
                per_indicator_sum += float(v)
        # Round to 2dp to avoid float noise (e.g. 10.0 vs 10).
        new_max = round(per_indicator_sum, 2)
        # Strip trailing .0 so 10.0 stores as 10 (matches existing
        # formatting convention - per-indicator integer maxes don't
        # carry a fractional component).
        if new_max == int(new_max):
            new_max = int(new_max)
        old_max = aspect.get("max2026")
        if old_max != new_max:
            aspect["max2026"] = new_max
            log.append(f"  {aspect['name']:<28s}: {old_max} -> {new_max}")
        else:
            log.append(f"  {aspect['name']:<28s}: {old_max} (unchanged, matches per-indicator sum)")

    GRESB_PATH.write_text(
        json.dumps(g, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print("Brief 26 (BR-16) Part 3 - Section C applied:")
    print()
    for line in log:
        print(line)
    print()
    print(f"Wrote {GRESB_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
