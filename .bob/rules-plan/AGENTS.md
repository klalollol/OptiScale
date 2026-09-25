# Project Architecture Rules (Non-Obvious Only)

- Single rendering pattern: `src/main.ts` queries a fixed set of container IDs (`#subagent-cards`, `#diff-label`, `#diff-legacy`, `#diff-modern`, `#diff-parity`, `#stats-footer`) and injects HTML strings. All other DOM structure (topbar, hero, SVG diagram, section labels, diff panel headers) is static in `index.html`.
- The code diff panel uses `.innerHTML` injection so the syntax-highlight `<span>` tags in `codeDiff.legacy` / `codeDiff.modern` are rendered as HTML — this is intentional.
- The blueprint grid is CSS-only (`background-image: linear-gradient` at `32px` intervals on `body`) — not an image or canvas. The grid colour token is `--grid`.
- The `subagent-grid` and `diff-panel` use `gap: 1px` with `background: var(--border)` on the parent to create divider lines between cells — not individual borders. Changing padding or background on child cells changes the apparent gap width.
- `sa-progress-fill` colour is determined by a JS ternary in `src/main.ts`, not by data — the `SubagentCard` type has no colour field. Status → class mapping is: `running`→(no class, cyan), `verifying`→`amber`, `queued`→`muted`.
- No build-time code splitting — single `<script type="module">` entry. Keep `src/data.ts` pure data; any import of a large library there will bloat the only bundle.
- `moduleResolution: "Bundler"` — Vite handles resolution; do not use `.js` suffixes on local imports.
