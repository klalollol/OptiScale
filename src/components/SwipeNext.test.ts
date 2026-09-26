// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindSwipeNext } from './SwipeNext';

let page: HTMLElement;
let content: HTMLElement;
let code: HTMLElement;
let link: HTMLAnchorElement;
let controller: AbortController;
const navigate = vi.fn();

function touch(type: string, x: number, y: number, target = content): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const point = { identifier: 1, clientX: x, clientY: y };
  Object.assign(event, { touches: type === 'touchend' || type === 'touchcancel' ? [] : [point], changedTouches: [point] });
  target.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  vi.useFakeTimers();
  navigate.mockReset();
  page = document.createElement('div');
  page.innerHTML = '<div class="content">Homepage content</div><pre>Scrollable code</pre><a href="/upload">Continue to upload</a>';
  document.body.replaceChildren(page);
  content = page.querySelector<HTMLElement>('.content')!;
  code = page.querySelector<HTMLElement>('pre')!;
  link = page.querySelector<HTMLAnchorElement>('a')!;
  controller = new AbortController();
  bindSwipeNext(page, link, navigate, controller.signal);
});
afterEach(() => { controller.abort(); vi.useRealTimers(); });

describe('next-page swipe', () => {
  it('navigates from content outside the link after a deliberate left swipe', () => {
    touch('touchstart', 200, 100);
    const end = touch('touchend', 100, 110);
    expect(end.defaultPrevented).toBe(true);
    vi.runAllTimers();
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/upload');
  });
  it('suppresses the compatibility click when the swipe begins on the link', () => {
    touch('touchstart', 200, 100, link);
    touch('touchend', 100, 110, link);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    vi.runAllTimers();
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/upload');
  });
  it.each([[190, 100], [205, 200], [300, 100]])('ignores taps, vertical scrolls and reverse swipes (%s, %s)', (x, y) => {
    touch('touchstart', 200, 100);
    touch('touchend', x, y);
    vi.runAllTimers();
    expect(navigate).not.toHaveBeenCalled();
  });
  it('stops tracking when a gesture turns into vertical scrolling', () => {
    touch('touchstart', 200, 100);
    touch('touchmove', 195, 160);
    touch('touchend', 80, 160);
    vi.runAllTimers();
    expect(navigate).not.toHaveBeenCalled();
  });
  it('leaves code-panel scrolling and taps to native browser handling', () => {
    touch('touchstart', 200, 100, code);
    touch('touchend', 100, 100, code);
    touch('touchstart', 200, 100, link);
    touch('touchend', 200, 100, link);
    vi.runAllTimers();
    expect(navigate).not.toHaveBeenCalled();
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.addEventListener('click', (event) => {
      expect(event.defaultPrevented).toBe(false);
      event.preventDefault(); // Do not ask jsdom to perform real navigation.
    });
    link.dispatchEvent(click);
  });
  it('does not navigate while text is selected', () => {
    const range = document.createRange();
    range.selectNodeContents(content);
    window.getSelection()?.addRange(range);
    touch('touchstart', 200, 100);
    touch('touchend', 100, 100);
    vi.runAllTimers();
    expect(navigate).not.toHaveBeenCalled();
    window.getSelection()?.removeAllRanges();
  });
  it('does not navigate after a cancelled touch or an abandoned page', () => {
    touch('touchstart', 200, 100);
    touch('touchcancel', 100, 100);
    touch('touchend', 100, 100);
    vi.runAllTimers();
    expect(navigate).not.toHaveBeenCalled();
    touch('touchstart', 200, 100);
    touch('touchend', 100, 100);
    controller.abort();
    vi.runAllTimers();
    expect(navigate).not.toHaveBeenCalled();
  });
});
