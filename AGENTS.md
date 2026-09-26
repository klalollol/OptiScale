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

## UX / UI Design System

### Visual Language
OptiScale uses a **blueprint / technical schematic** aesthetic: dark navy background with a fine grid overlay, flat rectangular panels separated by single-pixel lines, and a monospace font throughout. No rounded cards, no drop shadows, no gradients on content panels. Every element should feel like it belongs on an engineering dashboard.

### Colour Tokens (all in `:root`, `src/styles.css`)

| Token | Hex / value | Usage |
|---|---|---|
| `--bg` | `#0b1929` | Page background |
| `--grid` | `rgba(30,58,95,0.55)` | Blueprint grid lines (background-image only) |
| `--border` | `rgba(30,70,110,0.7)` | All panel/section borders and divider lines |
| `--border-bright` | `rgba(0,188,212,0.35)` | Highlighted/active borders (cyan-accent elements) |
| `--text` | `#cce8f4` | Body text |
| `--muted` | `#5a7a99` | Labels, metadata, secondary text, disabled states |
| `--cyan` | `#00bcd4` | Primary accent — active states, links, highlights |
| `--cyan-soft` | `rgba(0,188,212,0.12)` | Tinted backgrounds for cyan-accent elements |
| `--green` | `#4ade80` | Success / live status dot |
| `--amber` | `#f59f00` | Warning / in-progress / legacy code side |
| `--red` | `#f87171` | Error / failure states |
| `--mono` | `'JetBrains Mono', monospace` | The only font; applied to `body` |

**Rule:** Never use a hard-coded colour value anywhere in the CSS or inline styles. Always reference a token.

### Typography
- **Font**: JetBrains Mono exclusively — no other typeface is permitted.
- **Base**: `13px`, `line-height: 1.6` on `body`
- **Hero headline**: `clamp(1.7rem, 3.5vw, 2.6rem)`, weight `700`, `letter-spacing: -0.02em`, colour `#ffffff`
- **Section labels** (eyebrows): `0.68rem`, `letter-spacing: 0.12em`, `text-transform: uppercase`, colour `--muted`
- **Card titles** (`.sa-title`): `1rem`, weight `700`, colour `#ffffff`
- **Body/description text**: `0.78–0.84rem`, colour `--muted`, `line-height: 1.65–1.75`
- **Metadata / progress counters**: `0.68rem`, colour `--muted`; percentages use `--cyan`
- **Stats numbers** (`.stat-num`): `clamp(2rem, 4vw, 3rem)`, weight `700`, `letter-spacing: -0.04em`, colour `#ffffff`

### Layout Principles
- Max content width: `min(1100px, calc(100% - 40px))`, centred.
- Sections are stacked vertically and separated by `border-bottom: 1px solid var(--border)`. Padding is `40px 0` per section.
- **Multi-column panels** (subagent grid, diff panel, stats footer) use `gap: 1px` + `background: var(--border)` on the **parent** to produce divider lines — child cells set `background: var(--bg)`. Do not add individual borders to cells.
- The hero is a 2-column `1fr 1fr` grid (left: headline + text + pills; right: SVG diagram). The diagram column is hidden at `≤860px`.
- The blueprint grid background (`32px` intervals, `linear-gradient` lines) must remain on `body` and must not be overridden by any child panel background.

### Component Patterns

**Status badges** (`.sa-status`): small `0.65rem` pill, `border-radius: 3px`, `lowercase` text, `border: 1px solid`. Three states — colour comes from CSS class only, never inline style:
- `.running` → cyan border + cyan-soft background
- `.verifying` → amber border + amber tint
- `.queued` → muted border + transparent background

**Progress bars**: `3px` track (`--border` background), fill with `border-radius: 2px`. Colour modifier classes on `.sa-progress-fill`: no class = `--cyan`, `.amber` = `--amber`, `.muted` = `--muted` at 40% opacity.

**Pills** (`.pill`): `0.72rem`, `border-radius: 4px`, `letter-spacing: 0.04em`. Three variants: `.label` (muted text, transparent bg, border), `.value` (cyan text, cyan-soft bg, bright border), `.arrow` (muted, no border, minimal padding).

**Diff panel**: two columns separated by a `1px` divider. Legacy side header uses `--amber`; modern side uses `--cyan`. Code inside uses `<pre class="diff-code">` with syntax spans (`.kw`, `.ty`, `.fn`, `.cm`, `.st`, `.nu`, `.op`). The parity confirmation line below uses `--green`, centred, `0.72rem`.

**SVG diagram**: inline in `index.html`, `viewBox="0 0 320 200"`. Hex shapes in `--cyan` (`#00bcd4`), connecting lines in `--border` (`#1e3a5f`), source node amber, target node green, labels in `--cyan`. Do not replace with a canvas or img tag.

**Pulsing live dot** (`.status-dot`): `8px` circle, `--green`, `@keyframes pulse` opacity `1→0.4→1` over `2s ease-in-out`.

### What to Never Do
- Do not add rounded cards with box-shadows (the previous design used these — they were intentionally removed)
- Do not introduce a second font family
- Do not add gradients to panel backgrounds
- Do not use `border-radius > 4px` on any panel or grid cell (pills and badges can use small radii)
- Do not add hover states that change layout or size — only colour/opacity transitions are appropriate
- Do not add new CSS colour values outside `:root` tokens

## Non-obvious

- `index.html` references `./src/styles.css` directly; Vite resolves this at dev time — do NOT import CSS in TS
- The blueprint grid background is pure CSS (`background-image` with `linear-gradient` lines at `32px` intervals) — it is not an image file
- `codeDiff.legacy` / `codeDiff.modern` are assigned via `.innerHTML`, not `.textContent` — HTML entities and `<span>` tags in the strings are intentional
- `bob_sessions/` contains evidence SVGs referenced by hard-coded filename in the old HTML; the redesigned `index.html` no longer has an evidence section — that folder is now unused by the page
