import type { ReviewJob } from '../types/review';
import { httpError, jobUrl, parseJob } from './api';

export const POLL_INTERVAL_MS = 2000;
const REQUEST_TIMEOUT_MS = 30000;
const MAX_POLL_DURATION_MS = 10 * 60 * 1000;

export interface PollOptions {
  signal: AbortSignal;
  onUpdate: (job: ReviewJob) => void;
  intervalMs?: number;
}

export async function fetchReview(jobId: string, signal: AbortSignal): Promise<ReviewJob> {
  const controller = new AbortController();
  const abort = (): void => controller.abort(signal.reason);
  signal.throwIfAborted();
  signal.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => controller.abort(new Error('The review request timed out. Please retry.')), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(jobUrl(jobId), { signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw httpError(response.status);
    const payload: unknown = await response.json();
    return parseJob(payload, jobId);
  } catch (error: unknown) {
    if (controller.signal.aborted) throw controller.signal.reason;
    if (error instanceof SyntaxError) {
      const invalidResponse = new Error('The review API is not connected or returned invalid JSON. Try Demo works offline.');
      Object.defineProperty(invalidResponse, 'cause', { value: error });
      throw invalidResponse;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}

function delay(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const abort = (): void => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, milliseconds);
    signal.addEventListener('abort', abort, { once: true });
  });
}

export async function pollReview(jobId: string, options: PollOptions): Promise<ReviewJob> {
  const started = Date.now();
  while (Date.now() - started < MAX_POLL_DURATION_MS) {
    const job = await fetchReview(jobId, options.signal);
    options.signal.throwIfAborted();
    options.onUpdate(job);
    if (['completed', 'empty', 'failed'].includes(job.status)) return job;
    await delay(options.intervalMs ?? POLL_INTERVAL_MS, options.signal);
  }
  throw new Error('The review is still taking longer than expected. Retry to check the same job again.');
}
