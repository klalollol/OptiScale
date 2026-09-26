/**
 * swipe.ts — SwipeNext: gesture-driven section navigation for OptiScale SPA
 *
 * Behaviour
 * ─────────
 * • Touch: a downward swipe (≥ 55 px vertical, < 45 px horizontal drift)
 *   scrolls the viewport to the next *unlocked* section.
 * • Never blocks normal page scrolling — passive listeners only on touchmove.
 * • Visual feedback: a transient "swipe" pill fades in at the bottom of the
 *   screen as soon as the gesture threshold is met, then auto-dismisses.
 * • Animation: short eased scroll (320 ms, cubic-bezier matching --t-spring),
 *   or instant when prefers-reduced-motion is set.
 * • Re-entry guard: ignores new gestures while a scroll animation is running.
 * • prefers-reduced-motion: scrollIntoView({ behavior:'instant' }).
 */
export {};

// ─── Constants ────────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD_Y  = 55;   // px vertical movement required
const SWIPE_MAX_X        = 45;   // px max horizontal drift (keeps it intentional)
const SCROLL_DURATION    = 320;  // ms for the eased scroll animation
const COOLDOWN_MS        = 600;  // ms lock-out after a scroll completes
const HINT_VISIBLE_MS    = 900;  // ms the feedback pill stays visible

// Section IDs in order — must match app.ts order
const SECTION_IDS = [
  'sec-upload',
  'sec-analyze',
  'sec-optimize',
  'sec-benchmark',
  'sec-prove',
] as const;

// Height of sticky topbar + workflow bar + breathing gap (mirrors stickyHeight() in app.ts)
function stickyOffset(): number {
  const topbar = document.querySelector<HTMLElement>('.spa-topbar');
  const wfbar  = document.querySelector<HTMLElement>('.spa-workflow-bar');
  const th = topbar?.offsetHeight ?? 57;
  const wh = wfbar?.offsetHeight  ?? 48;
  return th + wh + 8;
}

// ─── Reduced-motion check ─────────────────────────────────────────────────────

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ─── Eased scroll ─────────────────────────────────────────────────────────────

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function animateScrollTo(targetY: number, onDone: () => void): void {
  if (prefersReducedMotion()) {
    window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
    onDone();
    return;
  }

  const startY    = window.scrollY;
  const delta     = targetY - startY;
  if (Math.abs(delta) < 2) { onDone(); return; }

  let startTime: number | null = null;

  function step(now: number): void {
    if (startTime === null) startTime = now;
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / SCROLL_DURATION, 1);
    window.scrollTo(0, startY + delta * easeOutCubic(progress));
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      onDone();
    }
  }

  requestAnimationFrame(step);
}

// ─── Feedback pill ────────────────────────────────────────────────────────────

let hintEl: HTMLElement | null = null;
let hintTimer: ReturnType<typeof setTimeout> | null = null;

function getHintEl(): HTMLElement {
  if (!hintEl) {
    hintEl = document.createElement('div');
    hintEl.id = 'swipe-hint-pill';
    hintEl.className = 'swipe-hint-pill';
    hintEl.textContent = '↓ next section';
    document.body.appendChild(hintEl);
  }
  return hintEl;
}

function showHint(): void {
  const el = getHintEl();
  if (hintTimer) clearTimeout(hintTimer);
  el.classList.add('visible');
  hintTimer = setTimeout(() => {
    el.classList.remove('visible');
    hintTimer = null;
  }, HINT_VISIBLE_MS);
}

function hideHint(): void {
  if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
  getHintEl().classList.remove('visible');
}

// ─── Section resolver ─────────────────────────────────────────────────────────

/**
 * Returns the next section that is NOT locked (spa-locked class absent)
 * after the section that currently occupies the top of the viewport.
 */
function nextUnlockedSection(): HTMLElement | null {
  const offset = stickyOffset();

  // Find the section whose top is closest to (but at or above) the viewport top
  let currentIdx = 0;
  let bestOffset = -Infinity;

  SECTION_IDS.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top - offset;
    // Section is "current" if its top is ≤ 8 px below the offset line
    if (top <= 8 && top > bestOffset) {
      bestOffset = top;
      currentIdx = i;
    }
  });

  // Look for the next unlocked section after currentIdx
  for (let i = currentIdx + 1; i < SECTION_IDS.length; i++) {
    const el = document.getElementById(SECTION_IDS[i]);
    if (el && !el.classList.contains('spa-locked')) return el;
  }
  return null;
}

// ─── Core gesture handler ─────────────────────────────────────────────────────

let scrolling   = false;
let lastScrollT = 0;
let touchStartY = 0;
let touchStartX = 0;
let thresholdMet = false;   // true once gesture crosses the minimum distance

function onTouchStart(e: TouchEvent): void {
  const t = e.touches[0];
  touchStartY  = t.clientY;
  touchStartX  = t.clientX;
  thresholdMet = false;
}

// touchmove is passive — we never call preventDefault
function onTouchMove(e: TouchEvent): void {
  if (scrolling) return;
  const t     = e.touches[0];
  const dy    = touchStartY - t.clientY;   // positive = swiping up (page moves down)
  const dx    = Math.abs(t.clientX - touchStartX);

  if (dy >= SWIPE_THRESHOLD_Y && dx < SWIPE_MAX_X && !thresholdMet) {
    thresholdMet = true;
    showHint();
  }
}

function onTouchEnd(): void {
  if (!thresholdMet) return;
  thresholdMet = false;
  hideHint();

  const now = Date.now();
  if (scrolling || now - lastScrollT < COOLDOWN_MS) return;

  const target = nextUnlockedSection();
  if (!target) return;

  scrolling = true;
  const rect     = target.getBoundingClientRect();
  const absTop   = rect.top + window.scrollY;
  const targetY  = Math.max(0, absTop - stickyOffset());

  animateScrollTo(targetY, () => {
    scrolling   = false;
    lastScrollT = Date.now();
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initSwipeNext(): void {
  // Passive listeners — never interfere with native scroll
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove',  onTouchMove,  { passive: true });
  document.addEventListener('touchend',   onTouchEnd,   { passive: true });
}
