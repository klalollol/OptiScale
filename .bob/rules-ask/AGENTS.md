# Project Documentation Rules (Non-Obvious Only)

- `src/lib/preflight/` is browser-safe TS — no Node APIs. It is compiled by Vite as part of the main bundle.
- `src/lib/suggestions/` is also browser-safe — it contains the anti-pattern detection engine. `AntiPattern.beforeCode`/`afterCode` are canonical illustrative snippets, not generated from the uploaded project.
- `src/services/` contains Node-only code excluded from the Vite bundle. Documentation about it does not apply to the browser page.
- `src/types/review.ts` is a type-only file included by `tsconfig.json`. It defines the contract between `merge-report.mjs` and the UI; Node scripts reference it via JSDoc, not runtime imports.
- `templates/modernization/` files are **templates**, not source. They contain `@PLACEHOLDER@` tokens that get substituted at injection time. Reading them directly gives you the template, not the final output.
- The `src/lib/preflight/*.test.ts` files are plain assertion scripts (no test framework). Run them with `node --loader ts-node/esm <file>`. They are excluded from `tsconfig.json`.
- `merge-report.test.mjs` does NOT require a loader — it is plain ESM JavaScript.
- `bob_sessions/` folder is a dead artefact from a previous design; its SVGs are not referenced anywhere in the current page.
- The project has **two separate data layers**: `src/data.ts` feeds only `index.html`/`src/main.ts`; `src/demo-data.ts` feeds all inner pipeline pages. They are not interchangeable.
- `app.html` is a single-page app with all 5 pipeline sections in one DOM (revealed/scrolled). The other pages (`upload.html`, `analyze.html`, etc.) are separate standalone pages — there is no client-side router.
- Pipeline order: preflight blockers stop everything → static analysis always runs → `measured` tier requires Docker.
