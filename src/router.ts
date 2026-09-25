import { HomePage } from './pages/HomePage';
import { UploadPage } from './pages/UploadPage';
import { ResultPage } from './pages/ResultPage';
import type { PageRenderer } from './types/page';
import { pageShell } from './components/PageShell';

export interface ResolvedRoute {
  name: 'home' | 'upload' | 'result' | 'not-found';
  jobId?: string;
}

interface RouteDefinition {
  name: ResolvedRoute['name'];
  pattern: RegExp;
  render: PageRenderer;
}

export const routes: readonly RouteDefinition[] = [
  { name: 'home', pattern: /^\/$/, render: HomePage },
  { name: 'upload', pattern: /^\/upload$/, render: UploadPage },
  { name: 'result', pattern: /^\/result\/([^/]+)$/, render: ResultPage },
];

export function resolveRoute(path: string): ResolvedRoute {
  if (!path.startsWith('/') || path.startsWith('//')) return { name: 'not-found' };
  const pathname = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  for (const route of routes) {
    const match = pathname.match(route.pattern);
    if (!match) continue;
    if (route.name !== 'result') return { name: route.name };
    try {
      const jobId = decodeURIComponent(match[1]);
      if (/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(jobId)) return { name: 'result', jobId };
    } catch { return { name: 'not-found' }; }
  }
  return { name: 'not-found' };
}

export function navigate(path: string): void {
  const destination = new URL(path, window.location.origin);
  if (destination.origin !== window.location.origin) throw new Error('Navigation must stay within this app.');
  if (destination.href === window.location.href) return;
  window.history.pushState(null, '', destination.pathname + destination.search + destination.hash);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function initRouter(root: HTMLElement): () => void {
  let pageController: AbortController | undefined;
  const render = (): void => {
    pageController?.abort();
    pageController = new AbortController();
    const route = resolveRoute(window.location.pathname);
    const definition = routes.find((item) => item.name === route.name);
    root.replaceChildren();
    if (definition) {
      definition.render({ root, navigate, signal: pageController.signal, jobId: route.jobId });
    } else {
      document.title = 'Page not found · OptiScale';
      root.innerHTML = pageShell('not-found-page', `<section class="page-heading"><p class="section-label">Route unavailable</p><h1>Page not found</h1><p>This address does not match a page or a valid job ID.</p><a class="action-button" href="/upload" data-nav>Go to upload</a></section>`);
    }
    const heading = root.querySelector<HTMLElement>('h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const click = (event: MouseEvent): void => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-nav]') : null;
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const destination = new URL(link.href);
    if (destination.origin !== window.location.origin) return;
    event.preventDefault();
    navigate(destination.pathname + destination.search + destination.hash);
  };
  window.addEventListener('popstate', render);
  root.addEventListener('click', click);
  render();
  return () => {
    pageController?.abort();
    window.removeEventListener('popstate', render);
    root.removeEventListener('click', click);
  };
}
