// app.ts — OptiScale single-page app controller
export {};

import { analyzeZip } from '../../lib/zip-analyzer';
import type { AnalysisProfile } from '../../lib/zip-analyzer';

// ─── Utilities ───────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return mb.toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
}

/** Eased scroll — lands at the section divider, accounts for sticky header height. */
function smoothScrollTo(targetY: number, duration = 750): void {
  const startY = window.scrollY;
  const diff   = targetY - startY;
  if (Math.abs(diff) < 2) return;

  let startTime: number | null = null;

  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function step(now: number): void {
    if (startTime === null) startTime = now;
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + diff * easeInOutCubic(progress));
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function stickyHeight(): number {
  // topbar (~65px) + workflow bar (~48px) + a small breathing gap
  return 65 + 48 + 8;
}

// ─── Workflow indicator ───────────────────────────────────────────────────────

const STEP_IDS    = ['wf-1', 'wf-2', 'wf-3', 'wf-4', 'wf-5'] as const;
const STEP_LABELS = ['UPLOAD', 'ANALYZE', 'OPTIMIZE', 'BENCHMARK', 'PROVE'];
const STEP_STATUS = [
  'system ready',
  'analysis complete',
  'optimization ready',
  'benchmarking',
  'results verified',
];

function setActiveStep(idx: number): void {
  STEP_IDS.forEach((id, i) => {
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

// ─── Section unlock + scroll ─────────────────────────────────────────────────

function unlockSection(sectionId: string, lockId: string, stepIdx: number): void {
  const sec  = document.getElementById(sectionId);
  const lock = document.getElementById(lockId);
  if (!sec || !lock) return;

  // 1. Hide overlay, remove locked class, add unlocked class
  lock.classList.add('hidden');
  sec.classList.remove('spa-locked');
  sec.classList.add('spa-unlocked');
  setActiveStep(stepIdx);

  // 2. Wait one frame for the layout to settle after class changes,
  //    then eased-scroll so the section divider sits just below the sticky bars.
  requestAnimationFrame(() => {
    const rect    = sec.getBoundingClientRect();
    const absTop  = rect.top + window.scrollY;
    const target  = Math.max(0, absTop - stickyHeight());
    smoothScrollTo(target, 750);
  });
}

// ─── Active analysis profile (set after upload, read by all sections) ─────────
// Exported so external scripts / future backend integration can inspect it.
let activeProfile: AnalysisProfile | null = null;
export function getActiveProfile(): AnalysisProfile | null { return activeProfile; }

function pct(n: number): string {
  return (n >= 0 ? '+' : '') + n + '%';
}
function negPct(n: number): string {
  return (n <= 0 ? '' : '+') + n + '%';
}
function fmtUnit(val: number, unit: string): string {
  return val.toLocaleString() + ' <span class="perf-unit">' + unit + '</span>';
}
function deltaClass(n: number, lowerIsBetter = false): string {
  if (n === 0) return 'perf-delta delta-neutral';
  const good = lowerIsBetter ? n < 0 : n > 0;
  return good ? 'perf-delta delta-good' : 'perf-delta delta-bad';
}

function setText(id: string, val: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setHtml(id: string, val: string): void {
  const el = document.getElementById(id);
  if (el) el.innerHTML = val;
}

function injectProfile(profile: AnalysisProfile): void {
  const b = profile.bottleneck;
  const r = profile.results;

  // ── §2 ANALYZE ──────────────────────────────────────────────────────────
  setText('an-project-name',   profile.projectName);
  setText('an-files',          String(profile.filesAnalyzed));
  setText('an-deps',           String(profile.dependencies));
  setText('an-patterns',       String(profile.patternsFound));
  setText('an-critical',       String(profile.criticalCount));

  const severityEl = document.getElementById('an-severity-badge');
  if (severityEl) {
    severityEl.textContent = b.severity.toUpperCase();
    severityEl.className   = `severity-badge severity-${b.severity}`;
  }
  setText('an-pattern-name',    b.patternName);
  setText('an-impact-tag',      'IMPACT: ' + b.impact);
  setText('an-bottleneck-title', b.title);
  setText('an-location-file',   b.file || 'app/queries.py');
  setText('an-location-line',   b.line ? 'Line ' + b.line : '—');
  setText('an-bottleneck-desc', b.description);
  setText('an-code-header',     'before — ' + (b.file || '…'));
  setHtml('an-code-before',     b.codeBeforeHtml);

  // Ladder rows
  const ladderEl = document.getElementById('an-ladder-rows');
  if (ladderEl) {
    ladderEl.innerHTML = b.ladderRows.map(row =>
      `<div class="ladder-row">
        <span class="ladder-users">${row.users}</span>
        <span class="ladder-arrow">→</span>
        <span class="ladder-queries${row.bad ? ' bad' : ''}">${row.queries}</span>
      </div>`
    ).join('');
  }

  // Why chain
  const whyEl = document.getElementById('an-why-chain');
  if (whyEl) {
    const nodes = b.whyChain;
    let html = '';
    nodes.forEach((node, i) => {
      const cls = node.bad ? ' bad' : node.warn ? ' warn' : '';
      html += `<span class="why-node${cls}">${node.text}</span>`;
      if (i < nodes.length - 1) html += `<span class="why-arrow why-arrow--v">↓</span>`;
    });
    whyEl.innerHTML = html;
  }

  setText('an-bob-pattern',    b.patternName);
  setText('an-bob-effect',     b.bobEffect);
  const confEl = document.getElementById('an-bob-confidence');
  if (confEl) {
    confEl.textContent = b.bobConfidence;
    confEl.style.color = b.confidenceColor;
  }

  // ── §3 OPTIMIZE ─────────────────────────────────────────────────────────
  setText('opt-project-name',  profile.projectName);
  const subText = b.severity === 'pass'
    ? 'No critical bottleneck detected. This project is already well-optimized.'
    : 'BOB found a potential performance bottleneck. Here is the proposed fix.';
  setText('opt-sub-text',      subText);
  const statusPill = document.getElementById('opt-status-pill');
  if (statusPill) {
    statusPill.textContent  = b.severity === 'pass' ? 'ALREADY OPTIMIZED' : 'OPTIMIZATION READY';
    statusPill.className    = b.severity === 'pass' ? 'status-pill status-complete' : 'status-pill status-ready';
  }
  setText('opt-diff-label',    'before / after — ' + b.diffLabel);
  setHtml('opt-code-before',   b.codeBeforeHtml);
  setHtml('opt-code-after',    b.codeAfterHtml);
  setText('opt-parity-line',   b.parityLine);
  setText('opt-type-title',    b.optimizationType);
  setText('opt-query-before',  b.queryBefore);
  setText('opt-query-after',   b.queryAfter);
  setText('opt-impact-title',  b.impact);
  setText('opt-change-file',   b.file || '—');
  setText('opt-change-lines',  b.linesAffected);
  setText('opt-change-type',   b.optimizationType);
  setText('opt-change-risk',   b.risk);

  // ── §4 BENCHMARK ────────────────────────────────────────────────────────
  setText('bench-endpoint',    profile.endpoint);
  setText('bench-db',          profile.database);

  // ── §5 PROVE ────────────────────────────────────────────────────────────
  const multStr = r.multiplier >= 100
    ? Math.round(r.multiplier) + '×'
    : r.multiplier.toFixed(r.multiplier < 2 ? 2 : 1) + '×';
  setText('prove-multiplier',   multStr);

  const tpBefore = r.throughputBefore.toLocaleString();
  const tpAfter  = r.throughputAfter.toLocaleString();
  setText('prove-tp-before',   tpBefore + ' req/s');
  setText('prove-tp-after',    tpAfter  + ' req/s');
  setText('prove-tp-delta',    '+' + r.throughputDeltaPct + '%');

  // Metric cards
  setText('mc-tp-b',  tpBefore + ' req/s');
  setText('mc-tp-a',  tpAfter  + ' req/s');
  setText('mc-tp-d',  pct(r.throughputDeltaPct));
  setText('mc-lat-b', r.latencyBefore + ' ms');
  setText('mc-lat-a', r.latencyAfter  + ' ms');
  setText('mc-lat-d', negPct(r.latencyDeltaPct));
  setText('mc-cpu-b', r.cpuBefore + '%');
  setText('mc-cpu-a', r.cpuAfter  + '%');
  setText('mc-cpu-d', negPct(r.cpuDeltaPct));
  setText('mc-mem-b', r.memBefore + ' GB');
  setText('mc-mem-a', r.memAfter  + ' GB');
  setText('mc-mem-d', negPct(r.memDeltaPct));

  // Table
  setHtml('tbl-tp-b',  fmtUnit(r.throughputBefore, 'req/s'));
  setHtml('tbl-tp-a',  fmtUnit(r.throughputAfter,  'req/s'));
  const tpDelta = document.getElementById('tbl-tp-d');
  if (tpDelta) { tpDelta.textContent = '+' + r.throughputDeltaPct + '%'; tpDelta.className = deltaClass(r.throughputDeltaPct); }

  setHtml('tbl-lat-b', fmtUnit(r.latencyBefore, 'ms'));
  setHtml('tbl-lat-a', fmtUnit(r.latencyAfter,  'ms'));
  const latDelta = document.getElementById('tbl-lat-d');
  if (latDelta) { latDelta.textContent = negPct(r.latencyDeltaPct); latDelta.className = deltaClass(r.latencyDeltaPct, true); }

  setHtml('tbl-cpu-b', fmtUnit(r.cpuBefore, '%'));
  setHtml('tbl-cpu-a', fmtUnit(r.cpuAfter,  '%'));
  const cpuDelta = document.getElementById('tbl-cpu-d');
  if (cpuDelta) { cpuDelta.textContent = negPct(r.cpuDeltaPct); cpuDelta.className = deltaClass(r.cpuDeltaPct, true); }

  setHtml('tbl-mem-b', fmtUnit(r.memBefore, 'GB'));
  setHtml('tbl-mem-a', fmtUnit(r.memAfter,  'GB'));
  const memDelta = document.getElementById('tbl-mem-d');
  if (memDelta) { memDelta.textContent = negPct(r.memDeltaPct); memDelta.className = deltaClass(r.memDeltaPct, true); }

  // Prediction vs measured
  const predEl = document.getElementById('prove-prediction');
  if (predEl) {
    predEl.textContent = r.bobPrediction;
    predEl.style.color = b.severity === 'critical' ? 'var(--red)' :
                         b.severity === 'moderate' ? 'var(--amber)' : 'var(--green)';
  }
  setText('prove-measured', r.benchmarkMeasured);

  // Bar widths — recalculated when PROVE unlocks (in toProveBtn handler)
  // Store on window so the unlock handler can re-read them
  (window as unknown as Record<string, number>)['_barOrigPct'] =
    Math.round((r.throughputBefore / r.throughputAfter) * 100);
}

// ─── Upload mock logic ────────────────────────────────────────────────────────

type UploadState = 'empty' | 'dragging' | 'uploading' | 'success' | 'error';
interface UploadError { title: string; message: string; }

const MOCK_VALIDATION_CHECKS = [
  'ZIP archive detected',
  'Project structure readable',
  'Source files detected',
  'Supported technology detected',
];

type DemoKey = 'ecommerce' | 'inventory' | 'analytics';

const DEMO_PROJECTS: Record<DemoKey, {
  name: string; sizeMB: number; stack: string; files: number; deps: number; path: string;
}> = {
  ecommerce: {
    name: 'sample-fastapi-ecommerce.zip',
    sizeMB: 4.2,
    stack: 'Python 3.11 · FastAPI · PostgreSQL',
    files: 126,
    deps: 47,
    path: '/demo-zips/sample-fastapi-ecommerce.zip',
  },
  inventory: {
    name: 'sample-fastapi-inventory.zip',
    sizeMB: 2.3,
    stack: 'Python 3.11 · FastAPI · PostgreSQL',
    files: 98,
    deps: 41,
    path: '/demo-zips/sample-fastapi-inventory.zip',
  },
  analytics: {
    name: 'sample-fastapi-analytics.zip',
    sizeMB: 2.5,
    stack: 'Python 3.11 · FastAPI · PostgreSQL',
    files: 112,
    deps: 44,
    path: '/demo-zips/sample-fastapi-analytics.zip',
  },
};

async function mockUploadProject(
  _file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  for (let i = 1; i <= 20; i++) {
    await sleep(60 + Math.random() * 40);
    onProgress(Math.round((i / 20) * 100));
  }
}

// DOM refs — upload
const uploadPanel       = document.getElementById('upload-panel')!;
const fileInput         = document.querySelector<HTMLInputElement>('#file-input')!;
const selectFileBtn     = document.getElementById('select-file-btn')!;
const demoBtn           = document.getElementById('demo-btn')!;
const demoPicker        = document.getElementById('demo-picker')!;
const retryBtn          = document.getElementById('retry-btn')!;
const continueAnalBtn   = document.getElementById('continue-to-analyze-btn')!;
const ctaUploadHint     = document.getElementById('cta-upload-hint')!;

const progressFill      = document.getElementById('upload-progress-fill')!;
const progressPct       = document.getElementById('upload-progress-pct')!;
const progressSize      = document.getElementById('upload-progress-size')!;
const uploadFilenameEl  = document.getElementById('upload-filename')!;
const successFilename   = document.getElementById('success-filename')!;
const successFilesize   = document.getElementById('success-filesize')!;
const validationChecks  = document.getElementById('validation-checks')!;
const errorTitle        = document.getElementById('error-title')!;
const errorMsg          = document.getElementById('error-msg')!;

const uploadStateEls: Record<UploadState, HTMLElement | null> = {
  empty:     document.getElementById('state-empty'),
  dragging:  document.getElementById('state-dragging'),
  uploading: document.getElementById('state-uploading'),
  success:   document.getElementById('state-success'),
  error:     document.getElementById('state-error'),
};

function showUploadState(state: UploadState): void {
  (Object.keys(uploadStateEls) as UploadState[]).forEach((k) => {
    uploadStateEls[k]?.classList.toggle('hidden', k !== state);
  });
  // Show / hide CTA
  const isSuccess = state === 'success';
  continueAnalBtn.style.display = isSuccess ? '' : 'none';
  ctaUploadHint.style.display   = isSuccess ? 'none' : '';
}

function renderValidation(): void {
  validationChecks.innerHTML = MOCK_VALIDATION_CHECKS
    .map((label) => `<div class="val-row"><span class="val-icon">✓</span><span>${label}</span></div>`)
    .join('');
}

function showUploadError(err: UploadError): void {
  errorTitle.textContent = err.title;
  errorMsg.textContent   = err.message;
  showUploadState('error');
}

async function startUpload(file: File): Promise<void> {
  if (!file.name.toLowerCase().endsWith('.zip')) {
    showUploadError({ title: 'INVALID FILE', message: 'Please upload a .ZIP project archive.' });
    return;
  }
  uploadFilenameEl.textContent = file.name;
  progressFill.style.width     = '0%';
  progressPct.textContent      = '0%';
  progressSize.textContent     = formatBytes(file.size);
  showUploadState('uploading');
  try {
    // Run upload animation and ZIP analysis in parallel
    const [profile] = await Promise.all([
      analyzeZip(file),
      mockUploadProject(file, (p) => {
        progressFill.style.width = p + '%';
        progressPct.textContent  = p + '%';
      }),
    ]);
    activeProfile = profile;
    injectProfile(profile);
    successFilename.textContent = file.name;
    successFilesize.textContent = formatBytes(file.size);
    renderValidation();
    showUploadState('success');
  } catch {
    showUploadError({ title: 'UPLOAD FAILED', message: 'An unexpected error occurred. Please try again.' });
  }
}

function togglePicker(force?: boolean): void {
  const show = force !== undefined ? force : demoPicker.classList.contains('hidden');
  demoPicker.classList.toggle('hidden', !show);
}

async function startDemoUpload(key: DemoKey): Promise<void> {
  const demo = DEMO_PROJECTS[key];
  togglePicker(false);
  uploadFilenameEl.textContent = demo.name;
  progressFill.style.width     = '0%';
  progressPct.textContent      = '0%';
  progressSize.textContent     = demo.sizeMB + ' MB';
  showUploadState('uploading');
  try {
    // Fetch real ZIP for analysis; fall back to empty file if server can't serve it
    let file: File;
    try {
      const resp = await fetch(demo.path);
      if (!resp.ok) throw new Error('fetch failed');
      const blob = await resp.blob();
      file = new File([blob], demo.name, { type: 'application/zip' });
    } catch {
      file = new File([new Uint8Array(64)], demo.name, { type: 'application/zip' });
    }
    // Run animation and analysis in parallel
    const [profile] = await Promise.all([
      analyzeZip(file),
      mockUploadProject(file, (p) => {
        progressFill.style.width = p + '%';
        progressPct.textContent  = p + '%';
      }),
    ]);
    activeProfile = profile;
    injectProfile(profile);
    successFilename.textContent = demo.name;
    successFilesize.textContent = `${demo.sizeMB} MB · ${demo.stack} · ${demo.files} source files · ${demo.deps} dependencies`;
    renderValidation();
    showUploadState('success');
  } catch {
    showUploadError({ title: 'DEMO LOAD FAILED', message: 'Could not load the demo project. Please try again.' });
  }
}

// Upload events
selectFileBtn.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
uploadPanel.addEventListener('click', (e) => {
  // Close picker if clicking outside it
  if (!(e.target as HTMLElement).closest('#demo-picker, #demo-btn')) togglePicker(false);
  if (!uploadStateEls.empty?.classList.contains('hidden')) return;
  if (!(e.target as HTMLElement).closest('#demo-picker, #demo-btn, #select-file-btn')) fileInput.click();
});
uploadPanel.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && !uploadStateEls.empty?.classList.contains('hidden')) {
    e.preventDefault(); fileInput.click();
  }
});
fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  if (f) void startUpload(f);
  fileInput.value = '';
});
demoBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePicker(); });
demoPicker.querySelectorAll<HTMLButtonElement>('.demo-pick-row').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const key = btn.dataset['demo'] as DemoKey | undefined;
    if (key && key in DEMO_PROJECTS) void startDemoUpload(key);
  });
});
retryBtn.addEventListener('click', (e) => { e.stopPropagation(); showUploadState('empty'); });
continueAnalBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  unlockSection('sec-analyze', 'lock-analyze', 1);
});

