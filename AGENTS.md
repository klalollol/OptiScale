# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project

Vanilla TypeScript + Vite static page (no framework, no test runner). ESM-only (`"type": "module"`). JetBrains Mono is the sole font — Inter was removed in the redesign.

## Commands

```bash
npm run dev      # dev server on port 5173 (binds 0.0.0.0)
npm run build    # tsc type-check + vite bundle → dist/
npm run preview  # preview built output on port 4173
```

No lint script, no test script.

## Architecture

- `index.html` — DOM skeleton; CSS loaded here via `<link>` (not imported in TS)
- `src/data.ts` — all typed content: `SubagentCard[]`, `CodeDiff`, `FooterStat[]`
- `src/main.ts` — queries container IDs and injects HTML strings; imports only from `./data`
- `src/styles.css` — full blueprint/grid design; all CSS vars defined in `:root`

### Container IDs rendered by `src/main.ts`

| ID | Data source |
|---|---|
| `#subagent-cards` | `subagentCards` array |
| `#diff-label`, `#diff-legacy`, `#diff-modern`, `#diff-parity` | `codeDiff` object |
| `#stats-footer` | `footerStats` array |

## Code Style

- TypeScript strict mode + `noUnusedLocals` + `noUnusedParameters` — unused symbols are **compile errors**
- `moduleResolution: "Bundler"` — no `.js` extensions on local imports
- All content data in `src/data.ts`; all DOM mutation in `src/main.ts` — keep this separation
- CSS uses `--bg`, `--border`, `--border-bright`, `--cyan`, `--cyan-soft`, `--green`, `--amber`, `--muted`, `--red`, `--mono` — use these vars, never hard-coded values
- `SubagentCard.status` values (`running`/`verifying`/`queued`) map directly to CSS class names on `.sa-status`
- `sa-progress-fill` colour modifier: `running` = no extra class (cyan default), `verifying` = `amber`, `queued` = `muted`
- Code diff HTML in `codeDiff.legacy` / `codeDiff.modern` uses inline `<span>` with classes `.kw`, `.ty`, `.fn`, `.cm`, `.st`, `.nu`, `.op` for syntax highlighting — these classes are defined in `src/styles.css`

## Non-obvious

- `index.html` references `./src/styles.css` directly; Vite resolves this at dev time — do NOT import CSS in TS
- The blueprint grid background is pure CSS (`background-image` with `linear-gradient` lines at `32px` intervals) — it is not an image file
- `codeDiff.legacy` / `codeDiff.modern` are assigned via `.innerHTML`, not `.textContent` — HTML entities and `<span>` tags in the strings are intentional
- `bob_sessions/` contains evidence SVGs referenced by hard-coded filename in the old HTML; the redesigned `index.html` no longer has an evidence section — that folder is now unused by the page
