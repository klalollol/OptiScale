import { escapeHtml } from '../utils/html';

interface MetricCardOptions {
  label: string;
  value: string | number;
  note?: string;
}

export function MetricCard({ label, value, note }: MetricCardOptions): string {
  return `<div class="metric-card"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>${note ? `<p>${escapeHtml(note)}</p>` : ''}</div>`;
}
