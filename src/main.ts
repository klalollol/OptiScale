import { heroStats, impactMetrics, pipelineSteps } from './data';

const statsRoot = document.querySelector('#stats');
const pipelineRoot = document.querySelector('#pipeline');
const impactRoot = document.querySelector('#impact-cards');

if (statsRoot) {
  statsRoot.innerHTML = heroStats
    .map(
      (stat) => `
        <div class="stat-card">
          <span class="stat-value">${stat.value}</span>
          <span class="stat-label">${stat.label}</span>
          <small>${stat.detail}</small>
        </div>
      `,
    )
    .join('');
}

if (pipelineRoot) {
  pipelineRoot.innerHTML = pipelineSteps
    .map(
      (step) => `
        <article class="pipeline-card ${step.accent}">
          <div class="step-tag">${step.id}</div>
          <h4>${step.title}</h4>
          <p>${step.summary}</p>
          <ul>
            ${step.deliverables.map((item) => `<li>${item}</li>`).join('')}
          </ul>
        </article>
      `,
    )
    .join('');
}

if (impactRoot) {
  impactRoot.innerHTML = impactMetrics
    .map(
      (metric) => `
        <article class="impact-card">
          <p class="impact-value">${metric.value}</p>
          <h4>${metric.title}</h4>
          <p>${metric.description}</p>
        </article>
      `,
    )
    .join('');
}
