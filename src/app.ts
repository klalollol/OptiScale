// app.ts — OptiScale single-page app controller
// All 5 pipeline sections live in one DOM; sections are revealed + autoscrolled.
export {};

// ─── Upload section logic (inlined from upload.ts) ───────────────────────────

type UploadState = 'empty' | 'dragging' | 'uploading' | 'success' | 'error';

interface UploadError { title: string; message: string; }

async function mockUploadProject(
  _file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  for (let i = 1; i <= 20; i++) {
    await sleep(60 + Math.random() * 40);
    onProgress(Math.round((i / 20) * 100));
  }
}

const MOCK_VALIDATION_CHECKS = [
  'ZIP archive detected',
  'Project structure readable',
  'Source files detected',
  'Supported technology detected',
];

const DEMO_PROJECT = {
  name: 'sample-fastapi-project.zip',
  sizeMB: 24.8,
  stack: 'Python 3.11 · FastAPI · PostgreSQL',
  files: 126,
  deps: 47,
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return mb.toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
}

// ─── Workflow indicator + breadcrumb helpers ──────────────────────────────────

const STEPS = ['wf-1', 'wf-2', 'wf-3', 'wf-4', 'wf-5'] as const;
const STEP_LABELS = ['UPLOAD', 'ANALYZE', 'OPTIMIZE', 'BENCHMARK', 'PROVE'];
const STEP_STATUS = ['system ready', 'analysis complete', 'optimization ready', 'benchmarking', 'results verified'];

function setActiveStep(idx: number): void {
  STEPS.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active', 'done');
    if (i < idx)  el.classList.add('done');
    if (i === idx) el.classList.add('active');
  });
  const bc = document.getElementById('spa-breadcrumb');
  if (bc) bc.textContent = STEP_LABELS[idx] ?? '';
  const st = document.getElementById('spa-status');
  if (st) st.textContent = STEP_STATUS[idx] ?? '';
}

// ─── Section unlock + autoscroll ─────────────────────────────────────────────

function unlockSection(id: string, lockId: string, stepIdx: number): void {
  const sec  = document.getElementById(id);
  const lock = document.getElementById(lockId);
  if (!sec || !lock) return;

  lock.classList.add('hidden');
  sec.classList.remove('spa-locked');
  sec.classList.add('spa-unlocked');
  setActiveStep(stepIdx);

  // scroll the section divider into view with a small delay so layout settles
  setTimeout(() => {
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

// ─── UPLOAD logic ─────────────────────────────────────────────────────────────

const uploadPanel     = document.getElementById('upload-panel')!;
const fileInput       = document.querySelector<HTMLInputElement>('#file-input')!;
const selectFileBtn   = document.getElementById('select-file-btn')!;
const demoBtn         = document.getElementById('demo-btn')!;
const retryBtn        = document.getElementById('retry-btn')!;
const continueAnalBtn = document.getElementById('continue-to-analyze-btn')!;

const stateEls: Record<UploadState, HTMLElement | null> = {
  empty:     document.getElementById('state-empty'),
  dragging:  document.getElementById('state-dragging'),
  uploading: document.getElementById('state-uploading'),
  success:   document.getElementById('state-success'),
  error:     document.getElementById('state-error'),
};

const progressFill     = document.getElementById('upload-progress-fill')!;
const progressPct      = document.getElementById('upload-progress-pct')!;
const progressSize     = document.getElementById('upload-progress-size')!;
const uploadFilenameEl = document.getElementById('upload-filename')!;
const successFilename  = document.getElementById('success-filename')!;
const successFilesize  = document.getElementById('success-filesize')!;
const validationChecks = document.getElementById('validation-checks')!;
const errorTitle       = document.getElementById('error-title')!;
const errorMsg         = document.getElementById('error-msg')!;

function showUploadState(state: UploadState): void {
  (Object.keys(stateEls) as UploadState[]).forEach((k) => {
    stateEls[k]?.classList.toggle('hidden', k !== state);
  });
}

function renderValidation(): void {
  validationChecks.innerHTML = MOCK_VALIDATION_CHECKS
    .map((label) => `<div class="val-row"><span class="val-icon">✓</span><span>${label}</span></div>`)
    .join('');
}

function showError(err: UploadError): void {
  errorTitle.textContent = err.title;
  errorMsg.textContent   = err.message;
  showUploadState('error');
}

async function startUpload(file: File): Promise<void> {
  if (!file.name.toLowerCase().endsWith('.zip')) {
    showError({ title: 'INVALID FILE', message: 'Please upload a .ZIP project archive.' });
    return;
  }
  uploadFilenameEl.textContent  = file.name;
  progressFill.style.width      = '0%';
  progressPct.textContent       = '0%';
  progressSize.textContent      = formatBytes(file.size);
  showUploadState('uploading');

  try {
    await mockUploadProject(file, (pct) => {
      progressFill.style.width = pct + '%';
      progressPct.textContent  = pct + '%';
    });
    successFilename.textContent = file.name;
    successFilesize.textContent = formatBytes(file.size);
    renderValidation();
    showUploadState('success');
  } catch {
    showError({ title: 'UPLOAD FAILED', message: 'An unexpected error occurred. Please try again.' });
  }
}

async function startDemoUpload(): Promise<void> {
  const demoBytes = DEMO_PROJECT.sizeMB * 1024 * 1024;
  uploadFilenameEl.textContent = DEMO_PROJECT.name;
  progressFill.style.width     = '0%';
  progressPct.textContent      = '0%';
  progressSize.textContent     = DEMO_PROJECT.sizeMB + ' MB';
  showUploadState('uploading');

  try {
    await mockUploadProject({ name: DEMO_PROJECT.name, size: demoBytes } as File, (pct) => {
      progressFill.style.width = pct + '%';
      progressPct.textContent  = pct + '%';
    });
    successFilename.textContent = DEMO_PROJECT.name;
    successFilesize.textContent =
      `${DEMO_PROJECT.sizeMB} MB · ${DEMO_PROJECT.stack} · ${DEMO_PROJECT.files} files · ${DEMO_PROJECT.deps} deps`;
    renderValidation();
    showUploadState('success');
  } catch {
    showError({ title: 'DEMO LOAD FAILED', message: 'Could not load the demo project. Please try again.' });
  }
}

// Upload events
selectFileBtn.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
uploadPanel.addEventListener('click', () => {
  if (!stateEls.empty?.classList.contains('hidden')) fileInput.click();
});
uploadPanel.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && !stateEls.empty?.classList.contains('hidden')) {
    e.preventDefault(); fileInput.click();
  }
});
fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  if (f) void startUpload(f);
  fileInput.value = '';
});
demoBtn.addEventListener('click', (e) => { e.stopPropagation(); void startDemoUpload(); });
retryBtn.addEventListener('click', (e) => { e.stopPropagation(); showUploadState('empty'); });
continueAnalBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  unlockSection('sec-analyze', 'lock-analyze', 1);
});

