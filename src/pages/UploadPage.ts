import { ActionButton } from '../components/ActionButton';
import { FileDropzone, bindFileDropzone } from '../components/FileDropzone';
import { pageShell } from '../components/PageShell';
import { getDemoResult } from '../services/demoService';
import { MAX_UPLOAD_MB, MAX_EXPANDED_MB, MAX_ARCHIVE_ENTRIES, fileSize, uploadZip, validateZip } from '../services/uploadService';
import { appStore } from '../state/appStore';
import type { PageContext } from '../types/page';
import { errorMessage, escapeHtml } from '../utils/html';

export function UploadPage({ root, navigate, signal }: PageContext): void {
  document.title = 'Upload ZIP · OptiScale';
  root.innerHTML = pageShell('upload-page', `
    <section class="page-heading"><p class="section-label">Legacy-to-cloud modernization pipeline</p>
      <h1>Your legacy code.<br><span>A verified path forward.</span></h1>
      <p>Upload a Java project. The pipeline refactors the code, compares old and new behaviour, and prepares deployment artifacts.</p>
      <div class="impact-strip"><span>Target: <strong>−70% refactor time</strong></span><span>Target: <strong>0% business-logic loss</strong></span></div>
    </section>
    <section class="upload-workspace" aria-label="Upload a project">
      <div class="upload-main"><p class="section-label">Project archive</p>${FileDropzone()}
        <div id="selected-file" class="selected-file" aria-live="polite" hidden></div>
        <div class="action-row">${ActionButton({ id: 'review-button', label: 'Review →', disabled: true })}${ActionButton({ id: 'demo-button', label: 'Try Demo', secondary: true })}</div>
        <p class="flow-note">Try Demo opens a bundled sample. It does not upload files or contact the review service.</p>
        <p id="upload-error" class="inline-error" role="alert" aria-live="assertive"></p>
        <div id="upload-progress" hidden><label for="upload-meter" id="upload-status">Preparing upload…</label><progress id="upload-meter" max="100" value="0"></progress><p class="flow-note">You can open Try Demo at any time to cancel this upload and explore the sample.</p></div>
        <p id="validation-status" class="flow-note" role="status" aria-live="polite"></p>
      </div>
      <aside id="upload-constraints" class="constraints-panel" aria-labelledby="constraints-title">
        <h2 id="constraints-title">Archive requirements</h2><dl>
          <dt>Format</dt><dd>.zip only<br><code>application/zip</code><br><code>application/x-zip-compressed</code></dd>
          <dt>Maximum upload</dt><dd>${MAX_UPLOAD_MB} MB</dd>
          <dt>Expected contents</dt><dd>A project root with <code>pom.xml</code> or <code>build.gradle</code>, plus <code>src/</code>. A single enclosing project folder is supported.</dd>
          <dt>Optional context</dt><dd><code>docs/</code> for legacy system documentation and target architecture specifications.</dd>
          <dt>Not accepted</dt><dd>.rar, .7z, .tar.gz, bare folders, empty or corrupt archives, and password-protected ZIPs.</dd>
          <dt>Expanded archive limit</dt><dd>${MAX_EXPANDED_MB} MB and ${MAX_ARCHIVE_ENTRIES.toLocaleString()} entries. Remove build output before compressing.</dd>
        </dl>
      </aside>
    </section>`);

  const review = root.querySelector<HTMLButtonElement>('#review-button');
  const preview = root.querySelector<HTMLElement>('#selected-file');
  const errors = root.querySelector<HTMLElement>('#upload-error');
  const status = root.querySelector<HTMLElement>('#validation-status');
  const progress = root.querySelector<HTMLElement>('#upload-progress');
  const meter = root.querySelector<HTMLProgressElement>('#upload-meter');
  const uploadStatus = root.querySelector<HTMLElement>('#upload-status');
  const browse = root.querySelector<HTMLButtonElement>('#browse-zip');
  const input = root.querySelector<HTMLInputElement>('#zip-file');
  if (!review || !preview || !errors || !status || !progress || !meter || !uploadStatus || !browse || !input) throw new Error('Upload controls are missing.');

  let selected: File | null = null;
  let validating: AbortController | undefined;
  let uploading = false;
  let disposed = false;
  signal.addEventListener('abort', () => { disposed = true; validating?.abort(); }, { once: true });

  const clear = (): void => {
    validating?.abort();
    selected = null;
    review.disabled = true;
    preview.hidden = true;
    preview.replaceChildren();
    status.textContent = '';
    errors.textContent = '';
  };
  const selectFiles = async (files: File[]): Promise<void> => {
    if (uploading || disposed) return;
    clear();
    const controller = new AbortController();
    validating = controller;
    status.textContent = 'Checking ZIP signature, contents and integrity…';
    try {
      const file = await validateZip(files, controller.signal);
      if (disposed || controller.signal.aborted) return;
      selected = file;
      preview.hidden = false;
      preview.innerHTML = `<div><strong>${escapeHtml(file.name)}</strong><span>${fileSize(file.size)} · Valid ZIP</span></div><div class="file-actions"><button type="button" class="text-button" data-file-action="replace">Replace</button><button type="button" class="text-button" data-file-action="remove">Remove</button></div>`;
      review.disabled = false;
      status.textContent = 'Validation passed. Ready for review.';
    } catch (error: unknown) {
      if (disposed || controller.signal.aborted) return;
      errors.textContent = errorMessage(error);
      status.textContent = '';
    }
  };
  bindFileDropzone({ root, signal, onFiles: (files) => { void selectFiles(files); }, onInvalidDrop: (message) => { clear(); errors.textContent = message; } });
  preview.addEventListener('click', (event) => {
    if (uploading) return;
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-file-action]') : null;
    if (button?.dataset.fileAction === 'remove') { clear(); browse.focus(); }
    if (button?.dataset.fileAction === 'replace') input.click();
  }, { signal });
  review.addEventListener('click', () => {
    if (!selected || review.disabled || uploading) return;
    const file = selected;
    uploading = true;
    review.disabled = true;
    browse.disabled = true;
    input.disabled = true;
    preview.querySelectorAll<HTMLButtonElement>('button').forEach((button) => { button.disabled = true; });
    errors.textContent = '';
    progress.hidden = false;
    meter.value = 0;
    status.textContent = '';
    uploadStatus.textContent = 'Validating and preparing upload…';
    void uploadZip(file, { signal, onProgress: (value) => {
      if (disposed) return;
      meter.value = value;
      uploadStatus.textContent = value === 100 ? 'Upload complete. Waiting for the review service…' : `Uploading… ${value}%`;
    } }).then((job) => {
      if (disposed) return;
      appStore.setJob(job);
      navigate(`/result/${encodeURIComponent(job.id)}`);
    }).catch((error: unknown) => {
      if (!disposed) errors.textContent = errorMessage(error);
    }).finally(() => {
      if (disposed) return;
      uploading = false;
      review.disabled = selected === null;
      browse.disabled = false;
      input.disabled = false;
      progress.hidden = true;
      preview.querySelectorAll<HTMLButtonElement>('button').forEach((button) => { button.disabled = false; });
    });
  }, { signal });
  root.querySelector('#demo-button')?.addEventListener('click', () => {
    appStore.setResult(getDemoResult());
    navigate('/result/demo');
  }, { signal });
}
