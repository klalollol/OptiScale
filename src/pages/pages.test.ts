// @vitest-environment jsdom
import currentHtml from '../../index.html?raw';
import originalHtml from '../test-fixtures/homepage.html?raw';
import originalRendererSource from '../test-fixtures/homepage-renderer.txt?raw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { codeDiff, footerStats, subagentCards } from '../data';
import { initRouter } from '../router';
import { getDemoResult } from '../services/demoService';
import type { ReviewJob } from '../types/review';
import { HomePage } from './HomePage';
import { ResultPage, resultMarkup } from './ResultPage';

const originalRenderer = originalRendererSource.replace(/^import[^\n]+\n/, '');
let controller: AbortController;
let root: HTMLElement;
let dispose: (() => void) | undefined;

beforeEach(() => {
  document.body.innerHTML = new DOMParser().parseFromString(currentHtml, 'text/html').body.innerHTML;
  root = document.querySelector<HTMLElement>('#app')!;
  controller = new AbortController();
  window.history.replaceState(null, '', '/');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => { controller.abort(); dispose?.(); dispose = undefined; vi.unstubAllGlobals(); });

describe('homepage regression and navigation', () => {
  it('preserves the original homepage renderer output exactly', () => {
    const original = new DOMParser().parseFromString(originalHtml, 'text/html');
    const renderOriginal = new Function('document', 'subagentCards', 'codeDiff', 'footerStats', originalRenderer);
    renderOriginal(original, subagentCards, codeDiff, footerStats);
    HomePage({ root, navigate: vi.fn(), signal: controller.signal });
    for (const id of ['subagent-cards', 'diff-label', 'diff-legacy', 'diff-modern', 'diff-parity', 'stats-footer']) {
      expect(root.querySelector(`#${id}`)?.innerHTML).toBe(original.querySelector(`#${id}`)?.innerHTML);
    }
    expect(root.querySelector('.hero-headline')?.textContent).toBe(original.querySelector('.hero-headline')?.textContent);
    expect(root.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 320 200');
  });
  it('opens the upload page when swiping left from the homepage hero', () => {
    vi.useFakeTimers();
    try {
      dispose = initRouter(root);
      const hero = root.querySelector<HTMLElement>('.hero-headline')!;
      const touch = (type: string, x: number): void => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        const point = { identifier: 1, clientX: x, clientY: 100 };
        Object.assign(event, { touches: type === 'touchend' ? [] : [point], changedTouches: [point] });
        hero.dispatchEvent(event);
      };
      touch('touchstart', 200);
      touch('touchend', 100);
      vi.runAllTimers();
      expect(window.location.pathname).toBe('/upload');
    } finally {
      vi.useRealTimers();
    }
  });
  it('navigates home → upload → offline demo and restores a popped route', () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));
    dispose = initRouter(root);
    expect(root.querySelector('.home-nav')?.textContent).toBe('Home');
    expect(root.querySelector('[data-swipe-next]')?.textContent).toContain('Continue to upload');
    root.querySelector<HTMLAnchorElement>('a[href="/upload"]')?.click();
    expect(window.location.pathname).toBe('/upload');
    expect(root.querySelector('.flow-nav')?.textContent).toBe('Home');
    expect(root.querySelector<HTMLButtonElement>('#browse-zip')?.textContent).toContain('Upload ZIP');
    expect(root.querySelector<HTMLButtonElement>('#review-button')?.disabled).toBe(true);
    root.querySelector<HTMLButtonElement>('#demo-button')?.click();
    expect(window.location.pathname).toBe('/result/demo');
    expect(root.textContent).toContain(getDemoResult().projectName);
    expect(fetch).not.toHaveBeenCalled();
    window.history.replaceState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(root.querySelector('#subagent-cards')).not.toBeNull();
    expect(document.title).toBe('OptiScale · Automated Modernization Engine');
  });
  it('renders a 404 with a recovery link', () => {
    window.history.replaceState(null, '', '/unknown');
    dispose = initRouter(root);
    expect(root.textContent).toContain('Page not found');
    expect(root.querySelector('a[href="/upload"]')).not.toBeNull();
  });
});

