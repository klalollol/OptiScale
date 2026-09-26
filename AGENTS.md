# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project

Vanilla TypeScript + Vite static page (no framework, no test runner). ESM-only (`"type": "module"`). JetBrains Mono is the sole font.

## Commands

```bash
npm run dev      # dev server on port 5173 (binds 0.0.0.0)
npm run build    # tsc type-check + vite bundle → dist/
npm run preview  # preview built output on port 4173
```

**No lint script, no test runner.** Tests are plain TS/JS files that throw on failure:
- `node --loader ts-node/esm src/lib/preflight/preflight.test.ts`  — preflight + detectJavaVersion
- `node --loader ts-node/esm src/lib/preflight/revert.test.ts`     — tree-hash revert proof
- `node --loader ts-node/esm src/lib/preflight/math.test.ts`       — percentage math
- `node templates/modernization/tools/merge-report.test.mjs`       — merge-report (plain Node, no loader needed)

`npm run build` is the only validation available for browser-side TS.

## Architecture

- `index.html` — DOM skeleton; CSS loaded here via `<link>` (not imported in TS)
- `src/data.ts` — **all content data lives here**; `src/main.ts` only renders
- `src/main.ts` — queries container IDs and injects HTML strings; imports only from `./data`
- `src/lib/preflight/` — pure TS library (browser-safe; no Node APIs); compiled by Vite
- `src/services/` — Node-only service (`harnessService.ts`); **excluded from tsconfig** (DOM types would conflict)
- `src/types/review.ts` — shared types for `merge-report.mjs`; referenced via JSDoc only
- `templates/modernization/` — harness templates copied verbatim (with `@PLACEHOLDER@` substitution) into `<project>/.modernization/`

### Container IDs rendered by `src/main.ts`

| ID | Data source |
|---|---|
| `#subagent-cards` | `subagentCards` array |
| `#diff-label`, `#diff-legacy`, `#diff-modern`, `#diff-parity` | `codeDiff` object |
| `#stats-footer` | `footerStats` array |
| `#preflight-checks` | `samplePreflightPanel` (Page 2 upload section) |
| `#review-btn` | disabled while any `blocker`+`fail` check exists |
| `#requirements-panel` | `samplePreflightPanel` (Page 3 requirements section) |
| `#perf-table` | `samplePerfMetrics` array |

## Code Style

- TypeScript `strict` + `noUnusedLocals` + `noUnusedParameters` — unused symbols are **compile errors**
- `moduleResolution: "Bundler"` — no `.js` extensions on local imports
- All content data in `src/data.ts`; all DOM mutation in `src/main.ts` — keep this separation
- CSS uses `--bg`, `--border`, `--border-bright`, `--cyan`, `--cyan-soft`, `--green`, `--amber`, `--muted`, `--red`, `--mono` — use these vars, never hard-coded values
- `SubagentCard.status` values (`running`/`verifying`/`queued`) map directly to CSS class names on `.sa-status`
- `sa-progress-fill` colour modifier: `running` = no extra class (cyan default), `verifying` = `amber`, `queued` = `muted`
- Code diff HTML in `codeDiff.legacy` / `codeDiff.modern` — assign to `.innerHTML`, never `.textContent`
- **Badge law**: `.badge-estimated` must never look like `.badge-measured`. Measured = cyan filled; estimated = amber outline only, transparent background. Never swap or unify these classes.

## UX / UI Design System

Blueprint / technical schematic aesthetic: dark navy, fine grid overlay, flat rectangular panels, 1px dividers, monospace everywhere.

### Colour Tokens (`:root` in `src/styles.css`)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0b1929` | Page background |
| `--grid` | `rgba(30,58,95,0.55)` | Blueprint grid (background-image only) |
| `--border` | `rgba(30,70,110,0.7)` | All panel borders |
| `--border-bright` | `rgba(0,188,212,0.35)` | Active/highlighted borders |
| `--text` | `#cce8f4` | Body text |
| `--muted` | `#5a7a99` | Labels, secondary text, disabled |
| `--cyan` | `#00bcd4` | Primary accent |
| `--cyan-soft` | `rgba(0,188,212,0.12)` | Tinted backgrounds |
| `--green` | `#4ade80` | Success / live dot |
| `--amber` | `#f59f00` | Warning / legacy side |
| `--red` | `#f87171` | Error / blocker |
| `--mono` | `'JetBrains Mono', monospace` | Only font |

### Layout Rules
- Max content width: `min(1100px, calc(100% - 40px))`, centred.
- Multi-column panels use `gap: 1px` + `background: var(--border)` on the **parent**; children set `background: var(--bg)`. Never add individual borders to cells.
- No `border-radius > 4px` on panels or grid cells.
- No hover states that change layout or size — colour/opacity transitions only.
- No rounded cards with box-shadows, no gradients on content panels, no second font.
- Blueprint grid (`32px` intervals, `linear-gradient`) lives on `body` — must not be overridden.

### Component Patterns

- **Status badges** (`.sa-status`): colour comes from CSS class only, never inline style.
- **Preflight checks**: icon + severity are driven by `status`+`severity` combo; `skip` rows use `–` icon and muted colour, `blocker` rows use `✕` and `--red`, `warning` uses `⚠` and `--amber`, `pass` uses `✓` and `--green`.
- **Tier pill** (`.preflight-tier`): `.tier-measured` = cyan, `.tier-estimated` = amber, `.tier-unavailable` = red.
- **Perf delta**: `.delta-good` (green) for latency improvement (negative %) or throughput gain (positive %); `.delta-bad` (red) otherwise; `.delta-neutral` for zero.
- **SVG diagram**: inline in `index.html`, `viewBox="0 0 320 200"` — do not replace with `<canvas>` or `<img>`.

## Non-obvious

- `index.html` loads `./src/styles.css` via `<link>` — do **not** import CSS in any `.ts` file (breaks the build silently).
- `src/services/harnessService.ts` and all `*.test.ts` files are excluded from `tsconfig.json` — they use Node APIs and must not be compiled by Vite.
- `src/types/review.ts` is included by `tsconfig.json`; used by `merge-report.mjs` via JSDoc `@type`.
- Harness injection contract: everything goes under `<project>/.modernization/`; the ONLY pre-existing file that may be modified is the root aggregator (`pom.xml` / `settings.gradle[.kts]`), backed up as `*.optiscale.bak` first, append-only.
- `revert()` in `harnessService.ts` verifies the post-revert SHA-256 tree hash against the value recorded before injection — throws if they differ.
- `FixtureReplay.java` returns a `VOID_SENTINEL` object (never `null`) so JMH Blackhole always has a non-null value.
- `Normalizer.java` rounds floating-point values to 9 significant digits (`MathContext(9)`) before equality comparison — the tolerance is 1e-9, not byte equality.
- `merge-report.mjs` always emits `"source": "estimated"` when an input file is missing — it never fabricates a number, it uses `0` as the value.
- `bob_sessions/` is unused by the current page (evidence section was removed in redesign).