// Drag and drop
uploadPanel.addEventListener('dragenter', (e) => {
  e.preventDefault();
  if (!stateEls.empty?.classList.contains('hidden')) {
    uploadPanel.classList.add('drag-over');
    showUploadState('dragging');
  }
});
uploadPanel.addEventListener('dragover', (e) => e.preventDefault());
uploadPanel.addEventListener('dragleave', (e) => {
  if (!uploadPanel.contains(e.relatedTarget as Node)) {
    uploadPanel.classList.remove('drag-over');
    showUploadState('empty');
  }
});
uploadPanel.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadPanel.classList.remove('drag-over');
  const f = e.dataTransfer?.files[0];
  if (f) void startUpload(f);
});

// ─── ANALYZE → OPTIMIZE ──────────────────────────────────────────────────────

document.getElementById('to-optimize-btn')?.addEventListener('click', () => {
  unlockSection('sec-optimize', 'lock-optimize', 2);
});

// ─── OPTIMIZE apply logic ─────────────────────────────────────────────────────

const APPLY_STEPS_DATA = [
  'Patch generated',
  'Code updated',
  'Dependencies preserved',
  'Preparing optimized build',
];

const optIdleEl     = document.getElementById('opt-idle')!;
const optApplyingEl = document.getElementById('opt-applying')!;
const optDoneEl     = document.getElementById('opt-done')!;
const applyStepsEl  = document.getElementById('apply-steps')!;

function showOptState(s: 'idle' | 'applying' | 'done'): void {
  optIdleEl.classList.toggle('hidden', s !== 'idle');
  optApplyingEl.classList.toggle('hidden', s !== 'applying');
  optDoneEl.classList.toggle('hidden', s !== 'done');
}

function buildApplySteps(): void {
  applyStepsEl.innerHTML = APPLY_STEPS_DATA.map(
    (label, i) =>
      `<div class="apply-step" id="opt-step-${i}">
        <span class="apply-step-icon" id="opt-step-icon-${i}">○</span>
        <span>${label}</span>
      </div>`,
  ).join('');
}

async function runApply(): Promise<void> {
  showOptState('applying');
  buildApplySteps();

  for (let i = 0; i < APPLY_STEPS_DATA.length; i++) {
    const row  = document.getElementById(`opt-step-${i}`)!;
    const icon = document.getElementById(`opt-step-icon-${i}`)!;
    row.classList.add('active'); icon.textContent = '●';
    await sleep(500 + Math.random() * 300);
    if (i === APPLY_STEPS_DATA.length - 1) await sleep(400);
    row.classList.remove('active'); row.classList.add('done'); icon.textContent = '✓';
  }

  await sleep(300);
  showOptState('done');
}

