import { describe, expect, it } from 'vitest';
import type { FileDiff } from '../types/review';
import { difference, improvement, overallDifference, percent } from './metrics';

describe('percentage formulas', () => {
  it('calculates the specified change, similarity and signed LOC delta', () => {
    expect(difference(30, 100, 80)).toEqual({ change: 30, similarity: 70, locDelta: -20 });
    expect(difference(0, 100, 125)).toEqual({ change: 0, similarity: 100, locDelta: 25 });
  });
  it('does not silently clamp formulas when a backend counts inserted lines', () => {
    expect(difference(120, 100, 140)).toEqual({ change: 120, similarity: -20, locDelta: 40 });
  });
  it('handles zero baselines without NaN or infinity', () => {
    expect(difference(5, 0, 5)).toEqual({ change: null, similarity: null, locDelta: null });
    expect(percent(null)).toBe('N/A');
    expect(improvement({ before: 0, after: 30, direction: 'higher' })).toBeNull();
  });
  it('calculates the overall value using counts, not an average of percentages', () => {
    const files: FileDiff[] = [
      { path: 'a.java', language: 'Java', original: '', modernized: '', changedLines: 1, totalOriginalLines: 10, newLOC: 5 },
      { path: 'b.java', language: 'Java', original: '', modernized: '', changedLines: 90, totalOriginalLines: 90, newLOC: 75 },
    ];
    expect(overallDifference(files)).toEqual({ change: 91, similarity: 9, locDelta: -20 });
  });
  it('distinguishes throughput increases from latency decreases and regressions', () => {
    expect(improvement({ before: 200, after: 50, direction: 'lower' })).toBe(75);
    expect(improvement({ before: 100, after: 300, direction: 'higher' })).toBe(200);
    expect(improvement({ before: 100, after: 150, direction: 'lower' })).toBe(-50);
  });
  it('rejects invalid numeric inputs', () => {
    expect(() => difference(-1, 10, 10)).toThrow(RangeError);
    expect(() => difference(1, Infinity, 10)).toThrow(RangeError);
  });
});
