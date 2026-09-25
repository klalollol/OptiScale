import { ActionButton } from '../components/ActionButton';
import { CodeDiffViewer, bindCodeDiffViewer } from '../components/CodeDiffViewer';
import { ExtensionCard } from '../components/ExtensionCard';
import { MetricCard } from '../components/MetricCard';
import { pageShell } from '../components/PageShell';
import { getDemoResult } from '../services/demoService';
import { downloadBlob, modernizedZip, reportMarkdown } from '../services/exportService';
import { pollReview } from '../services/reviewService';
import { appStore } from '../state/appStore';
import type { PageContext } from '../types/page';
import type { DeploymentArtifact, PerfFinding, ReviewJob, ReviewResult } from '../types/review';
import { errorMessage, escapeHtml, highlightCode } from '../utils/html';
import { improvement, percent } from '../utils/metrics';

function findingCard(finding: PerfFinding): string {
  return `<article class="finding-card"><header><span class="severity ${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span><h3>${escapeHtml(finding.title)}</h3></header>
    <p class="finding-location">${escapeHtml(finding.file)}:${finding.line}</p><dl><dt>Why it is slow</dt><dd>${escapeHtml(finding.whySlow)}</dd><dt>The fix</dt><dd>${escapeHtml(finding.fix)}</dd><dt>Expected gain · ${escapeHtml(finding.evidence)}</dt><dd>${escapeHtml(finding.expectedGain)}</dd></dl></article>`;
}

function artifactViewer(artifact: DeploymentArtifact, index: number): string {
  return `<details class="artifact-viewer"><summary>${escapeHtml(artifact.name)}<span>${escapeHtml(artifact.path)}</span></summary><div class="artifact-tools"><button type="button" class="text-button" data-copy-artifact="${index}">Copy ${escapeHtml(artifact.name)}</button></div><pre class="diff-code" tabindex="0"><code>${highlightCode(artifact.content)}</code></pre></details>`;
}

