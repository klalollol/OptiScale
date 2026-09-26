# Project Documentation Rules (Non-Obvious Only)

- `src/lib/preflight/` is browser-safe TS — no Node APIs. It is compiled by Vite as part of the main bundle.
- `src/services/` contains Node-only code excluded from the Vite bundle. Documentation about it does not apply to the browser page.
- `types/review.ts` is a type-only file outside `tsconfig.json`'s `include`. It defines the contract between `merge-report.mjs` and the UI — it is not importable from browser code.
- `templates/modernization/` files are **templates**, not source. They contain `@PLACEHOLDER@` tokens that get substituted at injection time. Reading them directly gives you the template, not the final output.
- The `src/lib/preflight/*.test.ts` files are plain assertion scripts (no test framework). Run them with `node --loader ts-node/esm <file>`. They are excluded from `tsconfig.json`.
- `merge-report.test.mjs` does NOT require a loader — it is plain ESM JavaScript.
- `bob_sessions/` folder is a dead artefact from a previous design; its SVGs are not referenced anywhere in the current page.
- The page has conceptual "pages" (upload/review, requirements/perf) but it is a single HTML file — there is no routing.
- Pipeline order: preflight blockers stop everything → static analysis always runs → `measured` tier requires Docker.
