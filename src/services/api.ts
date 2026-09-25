import { reviewJobSchema, type ReviewJob } from '../types/review';

const API_BASE = '/api/reviews';
export const jobUrl = (jobId: string): string => `${API_BASE}/${encodeURIComponent(jobId)}`;
export const uploadUrl = API_BASE;

export function parseJob(payload: unknown, expectedId?: string): ReviewJob {
  const parsed = reviewJobSchema.safeParse(payload);
  if (!parsed.success || (expectedId && parsed.data.id !== expectedId)) {
    throw new Error('The review service returned an invalid response. Retry or check the API contract in README.');
  }
  return parsed.data;
}

export function httpError(status: number): Error {
  if (status === 404) return new Error('This job was not found. Check the URL or upload the project again.');
  if (status === 413) return new Error('The server rejected the archive size. Choose a smaller ZIP and retry.');
  return new Error(`The review service is unavailable (HTTP ${status}). Retry when the backend is connected, or use Try Demo.`);
}