describe('result page states and controls', () => {
  it('loads /result/demo directly without network access', () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));
    ResultPage({ root, navigate: vi.fn(), signal: controller.signal, jobId: 'demo' });
    expect(root.textContent).toContain('Bundled demo');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('re-fetches a real job on a direct link with no cached state', async () => {
    const result = { ...getDemoResult(), jobId: 'direct-link', mode: 'review' };
    const job: ReviewJob = { id: result.jobId, status: 'completed', subagents: [], result, error: null };
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(job)));
    ResultPage({ root, navigate: vi.fn(), signal: controller.signal, jobId: job.id });
    expect(root.textContent).toContain('Fetching the latest job');
    await vi.waitFor(() => expect(root.textContent).toContain(result.projectName));
    expect(fetch).toHaveBeenCalledWith('/api/reviews/direct-link', expect.objectContaining({ cache: 'no-store' }));
  });
  it('shows recoverable errors and retries the same job', async () => {
    const job: ReviewJob = { id: 'retry-job', status: 'empty', subagents: [], result: null, error: null };
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Disconnected')).mockResolvedValueOnce(new Response(JSON.stringify(job)));
    ResultPage({ root, navigate: vi.fn(), signal: controller.signal, jobId: job.id });
    await vi.waitFor(() => expect(root.textContent).toContain('Disconnected'));
    root.querySelector<HTMLButtonElement>('[data-retry]')?.click();
    await vi.waitFor(() => expect(root.textContent).toContain('No review results yet'));
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('handles invalid API data without crashing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"status":"completed"}'));
    ResultPage({ root, navigate: vi.fn(), signal: controller.signal, jobId: 'invalid-data' });
    await vi.waitFor(() => expect(root.textContent).toContain('invalid response'));
    expect(root.querySelector('[data-retry]')).not.toBeNull();
  });
  it('does not let a completed request repaint an abandoned page', async () => {
    const job: ReviewJob = { id: 'late-job', status: 'empty', subagents: [], result: null, error: null };
    let finish: (response: Response) => void = () => undefined;
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise<Response>((resolve) => { finish = resolve; }));
    ResultPage({ root, navigate: vi.fn(), signal: controller.signal, jobId: job.id });
    controller.abort();
    root.innerHTML = '<h1>Another page</h1>';
    finish(new Response(JSON.stringify(job)));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(root.textContent).toBe('Another page');
  });
  it('switches files, copies artifacts, selects an extension and prepares all files for PDF', async () => {
    const result = getDemoResult();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    ResultPage({ root, navigate: vi.fn(), signal: controller.signal, jobId: 'demo' });
    const select = root.querySelector<HTMLSelectElement>('#diff-file')!;
    select.value = '1';
    select.dispatchEvent(new Event('change'));
    expect(root.querySelector('#selected-diff')?.textContent).toContain('public record Item');
    root.querySelector<HTMLButtonElement>('[data-copy-artifact="0"]')?.click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(result.artifacts[0].content));
    const extension = root.querySelector<HTMLButtonElement>('[data-extension]')!;
    const selectedBefore = extension.getAttribute('aria-pressed');
    extension.click();
    expect(extension.getAttribute('aria-pressed')).not.toBe(selectedBefore);
    root.querySelector<HTMLButtonElement>('#download-pdf')?.click();
    expect(print).toHaveBeenCalledOnce();
    for (const file of result.files) expect(document.querySelector('#print-report')?.textContent).toContain(file.modernized);
  });
  it('escapes code and untrusted project strings', () => {
    const result = getDemoResult();
    result.projectName = '<img src=x onerror=alert(1)>';
    result.files[0].original = '<script>alert(1)</script>';
    root.innerHTML = resultMarkup(result);
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('script')).toBeNull();
    expect(root.textContent).toContain('<script>alert(1)</script>');
  });
});
