# Project Documentation Context (Non-Obvious Only)

- This is a **hackathon concept demo** — intentionally no backend, router, state management, or test suite.
- Zero runtime dependencies; only `typescript` and `vite` as devDependencies.
- The project was fully redesigned: the old multi-section layout (hero stats, pipeline cards, impact metrics, migration map, parity reports, deploy artifacts) was replaced by a single-page blueprint/grid design with three sections: subagent status cards, a code diff panel, and a footer stats row.
- `bob_sessions/` still exists but is no longer referenced anywhere in `index.html` after the redesign — it is vestigial.
- The inline SVG pipeline diagram (hexagons showing monolith → refactor/parity/ci-cd → cloud) is hardcoded in `index.html`, not generated from `src/data.ts`.
- There is no linter (no ESLint/Prettier). TypeScript compiler strictness is the only quality gate.
