"""Brief 26 (BR-16) Part 1 patch script - Section A indicator-level changes.

Applies the corrections from BR-16-corrections.json to gresb.json:
- Sets each `field_changes[field].to` value on the matching indicator
- Mirrors floor2026 -> defendable2026 and ceiling2026 -> achievable2026
- Recomputes pointContribution2026 = ceiling2026 - floor2026
- Sets RES6 forecastRationale per brief Section A.2 (not in JSON)
- Writes JSON back with the same 2-space indent as before

Idempotent: re-running is a no-op once all corrections are applied.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
GRESB_PATH = REPO / "eir" / "src" / "data" / "gresb.json"
CORRECTIONS_PATH = REPO / "docs" / "briefs" / "active" / "26_BR-16_corrections.json"

# Brief Section A.2 - RES6 forecastRationale replacement text (not in
# corrections.json, taken from the brief markdown verbatim).
RES6_FORECAST_RATIONALE = (
    "RES6 is Residential Standalone Assessment only - 1.5pt max. "
    "IVG does not submit to Standalone (voluntary). Adding occupancy "
    "clauses now is a 2027 play if IVG ever opts in."
)


def main() -> int:
    g = json.loads(GRESB_PATH.read_text(encoding="utf-8"))
    corrections = json.loads(CORRECTIONS_PATH.read_text(encoding="utf-8"))

    log: list[str] = []

    for code, spec in corrections.items():
        ind = find_indicator(g, code)
        if ind is None:
            log.append(f"WARN: indicator {code} not found in gresb.json")
            continue

        for field, change in spec["field_changes"].items():
            new_val = change["to"]
            old_val = ind.get(field)
            ind[field] = new_val
            log.append(f"  {code}.{field}: {fmt(old_val)} -> {fmt(new_val)}")

            # Mirror floor2026 -> defendable2026, ceiling2026 -> achievable2026
            if field == "floor2026":
                ind["defendable2026"] = new_val
                log.append(f"  {code}.defendable2026 (mirror): -> {fmt(new_val)}")
            elif field == "ceiling2026":
                ind["achievable2026"] = new_val
                log.append(f"  {code}.achievable2026 (mirror): -> {fmt(new_val)}")

        # Recompute pointContribution2026 = ceiling2026 - floor2026
        if "floor2026" in spec["field_changes"] or "ceiling2026" in spec["field_changes"]:
            floor = ind.get("floor2026") or 0
            ceiling = ind.get("ceiling2026") or 0
            try:
                point = round(float(ceiling) - float(floor), 2)
            except (TypeError, ValueError):
                point = 0
            ind["pointContribution2026"] = point
            log.append(f"  {code}.pointContribution2026 (recomputed): -> {point}")

        # RES6 special - replace forecastRationale per brief Section A.2
        if code == "RES6":
            old = ind.get("forecastRationale")
            ind["forecastRationale"] = RES6_FORECAST_RATIONALE
            log.append(f"  RES6.forecastRationale: replaced (was {fmt(old)[:60]}...)")

    # Write back. json.dump uses the same 2-space indent the file already
    # uses (matches existing formatting; verify with `git diff --stat`).
    GRESB_PATH.write_text(
        json.dumps(g, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print("Brief 26 (BR-16) Part 1 - Section A applied:")
    print()
    for line in log:
        print(line)
    print()
    print(f"Wrote {GRESB_PATH}")
    return 0


def find_indicator(g: dict, code: str) -> dict | None:
    """Locate an indicator by code inside aspects[].indicators[]."""
    for aspect in g.get("aspects", []):
        for ind in aspect.get("indicators", []):
            if ind.get("code") == code:
                return ind
    return None


def fmt(v) -> str:
    """Short repr for log output."""
    if isinstance(v, str):
        return repr(v) if len(v) < 60 else repr(v[:57] + "...")
    return repr(v)


if __name__ == "__main__":
    sys.exit(main())
