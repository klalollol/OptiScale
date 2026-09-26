# Project Architecture Rules (Non-Obvious Only)

- **Two separate compilation targets**: Vite bundles `src/` (browser, DOM types); `src/services/` and `*.test.ts` are Node-only and excluded from `tsconfig.json`. Adding a Node import to `src/` or `src/lib/` will fail silently at type-check but crash at runtime.
- `src/lib/preflight/`, `src/lib/suggestions/`, and `src/data.ts`/`src/demo-data.ts` must stay browser-safe — no `node:fs`, no `node:crypto`, no `node:child_process`.
- **Two distinct data layers**: `src/data.ts` → `src/main.ts` → `index.html` DOM. `src/demo-data.ts` → inner pipeline page TS modules. They must never be merged; inner pages do not use `src/main.ts`.
- **Multi-page Vite build**: 8 entry points declared in `vite.config.ts` `rollupOptions.input`. Every new page requires both an HTML file and a TS entry registered there. CSS is not bundled into JS — it is loaded via `<link>` in each HTML file.
- **CSS cascade for inner pages** (order matters): `styles.css` (base) → `upload.css` (topbar) → `pages.css` (page hero/steps) → `app.css` (SPA-only, only `app.html`). Missing a layer = missing styles with no error.
- **Harness injection contract** (non-negotiable):
  - Everything generated goes under `<project>/.modernization/` — nothing else.
  - Only the root aggregator (`pom.xml` / `settings.gradle[.kts]`) may be modified.
  - Back it up as `*.optiscale.bak` BEFORE any modification; append-only, never regenerate.
  - SHA-256 of the project tree (excluding `.modernization/`) is recorded before injection; `revert()` verifies it afterwards.
- **Pipeline order must be preserved**: unzip → `runPreflight` → if blockers, stop and render; if clean, static analysis; if `measured` tier and Docker available, `injectHarness` → `runBench`. Always call `revert()` in `finally`.
- `run-bench.sh` exits `2` on build failure — this is the caller's signal to downgrade to `estimated` tier. Exit `1` means a different error.
- **Sandbox requirements are non-negotiable**: `internal: true` network, `read_only` rootfs + `tmpfs /tmp`, `cap_drop: ALL`, `no-new-privileges`, `pids_limit`, CPU/memory limits, images deleted after run. Never relax these for untrusted uploaded code.
- Zip-slip check must happen before any file is written to disk — reject archives with `..` or absolute paths at the `ArchiveEntry[]` level.
- `merge-report.mjs` must never emit a fabricated number. Missing input → value `0`, source `"estimated"`. This invariant is tested in `merge-report.test.mjs`.
- `Normalizer.java` uses `MathContext(9)` (9 significant digits) for numeric tolerance — this is not configurable and intentionally ignores sub-1e-9 floating-point variance.
- `FixtureReplay.java` uses per-classifier `URLClassLoader` instances to isolate legacy and modern classes. Both loaders must be closed in `TearDown` to release JAR file handles.
