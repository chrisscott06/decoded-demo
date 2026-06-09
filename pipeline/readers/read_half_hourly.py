"""Half-hourly Stark reader (Brief 11 rewrite).

Reads the real 3-column Stark exports landed in `pipeline/source-data/`:

    Date (D/M/YYYY),Time,Value
    07/02/2026,00:30,0.0      ← newest first (DESCENDING)
    07/02/2026,00:00,0.0
    ...
    02/04/2024,00:30,47.6
    02/04/2024,00:00,36.6      ← oldest last

Each CSV is one MPAN × ~22 months (~32,510 rows = Apr 2024 → Feb 2026).

Key conventions applied:
  - **HH-ending → start-of-period.** Stark timestamps are the END of each
    half-hour. The Load Inspector treats sample `i` as STARTING at
    `T0 + i × 30min`. So we subtract one 30-min interval from each parsed
    timestamp to get the period-start used everywhere downstream.
  - **Sort ascending** — source is newest-first.
  - **Derive start_date / end_date from data** — never hard-coded.
  - **Auto-detect columns** by header keyword (date / time / value) so
    future Stark exports with slightly different headers still parse.

Pending MPANs (Bramshott, 2 × Ampfield as of 2026-05-22) get an index
entry with `data_status: "pending"` + reason; no per-MPAN JSON is written.
The Site Detail HH view renders the pending state for those.
"""

from __future__ import annotations

import csv
import json
import re
from datetime import datetime, timedelta
from pathlib import Path


# MPAN → site_id mapping (canonical) -----------------------------------------

_MPAN_TO_SITE: dict[str, dict[str, str]] = {
    "1170000537858": {"site_id": "austin-heath",       "meter_label": "Austin Heath"},
    "1300060637737": {"site_id": "gifford-lea",        "meter_label": "Gifford Lea"},
    "1900092082315": {"site_id": "ledian-gardens",     "meter_label": "Ledian Gardens"},
    "2000054195811": {"site_id": "bramshott-place",    "meter_label": "Bramshott Clubhouse"},
    "2700000897657": {"site_id": "durrants-village",   "meter_label": "Durrants Village"},
    "2700001623991": {"site_id": "millbrook-village",  "meter_label": "Springbok Hall (Millbrook)"},
    "2700004078407": {"site_id": "great-alne-park",    "meter_label": "Great Alne Park"},
    "2700007408969": {"site_id": "elderswell",         "meter_label": "Elderswell — Electric Room"},
    "2700007408978": {"site_id": "elderswell",         "meter_label": "Elderswell — Plant Room"},
    "2700007801700": {"site_id": "millfield-green",    "meter_label": "Millfield Green"},
    "3110000087890": {"site_id": "ampfield-meadows",   "meter_label": "Ampfield Meadows — Energy Centre"},
    "3110000100948": {"site_id": "ampfield-meadows",   "meter_label": "Ampfield Meadows — Main"},
}

_MPAN_RE = re.compile(r"mpan_(\d{13,14})")


# ---------------------------------------------------------------------------
# Discovery
# ---------------------------------------------------------------------------

def find_csvs(source_data: Path) -> list[Path]:
    """Real Stark exports are prefixed `consumption_data_mpan_*.csv`."""
    return sorted(source_data.glob("consumption_data_mpan_*.csv"))


def _extract_mpan(filename: str) -> str | None:
    m = _MPAN_RE.search(filename)
    return m.group(1) if m else None


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

def _detect_columns(header: list[str]) -> tuple[int, int, int]:
    """Return (date_idx, time_idx, value_idx) by header keyword auto-detect.

    Brief 11 anticipates future Stark schemas with extra columns (e.g. the
    6-col `Timestamp, Date, Time, kWh, Source, Fill_Method` seen on one
    file in Downloads). Auto-detection insulates the reader from that
    drift.
    """
    norm = [(i, str(h).strip().lower()) for i, h in enumerate(header)]
    date_idx = next((i for i, h in norm if "date" in h and "time" not in h), None)
    time_idx = next((i for i, h in norm if h == "time" or h.startswith("time")), None)
    value_idx = next((i for i, h in norm if h in {"value", "kwh", "consumption_kwh", "consumption"}), None)
    if date_idx is None or time_idx is None or value_idx is None:
        raise ValueError(f"Header column auto-detection failed: {header}")
    return date_idx, time_idx, value_idx


