import { businessImpact, homeHighlights, homeSteps } from './data';

const htmlEntities: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};
const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => htmlEntities[char]);
const usd = (value: number): string => `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

type BudgetInputs = {
  hourlyRateUsd: number;
  conventionalCiTestUsd: number;
  optiScaleToolsUsd: number;
  optiScaleCiTestUsd: number;
};

const defaultBudget: BudgetInputs = {
  hourlyRateUsd: businessImpact.hourlyRateUsd,
  conventionalCiTestUsd: businessImpact.conventionalCiTestUsd,
  optiScaleToolsUsd: businessImpact.optiScaleToolsUsd,
  optiScaleCiTestUsd: businessImpact.optiScaleCiTestUsd,
};
const initialBudget: BudgetInputs = { ...defaultBudget, hourlyRateUsd: 100 };
const budgetFields = Object.keys(defaultBudget) as (keyof BudgetInputs)[];
const roundUsd = (value: number): number => Math.round(value * 100) / 100;

function calculateBudget(inputs: BudgetInputs) {
  const conventionalCost = roundUsd(businessImpact.conventional.engineerHours * inputs.hourlyRateUsd + inputs.conventionalCiTestUsd);
  const scenarios = businessImpact.scenarios.map((scenario) => {
    const cost = roundUsd(scenario.engineerHours * inputs.hourlyRateUsd + inputs.optiScaleToolsUsd + inputs.optiScaleCiTestUsd);
    const difference = roundUsd(conventionalCost - cost);
    return { ...scenario, cost, difference, percent: Math.abs(difference / conventionalCost * 100) };
  });
  const base = scenarios.find((scenario) => scenario.key === 'base');
  if (!base) throw new Error('Business impact base case is missing.');
  return { conventionalCost, scenarios, base, scale: Math.max(conventionalCost, base.cost) };
}

function changeCopy(difference: number): { label: string; detail: string } {
  const copy = businessImpact.copy;
  if (difference > 0) return { label: copy.reduction, detail: copy.savings };
  if (difference < 0) return { label: copy.increase, detail: copy.higher };
  return { label: copy.equal, detail: copy.difference };
}

function renderBusinessImpact(): string {
  const { conventional } = businessImpact;
  const copy = businessImpact.copy;
  const { conventionalCost, scenarios, base, scale } = calculateBudget(initialBudget);
  const savedHours = conventional.engineerHours - base.engineerHours;
  const baseCopy = changeCopy(base.difference);
  const costBars = [
    { key: 'conventional', label: conventional.label, costUsd: conventionalCost, className: 'conventional' },
    { key: 'base', label: copy.optiScaleBase, costUsd: base.cost, className: 'optiscale' },
  ];

  return `
    <div class="impact-heading">
      <div><p class="section-label">${escapeHtml(copy.sectionLabel)}</p>
        <h2 id="business-impact-title">${escapeHtml(businessImpact.title)}</h2></div>
      <p>${escapeHtml(businessImpact.intro)}</p>
    </div>
    <details class="impact-budget-panel" open>
      <summary>${escapeHtml(copy.budgetSummary)} <span>${escapeHtml(copy.budgetAside)}</span></summary>
      <div class="impact-budget-body">
        <p>${escapeHtml(copy.budgetIntro)}</p>
        <div class="impact-budget-grid">
          <label>${escapeHtml(copy.engineeringRate)} <span>${escapeHtml(copy.hourlyUnit)}</span><input data-budget-field="hourlyRateUsd" type="number" inputmode="decimal" min="0" max="1000000000" step="any" value="${initialBudget.hourlyRateUsd}"></label>
          <label>${escapeHtml(copy.conventionalCi)} <span>${escapeHtml(copy.projectUnit)}</span><input data-budget-field="conventionalCiTestUsd" type="number" inputmode="decimal" min="0" max="1000000000" step="any" value="${initialBudget.conventionalCiTestUsd}"></label>
          <label>${escapeHtml(copy.optiScaleTools)} <span>${escapeHtml(copy.projectUnit)}</span><input data-budget-field="optiScaleToolsUsd" type="number" inputmode="decimal" min="0" max="1000000000" step="any" value="${initialBudget.optiScaleToolsUsd}"></label>
          <label>${escapeHtml(copy.optiScaleCi)} <span>${escapeHtml(copy.projectUnit)}</span><input data-budget-field="optiScaleCiTestUsd" type="number" inputmode="decimal" min="0" max="1000000000" step="any" value="${initialBudget.optiScaleCiTestUsd}"></label>
        </div>
        <p class="impact-budget-formula">${escapeHtml(copy.budgetFormula)}</p>
        <p class="impact-budget-error" role="status" aria-live="polite" hidden></p>
        <button class="impact-budget-reset" type="button">${escapeHtml(copy.reset)}</button>
      </div>
    </details>
    <div class="impact-main-grid">
      <div class="impact-lead">
        <span class="impact-eyebrow">${escapeHtml(copy.baseCase)}</span>
        <p class="impact-budget-state" data-impact-budget-state>${escapeHtml(copy.customState)}</p>
        <p class="impact-reduction"><strong data-impact-base-percent>${base.percent.toFixed(1)}%</strong><span data-impact-base-label>${baseCopy.label}</span></p>
        <p class="impact-savings"><strong data-impact-base-difference>${usd(Math.abs(base.difference))}</strong><span data-impact-base-detail>${baseCopy.detail} / project</span></p>
        <p class="impact-hours"><strong>${savedHours} engineer-hours</strong> ${escapeHtml(copy.hoursCaveat)}</p>
      </div>
      <div class="impact-chart" role="group" aria-label="${escapeHtml(copy.chartAria)}">
        <p class="impact-chart-title">${escapeHtml(copy.chartTitle)} <span>${escapeHtml(copy.projectUnit)}</span></p>
        ${costBars.map((bar) => `
          <div class="impact-bar-row">
            <div class="impact-bar-meta"><span>${escapeHtml(bar.label)}</span><strong data-impact-cost="${bar.key}">${usd(bar.costUsd)}</strong></div>
            <div class="impact-bar-track" aria-hidden="true"><span class="impact-bar-fill ${bar.className}" data-impact-bar="${bar.key}" style="width:${((bar.costUsd / scale) * 100).toFixed(1)}%"></span></div>
          </div>
        `).join('')}
        <div class="impact-chart-axis" aria-hidden="true"><span>$0</span><span data-impact-axis-max>${usd(scale)}</span></div>
        <p class="impact-chart-note">Bars share the same $0–<span data-impact-note-max>${usd(scale)}</span> scale.</p>
      </div>
    </div>
    <div class="impact-scenario-grid" role="list" aria-label="${escapeHtml(copy.scenarioAria)}">
      ${scenarios.map((scenario) => {
        const copy = changeCopy(scenario.difference);
        return `<div class="impact-scenario ${scenario.key === 'base' ? 'is-base' : ''}" data-impact-scenario="${scenario.key}" role="listitem">
          <span class="impact-scenario-name">${escapeHtml(scenario.label)}</span>
          <strong data-impact-percent>${scenario.percent.toFixed(1)}%</strong>
          <span data-impact-difference>${usd(Math.abs(scenario.difference))} ${copy.detail}</span>
        </div>`;
      }).join('')}
    </div>
    <p class="impact-disclaimer">${escapeHtml(businessImpact.disclaimer)}</p>
    <a class="impact-assumptions-link" href="#impact-assumptions">${escapeHtml(copy.assumptionsLink)} <span aria-hidden="true">↓</span></a>
    <details class="impact-assumptions" id="impact-assumptions">
      <summary>${escapeHtml(copy.detailsSummary)}</summary>
      <div class="impact-detail-grid">
        <div>
          <h3>${escapeHtml(copy.inputsHeading)}</h3>
          <p>${escapeHtml(copy.scope)} Labour uses <span data-impact-rate-description>an entered rate of ${usd(initialBudget.hourlyRateUsd)}/hour</span>.</p>
          <div class="impact-workstreams" role="list" aria-label="${escapeHtml(copy.workstreamsAria)}">
            ${businessImpact.workstreams.map((workstream) => `
              <div role="listitem"><span>${escapeHtml(workstream.label)}</span><strong>${workstream.conventionalHours} → ${workstream.baseHours} h</strong></div>
            `).join('')}
          </div>
          <p data-impact-conventional-formula>Conventional: ${conventional.engineerHours} h × ${usd(initialBudget.hourlyRateUsd)} + ${usd(initialBudget.conventionalCiTestUsd)} project CI/test = ${usd(conventionalCost)}.</p>
          ${scenarios.map((scenario) => `<p data-impact-scenario-formula="${scenario.key}">OptiScale ${escapeHtml(scenario.label.toLowerCase())}: ${scenario.engineerHours} h × ${usd(initialBudget.hourlyRateUsd)} + ${usd(initialBudget.optiScaleToolsUsd)} tools/AI + ${usd(initialBudget.optiScaleCiTestUsd)} project CI/test = ${usd(scenario.cost)}.</p>`).join('')}
          <p>${escapeHtml(copy.formulaNote)}</p>
          <p>${escapeHtml(copy.limits)}</p>
        </div>
        <div>
          <h3>${escapeHtml(copy.researchHeading)}</h3>
          <p>${escapeHtml(copy.researchIntro)}</p>
          <ul class="impact-source-list">
            ${businessImpact.sources.map((source) => `
              <li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)} <span aria-hidden="true">↗</span></a><span>${escapeHtml(source.context)}</span></li>
            `).join('')}
          </ul>
        </div>
      </div>
    </details>
  `;
}

function wireBusinessBudget(root: HTMLElement): void {
  const fields = budgetFields.map((key) => ({
    key,
    input: root.querySelector<HTMLInputElement>('[data-budget-field="' + key + '"]'),
  }));
  const error = root.querySelector<HTMLElement>('.impact-budget-error');
  const status = root.querySelector<HTMLElement>('[data-impact-budget-state]');
  const copy = businessImpact.copy;
  const setText = (selector: string, value: string): void => {
    const element = root.querySelector<HTMLElement>(selector);
    if (element) element.textContent = value;
  };

  const update = (): void => {
    const inputs = { ...defaultBudget };
    let invalid = false;
    for (const { key, input } of fields) {
      const value = input?.valueAsNumber ?? Number.NaN;
      const fieldInvalid = !input || input.value.trim() === '' || !input.checkValidity()
        || !Number.isFinite(value) || value < 0 || value > 1_000_000_000;
      input?.setAttribute('aria-invalid', String(fieldInvalid));
      if (fieldInvalid) invalid = true;
      else inputs[key] = value;
    }
    const zeroBaseline = !invalid
      && businessImpact.conventional.engineerHours * inputs.hourlyRateUsd + inputs.conventionalCiTestUsd <= 0;
    if (invalid || zeroBaseline) {
      if (error) {
        error.hidden = false;
        error.textContent = zeroBaseline ? copy.zeroBaseline : copy.invalidValue;
      }
      if (status) status.textContent = copy.invalidState;
      return;
    }

    const result = calculateBudget(inputs);
    if (!Number.isFinite(result.scale) || result.scenarios.some((scenario) => !Number.isFinite(scenario.percent))) {
      if (error) {
        error.hidden = false;
        error.textContent = copy.oversizedValue;
      }
      return;
    }
    if (error) error.hidden = true;
    const custom = budgetFields.some((key) => inputs[key] !== defaultBudget[key]);
    if (status) status.textContent = custom ? copy.customState : copy.defaultState;

    const baseCopy = changeCopy(result.base.difference);
    setText('[data-impact-base-percent]', result.base.percent.toFixed(1) + '%');
    setText('[data-impact-base-label]', baseCopy.label);
    setText('[data-impact-base-difference]', usd(Math.abs(result.base.difference)));
    setText('[data-impact-base-detail]', baseCopy.detail + ' / project');
    root.querySelector('.impact-lead')?.classList.toggle('is-increase', result.base.difference < 0);

    for (const [key, cost] of [['conventional', result.conventionalCost], ['base', result.base.cost]] as const) {
      setText('[data-impact-cost="' + key + '"]', usd(cost));
      const bar = root.querySelector<HTMLElement>('[data-impact-bar="' + key + '"]');
      if (bar) bar.style.width = (cost / result.scale * 100).toFixed(1) + '%';
    }
    setText('[data-impact-axis-max]', usd(result.scale));
    setText('[data-impact-note-max]', usd(result.scale));

    for (const scenario of result.scenarios) {
      const selector = '[data-impact-scenario="' + scenario.key + '"]';
      const card = root.querySelector<HTMLElement>(selector);
      const copy = changeCopy(scenario.difference);
      card?.classList.toggle('is-increase', scenario.difference < 0);
      setText(selector + ' [data-impact-percent]', scenario.percent.toFixed(1) + '%');
      setText(selector + ' [data-impact-difference]', usd(Math.abs(scenario.difference)) + ' ' + copy.detail);
      setText(
        '[data-impact-scenario-formula="' + scenario.key + '"]',
        'OptiScale ' + scenario.label.toLowerCase() + ': ' + scenario.engineerHours + ' h × '
          + usd(inputs.hourlyRateUsd) + ' + ' + usd(inputs.optiScaleToolsUsd) + ' tools/AI + '
          + usd(inputs.optiScaleCiTestUsd) + ' project CI/test = ' + usd(scenario.cost) + '.',
      );
    }
    setText('[data-impact-rate-description]',
      (custom ? 'an entered' : 'a planning') + ' rate of ' + usd(inputs.hourlyRateUsd) + '/hour');
    setText('[data-impact-conventional-formula]',
      'Conventional: ' + businessImpact.conventional.engineerHours + ' h × ' + usd(inputs.hourlyRateUsd)
        + ' + ' + usd(inputs.conventionalCiTestUsd) + ' project CI/test = '
        + usd(result.conventionalCost) + '.');
  };

  root.querySelector('.impact-budget-panel')?.addEventListener('input', update);
  root.querySelector<HTMLButtonElement>('.impact-budget-reset')?.addEventListener('click', () => {
    for (const { key, input } of fields) {
      if (input) input.value = String(defaultBudget[key]);
    }
    update();
  });
}

const stepsRoot = document.getElementById('home-steps');
if (stepsRoot) {
  stepsRoot.innerHTML = homeSteps
    .map(
      (step) =>
        '<li class="home-step-card">' +
          '<span class="home-step-number">' + step.number + '</span>' +
          '<h3 class="home-card-title">' + step.title + '</h3>' +
          '<p class="home-card-copy">' + step.description + '</p>' +
        '</li>',
    )
    .join('');
}

const highlightsRoot = document.getElementById('home-highlights');
if (highlightsRoot) {
  highlightsRoot.innerHTML = homeHighlights
    .map(
      (item) =>
        '<article class="home-feature-card">' +
          '<span class="home-feature-label">' + item.label + '</span>' +
          '<h3 class="home-card-title">' + item.title + '</h3>' +
          '<p class="home-card-copy">' + item.description + '</p>' +
        '</article>',
    )
    .join('');
}

const impactRoot = document.getElementById('business-impact-content');
if (impactRoot) {
  impactRoot.innerHTML = renderBusinessImpact();
  wireBusinessBudget(impactRoot);
  const assumptionsLink = impactRoot.querySelector<HTMLAnchorElement>('.impact-assumptions-link');
  const assumptions = impactRoot.querySelector<HTMLDetailsElement>('#impact-assumptions');
  if (assumptionsLink && assumptions) {
    assumptionsLink.addEventListener('click', () => { assumptions.open = true; });
    if (window.location.hash === '#impact-assumptions') assumptions.open = true;
  }
}

const homeSections = document.querySelectorAll<HTMLElement>('.home-page main > section');
if (
  homeSections.length > 0 &&
  'IntersectionObserver' in window &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.05, rootMargin: '0px 0px -40px 0px' },
  );

  homeSections.forEach((section) => {
    section.classList.add('home-reveal');
    revealObserver.observe(section);
  });
}
