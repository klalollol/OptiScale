/**
 * Percentage math tests — change %, similarity %, LOC delta %.
 * Run with:  node --loader ts-node/esm src/lib/preflight/math.test.ts
 */

// ─── the functions under test (inlined here, also used by merge-report) ──────

/** (modern - legacy) / legacy * 100, rounded to 2 dp.  Positive = faster/better. */
export function changePercent(legacy: number, modern: number): number {
  if (legacy === 0) return 0;
  return Math.round(((modern - legacy) / legacy) * 10_000) / 100;
}

/**
 * Parity similarity: passed fixtures / total * 100, rounded to 2 dp.
 */
export function similarityPercent(passed: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((passed / total) * 10_000) / 100;
}

/**
 * LOC delta percent relative to legacy LOC, rounded to 2 dp.
 * Negative = modern is smaller (good).
 */
export function locDeltaPercent(legacyLoc: number, modernLoc: number): number {
  if (legacyLoc === 0) return 0;
  return Math.round(((modernLoc - legacyLoc) / legacyLoc) * 10_000) / 100;
}

// ─── assertion helper ─────────────────────────────────────────────────────────
function eq(a: number, b: number, msg: string): void {
  if (a !== b) throw new Error(`FAIL: ${msg} — expected ${b}, got ${a}`);
}

// ─── changePercent ────────────────────────────────────────────────────────────
eq(changePercent(100, 80),   -20,   'changePercent: 100→80 = -20%');
eq(changePercent(100, 120),   20,   'changePercent: 100→120 = +20%');
eq(changePercent(100, 100),    0,   'changePercent: no change = 0%');
eq(changePercent(0,   50),     0,   'changePercent: legacy=0 → 0 (no div-by-zero)');
eq(changePercent(200, 150),  -25,   'changePercent: 200→150 = -25%');
eq(changePercent(3,     2),  Math.round((-1/3)*10_000)/100, 'changePercent: 3→2 fractional');

// ─── similarityPercent ────────────────────────────────────────────────────────
eq(similarityPercent(1204, 1204), 100,  'similarity: all pass = 100%');
eq(similarityPercent(0,    1204),   0,  'similarity: none pass = 0%');
eq(similarityPercent(975,  1204), Math.round((975/1204)*10_000)/100, 'similarity: 975/1204');
eq(similarityPercent(0,       0), 100,  'similarity: empty → 100% (vacuous)');

// ─── locDeltaPercent ──────────────────────────────────────────────────────────
eq(locDeltaPercent(1000, 800),  -20,   'locDelta: 1000→800 = -20%');
eq(locDeltaPercent(1000, 1200),  20,   'locDelta: 1000→1200 = +20%');
eq(locDeltaPercent(1000, 1000),   0,   'locDelta: unchanged = 0%');
eq(locDeltaPercent(0,     500),   0,   'locDelta: legacyLoc=0 → 0 (no div-by-zero)');
eq(locDeltaPercent(500,   250),  -50,  'locDelta: halved = -50%');

console.log('math.test.ts: all assertions passed');
