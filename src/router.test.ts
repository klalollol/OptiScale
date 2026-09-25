import { describe, expect, it } from 'vitest';
import { resolveRoute } from './router';

describe('router resolution (no DOM required)', () => {
  it.each(['/', '/?demo=true', '/#top'])('resolves home %s', (path) => {
    expect(resolveRoute(path)).toEqual({ name: 'home' });
  });
  it('resolves upload with a trailing slash', () => {
    expect(resolveRoute('/upload/')).toEqual({ name: 'upload' });
  });
  it('resolves direct result links and decoded job IDs', () => {
    expect(resolveRoute('/result/demo')).toEqual({ name: 'result', jobId: 'demo' });
    expect(resolveRoute('/result/job%2D123?tab=code')).toEqual({ name: 'result', jobId: 'job-123' });
  });
  it.each(['/missing', '/result', '/result/', '/result/a/b', '/result/%', '/result/%2F', '/result/%3Cscript%3E', '//outside.test', 'https://outside.test', '/result/' + 'x'.repeat(129)])('falls back for invalid route %s', (path) => {
    expect(resolveRoute(path)).toEqual({ name: 'not-found' });
  });
});
