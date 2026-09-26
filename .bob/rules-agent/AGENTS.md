# Project Coding Rules (Non-Obvious Only)

- All content data lives in `src/data.ts`; `src/pages/home/main.ts` renders the home page. Never add data inline in the render file.
- Page HTML lives in `src/pages/<page>/`; CSS is loaded via `<link>` from `src/css/` — adding a CSS `import` in any `.ts` file will break the build.
- `SubagentCard.status` values (`running`, `verifying`, `queued`) are applied as CSS class names on `.sa-status`; adding a new status requires a matching CSS rule in `src/css/styles.css`.
- The progress bar fill colour is controlled by an extra class on `.sa-progress-fill`: no class = cyan (running), `amber` = verifying, `muted` = queued. This is set in `src/pages/home/main.ts` via a ternary on `card.status`.
- `codeDiff.legacy` / `codeDiff.modern` strings contain raw HTML with `<span class="kw">` etc. — assign to `.innerHTML`, never `.textContent`. The span classes (`.kw`, `.ty`, `.fn`, `.cm`, `.st`, `.nu`, `.op`) must be defined in `src/css/styles.css`.
- TypeScript `strict` + `noUnusedLocals` + `noUnusedParameters` are all on — any unused symbol is a compile error. Run `npm run build` to validate before finishing changes.
- No test runner exists; `npm run dev` + browser is the only way to validate rendering changes.
- `src/services/harnessService.ts` uses Node APIs — it is excluded from `tsconfig.json` and must never be imported from browser-side code. Same for `*.test.ts` files.
- `src/types/review.ts` is included by `tsconfig.json` — reference it from Node scripts via JSDoc `@type {import('...')}`, never via runtime `import`.
- New container IDs added to `src/pages/home/index.html` require a matching `document.querySelector('#id')` block in `src/pages/home/main.ts` and sample data in `src/data.ts`.
- `.badge-estimated` (amber outline, transparent bg) must never share styles with `.badge-measured` (cyan filled). This is a non-negotiable UI contract.
- Preflight tier pill classes: `.tier-measured`, `.tier-estimated`, `.tier-unavailable` — all must be defined in CSS before use.
- Harness injection: `injectHarness()` must record tree SHA-256 BEFORE writing any file. `revert()` verifies this hash after restoring — mismatch throws.
- Template placeholders use `@UPPER_SNAKE_CASE@` syntax — `fillPlaceholders()` in `harnessService.ts` replaces them via regex `/@([A-Z_]+)@/g`.
- `run-bench.sh` exits `2` (not `1`) on build failure — callers check for exit code `2` specifically to fall back to `tier="estimated"`.