export function resultMarkup(result: ReviewResult, selectedIds: readonly string[] = []): string {
  const effort = improvement({ before: result.engineerHoursBefore, after: result.engineerHoursAfter, direction: 'lower' });
  const parity = result.parity;
  return `<section class="page-heading"><div class="result-eyebrow"><p class="section-label">Modernization review · ${escapeHtml(result.jobId)}</p><span class="result-mode">${result.mode === 'demo' ? 'Bundled demo · sample data' : 'Review result'}</span></div>
    <h1>${escapeHtml(result.projectName)}</h1><p>${escapeHtml(result.detectedStack.join(' + '))}<span class="stack-arrow"> → </span>${escapeHtml(result.targetStack.join(' + '))}</p>
    ${result.mode === 'demo' ? '<p class="demo-notice">This is an illustrative sample. Performance and effort values are estimates; parity counts are example results. No uploaded project was processed.</p>' : ''}
    <dl class="metric-grid">${MetricCard({ label: 'Files scanned', value: result.filesScanned.toLocaleString() })}${MetricCard({ label: 'Original LOC', value: result.originalLOC.toLocaleString() })}${MetricCard({ label: 'Modernization score', value: `${result.modernizationScore}%` })}${MetricCard({ label: 'Estimated hours saved', value: percent(effort), note: `${result.engineerHoursBefore} → ${result.engineerHoursAfter} engineer-hours` })}</dl><p class="flow-note">${escapeHtml(result.effortNote)}</p>
  </section>
  <section class="result-section" aria-labelledby="performance-title"><p class="section-label">Performance optimization</p><h2 id="performance-title">Make every request faster.</h2><p class="section-intro">Prioritized findings, their causes, and concrete fixes to validate with your workload.</p><div class="finding-grid">${result.findings.length ? result.findings.map(findingCard).join('') : '<p class="empty-note">No performance findings were returned.</p>'}</div></section>
  <section class="result-section" aria-labelledby="code-title"><p class="section-label">Original vs modernized</p><h2 id="code-title">Inspect the change.</h2>${CodeDiffViewer(result.files)}
    <h3 class="table-heading">Performance delta</h3><div class="table-scroll" tabindex="0" aria-label="Performance comparison"><table><caption>Before and after, with evidence for each metric</caption><thead><tr><th scope="col">Metric</th><th scope="col">Before</th><th scope="col">After</th><th scope="col">Improvement</th><th scope="col">Evidence</th></tr></thead><tbody>${result.performance.map((metric) => `<tr><th scope="row">${escapeHtml(metric.label)}</th><td>${metric.before.toLocaleString()} ${escapeHtml(metric.unit)}</td><td>${metric.after.toLocaleString()} ${escapeHtml(metric.unit)}</td><td>${percent(improvement(metric))}</td><td><strong>${escapeHtml(metric.evidence)}</strong><span>${escapeHtml(metric.note)}</span></td></tr>`).join('')}</tbody></table></div>
    ${result.performance.length ? '' : '<p class="empty-note">No performance metrics were returned.</p>'}
    <p class="flow-note">Lower is better for latency, memory and cold start: (before − after) / before × 100. Higher is better for throughput: (after − before) / before × 100. A zero baseline is N/A; negative improvement means regression.</p></section>
  <section class="result-section" aria-labelledby="parity-title"><p class="section-label">Subagent 2 · parity verification</p><h2 id="parity-title">Business behaviour, checked.</h2><dl class="metric-grid">${MetricCard({ label: 'Generated tests', value: parity.generatedTests.toLocaleString() })}${MetricCard({ label: 'Passed', value: parity.passed.toLocaleString() })}${MetricCard({ label: 'Failed', value: parity.failed.toLocaleString() })}${MetricCard({ label: 'I/O equivalence', value: `${parity.equivalencePercent}%` })}</dl><p class="flow-note">${escapeHtml(parity.evidence)} · ${escapeHtml(parity.note)}</p><div class="parity-drift ${parity.behaviouralDrift.length || parity.failed ? 'has-drift' : ''}"><h3>Behavioural drift</h3>${parity.behaviouralDrift.length ? `<ul>${parity.behaviouralDrift.map((drift) => `<li>${escapeHtml(drift)}</li>`).join('')}</ul>` : '<p>No behavioural drift listed in this report.</p>'}</div></section>
  <section class="result-section" aria-labelledby="deployment-title"><p class="section-label">Subagent 3 · deployment</p><h2 id="deployment-title">Ready for engineering review.</h2><p class="section-intro">Inspect generated artifacts before integrating them into your environment.</p>${result.artifacts.length ? result.artifacts.map(artifactViewer).join('') : '<p class="empty-note">No deployment artifacts were returned.</p>'}<p id="copy-status" class="flow-note" role="status" aria-live="polite"></p></section>
  <section class="result-section" aria-labelledby="extensions-title"><p class="section-label">Recommended extensions & dependencies</p><h2 id="extensions-title">Build on the right tools.</h2><p class="section-intro">Add to project includes a reviewable setup file in the downloaded ZIP. Merge dependency snippets with compatible versions and run installation commands locally.</p><div class="extension-grid">${result.extensions.length ? result.extensions.map((extension) => ExtensionCard(extension, selectedIds.includes(extension.id))).join('') : '<p class="empty-note">No recommendations were returned.</p>'}</div><p id="extension-status" class="flow-note" role="status" aria-live="polite"></p></section>
  <section class="result-section export-section" aria-labelledby="export-title"><p class="section-label">Take the next step</p><h2 id="export-title">Take the review with you.</h2><p>${escapeHtml(result.archiveNote)}</p><div class="action-row">${ActionButton({ id: 'download-md', label: 'Download report (MD)', secondary: true })}${ActionButton({ id: 'download-pdf', label: 'Save report as PDF', secondary: true })}${ActionButton({ id: 'download-zip', label: 'Download modernized ZIP' })}</div><p class="flow-note">PDF opens your browser’s print dialog. Choose Save as PDF to export the full report, including every compared file.</p><p id="export-status" class="flow-note" role="status" aria-live="polite"></p><a class="back-link" href="/upload" data-nav>← Review another project</a></section>`;
}

function progressMarkup(jobId: string, job?: ReviewJob): string {
  return `<section class="page-heading"><p class="section-label">Review in progress</p><h1>Modernizing your project.</h1><p>Job ${escapeHtml(jobId)} · ${job ? escapeHtml(job.status) : 'Fetching the latest job state…'}</p></section>
    <div class="job-progress" aria-live="polite">${job?.subagents.length ? job.subagents.map((agent) => `<article class="job-agent"><header><h2>${escapeHtml(agent.name)}</h2><span class="sa-status ${agent.status === 'completed' ? 'running' : agent.status === 'failed' ? 'verifying' : agent.status}">${escapeHtml(agent.status)}</span></header><label for="agent-${escapeHtml(agent.id)}">${escapeHtml(agent.detail)} · ${agent.progress}%</label><progress id="agent-${escapeHtml(agent.id)}" max="100" value="${agent.progress}">${agent.progress}%</progress></article>`).join('') : '<p class="flow-note">Waiting for subagent progress from the review service.</p>'}</div>`;
}

