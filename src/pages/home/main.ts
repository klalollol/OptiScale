import {
  subagentCards,
  codeDiff,
  footerStats,
  samplePreflightPanel,
  samplePerfMetrics,
  sampleSuggestions,
  type PreflightCheckDisplay,
  type PreflightPanelData,
  type PerfMetricRow,
  type SuggestionRow,
  type SuggestionPanelData,
} from '../../data';

// ─── Subagent cards ───────────────────────────────────────────────────────────

const subagentRoot = document.querySelector('#subagent-cards');
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

const diffLabel = document.querySelector('#diff-label');
if (diffLabel) diffLabel.textContent = codeDiff.label;

const diffLegacy = document.querySelector('#diff-legacy');
if (diffLegacy) diffLegacy.innerHTML = codeDiff.legacy;

const diffModern = document.querySelector('#diff-modern');
if (diffModern) diffModern.innerHTML = codeDiff.modern;

const diffParity = document.querySelector('#diff-parity');
if (diffParity) diffParity.textContent = codeDiff.parityLine;

// ─── Footer stats ─────────────────────────────────────────────────────────────

const statsFooter = document.querySelector('#stats-footer');
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

// ─── Preflight checklist (Page 2) ────────────────────────────────────────────

function statusIcon(c: PreflightCheckDisplay): string {
  if (c.status === 'pass') return '✓';
  if (c.status === 'skip') return '–';
  // fail
  return c.severity === 'blocker' ? '✕' : '⚠';
}

function severityClass(c: PreflightCheckDisplay): string {
  if (c.status === 'pass') return 'pass';
  if (c.status === 'skip') return 'skip';
  return c.severity === 'blocker' ? 'blocker' : 'warning';
}

function renderPreflightChecks(panel: PreflightPanelData): string {
  const hasBlockers = panel.checks.some(
    (c) => c.severity === 'blocker' && c.status === 'fail',
  );
  const tierClass =
    panel.tier === 'measured'
      ? 'tier-measured'
      : panel.tier === 'estimated'
        ? 'tier-estimated'
        : 'tier-unavailable';

  return `
    <div class="preflight-header">
      <span class="preflight-score">score <span class="preflight-score-num">${panel.score}%</span></span>
      <span class="preflight-tier ${tierClass}">${panel.tier}</span>
    </div>
    <div class="preflight-list">
      ${panel.checks
        .map((c) => {
          const cls = severityClass(c);
          const icon = statusIcon(c);
          const rem = c.remediation
            ? `<span class="pf-remediation">→ ${c.remediation}</span>`
            : '';
          return `
          <div class="preflight-check ${cls}">
            <span class="pf-icon">${icon}</span>
            <div class="pf-body">
              <span class="pf-label">${c.label}</span>
              <span class="pf-detail">${c.detail}</span>
              ${rem}
            </div>
          </div>`;
        })
        .join('')}
    </div>
    ${
      hasBlockers
        ? '<p class="preflight-blocked">⛔ review disabled — resolve all blockers to continue</p>'
        : ''
    }
  `;
}

const preflightRoot = document.querySelector('#preflight-checks');
if (preflightRoot) {
  preflightRoot.innerHTML = renderPreflightChecks(samplePreflightPanel);
}

// Wire the Review button: disabled while any blocker is unresolved
const reviewBtn = document.querySelector<HTMLButtonElement>('#review-btn');
if (reviewBtn) {
  const hasBlockers = samplePreflightPanel.checks.some(
    (c) => c.severity === 'blocker' && c.status === 'fail',
  );
  reviewBtn.disabled = hasBlockers;
}

// ─── Requirements panel + Perf table (Page 3) ────────────────────────────────

function renderRequirementsPanel(panel: PreflightPanelData): string {
  return renderPreflightChecks(panel);
}

function deltaBadge(delta: number, unit: string): string {
  // Latency: lower is better (negative delta = improvement)
  // Throughput / JMH score interpretation is caller's responsibility;
  // we simply colour negative = red, positive = green here for latency-centric view
  const isLatency = unit === 'ms' || unit === 'ns';
  const improved  = isLatency ? delta < 0 : delta > 0;
  const cls = improved ? 'delta-good' : delta === 0 ? 'delta-neutral' : 'delta-bad';
  const sign = delta > 0 ? '+' : '';
  return `<span class="perf-delta ${cls}">${sign}${delta.toFixed(2)}%</span>`;
}

