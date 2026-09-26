import { homeHighlights, homeSteps } from '../../data';

const stepsRoot = document.getElementById('home-steps');
if (stepsRoot) {
  stepsRoot.innerHTML = homeSteps
    .map(
      (step) => `
        <li class="home-step-card">
          <span class="home-step-number">${step.number}</span>
          <h3 class="home-card-title">${step.title}</h3>
          <p class="home-card-copy">${step.description}</p>
        </li>
      `,
    )
    .join('');
}

const highlightsRoot = document.getElementById('home-highlights');
if (highlightsRoot) {
  highlightsRoot.innerHTML = homeHighlights
    .map(
      (item) => `
        <article class="home-feature-card">
          <span class="home-feature-label">${item.label}</span>
          <h3 class="home-card-title">${item.title}</h3>
          <p class="home-card-copy">${item.description}</p>
        </article>
      `,
    )
    .join('');
}

// ─── Swipe to next section ───────────────────────────────────────────────────

const SWIPE_THRESHOLD_Y = 55;
const SWIPE_MAX_X = 45;
const SCROLL_DURATION = 320;
const SWIPE_COOLDOWN_MS = 600;
const HINT_VISIBLE_MS = 900;
const swipeSections = Array.from(
  document.querySelectorAll<HTMLElement>('main > section'),
);

let touchStartY = 0;
let touchStartX = 0;
let touchSectionIndex = 0;
let thresholdMet = false;
let scrolling = false;
let lastScrollAt = 0;
let hintTimer: ReturnType<typeof setTimeout> | null = null;
let hintElement: HTMLElement | null = null;

function currentSwipeSectionIndex(): number {
  let currentIndex = 0;
  let closestTop = -Infinity;

  swipeSections.forEach((section, index) => {
    const top = section.getBoundingClientRect().top;
    if (top <= 8 && top > closestTop) {
      closestTop = top;
      currentIndex = index;
    }
  });

  return currentIndex;
}

function getSwipeHint(): HTMLElement {
  if (!hintElement) {
    hintElement = document.createElement('div');
    hintElement.className = 'swipe-hint-pill';
    hintElement.textContent = '↑ next section';
    document.body.appendChild(hintElement);
  }
  return hintElement;
}

function showSwipeHint(): void {
  const hint = getSwipeHint();
  if (hintTimer) clearTimeout(hintTimer);
  hint.classList.add('visible');
  hintTimer = setTimeout(() => {
    hint.classList.remove('visible');
    hintTimer = null;
  }, HINT_VISIBLE_MS);
}

function hideSwipeHint(): void {
  if (hintTimer) clearTimeout(hintTimer);
  hintTimer = null;
  getSwipeHint().classList.remove('visible');
}

function scrollToSection(targetY: number, onDone: () => void): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, targetY);
    onDone();
    return;
  }

  const startY = window.scrollY;
  const distance = targetY - startY;
  if (Math.abs(distance) < 2) {
    onDone();
    return;
  }

  let startTime: number | null = null;

  function step(now: number): void {
    if (startTime === null) startTime = now;
    const progress = Math.min((now - startTime) / SCROLL_DURATION, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    window.scrollTo(0, startY + distance * easedProgress);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      onDone();
    }
  }

  requestAnimationFrame(step);
}

document.addEventListener(
  'touchstart',
  (event: TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;

    const target = event.target;
    if (target instanceof Element && target.closest('a, button, input, select, textarea')) {
      thresholdMet = false;
      return;
    }

    touchStartY = touch.clientY;
    touchStartX = touch.clientX;
    touchSectionIndex = currentSwipeSectionIndex();
    thresholdMet = false;
  },
  { passive: true },
);

document.addEventListener(
  'touchmove',
  (event: TouchEvent) => {
    if (scrolling) return;
    const touch = event.touches[0];
    if (!touch) return;

    const verticalDistance = touchStartY - touch.clientY;
    const horizontalDistance = Math.abs(touch.clientX - touchStartX);
    if (verticalDistance >= SWIPE_THRESHOLD_Y && horizontalDistance < SWIPE_MAX_X && !thresholdMet) {
      thresholdMet = true;
      showSwipeHint();
    }
  },
  { passive: true },
);

document.addEventListener(
  'touchend',
  () => {
    if (!thresholdMet) return;
    thresholdMet = false;
    hideSwipeHint();

    const now = Date.now();
    if (scrolling || now - lastScrollAt < SWIPE_COOLDOWN_MS) return;

    const target = swipeSections[touchSectionIndex + 1];
    if (!target) return;

    scrolling = true;
    const targetY = target.getBoundingClientRect().top + window.scrollY;
    scrollToSection(targetY, () => {
      scrolling = false;
      lastScrollAt = Date.now();
    });
  },
  { passive: true },
);
