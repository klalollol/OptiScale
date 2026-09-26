/**
 * Shared types for the merge-report pipeline output.
 * Consumed by merge-report.mjs and referenced by the UI data layer.
 */

export type MetricSource = 'measured' | 'estimated';

/** One row of the perf comparison table. */
export interface PerfMetricDelta {
  /** Human-readable metric name, e.g. "p95 latency" */
  name: string;
  /** Originating tool: k6 | jmh | sql | static */
  tool: 'k6' | 'jmh' | 'sql' | 'static';
  legacyValue: number;
  modernValue: number;
  unit: string;
  /** Positive = modern is better (lower latency, higher throughput). */
  deltaPercent: number;
  source: MetricSource;
}

/** Summary of behavioural parity between legacy and modern. */
export interface ParityReport {
  totalFixtures: number;
  passed: number;
  failed: number;
  /** Percentage of fixtures that passed, 0-100. */
  similarityPercent: number;
  /** Rows where drift was detected. */
  driftDetails: DriftDetail[];
  source: MetricSource;
}

export interface DriftDetail {
  fixtureId: string;
  legacyResponse: string;
  modernResponse: string;
}

/** Top-level shape emitted by merge-report.mjs. */
export interface MergeReportOutput {
  generatedAt: string;
  metrics: PerfMetricDelta[];
  parity: ParityReport;
}