def _parse_csv(path: Path, log: list[str]) -> list[tuple[datetime, float | None]]:
    """Parse a Stark CSV into a list of (period_start_timestamp, value).

    - Auto-detect Date/Time/Value columns.
    - Convert HH-ending to period-start by subtracting one 30-min interval.
    - Sort ASCENDING by period-start.
    """
    interval = timedelta(minutes=30)
    parsed: list[tuple[datetime, float | None]] = []
    skipped = 0

    with path.open(encoding="utf-8") as f:
        reader = csv.reader(f)
        try:
            header = next(reader)
        except StopIteration:
            return []

        date_idx, time_idx, value_idx = _detect_columns(header)

        for row in reader:
            if len(row) <= max(date_idx, time_idx, value_idx):
                skipped += 1
                continue
            date_s = (row[date_idx] or "").strip()
            time_s = (row[time_idx] or "").strip()
            value_s = (row[value_idx] or "").strip()
            if not date_s or not time_s:
                skipped += 1
                continue
            # Parse DD/MM/YYYY HH:MM
            try:
                ts_end = datetime.strptime(f"{date_s} {time_s}", "%d/%m/%Y %H:%M")
            except ValueError:
                skipped += 1
                continue
            # HH-ending → period-start
            ts_start = ts_end - interval
            # Parse value (allow blank/NaN)
            value: float | None
            if value_s == "" or value_s.lower() in {"nan", "null", "none"}:
                value = None
            else:
                try:
                    value = float(value_s)
                except ValueError:
                    value = None
            parsed.append((ts_start, value))

    if skipped:
        log.append(f"    skipped {skipped} unparseable rows in {path.name}")

    # Sort ascending by period-start
    parsed.sort(key=lambda x: x[0])
    return parsed


# ---------------------------------------------------------------------------
# Aggregates
# ---------------------------------------------------------------------------

def _compute_stats(parsed: list[tuple[datetime, float | None]]) -> dict:
    """Section 3.2 — peak / mean / annualised kWh / load factor / weekday /
    weekend / coverage / period_count / years_covered.

    Annualised kWh = (sum of values × 0.5h) ÷ years_covered, where
    years_covered = (end_date − start_date) in days ÷ 365.25.
    """
    interval_hours = 0.5
    periods_per_day = 48
    period_count = len(parsed)
    valid_pairs = [(t, v) for t, v in parsed if v is not None]
    valid_count = len(valid_pairs)
    missing_periods = period_count - valid_count
    zero_periods = sum(1 for _, v in valid_pairs if v == 0)

    if not valid_pairs:
        return {
            "peak_kw": 0.0, "peak_hh_kwh": 0.0,
            "mean_kw": 0.0, "annual_kwh": 0.0, "load_factor": 0.0,
            "weekday_mean": 0.0, "weekend_mean": 0.0,
            "coverage": 0.0,
            "period_count": period_count,
            "missing_periods": missing_periods,
            "zero_periods": zero_periods,
            "duration_days": 0,
            "years_covered": 0.0,
        }

    values = [v for _, v in valid_pairs]
    timestamps = [t for t, _ in valid_pairs]

    # Brief 19 Part 1a — peak/mean conversion fix (Chris ask 4 Jun).
    # Stark HH values are kWh-per-half-hour; multiplying by 2 (i.e.
    # 1 / interval_hours) converts to instantaneous kW (the MD — Maximum
    # Demand half-hourly average). The previous implementation stored
    # peak_kw = max(values) which was actually kWh per HH, half the kW.
    # Same correction applies to mean and weekday/weekend means.
    # peak_hh_kwh kept as an audit field carrying the raw maximum
    # kWh-per-HH value for traceability.
    peak_hh_kwh = max(values)
    peak = peak_hh_kwh * 2  # MD in kW (peak half-hourly demand)
    mean_hh_kwh = sum(values) / valid_count
    mean = mean_hh_kwh * 2  # mean demand in kW
    total_kwh = sum(values) * interval_hours

    # years_covered — actual span, not assumption
    span_days = (timestamps[-1] - timestamps[0]).total_seconds() / 86400.0 + (1.0 / 48.0)
    years_covered = span_days / 365.25
    annual_kwh = total_kwh / years_covered if years_covered > 0 else 0.0

    # Load factor unchanged — mean/peak ratio cancels the 2× scaling.
    load_factor = mean / peak if peak > 0 else 0.0

    # Weekday / weekend classification — per timestamp, not assumed
    wd_sum, wd_count, we_sum, we_count = 0.0, 0, 0.0, 0
    for t, v in valid_pairs:
        if t.weekday() >= 5:  # Sat=5, Sun=6
            we_sum += v
            we_count += 1
        else:
            wd_sum += v
            wd_count += 1
    weekday_mean = (wd_sum / wd_count * 2) if wd_count else 0.0  # × 2 → kW
    weekend_mean = (we_sum / we_count * 2) if we_count else 0.0

    duration_days = int(span_days)

    return {
        "peak_kw": round(peak, 2),
        "peak_hh_kwh": round(peak_hh_kwh, 2),
        "mean_kw": round(mean, 2),
        "annual_kwh": round(annual_kwh, 1),
        "total_kwh": round(total_kwh, 1),
        "load_factor": round(load_factor, 4),
        "weekday_mean": round(weekday_mean, 2),
        "weekend_mean": round(weekend_mean, 2),
        "coverage": round(valid_count / period_count, 4) if period_count else 0.0,
        "period_count": period_count,
        "missing_periods": missing_periods,
        "zero_periods": zero_periods,
        "duration_days": duration_days,
        "years_covered": round(years_covered, 3),
    }


