// benchmark.ts — Benchmark page state machine
import { benchmarkData } from '../../demo-data';

void benchmarkData; // available for future backend wiring

const LOG_STEPS: Array<{ label: string; delay: number }> = [
  { label: 'Sandbox initialized',     delay: 400  },
  { label: 'PostgreSQL ready',         delay: 600  },
  { label: 'Application started',      delay: 700  },
  { label: 'Load generator connected', delay: 500  },
  { label: 'Running workload',         delay: 3000 },
  { label: 'Collecting metrics',       delay: 1200 },
  { label: 'Comparing results',        delay: 800  },
];

const idleEl     = document.querySelector<HTMLElement>('#bench-idle')!;
const runningEl  = document.querySelector<HTMLElement>('#bench-running')!;
const completeEl = document.querySelector<HTMLElement>('#bench-complete')!;
const startBtn   = document.querySelector<HTMLButtonElement>('#start-bench-btn')!;
const logRoot    = document.querySelector<HTMLElement>('#bench-log')!;
const statusText = document.querySelector<HTMLElement>('#bench-status-text')!;

const progOrig = document.querySelector<HTMLElement>('#prog-orig')!;
const progOpt  = document.querySelector<HTMLElement>('#prog-opt')!;
const pctOrig  = document.querySelector<HTMLElement>('#pct-orig')!;
const pctOpt   = document.querySelector<HTMLElement>('#pct-opt')!;

function showState(s: 'idle' | 'running' | 'complete'): void {
  idleEl.classList.toggle('hidden', s !== 'idle');
  runningEl.classList.toggle('hidden', s !== 'running');
  completeEl.classList.toggle('hidden', s !== 'complete');
}

function buildLog(): void {
  logRoot.innerHTML = LOG_STEPS.map(
    (s, i) =>
      `<div class="bench-log-entry pending" id="log-${i}">
        <span class="bench-log-icon" id="log-icon-${i}">○</span>
        <span>${s.label}</span>
      </div>`,
  ).join('');
}

async function animateProgress(
  fillEl: HTMLElement,
  pctEl: HTMLElement,
  target: number,
  durationMs: number,
): Promise<void> {
  const steps = 30;
  const step  = target / steps;
  const delay = durationMs / steps;
  let current = 0;
  while (current < target) {
    current = Math.min(current + step, target);
    fillEl.style.width  = current + '%';
    pctEl.textContent   = Math.round(current) + '%';
    await new Promise<void>((r) => setTimeout(r, delay));
  }
}

async function runBenchmark(): Promise<void> {
  showState('running');
  statusText.textContent = 'running benchmark…';
  buildLog();

  const totalTime = LOG_STEPS.reduce((a, s) => a + s.delay, 0);
  const origTarget  = 85;
  const optTarget   = 91;

  // run progress bars in parallel with log steps
  void animateProgress(progOrig, pctOrig, origTarget, totalTime * 0.9);
  void animateProgress(progOpt,  pctOpt,  optTarget,  totalTime * 0.95);

  for (let i = 0; i < LOG_STEPS.length; i++) {
    const entry = document.querySelector<HTMLElement>(`#log-${i}`)!;
    const icon  = document.querySelector<HTMLElement>(`#log-icon-${i}`)!;

    entry.classList.remove('pending');
    entry.classList.add('active');
    icon.textContent = '●';

    await new Promise<void>((r) => setTimeout(r, LOG_STEPS[i].delay));

    entry.classList.remove('active');
    entry.classList.add('done');
    icon.textContent = '✓';
  }

  // fill to 100%
  progOrig.style.width = '100%'; pctOrig.textContent = '100%';
  progOpt.style.width  = '100%'; pctOpt.textContent  = '100%';

  await new Promise<void>((r) => setTimeout(r, 400));
  statusText.textContent = 'benchmark complete';
  showState('complete');
}

startBtn.addEventListener('click', () => void runBenchmark());

showState('idle');
