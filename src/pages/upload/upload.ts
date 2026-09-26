// ─── Upload page state machine ────────────────────────────────────────────────

type UploadState = 'empty' | 'dragging' | 'uploading' | 'success' | 'error';

interface UploadError {
  title: string;
  message: string;
}

// ─── Mock service layer (replace with real API calls later) ──────────────────

async function mockUploadProject(
  _file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  const totalSteps = 20;
  for (let i = 1; i <= totalSteps; i++) {
    await new Promise<void>((r) => setTimeout(r, 60 + Math.random() * 40));
    onProgress(Math.round((i / totalSteps) * 100));
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

// ─── DOM references ───────────────────────────────────────────────────────────

const panel       = document.querySelector<HTMLElement>('#upload-panel')!;
const fileInput   = document.querySelector<HTMLInputElement>('#file-input')!;
const selectBtn   = document.querySelector<HTMLButtonElement>('#select-file-btn')!;
const demoBtn     = document.querySelector<HTMLButtonElement>('#demo-btn')!;
const retryBtn    = document.querySelector<HTMLButtonElement>('#retry-btn')!;
const continueBtn = document.querySelector<HTMLButtonElement>('#continue-btn')!;

const stateEls: Record<UploadState, HTMLElement | null> = {
  empty:     document.querySelector('#state-empty'),
  dragging:  document.querySelector('#state-dragging'),
  uploading: document.querySelector('#state-uploading'),
  success:   document.querySelector('#state-success'),
  error:     document.querySelector('#state-error'),
};

// progress
const progressFill  = document.querySelector<HTMLElement>('#upload-progress-fill')!;
const progressPct   = document.querySelector<HTMLElement>('#upload-progress-pct')!;
const progressSize  = document.querySelector<HTMLElement>('#upload-progress-size')!;
const uploadFilenameEl = document.querySelector<HTMLElement>('#upload-filename')!;

// success
const successFilename = document.querySelector<HTMLElement>('#success-filename')!;
const successFilesize = document.querySelector<HTMLElement>('#success-filesize')!;
const validationChecks = document.querySelector<HTMLElement>('#validation-checks')!;

// error
const errorTitle = document.querySelector<HTMLElement>('#error-title')!;
const errorMsg   = document.querySelector<HTMLElement>('#error-msg')!;

// ─── State management ─────────────────────────────────────────────────────────

function showState(state: UploadState): void {
  (Object.keys(stateEls) as UploadState[]).forEach((k) => {
    stateEls[k]?.classList.toggle('hidden', k !== state);
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return mb.toFixed(1) + ' MB';
  const kb = bytes / 1024;
  return kb.toFixed(1) + ' KB';
}

function showError(err: UploadError): void {
  errorTitle.textContent = err.title;
  errorMsg.textContent   = err.message;
  showState('error');
}

function renderValidation(): void {
  validationChecks.innerHTML = MOCK_VALIDATION_CHECKS
    .map(
      (label) =>
        `<div class="val-row"><span class="val-icon">✓</span><span>${label}</span></div>`,
    )
    .join('');
}

async function startUpload(file: File): Promise<void> {
  // Validate extension — no size limit
  if (!file.name.toLowerCase().endsWith('.zip')) {
    showError({
      title:   'INVALID FILE',
      message: 'Please upload a .ZIP project archive.',
    });
    return;
  }

  // Switch to uploading state
  uploadFilenameEl.textContent = file.name;
  progressFill.style.width = '0%';
  progressPct.textContent  = '0%';
  progressSize.textContent = formatBytes(file.size);
  showState('uploading');

  try {
    await mockUploadProject(file, (pct) => {
      progressFill.style.width = pct + '%';
      progressPct.textContent  = pct + '%';
    });

    // Success
    successFilename.textContent = file.name;
    successFilesize.textContent = formatBytes(file.size);
    renderValidation();
    showState('success');
  } catch {
    showError({
      title:   'UPLOAD FAILED',
      message: 'An unexpected error occurred. Please try again.',
    });
  }
}

async function startDemoUpload(): Promise<void> {
  uploadFilenameEl.textContent = DEMO_PROJECT.name;
  const demoBytes = DEMO_PROJECT.sizeMB * 1024 * 1024;
  progressFill.style.width = '0%';
  progressPct.textContent  = '0%';
  progressSize.textContent = DEMO_PROJECT.sizeMB + ' MB';
  showState('uploading');

  try {
    await mockUploadProject({ name: DEMO_PROJECT.name, size: demoBytes } as File, (pct) => {
      progressFill.style.width = pct + '%';
      progressPct.textContent  = pct + '%';
    });

    successFilename.textContent = DEMO_PROJECT.name;
    successFilesize.textContent =
      `${DEMO_PROJECT.sizeMB} MB · ${DEMO_PROJECT.stack} · ${DEMO_PROJECT.files} files · ${DEMO_PROJECT.deps} deps`;
    renderValidation();
    showState('success');
  } catch {
    showError({
      title:   'DEMO LOAD FAILED',
      message: 'Could not load the demo project. Please try again.',
    });
  }
}

// ─── Events ───────────────────────────────────────────────────────────────────

// Click to open file picker (panel or button)
selectBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

panel.addEventListener('click', () => {
  const emptyVisible = !stateEls.empty?.classList.contains('hidden');
  if (emptyVisible) fileInput.click();
});

// Keyboard access on panel
panel.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const emptyVisible = !stateEls.empty?.classList.contains('hidden');
    if (emptyVisible) fileInput.click();
  }
});

// File input change
fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) void startUpload(file);
  fileInput.value = ''; // allow re-selecting same file
});

// Demo button
demoBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  void startDemoUpload();
});

// Retry
retryBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  showState('empty');
});

// Continue to analysis
continueBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  window.location.href = '../analyze/';
});

// ─── Drag & drop ─────────────────────────────────────────────────────────────

panel.addEventListener('dragenter', (e) => {
  e.preventDefault();
  const emptyVisible = !stateEls.empty?.classList.contains('hidden');
  if (emptyVisible) {
    panel.classList.add('drag-over');
    showState('dragging');
  }
});

panel.addEventListener('dragover', (e) => {
  e.preventDefault();
});

panel.addEventListener('dragleave', (e) => {
  // Only reset if leaving the panel itself, not a child
  if (!panel.contains(e.relatedTarget as Node)) {
    panel.classList.remove('drag-over');
    showState('empty');
  }
});

panel.addEventListener('drop', (e) => {
  e.preventDefault();
  panel.classList.remove('drag-over');
  const file = e.dataTransfer?.files[0];
  if (file) void startUpload(file);
});

// ─── Init ─────────────────────────────────────────────────────────────────────

showState('empty');
