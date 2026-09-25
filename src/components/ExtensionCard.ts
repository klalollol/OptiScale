import type { ExtensionSuggestion } from '../types/review';
import { escapeHtml } from '../utils/html';

export function ExtensionCard(extension: ExtensionSuggestion, selected: boolean): string {
  return `<article class="extension-card"><span class="section-label">${escapeHtml(extension.category)}</span><h3>${escapeHtml(extension.name)}</h3>
    <p><strong>Replaces:</strong> ${escapeHtml(extension.replaces)}</p><p>${escapeHtml(extension.why)}</p>
    <pre tabindex="0" aria-label="Installation instructions"><code>${escapeHtml(extension.installCommand)}</code></pre>
    <a href="${escapeHtml(extension.sourceUrl)}" target="_blank" rel="noopener noreferrer">Official documentation ↗</a>
    <button type="button" class="action-button secondary" data-extension="${escapeHtml(extension.id)}" aria-pressed="${selected}">${selected ? 'Added · remove' : 'Add to project'}</button></article>`;
}
