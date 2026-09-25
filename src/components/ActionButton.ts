import { escapeHtml } from '../utils/html';

interface ActionButtonOptions {
  id: string;
  label: string;
  secondary?: boolean;
  disabled?: boolean;
}

export function ActionButton({ id, label, secondary = false, disabled = false }: ActionButtonOptions): string {
  return `<button type="button" id="${escapeHtml(id)}" class="action-button${secondary ? ' secondary' : ''}" ${disabled ? 'disabled' : ''}>${escapeHtml(label)}</button>`;
}
