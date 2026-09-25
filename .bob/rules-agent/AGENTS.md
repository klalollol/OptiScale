# Project Coding Rules (Non-Obvious Only)

- All content data lives in `src/data.ts`; `src/main.ts` only renders. Never add data inline in the render file.
- CSS is loaded via `<link>` in `index.html` — adding a CSS `import` in any `.ts` file will break the build.
- `SubagentCard.status` values (`running`, `verifying`, `queued`) are applied as CSS class names on `.sa-status`; adding a new status requires a matching CSS rule in `src/styles.css`.
- The progress bar fill colour is controlled by an extra class on `.sa-progress-fill`: no class = cyan (running), `amber` = verifying, `muted` = queued. This is set in `src/main.ts` via a ternary on `card.status`.
- `codeDiff.legacy` / `codeDiff.modern` strings contain raw HTML with `<span class="kw">` etc. — assign to `.innerHTML`, never `.textContent`. The span classes (`.kw`, `.ty`, `.fn`, `.cm`, `.st`, `.nu`, `.op`) must be defined in `src/styles.css`.
- TypeScript `strict` + `noUnusedLocals` + `noUnusedParameters` are all on — any unused symbol is a compile error. Run `npm run build` to validate before finishing changes.
- No test runner exists; `npm run dev` + browser is the only way to validate rendering changes.
