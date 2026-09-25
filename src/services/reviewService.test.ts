import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReviewJob } from '../types/review';
import { fetchReview, pollReview } from './reviewService';

afterEach(() => vi.useRealTimers());

describe('review fetching and polling', () => {
  it('reports per-subagent progress until a terminal response', async () => {
    const progress: ReviewJob = { id: 'poll-job', status: 'running', result: null, error: null, subagents: [
      { id: 'refactor', name: 'Code Refactorer', status: 'running', progress: 42, detail: 'Refactoring source files' },
      { id: 'parity', name: 'Parity Test Generator', status: 'queued', progress: 0, detail: 'Waiting for source' },
      { id: 'deploy', name: 'CI/CD Deployer', status: 'queued', progress: 0, detail: 'Waiting for verification' },
    ] };
    const done: ReviewJob = { ...progress, status: 'empty', subagents: [] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(progress))).mockResolvedValueOnce(new Response(JSON.stringify(done)));
    const updates = vi.fn<(job: ReviewJob) => void>();
    await expect(pollReview(progress.id, { signal: new AbortController().signal, onUpdate: updates, intervalMs: 1 })).resolves.toEqual(done);
    expect(updates.mock.calls.map(([job]) => job.status)).toEqual(['running', 'empty']);
    expect(updates.mock.calls[0][0].subagents[0].progress).toBe(42);
  });
  it('stops polling when navigation aborts the current job', async () => {
    const job: ReviewJob = { id: 'abort-job', status: 'queued', subagents: [], result: null, error: null };
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(job)));
    const controller = new AbortController();
    const pending = pollReview(job.id, { signal: controller.signal, onUpdate: () => controller.abort(), intervalMs: 1 });
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('rejects a mismatched job ID and an HTML fallback response', async () => {
    const job: ReviewJob = { id: 'wrong-job', status: 'empty', subagents: [], result: null, error: null };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(job))).mockResolvedValueOnce(new Response('<html></html>'));
    await expect(fetchReview('right-job', new AbortController().signal)).rejects.toThrow('invalid response');
    await expect(fetchReview('right-job', new AbortController().signal)).rejects.toThrow('not connected');
  });
  it('gives useful errors for missing and failed HTTP requests', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 404 })).mockResolvedValueOnce(new Response('', { status: 503 }));
    await expect(fetchReview('missing', new AbortController().signal)).rejects.toThrow('not found');
    await expect(fetchReview('missing', new AbortController().signal)).rejects.toThrow('503');
  });
});
