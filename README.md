# OptiScale

**Optimize before you scale.**

OptiScale is a browser-based performance-analysis prototype for Python and FastAPI projects. Upload a ZIP, review heuristic findings and a suggested code change, then explore an illustrative benchmark comparison.

The five-step flow is **Upload → Analyze → Optimize → Benchmark → Prove**. It runs without a backend: ZIP analysis happens in the browser, and benchmark figures come from preset profiles rather than measurements of the uploaded project.

## Features

- Reads ZIP archives locally in the browser, including stored and deflate-compressed entries.
- Scans Python source for selected N+1 query patterns, unindexed foreign keys, and existing eager-loading optimizations.
- Injects a matching analysis profile into the Analyze, Optimize, Benchmark, and Prove sections.
- Includes three demo test cases with distinct outcomes: severe N+1, missing index, and an already-optimized baseline.
- Uses a blueprint-style interface built with vanilla TypeScript, Vite, and CSS custom properties.

## Run locally

Prerequisite: Node.js 18 or newer.

```bash
npm install
npm run dev
```

Vite serves the landing page at `http://localhost:5173/`. The routed landing page is `http://localhost:5173/src/pages/home/`; the main five-step app is `http://localhost:5173/src/pages/app/`.

```bash
npm run build
npm run preview
```

No environment variables or backend services are required.

## Project structure

```text
src/
	pages/
		home/       Landing page markup and renderer
		terms/      Consent checkpoint
		app/        Main five-step analysis flow and controller
		upload/     Standalone upload page
		analyze/    Standalone analysis page
		optimize/   Standalone optimization page
		benchmark/  Standalone benchmark page
		prove/      Standalone results page
	css/          Shared and page-specific stylesheets
	data.ts       Shared display data and homepage content
	demo-data.ts  Preset profile data for standalone pages
	lib/
		zip-analyzer.ts  Browser ZIP reader and Python pattern classifier
		preflight/       Archive and project checks used by the modernization tools
		suggestions/     Suggestion helpers
public/demo-zips/    ZIP files served to the main app's demo picker
demo-projects/       Source demo projects and test-case ZIP archives
templates/           Modernization harness templates
```

The Vite multi-entry configuration lives in `vite.config.ts`. Keep page HTML and TypeScript under `src/pages/<page>/`, and load CSS through HTML `<link>` elements.

## Demo cases

The main app's demo picker loads these archives from `public/demo-zips/`:

| Archive | Detected case | Example profile |
| --- | --- | --- |
| `tc-severe-n-plus-one.zip` | Nested N+1 query pattern | 12.3× throughput profile, approximately 92% lower latency |
| `tc-missing-index.zip` | Missing database index | 4.5× throughput profile, approximately 78% lower latency |
| `tc-no-bottleneck.zip` | Existing eager loading and indexes | Pass profile, approximately 1.02× throughput |

These are illustrative profiles, not measured results. The ZIPs are also stored under `demo-projects/` for inspection. For manual upload testing, place other ZIPs in the git-ignored `test-cases/` directory and use the app's upload control.

## ZIP analysis

`src/lib/zip-analyzer.ts` reads ZIP entries using browser APIs. It supports stored entries and deflate decompression through `DecompressionStream`, strips Python comments and docstrings before matching, and selects a preset profile based on recognized patterns. The current heuristics include:

- Nested loops with database queries in the inner loop (severe N+1).
- A database query inside one loop (N+1).
- Foreign-key columns without an index or a relevant composite index.
- Existing `joinedload`, `selectinload`, or `subqueryload` usage.

Treat findings as suggestions for review. The prototype does not modify uploaded files, and its benchmark numbers are simulated.

## Design system

The UI uses a dark navy blueprint grid, JetBrains Mono, flat panels, and cyan, green, amber, and red status colors. Shared CSS tokens are defined in `src/css/styles.css`; page-specific rules live alongside them in `src/css/`.

## Tests and checks

There is no general test runner. `npm run build` runs the TypeScript check and production bundle. Assertion-based checks are documented in [AGENTS.md](AGENTS.md), and the merge-report test can be run with:

```bash
node templates/modernization/tools/merge-report.test.mjs
```

## License

MIT