export function ResultPage({ root, navigate, signal, jobId }: PageContext): void {
  document.title = 'Review result · OptiScale';
  if (!jobId) { navigate('/upload'); return; }
  root.innerHTML = pageShell('result-page', '<div id="result-content"></div>');
  const content = root.querySelector<HTMLElement>('#result-content');
  if (!content) throw new Error('Result container is missing.');
  let requestController: AbortController | undefined;
  let printing: HTMLElement | undefined;
  signal.addEventListener('abort', () => { requestController?.abort(); printing?.remove(); }, { once: true });

  const bindResult = (result: ReviewResult): void => {
    content.innerHTML = resultMarkup(result, appStore.selectedExtensions(result.jobId));
    document.title = `${result.projectName} · OptiScale`;
    bindCodeDiffViewer(content, result.files, signal);
    content.querySelectorAll<HTMLButtonElement>('[data-copy-artifact]').forEach((button) => {
      button.addEventListener('click', () => {
        const artifact = result.artifacts[Number(button.dataset.copyArtifact)];
        const status = content.querySelector('#copy-status');
        if (!artifact || !status) return;
        if (!navigator.clipboard) { status.textContent = 'Clipboard is unavailable. Select the code and copy it manually.'; return; }
        void navigator.clipboard.writeText(artifact.content).then(() => { status.textContent = `${artifact.name} copied.`; }).catch(() => { status.textContent = 'Clipboard access was denied. Select the code and copy it manually.'; });
      }, { signal });
    });
    content.querySelectorAll<HTMLButtonElement>('[data-extension]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.extension;
        if (!id) return;
        const selected = appStore.toggleExtension(result.jobId, id);
        button.setAttribute('aria-pressed', String(selected));
        button.textContent = selected ? 'Added · remove' : 'Add to project';
        const status = content.querySelector('#extension-status');
        if (status) status.textContent = selected ? 'Setup file added to your next modernized ZIP export.' : 'Setup file removed from your next export.';
      }, { signal });
    });
    content.querySelector('#download-md')?.addEventListener('click', () => {
      downloadBlob(new Blob([reportMarkdown(result, appStore.selectedExtensions(result.jobId))], { type: 'text/markdown;charset=utf-8' }), `${result.jobId}-review.md`);
    }, { signal });
    content.querySelector('#download-pdf')?.addEventListener('click', () => {
      printing?.remove();
      printing = document.createElement('article');
      printing.id = 'print-report';
      const report = document.createElement('pre');
      report.textContent = reportMarkdown(result, appStore.selectedExtensions(result.jobId));
      printing.append(report);
      document.body.append(printing);
      window.print();
    }, { signal });
    const zipButton = content.querySelector<HTMLButtonElement>('#download-zip');
    zipButton?.addEventListener('click', () => {
      if (zipButton.disabled) return;
      const status = content.querySelector('#export-status');
      if (!status) return;
      zipButton.disabled = true;
      status.textContent = 'Preparing ZIP…';
      void modernizedZip(result, appStore.selectedExtensions(result.jobId), signal).then((blob) => {
        if (signal.aborted) return;
        downloadBlob(blob, result.archiveName);
        status.textContent = 'ZIP prepared. Check your browser downloads.';
      }).catch((error: unknown) => { if (!signal.aborted) status.textContent = errorMessage(error); })
        .finally(() => { if (!signal.aborted) zipButton.disabled = false; });
    }, { signal });
  };

  const load = async (): Promise<void> => {
    requestController?.abort();
    const controller = new AbortController();
    requestController = controller;
    content.innerHTML = progressMarkup(jobId);
    try {
      if (jobId === 'demo') { const demo = getDemoResult(); appStore.setResult(demo); bindResult(demo); return; }
      const cached = appStore.getResult(jobId);
      if (cached) { bindResult(cached); return; }
      const job = await pollReview(jobId, { signal: controller.signal, onUpdate: (update) => {
        if (!signal.aborted && !controller.signal.aborted) content.innerHTML = progressMarkup(jobId, update);
      } });
      if (signal.aborted || controller.signal.aborted) return;
      appStore.setJob(job);
      if (job.status === 'failed') throw new Error(job.error || 'The review failed. Retry to check this job or upload a new archive.');
      if (job.status === 'empty') {
        content.innerHTML = '<section class="page-heading"><p class="section-label">Review complete</p><h1>No review results yet.</h1><p>No supported source files were returned for this job. Check the project contents and upload again.</p><div class="action-row"><button type="button" class="action-button secondary" data-retry>Check again</button><a class="action-button" href="/upload" data-nav>Choose another ZIP</a></div></section>';
      } else if (job.result) bindResult(job.result);
    } catch (error: unknown) {
      if (signal.aborted || controller.signal.aborted) return;
      content.innerHTML = `<section class="page-heading"><p class="section-label">Review unavailable</p><h1>We could not load this review.</h1><p class="inline-error" role="alert">${escapeHtml(errorMessage(error))}</p><div class="action-row"><button type="button" class="action-button" data-retry>Retry</button><a class="action-button secondary" href="/upload" data-nav>Back to upload</a></div></section>`;
    }
  };
  content.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('[data-retry]')) void load();
  }, { signal });
  void load();
}
