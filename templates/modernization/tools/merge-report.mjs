#!/usr/bin/env node
/**
 * merge-report.mjs
 *
 * Reads:
 *   <out>/k6-legacy.json
 *   <out>/k6-modern.json
 *   <out>/jmh.json
 *   <out>/parity-report.json
 *   <out>/sql/*.log
 *
 * Emits ONE JSON object to stdout that conforms to MergeReportOutput in
 * types/review.ts.
 *
 * Contract:
 *   • Every metric carries "source": "measured" | "estimated"
 *   • Missing input → "estimated", derived from static fallback — never fabricated
 *   • No input is required; the script always produces a valid output
 *
 * Usage:
 *   node merge-report.mjs --out /path/to/out
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// ── CLI arg parsing ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const OUT_DIR = outIdx !== -1 ? args[outIdx + 1] : '.';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Safely parse a JSON file; returns null if missing or malformed. */
function readJson(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * (modern - legacy) / legacy * 100, rounded to 2 dp.
 * Positive = modern is higher (good for throughput, bad for latency —
 * callers must interpret sign in context).
 */
function deltaPercent(legacy, modern) {
  if (!legacy || legacy === 0) return 0;
  return Math.round(((modern - legacy) / legacy) * 10_000) / 100;
}

// ── k6 extraction ────────────────────────────────────────────────────────────

/**
 * Extracts key latency + throughput metrics from a k6 summary JSON.
 * Returns null if data is not present.
 */
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

// ── JMH extraction ───────────────────────────────────────────────────────────

/**
 * Returns { legacy: avgNs, modern: avgNs } from a JMH result array.
 * Looks for benchmark names containing "legacy" / "modern".
 */
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

// ── SQL log extraction ────────────────────────────────────────────────────────

/**
 * Reads all *.log files under <out>/sql/ and counts statements per container.
 * Log format: timestamp|executionTime|category|sql
 * Returns { legacy: count, modern: count } or null if no logs found.
 */
function extractSqlCounts(sqlDir) {
  if (!existsSync(sqlDir)) return null;
  let legacyCount = 0;
  let modernCount = 0;
  try {
    for (const file of readdirSync(sqlDir)) {
      if (!file.endsWith('.log')) continue;
      const content = readFileSync(join(sqlDir, file), 'utf8');
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      if (file.includes('legacy')) legacyCount += lines.length;
      else modernCount += lines.length;
    }
  } catch {
    return null;
  }
  if (legacyCount === 0 && modernCount === 0) return null;
  return { legacyCount, modernCount };
}

// ── parity extraction ─────────────────────────────────────────────────────────

/**
 * Parses parity-report.json (an array of ParityRecord objects emitted by
 * ParityIT).  Returns a ParityReport or an estimated fallback.
 */
function buildParityReport(raw, source) {
  if (!Array.isArray(raw)) {
    return {
      totalFixtures:    0,
      passed:           0,
      failed:           0,
      similarityPercent: 100,
      driftDetails:     [],
      source:           'estimated',
    };
  }
  const failed = raw.length;
  // We don't know total from the array alone; record what we have
  return {
    totalFixtures:    failed, // minimum known; ParityIT always writes failures only
    passed:           0,
    failed,
    similarityPercent: failed === 0 ? 100 : 0,
    driftDetails: raw.map((r) => ({
      fixtureId:       r.id        ?? 'unknown',
      legacyResponse:  r.legacyResponse ?? '',
      modernResponse:  r.modernResponse ?? '',
    })),
    source,
  };
}

// ── main ─────────────────────────────────────────────────────────────────────

const k6LegacyRaw  = readJson(join(OUT_DIR, 'k6-legacy.json'));
const k6ModernRaw  = readJson(join(OUT_DIR, 'k6-modern.json'));
const jmhRaw       = readJson(join(OUT_DIR, 'jmh.json'));
const parityRaw    = readJson(join(OUT_DIR, 'parity-report.json'));
const sqlDir       = join(OUT_DIR, 'sql');

const k6Legacy  = extractK6(k6LegacyRaw,  'legacy');
const k6Modern  = extractK6(k6ModernRaw,  'modern');
const jmh       = extractJmh(jmhRaw);
const sql       = extractSqlCounts(sqlDir);

/** @type {import('../../types/review.js').PerfMetricDelta[]} */
const metrics = [];

// ── k6: p95 latency ──────────────────────────────────────────────────────────
{
  const source = k6Legacy && k6Modern ? 'measured' : 'estimated';
  const legacyP95 = k6Legacy?.p95  ?? 0;
  const modernP95 = k6Modern?.p95  ?? 0;
  // For latency: negative delta = modern is faster (lower latency)
  metrics.push({
    name:         'p95 latency (ms)',
    tool:         'k6',
    legacyValue:  legacyP95,
    modernValue:  modernP95,
    unit:         'ms',
    deltaPercent: deltaPercent(legacyP95, modernP95),
    source,
  });
}

// ── k6: p99 latency ──────────────────────────────────────────────────────────
{
  const source = k6Legacy && k6Modern ? 'measured' : 'estimated';
  const legacyP99 = k6Legacy?.p99  ?? 0;
  const modernP99 = k6Modern?.p99  ?? 0;
  metrics.push({
    name:         'p99 latency (ms)',
    tool:         'k6',
    legacyValue:  legacyP99,
    modernValue:  modernP99,
    unit:         'ms',
    deltaPercent: deltaPercent(legacyP99, modernP99),
    source,
  });
}

// ── k6: throughput (req/s) ────────────────────────────────────────────────────
{
  const source = k6Legacy && k6Modern ? 'measured' : 'estimated';
  const legacyRps = k6Legacy?.rps ?? 0;
  const modernRps = k6Modern?.rps ?? 0;
  metrics.push({
    name:         'throughput (req/s)',
    tool:         'k6',
    legacyValue:  legacyRps,
    modernValue:  modernRps,
    unit:         'req/s',
    deltaPercent: deltaPercent(legacyRps, modernRps),
    source,
  });
}

// ── JMH: avg microbenchmark time ─────────────────────────────────────────────
{
  const source = jmh ? 'measured' : 'estimated';
  const legacyNs = jmh?.legacyNs ?? 0;
  const modernNs = jmh?.modernNs ?? 0;
  metrics.push({
    name:         'avg method time (ns)',
    tool:         'jmh',
    legacyValue:  legacyNs,
    modernValue:  modernNs,
    unit:         'ns',
    deltaPercent: deltaPercent(legacyNs, modernNs),
    source,
  });
}

// ── SQL: statement count ──────────────────────────────────────────────────────
{
  const source = sql ? 'measured' : 'estimated';
  const legacySql = sql?.legacyCount ?? 0;
  const modernSql = sql?.modernCount ?? 0;
  metrics.push({
    name:         'SQL statements',
    tool:         'sql',
    legacyValue:  legacySql,
    modernValue:  modernSql,
    unit:         'statements',
    deltaPercent: deltaPercent(legacySql, modernSql),
    source,
  });
}

// ── parity report ─────────────────────────────────────────────────────────────
const paritySource = parityRaw !== null ? 'measured' : 'estimated';
const parity = buildParityReport(parityRaw, paritySource);

/** @type {import('../../types/review.js').MergeReportOutput} */
const output = {
  generatedAt: new Date().toISOString(),
  metrics,
  parity,
};

process.stdout.write(JSON.stringify(output, null, 2) + '\n');
