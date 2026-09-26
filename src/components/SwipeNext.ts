import type { Navigate } from '../types/page';

interface SwipeOrigin {
  identifier: number;
  x: number;
  y: number;
}

// Touch events keep vertical page scrolling and horizontal code-panel scrolling native.
export function bindSwipeNext(page: HTMLElement, link: HTMLAnchorElement, navigate: Navigate, signal: AbortSignal): void {
  let origin: SwipeOrigin | undefined;
  let pending: ReturnType<typeof setTimeout> | undefined;
  const clear = (): void => { origin = undefined; };

  page.addEventListener('touchstart', (event) => {
    clear();
    if (event.touches.length !== 1 || pending !== undefined) return;
    if (event.target instanceof Element && event.target.closest('pre, input, textarea, select, [contenteditable], [data-no-swipe]')) return;
    const touch = event.touches[0];
    origin = { identifier: touch.identifier, x: touch.clientX, y: touch.clientY };
  }, { passive: true, signal });

  page.addEventListener('touchmove', (event) => {
    if (!origin) return;
    if (event.touches.length !== 1 || event.touches[0].identifier !== origin.identifier) { clear(); return; }
    const horizontal = Math.abs(event.touches[0].clientX - origin.x);
    const vertical = Math.abs(event.touches[0].clientY - origin.y);
    if (vertical > 24 && vertical > horizontal) clear();
  }, { passive: true, signal });

  page.addEventListener('touchcancel', clear, { signal });
  page.addEventListener('touchend', (event) => {
    if (!origin || event.touches.length !== 0) { clear(); return; }
    const touch = Array.from(event.changedTouches).find((item) => item.identifier === origin?.identifier);
    if (!touch) { clear(); return; }
    const horizontal = origin.x - touch.clientX;
    const vertical = Math.abs(origin.y - touch.clientY);
    clear();
    if (horizontal < 56 || horizontal < vertical * 1.5 || pending !== undefined || window.getSelection()?.toString()) return;
    event.preventDefault();
    // A touch on the link may also produce a compatibility click.
    pending = setTimeout(() => {
      pending = undefined;
      if (!signal.aborted) navigate(link.pathname);
    }, 0);
  }, { passive: false, signal });

  page.addEventListener('click', (event) => {
    if (pending !== undefined) { event.preventDefault(); event.stopPropagation(); }
  }, { capture: true, signal });
  signal.addEventListener('abort', () => { clear(); clearTimeout(pending); }, { once: true });
}
