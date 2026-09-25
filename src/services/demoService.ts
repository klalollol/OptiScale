import demoData from '../mocks/demo-result.json';
import { reviewResultSchema, type ReviewResult } from '../types/review';

// Compile-time structural check plus runtime vocabulary/range checks.
const bundledResult: ReviewResult = demoData;

export function getDemoResult(): ReviewResult {
  return reviewResultSchema.parse(structuredClone(bundledResult));
}