function sourceBadge(source: PerfMetricRow['source']): string {
  return source === 'measured'
    ? '<span class="badge-measured">measured</span>'
    : '<span class="badge-estimated">estimated</span>';
}

function renderPerfTable(rows: PerfMetricRow[]): string {
  return `
    <table class="perf-table">
      <thead>
        <tr>
          <th>metric</th>
          <th>tool</th>
          <th>legacy</th>
          <th>modern</th>
          <th>delta</th>
          <th>source</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r) => `
          <tr>
            <td class="perf-name">${r.name}</td>
            <td class="perf-tool">${r.tool}</td>
            <td class="perf-val">${r.legacyValue.toLocaleString()} <span class="perf-unit">${r.unit}</span></td>
            <td class="perf-val">${r.modernValue.toLocaleString()} <span class="perf-unit">${r.unit}</span></td>
            <td>${deltaBadge(r.deltaPercent, r.unit)}</td>
            <td>${sourceBadge(r.source)}</td>
          </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  `;
}

const reqPanel = document.querySelector('#requirements-panel');
if (reqPanel) {
  reqPanel.innerHTML = renderRequirementsPanel(samplePreflightPanel);
}

const perfTable = document.querySelector('#perf-table');
if (perfTable) {
  perfTable.innerHTML = renderPerfTable(samplePerfMetrics);
}

// ─── Suggestions panel (Page 3) ──────────────────────────────────────────────

function severityBadge(s: SuggestionRow['severity']): string {
  const cls =
    s === 'critical' ? 'sug-critical' : s === 'major' ? 'sug-major' : 'sug-minor';
  return `<span class="sug-severity ${cls}">${s}</span>`;
}

function categoryBadge(c: string): string {
  return `<span class="sug-category">${c}</span>`;
}

function boostBadge(row: SuggestionRow): string {
  if (row.boostMin === 0 && row.boostMax === 0) {
    return `<span class="sug-boost sug-boost-reliability">reliability fix</span>`;
  }
  return `<span class="sug-boost">↑ ${row.boostMin}–${row.boostMax}% ${row.boostMetric}</span>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderSuggestionsPanel(panel: SuggestionPanelData): string {
  const boostLine =
    panel.compositeBoostMin > 0
      ? `<div class="sug-composite">
           projected composite improvement:
           <span class="sug-composite-num">${panel.compositeBoostMin}–${panel.compositeBoostMax}%</span>
           p95 latency if all performance patterns are fixed
         </div>`
      : '';

  const cards = panel.rows
    .map((row) => {
      const steps = row.fixSteps
        .map((s, i) => `<li><span class="sug-step-num">${i + 1}.</span> ${s}</li>`)
        .join('');

      return `
      <div class="sug-card">
        <div class="sug-card-header">
          <div class="sug-card-meta">
            ${severityBadge(row.severity)}
            ${categoryBadge(row.category)}
          </div>
          <div class="sug-card-right">
            ${boostBadge(row)}
            <span class="sug-hits">${row.hitCount} file${row.hitCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="sug-label">${row.label}</div>
        <div class="sug-desc">${row.description}</div>
        <div class="sug-file">⌂ ${row.exampleFile}</div>
        <div class="sug-diff">
          <div class="sug-diff-col">
            <div class="sug-diff-header legacy-header">before</div>
            <pre class="sug-code">${escapeHtml(row.beforeCode)}</pre>
          </div>
          <div class="sug-diff-col">
            <div class="sug-diff-header modern-header">after</div>
            <pre class="sug-code">${escapeHtml(row.afterCode)}</pre>
          </div>
        </div>
        <ol class="sug-steps">${steps}</ol>
      </div>`;
    })
    .join('');

  return boostLine + `<div class="sug-list">${cards}</div>`;
}

const sugPanel = document.querySelector('#suggestions-panel');
if (sugPanel) {
  sugPanel.innerHTML = renderSuggestionsPanel(sampleSuggestions);
}