def _compute_monthly(parsed: list[tuple[datetime, float | None]]) -> dict:
    """12-bucket kwh / peak_kw / mean_kw averaged across the years the
    data spans (so a 22-month span doesn't double-count Jan-Feb).
    """
    interval_hours = 0.5
    kwh_per_month_year: dict[tuple[int, int], float] = {}  # (year, month) → kWh
    peak_per_month_year: dict[tuple[int, int], float] = {}
    mean_sum_per_month_year: dict[tuple[int, int], float] = {}
    mean_count_per_month_year: dict[tuple[int, int], int] = {}

    for t, v in parsed:
        if v is None:
            continue
        key = (t.year, t.month)
        kwh_per_month_year[key] = kwh_per_month_year.get(key, 0.0) + v * interval_hours
        peak_per_month_year[key] = max(peak_per_month_year.get(key, 0.0), v)
        mean_sum_per_month_year[key] = mean_sum_per_month_year.get(key, 0.0) + v
        mean_count_per_month_year[key] = mean_count_per_month_year.get(key, 0) + 1

    # Average each month bucket across years
    kwh = [0.0] * 12
    peak = [0.0] * 12
    mean = [0.0] * 12
    year_count_per_month = [0] * 12
    for (year, month), v in kwh_per_month_year.items():
        kwh[month - 1] += v
        year_count_per_month[month - 1] += 1
    for (year, month), v in peak_per_month_year.items():
        peak[month - 1] = max(peak[month - 1], v)
    for (year, month), s in mean_sum_per_month_year.items():
        c = mean_count_per_month_year.get((year, month), 0)
        if c:
            mean[month - 1] += s / c
    for i in range(12):
        if year_count_per_month[i] > 1:
            kwh[i] /= year_count_per_month[i]
            mean[i] /= year_count_per_month[i]

    # Brief 19 Part 1a — same kWh-per-HH → kW conversion as _compute_stats.
    return {
        "kwh": [round(k, 1) for k in kwh],
        "peak_kw": [round(p * 2, 2) for p in peak],
        "mean_kw": [round(m * 2, 2) for m in mean],
    }


def _compute_daily_profile(parsed: list[tuple[datetime, float | None]]) -> dict:
    """24-hour weekday + weekend mean kW. Sample timestamp is the
    period-start, so `t.hour` is the hour the period belongs to.
    """
    wd_sum = [0.0] * 24
    wd_count = [0] * 24
    we_sum = [0.0] * 24
    we_count = [0] * 24

    for t, v in parsed:
        if v is None:
            continue
        hour = t.hour
        if t.weekday() >= 5:
            we_sum[hour] += v
            we_count[hour] += 1
        else:
            wd_sum[hour] += v
            wd_count[hour] += 1

    # Brief 19 Part 1a — hourly profile values are mean kWh-per-HH at that
    # hour; multiply by 2 for kW (same correction as _compute_stats).
    return {
        "weekday_24h": [round(s / c * 2, 2) if c else 0.0 for s, c in zip(wd_sum, wd_count)],
        "weekend_24h": [round(s / c * 2, 2) if c else 0.0 for s, c in zip(we_sum, we_count)],
    }


# ---------------------------------------------------------------------------
# Top-level
# ---------------------------------------------------------------------------

