# ◇ OptiScale

**Optimize before you scale.**

OptiScale is an AI-powered application performance optimization platform. Upload your Python/FastAPI project as a ZIP, let BOB analyze the codebase for performance bottlenecks, apply the proposed optimization, run a fair benchmark, and prove the improvement — all in one guided flow.

```
Vanilla TypeScript   Vite   JetBrains Mono   No framework   No backend required
```

---

## 🤖 Built with IBM Bob

This entire project was developed in partnership with **IBM Bob** as an AI development assistant.

OptiScale demonstrates how IBM Bob accelerates software development by turning ideas into production-ready applications in record time. What would typically take 40–50 hours was completed in significantly less time with Bob's assistance.

### Bob's Impact

| Metric | Value |
|--------|-------|
| Pages Built | 8 HTML entry points (landing, terms, SPA + 5 standalone pages) |
| TypeScript Files | 10 source files with strict mode + `noUnusedLocals` |
| CSS Files | 5 design-system stylesheets (zero framework dependencies) |
| Complex Problems Solved | ZIP binary parsing, browser-side regex analyzer, multi-state SPA, fair benchmark simulation |
| Design System | Blueprint/terminal aesthetic built from scratch with CSS custom properties |

### How Bob Was Used

- **Architecture** — Bob designed the multi-entry Vite build, SPA section-unlock flow, and state management
- **ZIP Analyzer** — Bob implemented the browser-side ZIP binary reader + Python regex pattern classifier
- **UI/UX** — Bob created the blueprint/terminal dark navy design system with cyan accents and JetBrains Mono
- **Problem Solving** — Bob resolved TypeScript strict-mode errors, regex precedence bugs, and docstring false-positives
- **Test Cases** — Bob generated 3 distinct FastAPI projects with measurably different performance profiles
- **Documentation** — Bob wrote this README and all inline code documentation

---

## 🎯 What OptiScale Does

OptiScale guides developers through a 5-step performance optimization pipeline:

```
01 UPLOAD → 02 ANALYZE → 03 OPTIMIZE → 04 BENCHMARK → 05 PROVE
```

| Step | Description |
|------|-------------|
| **UPLOAD** | Drop a `.zip` of your FastAPI project. OptiScale reads it in the browser. |
| **ANALYZE** | BOB scans the Python source for performance anti-patterns using regex heuristics. |
| **OPTIMIZE** | A concrete code change is proposed with a before/after diff. |
| **BENCHMARK** | A simulated fair benchmark runs both the original and optimized versions. |
| **PROVE** | Side-by-side metrics prove the improvement with throughput, latency, CPU, and memory numbers. |

The entire pipeline runs **without a backend** — ZIP analysis is heuristic, benchmark results are preset profiles matched to the detected pattern. The architecture is designed so real API responses can replace mock data later.

---

## ✨ Features

### Browser-side ZIP Analysis
- Reads `.zip` binary format natively in the browser (no server upload needed)
- Supports both stored (method 0) and deflate-compressed (method 8) entries via `DecompressionStream`
- Strips Python comments and docstrings before pattern matching to avoid false positives

### Intelligent Pattern Classification
- **Severe N+1** — nested for-loop with `db.query()` inside the inner loop → 12.3× improvement profile
- **N+1** — single for-loop with `db.query()` in the body → 2.57× improvement profile
- **Missing Index** — unindexed `ForeignKey` columns with no `__table_args__` composite index → 4.5× improvement profile
- **Already Optimized** — uses `joinedload` / `selectinload` → PASS profile (1.02×, no changes needed)

### Dynamic Result Injection
Every section of the SPA (ANALYZE, OPTIMIZE, BENCHMARK, PROVE) renders from the detected profile — different ZIPs produce genuinely different results across all metrics, code diffs, file locations, and comparison tables.

### Blueprint / Terminal Aesthetic
Dark navy background, fine grid overlay, 1px dividers, flat rectangular panels, JetBrains Mono everywhere, cyan/amber/green/red status colors — no framework, no component library, pure CSS custom properties.

### Demo Mode
Three prebuilt demo projects selectable from the upload screen — each triggers a different analysis profile for presentation without preparing a ZIP file.

---

## 🛠️ Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Language | TypeScript 5.6 (strict) | `noUnusedLocals` + `noUnusedParameters` enforced |
| Bundler | Vite 5 | Multi-entry build, 8 HTML pages |
| Font | JetBrains Mono | Only font used throughout |
| CSS | Vanilla CSS with custom properties | No Tailwind, no CSS-in-JS |
| ZIP parsing | Native browser APIs | `DecompressionStream`, `ArrayBuffer`, `TextDecoder` |
| Routing | Multi-page (Vite `rollupOptions.input`) | No client-side router |
| Backend | None | All analysis is frontend heuristics |

---

## 🚀 Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Type-check + production build → dist/
npm run build

