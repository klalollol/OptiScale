/**
 * Types for the code suggestion engine.
 * Browser-safe — no Node APIs.
 */

/** Severity of the anti-pattern finding. */
export type SuggestionSeverity = 'critical' | 'major' | 'minor';

/** Category of the anti-pattern. */
export type AntiPatternCategory =
  | 'performance'
  | 'modernization'
  | 'correctness'
  | 'maintainability';

/**
 * A single detected anti-pattern instance in a source file.
 * `file` is the relative path (rootPrefix stripped).
 * `line` is 1-based, null when the pattern is file-level.
 */
export interface AntiPatternHit {
  file: string;
  line: number | null;
  /** Verbatim snippet from the source that matched. */
  snippet: string;
}

/**
 * One anti-pattern rule definition.
 * `beforeCode` / `afterCode` are illustrative, not generated from the actual
 * file — they show the canonical legacy → modern transformation.
 */
export interface AntiPattern {
  id: string;
  label: string;
  category: AntiPatternCategory;
  severity: SuggestionSeverity;
  description: string;
  /**
   * Estimated performance impact when this pattern is fixed, expressed as a
   * percentage range relative to the affected metric.
   * e.g. { metric: 'p95 latency', min: 15, max: 40 }
   */
  estimatedImpact: {
    metric: string;
    min: number;
    max: number;
    unit: '%';
  };
  /** Illustrative legacy code snippet (raw text, not HTML). */
  beforeCode: string;
  /** Illustrative modern replacement (raw text, not HTML). */
  afterCode: string;
  /** Step-by-step fix instructions. */
  fixSteps: string[];
}

/**
 * One row in the suggestions panel — the pattern definition plus the
 * concrete files where it was found.
 */
export interface CodeSuggestion {
  pattern: AntiPattern;
  hits: AntiPatternHit[];
  /** Projected boost for THIS project if all hits are fixed. */
  projectedBoostMin: number;
  projectedBoostMax: number;
}

/** Top-level output of runSuggestions(). */
export interface SuggestionReport {
  suggestions: CodeSuggestion[];
  /** Number of distinct anti-pattern types found. */
  totalPatterns: number;
  /** Total file locations flagged across all patterns. */
  totalHits: number;
  /** Composite projected p95 latency improvement (min%). */
  compositeBoostMin: number;
  /** Composite projected p95 latency improvement (max%). */
  compositeBoostMax: number;
  generatedAt: string;
}
