import { subagentCards, codeDiff, footerStats } from '../data';
import type { PageContext } from '../types/page';

export function HomePage({ root }: PageContext): void {
  document.title = 'OptiScale · Automated Modernization Engine';
  const template = document.querySelector<HTMLTemplateElement>('#home-template');
  if (!template) throw new Error('Homepage template is missing.');
  root.replaceChildren(template.content.cloneNode(true));
  // ─── Subagent cards ───────────────────────────────────────────────────────────
  
  const subagentRoot = root.querySelector('#subagent-cards');
  if (subagentRoot) {
    subagentRoot.innerHTML = subagentCards
      .map((card) => {
        const pct = Math.round((card.progressDone / card.progressTotal) * 100);
        const fillClass =
          card.status === 'running' ? '' : card.status === 'verifying' ? 'amber' : 'muted';
        return `
        <div class="subagent-card">
          <div class="sa-header">
            <span class="sa-id">${card.id}</span>
            <span class="sa-status ${card.status}">${card.status}</span>
          </div>
          <div class="sa-title">${card.title}</div>
          <div class="sa-desc">${card.description}</div>
          <div class="sa-progress-wrap">
            <div class="sa-progress-meta">
              <span>${card.progressDone.toLocaleString()} / ${card.progressTotal.toLocaleString()} ${card.progressUnit}</span>
              <span class="sa-progress-pct">${pct}%</span>
            </div>
            <div class="sa-progress-track">
              <div class="sa-progress-fill ${fillClass}" style="width:${pct}%"></div>
            </div>
          </div>
        </div>
      `;
      })
      .join('');
  }
  
  // ─── Code diff ────────────────────────────────────────────────────────────────
  
  const diffLabel = root.querySelector('#diff-label');
  if (diffLabel) diffLabel.textContent = codeDiff.label;
  
  const diffLegacy = root.querySelector('#diff-legacy');
  if (diffLegacy) diffLegacy.innerHTML = codeDiff.legacy;
  
  const diffModern = root.querySelector('#diff-modern');
  if (diffModern) diffModern.innerHTML = codeDiff.modern;
  
  const diffParity = root.querySelector('#diff-parity');
  if (diffParity) diffParity.textContent = codeDiff.parityLine;
  
  // ─── Footer stats ─────────────────────────────────────────────────────────────
  
  const statsFooter = root.querySelector('#stats-footer');
  if (statsFooter) {
    statsFooter.innerHTML = footerStats
      .map(
        (stat) => `
        <div class="stat-block">
          <span class="stat-num">${stat.value}</span>
          <span class="stat-desc">${stat.label}</span>
        </div>
      `,
      )
      .join('');
  }
}

