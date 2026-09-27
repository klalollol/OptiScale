import { businessImpact, homeHighlights, homeSteps } from '../../data';

const usd = (amount: number): string => `$${amount.toLocaleString('en-US')}`;

const htmlEntities: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};
const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => htmlEntities[char]);

type BudgetInputs = Pick<typeof businessImpact, 'hourlyRateUsd' | 'conventionalCiTestUsd' | 'optiScaleToolsUsd' | 'optiScaleCiTestUsd'>;
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
  const savingsHours = conventional.engineerHours - base.engineerHours;
  const baseCopy = changeCopy(base.difference);
  const bars = [
    { key: 'conventional', label: conventional.label, costUsd: conventionalCost, className: 'conventional' },
    { key: 'base', label: 'OptiScale · base', costUsd: base.cost, className: 'optiscale' },
  ];

  return `
    <div class="home-impact-heading">
      <div><p class="section-label">${escapeHtml(businessImpact.sectionLabel)}</p><h2 class="home-section-title" id="business-impact-title">${escapeHtml(businessImpact.title)}</h2></div>
      <p class="home-section-intro">${escapeHtml(businessImpact.intro)}</p>
    </div>
    <details class="home-impact-budget-panel" open>
      <summary>${escapeHtml(copy.budgetSummary)} <span>${escapeHtml(copy.budgetAside)}</span></summary>
      <div class="home-impact-budget-body">
        <p>${escapeHtml(copy.budgetIntro)}</p>
        <div class="home-impact-budget-grid">
          <label>${escapeHtml(copy.engineeringRate)} <span>${escapeHtml(copy.hourlyUnit)}</span><input data-budget-field="hourlyRateUsd" type="number" inputmode="decimal" min="0" max="1000000000" step="any" value="${initialBudget.hourlyRateUsd}"></label>
          <label>${escapeHtml(copy.conventionalCi)} <span>${escapeHtml(copy.projectUnit)}</span><input data-budget-field="conventionalCiTestUsd" type="number" inputmode="decimal" min="0" max="1000000000" step="any" value="${initialBudget.conventionalCiTestUsd}"></label>
          <label>${escapeHtml(copy.optiScaleTools)} <span>${escapeHtml(copy.projectUnit)}</span><input data-budget-field="optiScaleToolsUsd" type="number" inputmode="decimal" min="0" max="1000000000" step="any" value="${initialBudget.optiScaleToolsUsd}"></label>
          <label>${escapeHtml(copy.optiScaleCi)} <span>${escapeHtml(copy.projectUnit)}</span><input data-budget-field="optiScaleCiTestUsd" type="number" inputmode="decimal" min="0" max="1000000000" step="any" value="${initialBudget.optiScaleCiTestUsd}"></label>
        </div>
        <p class="home-impact-budget-formula">${escapeHtml(copy.budgetFormula)}</p>
        <p class="home-impact-budget-error" role="status" aria-live="polite" hidden></p>
        <button class="home-impact-budget-reset" type="button">${escapeHtml(copy.reset)}</button>
      </div>
    </details>
    <div class="home-impact-main">
      <div class="home-impact-lead">
        <span class="home-impact-eyebrow">${escapeHtml(copy.baseCase)}</span>
        <p class="home-impact-budget-state" data-impact-budget-state>${escapeHtml(copy.customState)}</p>
        <p class="home-impact-reduction"><strong data-impact-base-percent>${base.percent.toFixed(1)}%</strong><span data-impact-base-label>${escapeHtml(baseCopy.label)}</span></p>
        <p class="home-impact-savings"><strong data-impact-base-difference>${usd(Math.abs(base.difference))}</strong><span data-impact-base-detail>${escapeHtml(baseCopy.detail)} / project</span></p>
        <p class="home-impact-hours"><strong>${savingsHours} ${escapeHtml(businessImpact.hoursLabel)}</strong> · ${escapeHtml(businessImpact.hoursCaveat)}</p>
      </div>
      <div class="home-impact-chart" role="group" aria-label="${escapeHtml(copy.chartAria)}">
        <p class="home-impact-chart-title"><span>${escapeHtml(businessImpact.chartTitle)}</span><span>${escapeHtml(copy.projectUnit)}</span></p>
        ${bars.map((bar) => `
          <div class="home-impact-bar-row">
            <div class="home-impact-bar-meta"><span>${escapeHtml(bar.label)}</span><strong data-impact-cost="${bar.key}">${usd(bar.costUsd)}</strong></div>
            <div class="home-impact-bar-track" aria-hidden="true"><span class="home-impact-bar-fill ${bar.className}" data-impact-bar="${bar.key}" style="width:${((bar.costUsd / scale) * 100).toFixed(1)}%"></span></div>
          </div>
        `).join('')}
        <div class="home-impact-chart-axis" aria-hidden="true"><span>$0</span><span data-impact-axis-max>${usd(scale)}</span></div>
        <p class="home-impact-chart-note">Bars share the same $0–<span data-impact-note-max>${usd(scale)}</span> scale.</p>
      </div>
    </div>
    <div class="home-impact-scenarios" role="list" aria-label="${escapeHtml(copy.scenarioAria)}">
      ${scenarios.map((scenario) => {
        const scenarioCopy = changeCopy(scenario.difference);
        return `<div class="home-impact-scenario ${scenario.key === 'base' ? 'is-base' : ''}" data-impact-scenario="${scenario.key}" role="listitem">
          <span class="home-impact-scenario-name">${escapeHtml(scenario.label)}</span>
          <strong data-impact-percent>${scenario.percent.toFixed(1)}%</strong>
          <span data-impact-difference>${usd(Math.abs(scenario.difference))} ${escapeHtml(scenarioCopy.detail)}</span>
        </div>`;
      }).join('')}
    </div>
    <p class="home-impact-disclaimer">${escapeHtml(businessImpact.disclaimer)}</p>
    <a class="home-impact-assumptions-link" href="#impact-assumptions">${escapeHtml(businessImpact.labels.assumptionsLink)} <span aria-hidden="true">↓</span></a>
    <details class="home-impact-assumptions" id="impact-assumptions">
      <summary>${escapeHtml(businessImpact.labels.detailsSummary)}</summary>
      <div class="home-impact-details">
        <div>
          <h3>${escapeHtml(copy.inputsHeading)}</h3>
          <p>${escapeHtml(copy.scope)} <span data-impact-rate-description>an entered rate of ${usd(initialBudget.hourlyRateUsd)}/hour</span>.</p>
          <div class="home-impact-workstreams" role="list" aria-label="${escapeHtml(copy.workstreamsAria)}">
            ${businessImpact.workstreams.map((workstream) => `<div role="listitem"><span>${escapeHtml(workstream.label)}</span><strong>${workstream.conventionalHours} → ${workstream.baseHours} h</strong></div>`).join('')}
          </div>
          <p data-impact-conventional-formula>Conventional: ${conventional.engineerHours} h × ${usd(initialBudget.hourlyRateUsd)} + ${usd(initialBudget.conventionalCiTestUsd)} project CI/test = ${usd(conventionalCost)}.</p>
          ${scenarios.map((scenario) => `<p data-impact-scenario-formula="${scenario.key}">OptiScale ${escapeHtml(scenario.label.toLowerCase())}: ${scenario.engineerHours} h × ${usd(initialBudget.hourlyRateUsd)} + ${usd(initialBudget.optiScaleToolsUsd)} tools/AI + ${usd(initialBudget.optiScaleCiTestUsd)} project CI/test = ${usd(scenario.cost)}.</p>`).join('')}
          <p>${escapeHtml(businessImpact.reductionFormula)} ${escapeHtml(copy.formulaNote)}</p>
          <p>${escapeHtml(copy.limits)}</p>
        </div>
        <div>
          <h3>${escapeHtml(businessImpact.labels.researchHeading)}</h3>
          <p>${escapeHtml(businessImpact.researchCaveat)}</p>
          <ul class="home-impact-source-list">
            ${businessImpact.sources.map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)} <span aria-hidden="true">↗</span></a><span>${escapeHtml(source.context)}</span></li>`).join('')}
          </ul>
        </div>
      </div>
    </details>
  `;
}

function wireBusinessBudget(root: HTMLElement): void {
  const fields = budgetFields.map((key) => ({
    key,
    input: root.querySelector<HTMLInputElement>(`[data-budget-field="${key}"]`),
  }));
  const error = root.querySelector<HTMLElement>('.home-impact-budget-error');
  const status = root.querySelector<HTMLElement>('[data-impact-budget-state]');
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
        error.textContent = zeroBaseline ? businessImpact.copy.zeroBaseline : businessImpact.copy.invalidValue;
      }
      if (status) status.textContent = businessImpact.copy.invalidState;
      return;
    }

    const result = calculateBudget(inputs);
    if (!Number.isFinite(result.scale) || result.scenarios.some((scenario) => !Number.isFinite(scenario.percent))) {
      if (error) {
        error.hidden = false;
        error.textContent = businessImpact.copy.invalidValue;
      }
      return;
    }

    if (error) error.hidden = true;
    const custom = budgetFields.some((key) => inputs[key] !== defaultBudget[key]);
    if (status) status.textContent = custom ? businessImpact.copy.customState : businessImpact.copy.defaultState;
    const baseCopy = changeCopy(result.base.difference);
    setText('[data-impact-base-percent]', `${result.base.percent.toFixed(1)}%`);
    setText('[data-impact-base-label]', baseCopy.label);
    setText('[data-impact-base-difference]', usd(Math.abs(result.base.difference)));
    setText('[data-impact-base-detail]', `${baseCopy.detail} / project`);
    root.querySelector('.home-impact-lead')?.classList.toggle('is-increase', result.base.difference < 0);

    for (const [key, cost] of [['conventional', result.conventionalCost], ['base', result.base.cost]] as const) {
      setText(`[data-impact-cost="${key}"]`, usd(cost));
      const bar = root.querySelector<HTMLElement>(`[data-impact-bar="${key}"]`);
      if (bar) bar.style.width = `${(cost / result.scale * 100).toFixed(1)}%`;
    }
    setText('[data-impact-axis-max]', usd(result.scale));
    setText('[data-impact-note-max]', usd(result.scale));

    for (const scenario of result.scenarios) {
      const selector = `[data-impact-scenario="${scenario.key}"]`;
      const scenarioCopy = changeCopy(scenario.difference);
      root.querySelector(selector)?.classList.toggle('is-increase', scenario.difference < 0);
      setText(`${selector} [data-impact-percent]`, `${scenario.percent.toFixed(1)}%`);
      setText(`${selector} [data-impact-difference]`, `${usd(Math.abs(scenario.difference))} ${scenarioCopy.detail}`);
      setText(`[data-impact-scenario-formula="${scenario.key}"]`, `OptiScale ${scenario.label.toLowerCase()}: ${scenario.engineerHours} h × ${usd(inputs.hourlyRateUsd)} + ${usd(inputs.optiScaleToolsUsd)} tools/AI + ${usd(inputs.optiScaleCiTestUsd)} project CI/test = ${usd(scenario.cost)}.`);
    }
    setText('[data-impact-rate-description]', `${custom ? 'an entered' : 'a planning'} rate of ${usd(inputs.hourlyRateUsd)}/hour`);
    setText('[data-impact-conventional-formula]', `Conventional: ${businessImpact.conventional.engineerHours} h × ${usd(inputs.hourlyRateUsd)} + ${usd(inputs.conventionalCiTestUsd)} project CI/test = ${usd(result.conventionalCost)}.`);
  };

  root.querySelector('.home-impact-budget-panel')?.addEventListener('input', update);
  root.querySelector<HTMLButtonElement>('.home-impact-budget-reset')?.addEventListener('click', () => {
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
  wireBusinessBudget(impactRoot);
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

const homeSections = document.querySelectorAll<HTMLElement>('.home-page main > section');
if (
  homeSections.length > 0
  && 'IntersectionObserver' in window
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.05, rootMargin: '0px 0px -40px 0px' },
  );

  homeSections.forEach((section) => {
    section.classList.add('home-reveal');
    revealObserver.observe(section);
  });
}
