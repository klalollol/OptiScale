import type { FileDiff, PerfMetricDelta } from '../types/review';

export interface DiffPercentages {
  change: number | null;
  similarity: number | null;
  locDelta: number | null;
}

export function difference(changedLines: number, originalLOC: number, newLOC: number): DiffPercentages {
  if (![changedLines, originalLOC, newLOC].every((value) => Number.isFinite(value) && value >= 0)) {
    throw new RangeError('Line counts must be finite and nonnegative.');
  }
  if (originalLOC === 0) return { change: null, similarity: null, locDelta: null };
  const change = (changedLines / originalLOC) * 100;
  return { change, similarity: 100 - change, locDelta: ((newLOC - originalLOC) / originalLOC) * 100 };
}

export function overallDifference(files: readonly FileDiff[]): DiffPercentages {
  return difference(
    files.reduce((sum, file) => sum + file.changedLines, 0),
    files.reduce((sum, file) => sum + file.totalOriginalLines, 0),
    files.reduce((sum, file) => sum + file.newLOC, 0),
  );
}

export function improvement(metric: Pick<PerfMetricDelta, 'before' | 'after' | 'direction'>): number | null {
  if (metric.before === 0) return null;
  const delta = metric.direction === 'higher' ? metric.after - metric.before : metric.before - metric.after;
  return (delta / metric.before) * 100;
}

export function percent(value: number | null): string {
  return value === null ? 'N/A' : `${value.toFixed(1)}%`;
}
