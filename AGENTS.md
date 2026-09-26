# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project

Vanilla TypeScript + Vite multi-page application (no framework, no test runner). ESM-only (`"type": "module"`). JetBrains Mono is the sole font.

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

- `index.html` — redirects to the landing page at `src/pages/home/`
- `src/pages/<page>/index.html` — page DOM skeletons; CSS loaded via `<link>` from `src/css/`
- `src/data.ts` — shared and landing-page display data
- `src/pages/home/main.ts` — landing page renderer; imports `homeSteps` and `homeHighlights` from `../../data`
- `src/pages/app/app.ts` — five-step SPA controller; imports the ZIP analyzer and swipe helper
- `src/pages/<page>/` — each page's HTML and TypeScript entry point
- `src/css/` — shared and page-specific stylesheets
- `src/lib/preflight/` — pure TS library (browser-safe; no Node APIs); compiled by Vite
- `src/services/` — Node-only service (`harnessService.ts`); **excluded from tsconfig** (DOM types would conflict)
- `src/types/review.ts` — shared types for `merge-report.mjs`; referenced via JSDoc only
- `templates/modernization/` — harness templates copied verbatim (with `@PLACEHOLDER@` substitution) into `<project>/.modernization/`

### Landing page containers rendered by `src/pages/home/main.ts`

| ID | Data source |
|---|---|
| `#home-steps` | `homeSteps` array |
| `#home-highlights` | `homeHighlights` array |

## Code Style

- TypeScript `strict` + `noUnusedLocals` + `noUnusedParameters` — unused symbols are **compile errors**
- `moduleResolution: "Bundler"` — no `.js` extensions on local imports
- Landing-page display data lives in `src/data.ts`; rendering and DOM mutation stay in the corresponding `src/pages/<page>/` script
- CSS uses `--bg`, `--border`, `--border-bright`, `--cyan`, `--cyan-soft`, `--green`, `--amber`, `--muted`, `--red`, `--mono` — use these vars, never hard-coded values
- **Badge law**: `.badge-estimated` must never look like `.badge-measured`. Measured = cyan filled; estimated = amber outline only, transparent background. Never swap or unify these classes.

## UX / UI Design System

Blueprint / technical schematic aesthetic: dark navy, fine grid overlay, flat rectangular panels, 1px dividers, monospace everywhere.

### Colour Tokens (`:root` in `src/css/styles.css`)

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

- **Demo picker** (`#demo-picker`): its open state is `.is-open`; preserve `aria-expanded` synchronization and keyboard dismissal/navigation.
- **Swipe navigation** in the app advances only to the next unlocked workflow section and respects `prefers-reduced-motion`.

## Non-obvious

- Page HTML under `src/pages/` loads stylesheets from `src/css/` via `<link>` — do **not** import CSS in any `.ts` file (breaks the build silently).
- `src/services/harnessService.ts` and all `*.test.ts` files are excluded from `tsconfig.json` — they use Node APIs and must not be compiled by Vite.
- `src/types/review.ts` is included by `tsconfig.json`; used by `merge-report.mjs` via JSDoc `@type`.
- Harness injection contract: everything goes under `<project>/.modernization/`; the ONLY pre-existing file that may be modified is the root aggregator (`pom.xml` / `settings.gradle[.kts]`), backed up as `*.optiscale.bak` first, append-only.
- `revert()` in `harnessService.ts` verifies the post-revert SHA-256 tree hash against the value recorded before injection — throws if they differ.
- `FixtureReplay.java` returns a `VOID_SENTINEL` object (never `null`) so JMH Blackhole always has a non-null value.
- `Normalizer.java` rounds floating-point values to 9 significant digits (`MathContext(9)`) before equality comparison — the tolerance is 1e-9, not byte equality.
- `merge-report.mjs` always emits `"source": "estimated"` when an input file is missing — it never fabricates a number, it uses `0` as the value.
- `bob_sessions/` is unused by the current page (evidence section was removed in redesign).
