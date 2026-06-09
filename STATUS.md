# STATUS — decoded-demo

Last updated: 2026-06-10 (Phase 1 land — IVG branding stripped)

## Demo template setup

The repo is an anonymised demo template forked from `chrisscott06/ivg-esg-tool`
and reskinned for the fictional Westbrook Academies Trust. See `CLAUDE.md`
for the demo's context and `README.md` for how to run it locally.

The original IVG-engagement STATUS.md ran 147 KB of brief-and-chunk close
notes. That history isn't relevant to a demo audience and was wiped here.
Future demo-template work should append from this point onward, following
the same chapter-per-brief pattern the source tool used.

## Demo template chapters

### Phase 0 — Repo setup (2026-06-10)
Copy from source IVG tool, init git, set remote, baseline commit, push.
launch.bat added. vite port set to 5174 + strictPort. Source IVG repo's
`start.bat` deleted in the same step.

### Phase 1 — Strip client branding (2026-06-10)
Bulk text sweep "Inspired Villages [Group]" → "Westbrook Academies Trust"
and `\bIVG\b` → "Westbrook" across 63 source files (496 substitutions).
LogoLockup + PasswordGate rewritten as text-wordmark × NZA-logo lockup.
index.html title rebranded. eir/package.json name set to
"westbrook-trust-demo". Client logos at `eir/public/ivg-logo*.svg`
deleted. `docs/` engagement history wiped + replaced with a minimal
placeholder. Root `STATUS.md` and `README.md` and `CLAUDE.md` rewritten
to demo-template scope (deep palette + school list + provenance polish
deferred to Phase 5).

### Phase 2 — apply decodED palette (pending)
### Phase 3 — anonymise site names (pending)
### Phase 4 — randomise headline numbers ±10 % deterministic (pending)
### Phase 5 — metadata polish + final sweep (pending)
