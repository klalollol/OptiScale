import { businessImpact, homeHighlights, homeSteps } from './data';

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
  const assumptionsLink = impactRoot.querySelector<HTMLAnchorElement>('.home-impact-assumptions-link');
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
