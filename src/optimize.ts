// optimize.ts — Optimize page state machine
import { optimizationData } from './demo-data';

void optimizationData; // available for future backend wiring

type OptState = 'idle' | 'applying' | 'done';

const APPLY_STEPS: Array<{ label: string }> = [
  { label: 'Patch generated' },
  { label: 'Code updated' },
  { label: 'Dependencies preserved' },
  { label: 'Preparing optimized build' },
];

const idleEl     = document.querySelector<HTMLElement>('#opt-idle')!;
const applyingEl = document.querySelector<HTMLElement>('#opt-applying')!;
const doneEl     = document.querySelector<HTMLElement>('#opt-done')!;
const applyBtn   = document.querySelector<HTMLButtonElement>('#apply-btn')!;
const stepsRoot  = document.querySelector<HTMLElement>('#apply-steps')!;

function showState(s: OptState): void {
  idleEl.classList.toggle('hidden', s !== 'idle');
  applyingEl.classList.toggle('hidden', s !== 'applying');
  doneEl.classList.toggle('hidden', s !== 'done');
}

function buildStepRows(): void {
  stepsRoot.innerHTML = APPLY_STEPS.map(
    (s, i) =>
      `<div class="apply-step" id="step-${i}">
        <span class="apply-step-icon" id="step-icon-${i}">○</span>
        <span>${s.label}</span>
      </div>`,
  ).join('');
}

async function runApply(): Promise<void> {
  showState('applying');
  buildStepRows();

  for (let i = 0; i < APPLY_STEPS.length; i++) {
    const row  = document.querySelector<HTMLElement>(`#step-${i}`)!;
    const icon = document.querySelector<HTMLElement>(`#step-icon-${i}`)!;

    row.classList.add('active');
    icon.textContent = '●';
    await new Promise<void>((r) => setTimeout(r, 500 + Math.random() * 300));

    // Check if it's the last step
    if (i === APPLY_STEPS.length - 1) {
      // last step stays "active" briefly then done
      await new Promise<void>((r) => setTimeout(r, 400));
    }

    row.classList.remove('active');
    row.classList.add('done');
    icon.textContent = '✓';
  }

  await new Promise<void>((r) => setTimeout(r, 300));
  showState('done');
}

applyBtn.addEventListener('click', () => void runApply());

// diff btn — just highlights the diff panel which is already visible
document.querySelector<HTMLButtonElement>('#diff-btn')?.addEventListener('click', () => {
  const diffPanel = document.querySelector<HTMLElement>('.diff-panel');
  if (!diffPanel) return;
  diffPanel.style.outline = '1px solid var(--cyan)';
  diffPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => { diffPanel.style.outline = ''; }, 1500);
});

showState('idle');