def read_half_hourly(source_data: Path, dist_dir: Path, log: list[str]) -> dict:
    """Read all real Stark CSVs in source_data. Write per-MPAN JSON +
    index. MPANs without a CSV → index entry with data_status: "pending".
    """
    log.append("")
    log.append("[Half-hourly] Brief 11 rewrite — real 3-col Stark CSVs")

    csvs = find_csvs(source_data)
    hh_dir = dist_dir / "half_hourly"
    hh_dir.mkdir(parents=True, exist_ok=True)

    log.append(f"  [Half-hourly] {len(csvs)} CSV file(s) found (prefix consumption_data_mpan_*)")

    if not csvs:
        log.append("  WARNING: no real Stark CSVs in source-data. HH UI will show 'pending' for all 12 MPANs.")

    # ----- Process each real CSV ----------------------------------------
    index_mpans: list[dict] = []
    by_site: dict[str, list[str]] = {}
    processed_mpans: set[str] = set()

    for csv_path in csvs:
        mpan = _extract_mpan(csv_path.name)
        if mpan is None or mpan not in _MPAN_TO_SITE:
            log.append(f"  WARNING: skipping CSV with no/unknown MPAN: {csv_path.name}")
            continue
        meta = _MPAN_TO_SITE[mpan]

        parsed = _parse_csv(csv_path, log)
        if not parsed:
            log.append(f"  WARNING: empty CSV {csv_path.name}")
            continue

        stats = _compute_stats(parsed)
        monthly = _compute_monthly(parsed)
        daily_profile = _compute_daily_profile(parsed)

        start_date = parsed[0][0].date().isoformat()
        end_date = parsed[-1][0].date().isoformat()

        payload = {
            "mpan": mpan,
            "site_id": meta["site_id"],
            "meter_label": meta["meter_label"],
            "interval_hours": 0.5,
            "start_date": start_date,
            "end_date": end_date,
            "years_covered": stats["years_covered"],
            "hh_data": [v if v is not None else 0 for _, v in parsed],
            "stats": stats,
            "monthly": monthly,
            "daily_profile": daily_profile,
            "data_status": "ready",
        }
        out_path = hh_dir / f"{mpan}.json"
        out_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        processed_mpans.add(mpan)

        log.append(
            f"  → {mpan} ({meta['site_id']}, {meta['meter_label']}): "
            f"{stats['period_count']} periods, {start_date} → {end_date} "
            f"({stats['years_covered']:.2f} yr), annual {stats['annual_kwh']:.0f} kWh, "
            f"peak {stats['peak_kw']:.1f} kW"
        )

        index_mpans.append({
            "mpan": mpan,
            "site_id": meta["site_id"],
            "meter_label": meta["meter_label"],
            "annual_kwh": stats["annual_kwh"],
            "peak_kw": stats["peak_kw"],            # MD in kW (max HH kWh × 2)
            "peak_hh_kwh": stats["peak_hh_kwh"],    # raw audit — max kWh per HH
            "years_covered": stats["years_covered"],
            "data_status": "ready",
        })
        by_site.setdefault(meta["site_id"], []).append(mpan)

    # ----- Pending MPANs (no real CSV yet) ------------------------------
    for mpan, meta in _MPAN_TO_SITE.items():
        if mpan in processed_mpans:
            continue
        index_mpans.append({
            "mpan": mpan,
            "site_id": meta["site_id"],
            "meter_label": meta["meter_label"],
            "annual_kwh": None,
            "peak_kw": None,
            "peak_hh_kwh": None,
            "years_covered": None,
            "data_status": "pending",
            "reason": "Stark export not yet pulled.",
        })
        by_site.setdefault(meta["site_id"], []).append(mpan)
        log.append(f"  ↻ {mpan} ({meta['site_id']}, {meta['meter_label']}): pending — Stark export not yet pulled")

        # Remove any stale per-MPAN JSON from a prior (placeholder) run
        stale = hh_dir / f"{mpan}.json"
        if stale.exists():
            stale.unlink()
            log.append(f"    removed stale {mpan}.json from placeholder run")

    # Stable ordering
    index_mpans.sort(key=lambda m: (m["site_id"], m["mpan"]))
    for site_id in by_site:
        by_site[site_id].sort()

    ready_count = sum(1 for m in index_mpans if m["data_status"] == "ready")
    pending_count = sum(1 for m in index_mpans if m["data_status"] == "pending")
    log.append(
        f"  [Half-hourly] {ready_count} ready / {pending_count} pending — "
        f"across {len(by_site)} sites"
    )

    return {"mpans": index_mpans, "by_site": by_site}
