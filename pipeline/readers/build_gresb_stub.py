"""GRESB Readiness stub — minimal placeholder data for Phase 1B.

Per the brief, the full GRESB Readiness scorecard arrives on Sunday with a
proper reader on the GRESB Site Classification + Data Coverage Calculator
workbooks (CA-X-2002, CA-X-2003). For tonight's demo, this stub provides:
current score, target score, asset growth, and 5 indicator strips.
"""

from __future__ import annotations


def build_gresb_stub(log: list[str]) -> dict:
    log.append("")
    log.append("[GRESB stub] Writing placeholder gresb_stub.json")
    return {
        "current_score_2025": 52,
        "target_score_2026": 62,
        "portfolio_change": {
            "assets_2025": 3,
            "assets_2026": 11,
        },
        "indicators_summary": {
            "data_coverage":      {"status": "improving",    "target_points": 5.5, "current_progress_pct": 35},
            "policies":           {"status": "in_progress",  "target_points": 4.3, "current_progress_pct": 50},
            "green_leases":       {"status": "scoping",      "target_points": 5.0, "current_progress_pct": 10},
            "esg_fit_out_guides": {"status": "not_started",  "target_points": 3.0, "current_progress_pct": 0},
            "breeam_in_use":      {"status": "scoping",      "target_points": 8.5, "current_progress_pct": 0},
        },
        "coming_soon_message": "Full GRESB Readiness scorecard arrives Sunday with indicator-by-indicator detail and submission roadmap.",
    }