// Drag and drop
uploadPanel.addEventListener('dragenter', (e) => {
  e.preventDefault();
  if (!uploadStateEls.empty?.classList.contains('hidden')) {
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

const applyBtn        = document.getElementById('apply-btn')!;
const diffBtn         = document.getElementById('diff-btn')!;
const toBenchBtn      = document.getElementById('to-benchmark-btn')!;
const applyingSection = document.getElementById('opt-applying-section')!;
const applyStepsEl    = document.getElementById('apply-steps')!;
const doneSection     = document.getElementById('opt-done-section')!;

function setOptState(s: 'idle' | 'applying' | 'done'): void {
  applyBtn.style.display    = s === 'idle'     ? '' : 'none';
  diffBtn.style.display     = s === 'idle'     ? '' : 'none';
  toBenchBtn.style.display  = s === 'done'     ? '' : 'none';
  applyingSection.style.display = s === 'applying' ? '' : 'none';
  doneSection.style.display     = s === 'done'     ? '' : 'none';
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
  setOptState('applying');
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
  setOptState('done');
}

applyBtn.addEventListener('click', () => void runApply());
diffBtn.addEventListener('click', () => {
  const dp = document.querySelector<HTMLElement>('#sec-optimize .diff-panel');
  if (!dp) return;
  dp.style.outline = '1px solid var(--cyan)';
  dp.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => { dp.style.outline = ''; }, 1500);
});
toBenchBtn.addEventListener('click', () => {
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

const startBenchBtn    = document.getElementById('start-bench-btn')!;
const toProveBtn       = document.getElementById('to-prove-btn')!;
const benchRunning     = document.getElementById('bench-running')!;
const benchComplete    = document.getElementById('bench-complete')!;
const benchLogWrap     = document.getElementById('bench-log-wrap')!;
const benchLogEl       = document.getElementById('bench-log')!;
const progOrig         = document.getElementById('prog-orig') as HTMLElement;
const progOpt          = document.getElementById('prog-opt')  as HTMLElement;
const pctOrigEl        = document.getElementById('pct-orig')  as HTMLElement;
const pctOptEl         = document.getElementById('pct-opt')   as HTMLElement;

function setBenchState(s: 'idle' | 'running' | 'complete'): void {
  startBenchBtn.style.display  = s === 'idle'     ? '' : 'none';
  toProveBtn.style.display     = s === 'complete' ? '' : 'none';
  benchRunning.style.display   = s === 'running'  ? '' : 'none';
  benchLogWrap.style.display   = s === 'running'  ? '' : 'none';
  benchComplete.style.display  = s === 'complete' ? '' : 'none';
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
  setBenchState('running');
  buildBenchLog();
  const totalTime = BENCH_LOG_STEPS.reduce((a, s) => a + s.delay, 0);
  void animateProgress(progOrig, pctOrigEl, 85, totalTime * 0.9);
  void animateProgress(progOpt,  pctOptEl,  91, totalTime * 0.95);
  for (let i = 0; i < BENCH_LOG_STEPS.length; i++) {
    const entry = document.getElementById(`blog-${i}`)!;
    const icon  = document.getElementById(`blog-icon-${i}`)!;
    entry.classList.remove('pending'); entry.classList.add('active'); icon.textContent = '●';
    await sleep(BENCH_LOG_STEPS[i].delay);
    entry.classList.remove('active'); entry.classList.add('done'); icon.textContent = '✓';
  }
  progOrig.style.width = '100%'; pctOrigEl.textContent = '100%';
  progOpt.style.width  = '100%'; pctOptEl.textContent  = '100%';
  await sleep(400);
  setBenchState('complete');
}

startBenchBtn.addEventListener('click', () => void runBenchmark());
toProveBtn.addEventListener('click', () => {
  unlockSection('sec-prove', 'lock-prove', 4);
  // Animate throughput bars with profile-aware ratio
  setTimeout(() => {
    const barOrig = document.getElementById('bar-orig') as HTMLElement | null;
    const barOpt  = document.getElementById('bar-opt')  as HTMLElement | null;
    const origPct = (window as unknown as Record<string, number>)['_barOrigPct'] ?? 39;
    if (barOrig) barOrig.style.width = origPct + '%';
    if (barOpt)  barOpt.style.width  = '100%';
  }, 600);
});

// ─── Init ─────────────────────────────────────────────────────────────────────

showUploadState('empty');
setOptState('idle');
setBenchState('idle');
setActiveStep(0);