document.getElementById('apply-btn')?.addEventListener('click', () => void runApply());
document.getElementById('diff-btn')?.addEventListener('click', () => {
  const dp = document.querySelector<HTMLElement>('#sec-optimize .diff-panel');
  if (!dp) return;
  dp.style.outline = '1px solid var(--cyan)';
  dp.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => { dp.style.outline = ''; }, 1500);
});

document.getElementById('to-benchmark-btn')?.addEventListener('click', () => {
  unlockSection('sec-benchmark', 'lock-benchmark', 3);
});

// ─── BENCHMARK logic ──────────────────────────────────────────────────────────

const BENCH_LOG_STEPS = [
  { label: 'Sandbox initialized',     delay: 400  },
  { label: 'PostgreSQL ready',         delay: 600  },
  { label: 'Application started',      delay: 700  },
  { label: 'Load generator connected', delay: 500  },
  { label: 'Running workload',         delay: 3000 },
  { label: 'Collecting metrics',       delay: 1200 },
  { label: 'Comparing results',        delay: 800  },
];

const benchIdleEl     = document.getElementById('bench-idle')!;
const benchRunningEl  = document.getElementById('bench-running')!;
const benchCompleteEl = document.getElementById('bench-complete')!;
const benchLogEl      = document.getElementById('bench-log')!;
const progOrig        = document.getElementById('prog-orig') as HTMLElement;
const progOpt         = document.getElementById('prog-opt') as HTMLElement;
const pctOrig         = document.getElementById('pct-orig') as HTMLElement;
const pctOpt          = document.getElementById('pct-opt') as HTMLElement;

function showBenchState(s: 'idle' | 'running' | 'complete'): void {
  benchIdleEl.classList.toggle('hidden', s !== 'idle');
  benchRunningEl.classList.toggle('hidden', s !== 'running');
  benchCompleteEl.classList.toggle('hidden', s !== 'complete');
}

async function animateProgress(
  fillEl: HTMLElement, pctEl: HTMLElement, target: number, durationMs: number,
): Promise<void> {
  const steps = 30;
  const stepVal = target / steps;
  const delay   = durationMs / steps;
  let current   = 0;
  while (current < target) {
    current = Math.min(current + stepVal, target);
    fillEl.style.width  = current + '%';
    pctEl.textContent   = Math.round(current) + '%';
    await sleep(delay);
  }
}

function buildBenchLog(): void {
  benchLogEl.innerHTML = BENCH_LOG_STEPS.map(
    (s, i) =>
      `<div class="bench-log-entry pending" id="blog-${i}">
        <span class="bench-log-icon" id="blog-icon-${i}">○</span>
        <span>${s.label}</span>
      </div>`,
  ).join('');
}

async function runBenchmark(): Promise<void> {
  showBenchState('running');
  buildBenchLog();

  const totalTime = BENCH_LOG_STEPS.reduce((a, s) => a + s.delay, 0);
  void animateProgress(progOrig, pctOrig, 85, totalTime * 0.9);
  void animateProgress(progOpt,  pctOpt,  91, totalTime * 0.95);

  for (let i = 0; i < BENCH_LOG_STEPS.length; i++) {
    const entry = document.getElementById(`blog-${i}`)!;
    const icon  = document.getElementById(`blog-icon-${i}`)!;
    entry.classList.remove('pending'); entry.classList.add('active'); icon.textContent = '●';
    await sleep(BENCH_LOG_STEPS[i].delay);
    entry.classList.remove('active'); entry.classList.add('done'); icon.textContent = '✓';
  }

  progOrig.style.width = '100%'; pctOrig.textContent = '100%';
  progOpt.style.width  = '100%'; pctOpt.textContent  = '100%';
  await sleep(400);
  showBenchState('complete');
}

document.getElementById('start-bench-btn')?.addEventListener('click', () => void runBenchmark());

document.getElementById('to-prove-btn')?.addEventListener('click', () => {
  unlockSection('sec-prove', 'lock-prove', 4);
  // animate the throughput bars after a short delay
  setTimeout(() => {
    const barOrig = document.getElementById('bar-orig') as HTMLElement | null;
    const barOpt  = document.getElementById('bar-opt')  as HTMLElement | null;
    if (barOrig) barOrig.style.width = '38.85%';
    if (barOpt)  barOpt.style.width  = '100%';
  }, 500);
});

// ─── Init ─────────────────────────────────────────────────────────────────────

showUploadState('empty');
showOptState('idle');
showBenchState('idle');
setActiveStep(0);
