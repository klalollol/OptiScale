import { businessImpact, homeHighlights, homeSteps } from '../../data';

const usd = (amount: number): string => `$${amount.toLocaleString('en-US')}`;

const htmlEntities: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};
const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => htmlEntities[char]);

function renderBusinessImpact(): string {
  const { conventional, scenarios } = businessImpact;
  const labels = businessImpact.labels;
  const base = scenarios.find((scenario) => scenario.key === 'base');
  if (!base) throw new Error('Business impact base scenario is missing.');

  const savingsUsd = conventional.projectCostUsd - base.projectCostUsd;
  const savingsHours = conventional.engineerHours - base.engineerHours;
  const reduction = ((savingsUsd / conventional.projectCostUsd) * 100).toFixed(1);
  const bars = [
    { label: conventional.label, costUsd: conventional.projectCostUsd, className: 'conventional' },
    { label: labels.optiScaleBase, costUsd: base.projectCostUsd, className: 'optiscale' },
  ];

  return `
    <div class="home-section-head">
      <div>
        <p class="section-label">${escapeHtml(businessImpact.sectionLabel)}</p>
        <h2 class="home-section-title" id="business-impact-title">${escapeHtml(businessImpact.title)}</h2>
      </div>
      <p class="home-section-intro">${escapeHtml(businessImpact.intro)}</p>
    </div>
    <div class="home-impact-main">
      <div class="home-impact-lead">
        <span class="home-impact-eyebrow">${escapeHtml(businessImpact.baseLabel)}</span>
        <p class="home-impact-reduction"><strong>${reduction}%</strong><span>${escapeHtml(businessImpact.reductionLabel)}</span></p>
        <p class="home-impact-savings"><strong>${usd(savingsUsd)}</strong><span>${escapeHtml(businessImpact.savingsLabel)}</span></p>
        <p class="home-impact-hours"><strong>${savingsHours} ${escapeHtml(businessImpact.hoursLabel)}</strong> · ${escapeHtml(businessImpact.hoursCaveat)}</p>
      </div>
      <div class="home-impact-chart" role="group" aria-label="${escapeHtml(labels.costChart)}">
        <p class="home-impact-chart-title"><span>${escapeHtml(businessImpact.chartTitle)}</span><span>${escapeHtml(businessImpact.chartUnit)}</span></p>
        ${bars.map((bar) => `
          <div class="home-impact-bar-row">
            <div class="home-impact-bar-meta"><span>${escapeHtml(bar.label)}</span><strong>${usd(bar.costUsd)}</strong></div>
            <div class="home-impact-bar-track" aria-hidden="true"><span class="home-impact-bar-fill ${bar.className}" style="width:${((bar.costUsd / conventional.projectCostUsd) * 100).toFixed(1)}%"></span></div>
          </div>
        `).join('')}
        <div class="home-impact-chart-axis" aria-hidden="true"><span>$0</span><span>${usd(conventional.projectCostUsd)}</span></div>
        <p class="home-impact-chart-note">${escapeHtml(labels.scaleLead)} $0–${usd(conventional.projectCostUsd)} ${escapeHtml(labels.scaleTail)}</p>
      </div>
    </div>
    <div class="home-impact-scenarios" role="list" aria-label="${escapeHtml(labels.scenarioList)}">
      ${scenarios.map((scenario) => {
        const savings = conventional.projectCostUsd - scenario.projectCostUsd;
        const percent = ((savings / conventional.projectCostUsd) * 100).toFixed(1);
        return `<div class="home-impact-scenario ${scenario.key === 'base' ? 'is-base' : ''}" role="listitem">
          <span class="home-impact-scenario-name">${escapeHtml(scenario.label)}</span>
          <strong>${percent}%</strong>
          <span>${usd(savings)} ${escapeHtml(labels.scenarioSavings)}</span>
        </div>`;
      }).join('')}
    </div>
    <p class="home-impact-disclaimer">${escapeHtml(businessImpact.disclaimer)}</p>
    <a class="home-impact-assumptions-link" href="#impact-assumptions">${escapeHtml(labels.assumptionsLink)} <span aria-hidden="true">↓</span></a>
    <details class="home-impact-assumptions" id="impact-assumptions">
      <summary>${escapeHtml(labels.detailsSummary)}</summary>
      <div class="home-impact-details">
        <div>
          <h3>${escapeHtml(labels.modelHeading)}</h3>
          <p>${escapeHtml(businessImpact.modelScope)} ${escapeHtml(labels.labourRate)} ${usd(businessImpact.hourlyRateUsd)}/hour.</p>
          <div class="home-impact-workstreams" role="list" aria-label="${escapeHtml(labels.workstreamList)}">
            ${businessImpact.workstreams.map((workstream) => `<div role="listitem"><span>${escapeHtml(workstream.label)}</span><strong>${workstream.conventionalHours} → ${workstream.baseHours} h</strong></div>`).join('')}
          </div>
          <p>${escapeHtml(labels.conventional)}: ${conventional.engineerHours} h × ${usd(businessImpact.hourlyRateUsd)} + ${usd(businessImpact.conventionalCiTestUsd)} ${escapeHtml(labels.projectCiTest)} = ${usd(conventional.projectCostUsd)}.</p>
          ${scenarios.map((scenario) => `<p>${escapeHtml(labels.optiScale)} ${escapeHtml(scenario.label.toLowerCase())}: ${scenario.engineerHours} h × ${usd(businessImpact.hourlyRateUsd)} + ${usd(businessImpact.optiScaleToolsUsd)} ${escapeHtml(labels.toolsAi)} + ${usd(businessImpact.optiScaleCiTestUsd)} ${escapeHtml(labels.projectCiTest)} = ${usd(scenario.projectCostUsd)}.</p>`).join('')}
          <p>${escapeHtml(businessImpact.reductionFormula)} ${escapeHtml(businessImpact.modelCaveat)}</p>
          <p>${escapeHtml(businessImpact.limitation)}</p>
        </div>
        <div>
          <h3>${escapeHtml(labels.researchHeading)}</h3>
          <p>${escapeHtml(businessImpact.researchCaveat)}</p>
          <ul class="home-impact-source-list">
            ${businessImpact.sources.map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)} <span aria-hidden="true">↗</span></a><span>${escapeHtml(source.context)}</span></li>`).join('')}
          </ul>
        </div>
      </div>
    </details>
  `;
}

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

const impactRoot = document.getElementById('business-impact-content');
if (impactRoot) {
  impactRoot.innerHTML = renderBusinessImpact();
  const assumptionsLink = impactRoot.querySelector<HTMLAnchorElement>('.home-impact-assumptions-link');
  const assumptions = impactRoot.querySelector<HTMLDetailsElement>('#impact-assumptions');
  if (assumptionsLink && assumptions) {
    assumptionsLink.addEventListener('click', () => { assumptions.open = true; });
    if (window.location.hash === '#impact-assumptions') assumptions.open = true;
  }
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
