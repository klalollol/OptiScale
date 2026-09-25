// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as uploadService from '../services/uploadService';
import type { ReviewJob } from '../types/review';
import { UploadPage } from './UploadPage';

vi.mock('../services/uploadService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../services/uploadService')>();
  return { ...original, validateZip: vi.fn(), uploadZip: vi.fn() };
});

let root: HTMLElement;
let controller: AbortController;
const navigate = vi.fn();
beforeEach(() => {
  vi.mocked(uploadService.validateZip).mockReset();
  vi.mocked(uploadService.uploadZip).mockReset();
  root = document.createElement('main');
  document.body.replaceChildren(root);
  controller = new AbortController();
  UploadPage({ root, navigate, signal: controller.signal });
});
afterEach(() => controller.abort());

function choose(file: File): void {
  const input = root.querySelector<HTMLInputElement>('#zip-file')!;
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  input.dispatchEvent(new Event('change'));
}

describe('upload page interactions', () => {
  it('keeps constraints visible and Review disabled before validation', () => {
    expect(root.querySelector<HTMLButtonElement>('#review-button')?.disabled).toBe(true);
    expect(root.querySelector<HTMLButtonElement>('#demo-button')?.disabled).toBe(false);
    expect(root.querySelector('#upload-constraints')?.textContent).toContain(`${uploadService.MAX_UPLOAD_MB} MB`);
    root.querySelector<HTMLButtonElement>('#review-button')?.click();
    expect(uploadService.uploadZip).not.toHaveBeenCalled();
  });
  it('shows validation errors and keeps Review disabled', async () => {
    vi.mocked(uploadService.validateZip).mockRejectedValue(new Error('Corrupt ZIP. Re-create the archive.'));
    choose(new File(['wrong'], 'wrong.zip'));
    await vi.waitFor(() => expect(root.querySelector('#upload-error')?.textContent).toContain('Corrupt ZIP'));
    expect(root.querySelector<HTMLButtonElement>('#review-button')?.disabled).toBe(true);
  });
  it('enables Review only after success and removes the selected file', async () => {
    const file = new File(['ZIP'], 'project.zip');
    vi.mocked(uploadService.validateZip).mockResolvedValue(file);
    choose(file);
    expect(root.querySelector<HTMLButtonElement>('#review-button')?.disabled).toBe(true);
    await vi.waitFor(() => expect(root.querySelector<HTMLButtonElement>('#review-button')?.disabled).toBe(false));
    expect(root.querySelector('#selected-file')?.textContent).toContain('project.zip');
    root.querySelector<HTMLButtonElement>('[data-file-action="remove"]')?.click();
    expect(root.querySelector<HTMLButtonElement>('#review-button')?.disabled).toBe(true);
    expect(root.querySelector<HTMLElement>('#selected-file')?.hidden).toBe(true);
  });
  it('ignores stale validation if a newer selection is invalid', async () => {
    let resolveFirst: (file: File) => void = () => undefined;
    vi.mocked(uploadService.validateZip).mockImplementationOnce(() => new Promise<File>((resolve) => { resolveFirst = resolve; }))
      .mockRejectedValueOnce(new Error('Invalid second selection'));
    const first = new File(['ZIP'], 'first.zip');
    choose(first);
    choose(new File(['wrong'], 'wrong.zip'));
    resolveFirst(first);
    await vi.waitFor(() => expect(root.querySelector('#upload-error')?.textContent).toContain('Invalid second selection'));
    expect(root.querySelector<HTMLButtonElement>('#review-button')?.disabled).toBe(true);
  });
  it('uploads once, reports progress and navigates to the returned job', async () => {
    const file = new File(['ZIP'], 'project.zip');
    const job: ReviewJob = { id: 'uploaded-job', status: 'queued', subagents: [], result: null, error: null };
    vi.mocked(uploadService.validateZip).mockResolvedValue(file);
    vi.mocked(uploadService.uploadZip).mockImplementation(async (_file, options) => { options.onProgress(75); return job; });
    choose(file);
    await vi.waitFor(() => expect(root.querySelector<HTMLButtonElement>('#review-button')?.disabled).toBe(false));
    const review = root.querySelector<HTMLButtonElement>('#review-button')!;
    review.click();
    review.click();
    expect(root.querySelector('#upload-status')?.textContent).toContain('75%');
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/result/uploaded-job'));
    expect(uploadService.uploadZip).toHaveBeenCalledOnce();
  });
  it('leaves Try Demo enabled during upload', async () => {
    const file = new File(['ZIP'], 'project.zip');
    vi.mocked(uploadService.validateZip).mockResolvedValue(file);
    vi.mocked(uploadService.uploadZip).mockImplementation(() => new Promise(() => undefined));
    choose(file);
    await vi.waitFor(() => expect(root.querySelector<HTMLButtonElement>('#review-button')?.disabled).toBe(false));
    root.querySelector<HTMLButtonElement>('#review-button')?.click();
    const demo = root.querySelector<HTMLButtonElement>('#demo-button')!;
    expect(demo.disabled).toBe(false);
    demo.click();
    expect(navigate).toHaveBeenCalledWith('/result/demo');
  });
  it('rejects a bare folder drop with recovery guidance', () => {
    const drop = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [], items: [{ webkitGetAsEntry: () => ({ isDirectory: true }) }] } });
    root.querySelector('#dropzone')?.dispatchEvent(drop);
    expect(root.querySelector('#upload-error')?.textContent).toContain('Folders cannot be uploaded');
  });
});
