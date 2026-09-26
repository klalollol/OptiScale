#!/usr/bin/env node
/**
 * merge-report.test.mjs
 *
 * Tests for merge-report.mjs logic.
 * Extracted as pure functions to avoid file-system calls during test.
 *
 * Run with:  node templates/modernization/tools/merge-report.test.mjs
 */

// ── copied helpers (must stay in sync with merge-report.mjs) ─────────────────

function deltaPercent(legacy, modern) {
  if (!legacy || legacy === 0) return 0;
  return Math.round(((modern - legacy) / legacy) * 10_000) / 100;
}

function extractK6(summary, label) {
  if (!summary || !summary.metrics) return null;
  const dur  = summary.metrics['http_req_duration'];
  const rate = summary.metrics['http_reqs'];
  if (!dur || !rate) return null;
  return {
    label,
    p50:  dur.values['med']    ?? null,
    p95:  dur.values['p(95)']  ?? null,
    p99:  dur.values['p(99)']  ?? null,
    avg:  dur.values['avg']    ?? null,
    rps:  rate.values['rate']  ?? null,
  };
}

function extractJmh(jmhArray) {
  if (!Array.isArray(jmhArray)) return null;
  const pick = (substring) => {
    const entry = jmhArray.find(
      (e) => e.benchmark && e.benchmark.toLowerCase().includes(substring),
    );
    return entry ? entry.primaryMetric?.score ?? null : null;
  };
  const legacyNs = pick('legacy');
  const modernNs = pick('modern');
  if (legacyNs === null && modernNs === null) return null;
  return { legacyNs, modernNs };
}

function buildParityReport(raw, source) {
  if (!Array.isArray(raw)) {
    return {
      totalFixtures:     0,
      passed:            0,
      failed:            0,
      similarityPercent: 100,
      driftDetails:      [],
      source:            'estimated',
    };
  }
  const failed = raw.length;
  return {
    totalFixtures:     failed,
    passed:            0,
    failed,
    similarityPercent: failed === 0 ? 100 : 0,
    driftDetails: raw.map((r) => ({
      fixtureId:       r.id             ?? 'unknown',
      legacyResponse:  r.legacyResponse ?? '',
      modernResponse:  r.modernResponse ?? '',
    })),
    source,
  };
}

// ── assertion helpers ─────────────────────────────────────────────────────────

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function eq(a, b, msg) {
  if (a !== b) throw new Error(`FAIL: ${msg} — expected ${b}, got ${a}`);
}

// ── fixtures ──────────────────────────────────────────────────────────────────

const K6_SUMMARY = {
  metrics: {
    http_req_duration: {
      values: { med: 10, 'p(95)': 95, 'p(99)': 150, avg: 20 },
    },
    http_reqs: {
      values: { rate: 500 },
    },
  },
};

const JMH_ARRAY = [
  {
    benchmark: 'io.optiscale.bench.LatencyBenchmark.legacy',
    primaryMetric: { score: 1200 },
  },
  {
    benchmark: 'io.optiscale.bench.LatencyBenchmark.modern',
    primaryMetric: { score: 800 },
  },
];

const PARITY_ARRAY = [
  { id: 'order-1', legacyResponse: '{"status":"ok"}', modernResponse: '{"status":"error"}' },
];

// ── test: all inputs present ──────────────────────────────────────────────────
{
  const k6  = extractK6(K6_SUMMARY, 'legacy');
  assert(k6 !== null,     'extractK6: returns non-null for valid summary');
  eq(k6.p95, 95,          'extractK6: p95 extracted correctly');
  eq(k6.rps, 500,         'extractK6: rps extracted correctly');

  const jmh = extractJmh(JMH_ARRAY);
  assert(jmh !== null,    'extractJmh: returns non-null for valid array');
  eq(jmh.legacyNs, 1200,  'extractJmh: legacyNs extracted');
  eq(jmh.modernNs, 800,   'extractJmh: modernNs extracted');

  const parity = buildParityReport(PARITY_ARRAY, 'measured');
  eq(parity.source,  'measured',   'parity: source=measured when array provided');
  eq(parity.failed,  1,            'parity: failed count matches array length');
  eq(parity.driftDetails[0].fixtureId, 'order-1', 'parity: fixtureId preserved');

  console.log('✓ all-inputs-present: passed');
}

// ── test: k6 missing ─────────────────────────────────────────────────────────
{
  const k6Legacy = extractK6(null, 'legacy');
  const k6Modern = extractK6(null, 'modern');
  const source   = k6Legacy && k6Modern ? 'measured' : 'estimated';

  assert(k6Legacy === null,   'k6 missing: extractK6(null) returns null');
  eq(source, 'estimated',     'k6 missing: source degrades to estimated');

  // Metrics built with missing k6
  const legacyP95 = k6Legacy?.p95 ?? 0;
  eq(legacyP95, 0,            'k6 missing: legacyP95 defaults to 0');

  console.log('✓ k6-missing: passed');
}

// ── test: parity missing ──────────────────────────────────────────────────────
{
  const parity = buildParityReport(null, 'estimated');
  eq(parity.source,            'estimated', 'parity missing: source=estimated');
  eq(parity.totalFixtures,     0,           'parity missing: totalFixtures=0');
  eq(parity.similarityPercent, 100,         'parity missing: similarity defaults to 100 (vacuous)');
  eq(parity.driftDetails.length, 0,         'parity missing: no drift details');

  console.log('✓ parity-missing: passed');
}

// ── test: empty parity array (all fixtures passed) ────────────────────────────
{
  const parity = buildParityReport([], 'measured');
  eq(parity.failed,            0,    'parity empty: failed=0');
  eq(parity.similarityPercent, 100,  'parity empty: similarity=100');
  eq(parity.source,            'measured', 'parity empty: source=measured');

  console.log('✓ parity-empty-array: passed');
}

// ── test: JMH missing ────────────────────────────────────────────────────────
{
  const jmh = extractJmh(null);
  assert(jmh === null, 'JMH missing: extractJmh(null) returns null');

  const jmhEmpty = extractJmh([]);
  assert(jmhEmpty === null, 'JMH empty array: returns null (no matching benchmarks)');

  console.log('✓ jmh-missing: passed');
}

// ── test: deltaPercent edge cases ────────────────────────────────────────────
{
  eq(deltaPercent(0,   100), 0,    'deltaPercent: legacy=0 → 0 (no div-by-zero)');
  eq(deltaPercent(100, 80),  -20,  'deltaPercent: 100→80 = -20%');
  eq(deltaPercent(100, 120),  20,  'deltaPercent: 100→120 = +20%');

  console.log('✓ deltaPercent-edge-cases: passed');
}

console.log('\nmerge-report.test.mjs: all tests passed');