# Preview production build (http://localhost:4173)
npm run preview
```

No environment variables required. Everything runs in the browser.

---

## 📁 Project Structure

```
OptiScale/
├── index.html              # Landing page
├── terms.html              # Terms of use checkpoint
├── app.html                # Main SPA (all 5 pipeline steps)
├── upload.html             # Standalone upload page
├── analyze.html            # Standalone analyze page
├── optimize.html           # Standalone optimize page
├── benchmark.html          # Standalone benchmark page
├── prove.html              # Standalone results page
│
├── src/
│   ├── styles.css          # Global design tokens + shared components
│   ├── upload.css          # Upload drop zone + demo picker styles
│   ├── pages.css           # Inner-page shared styles (bottleneck, diff, bench, prove)
│   ├── app.css             # SPA-specific layout styles
│   ├── terms.css           # Terms page styles
│   │
│   ├── main.ts             # Landing page renderer
│   ├── terms.ts            # Terms page → routes to app.html on consent
│   ├── upload.ts           # Standalone upload page logic
│   ├── analyze.ts          # Standalone analyze page
│   ├── optimize.ts         # Standalone optimize page state machine
│   ├── benchmark.ts        # Standalone benchmark progress simulation
│   ├── prove.ts            # Standalone results page
│   ├── app.ts              # Main SPA controller (all 5 sections, profile injection)
│   │
│   ├── data.ts             # Landing page content data (subagentCards, codeDiff, etc.)
│   ├── demo-data.ts        # Mock data constants for standalone pages
│   │
│   └── lib/
│       ├── zip-analyzer.ts         # Browser ZIP reader + Python pattern classifier
│       ├── preflight/              # Preflight check utilities
│       └── suggestions/            # Suggestion engine
│
├── public/
│   └── demo-zips/
│       ├── sample-fastapi-ecommerce.zip   # Demo 1: N+1 pattern
│       ├── sample-fastapi-inventory.zip   # Demo 2: Missing index
│       └── sample-fastapi-analytics.zip   # Demo 3: Already optimized
│
├── demo-projects/          # Source files used to generate demo ZIPs
│   ├── sample-fastapi-ecommerce/
│   ├── sample-fastapi-inventory/
│   └── sample-fastapi-analytics/
│
├── test-cases/             # Test ZIPs for manual upload testing (git-ignored)
│   ├── README.md
│   ├── tc-severe-n-plus-one.zip    # 3-level nested N+1 → 12.3× result
│   ├── tc-missing-index.zip        # Unindexed FK → 4.5× result
│   └── tc-no-bottleneck.zip        # Already optimized → PASS result
│
├── templates/              # Harness templates for modernization pipeline
├── types/                  # Shared TypeScript types (JSDoc only, outside Vite bundle)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🧪 Test Cases

Three ready-to-use test ZIPs are included in `test-cases/` to demonstrate distinct analysis outcomes:

| ZIP File | Bottleneck | Severity | Result |
|----------|-----------|----------|--------|
| `tc-severe-n-plus-one.zip` | 3-level nested N+1 (1,001+ queries/req) | 🔴 CRITICAL | **12.3× throughput**, −92% latency |
| `tc-missing-index.zip` | Unindexed FK columns, full table scans | 🟡 MODERATE | **4.5× throughput**, −78% latency |
| `tc-no-bottleneck.zip` | Already uses `joinedload` + composite indexes | 🟢 PASS | **1.02× throughput**, −4% latency |

Drop any of these into the upload zone on `app.html` to see a different result flow.

### Adding Your Own Test Cases

Place any `.zip` of a FastAPI/Python project in `test-cases/` — the folder is git-ignored. Files are not committed.

---

## 🎨 Design System

OptiScale uses a **blueprint / technical schematic** aesthetic throughout.

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0b1929` | Page background |
| `--border` | `rgba(30,70,110,0.7)` | All panel borders |
| `--border-bright` | `rgba(0,188,212,0.35)` | Active/highlighted borders |
| `--text` | `#cce8f4` | Body text |
| `--muted` | `#5a7a99` | Labels, secondary text |
| `--cyan` | `#00bcd4` | Primary accent |
| `--green` | `#4ade80` | Success / pass |
| `--amber` | `#f59f00` | Warning / moderate |
| `--red` | `#f87171` | Error / critical |

### Layout Rules
- Max content width: `min(1100px, calc(100% - 40px))`, centred
- `gap: 1px` + `background: var(--border)` on multi-column parent — children set `background: var(--bg)`
- No `border-radius > 4px` on panels
- No hover states that change layout — colour/opacity transitions only
- Blueprint grid lives on `body` (32px intervals, `linear-gradient`)

---

## 🔬 How the ZIP Analyzer Works

`src/lib/zip-analyzer.ts` runs entirely in the browser:

1. **Parse ZIP binary** — reads local file headers, extracts entries, decompresses deflate (method 8) via `DecompressionStream`
2. **Strip noise** — removes Python docstrings and `#` comments to prevent false positives from English prose
3. **Run patterns** — applies regex patterns against comment-stripped source in priority order:
   - `severeN1` — two nested `for` loops with `db.query()` in the inner body
   - `n1` — one `for` loop with `db.query()` assignment in the body
   - `unindexedFk` — `ForeignKey(...)` column without `index=True` on the same line, and no `__table_args__` composite index
   - `alreadyOptimized` — calls to `joinedload(`, `selectinload(`, `subqueryload(`
4. **Map to profile** — selects a preset `AnalysisProfile` matching the detected pattern
5. **Inject into DOM** — `injectProfile()` in `app.ts` writes all values to ~40 named element IDs across §2–§5

---

## 📋 MVP Support

The current analysis engine targets:

| Stack | Version |
|-------|---------|
| Language | Python 3.10 / 3.11 |
| Framework | FastAPI |
| ORM | SQLAlchemy 2.x |
| Database | PostgreSQL |

---

## 🗺️ Roadmap

- [ ] Real backend — replace mock `analyzeZip()` with an actual BOB API call
- [ ] Java / Spring Boot support — extend pattern library
- [ ] Export — download results as PDF or JSON
- [ ] GitHub integration — analyze a repo URL without manual ZIP export
- [ ] Multi-file diff — show all changed files, not just the primary bottleneck
- [ ] Persistent sessions — save analysis results across page reloads

---

## 📄 License

MIT

---

*Developed with IBM Bob · Optimize before you scale.*
