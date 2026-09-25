import type { FileDiff } from '../types/review';
import { difference, overallDifference, percent, type DiffPercentages } from '../utils/metrics';
import { escapeHtml, highlightCode } from '../utils/html';

function metrics(values: DiffPercentages): string {
  return `<span>Code change <strong>${percent(values.change)}</strong></span><span>Similarity <strong>${percent(values.similarity)}</strong></span><span>LOC delta <strong>${percent(values.locDelta)}</strong></span>`;
}

function fileView(file: FileDiff): string {
  return `<div class="diff-percentages">${metrics(difference(file.changedLines, file.totalOriginalLines, file.newLOC))}</div>
    <p class="flow-note">${escapeHtml(file.changedLines)} changed lines / ${escapeHtml(file.totalOriginalLines)} original lines · ${escapeHtml(file.newLOC)} modernized lines</p>
    <div class="diff-panel"><div class="diff-col"><div class="diff-col-header legacy-header">Original · ${escapeHtml(file.language)}</div><pre class="diff-code" tabindex="0" aria-label="Original code"><code>${highlightCode(file.original)}</code></pre></div>
    <div class="diff-col"><div class="diff-col-header modern-header">Modernized · ${escapeHtml(file.language)}</div><pre class="diff-code" tabindex="0" aria-label="Modernized code"><code>${highlightCode(file.modernized)}</code></pre></div></div>`;
}

export function CodeDiffViewer(files: readonly FileDiff[]): string {
  if (!files.length) return '<p class="empty-note">No file comparisons were returned for this job.</p>';
  return `<div class="diff-overall"><h3>Overall · compared files</h3><div class="diff-percentages">${metrics(overallDifference(files))}</div></div>
    <label class="file-switcher" for="diff-file">Compare file<select id="diff-file">${files.map((file, index) => `<option value="${index}">${escapeHtml(file.path)}</option>`).join('')}</select></label>
    <div id="selected-diff">${fileView(files[0])}</div>
    <details class="formula-note"><summary>How percentages are calculated</summary><p>Code change % = changedLines / totalOriginalLines × 100</p><p>Similarity % = 100 − change %</p><p>LOC delta % = (newLOC − oldLOC) / oldLOC × 100</p><p>Overall values use summed line counts across compared files. A zero original baseline is N/A. Changed lines describe edits, not proof of behavioural equivalence.</p></details>`;
}

export function bindCodeDiffViewer(root: HTMLElement, files: readonly FileDiff[], signal: AbortSignal): void {
  root.querySelector<HTMLSelectElement>('#diff-file')?.addEventListener('change', (event) => {
    const select = event.currentTarget;
    const container = root.querySelector('#selected-diff');
    if (!(select instanceof HTMLSelectElement) || !container) return;
    const file = files[Number(select.value)];
    if (file) container.innerHTML = fileView(file);
  }, { signal });
}
