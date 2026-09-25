export function FileDropzone(): string {
  return `<div class="dropzone" id="dropzone">
    <input type="file" id="zip-file" class="visually-hidden" accept=".zip,application/zip,application/x-zip-compressed" aria-label="Choose a project ZIP" aria-describedby="upload-constraints upload-error" />
    <button type="button" id="browse-zip" class="dropzone-button" aria-describedby="upload-constraints upload-error">
      <span class="dropzone-symbol" aria-hidden="true">[ ↑ ]</span><strong>Drop your project ZIP here</strong><span>or click to browse files</span>
    </button>
  </div>`;
}

interface DropzoneOptions {
  root: HTMLElement;
  signal: AbortSignal;
  onFiles: (files: File[]) => void;
  onInvalidDrop: (message: string) => void;
}

export function bindFileDropzone({ root, signal, onFiles, onInvalidDrop }: DropzoneOptions): void {
  const input = root.querySelector<HTMLInputElement>('#zip-file');
  const zone = root.querySelector<HTMLElement>('#dropzone');
  const browse = root.querySelector<HTMLButtonElement>('#browse-zip');
  if (!input || !zone || !browse) throw new Error('Dropzone elements are missing.');
  browse.addEventListener('click', () => input.click(), { signal });
  input.addEventListener('change', () => {
    if (input.files?.length) onFiles(Array.from(input.files));
    input.value = '';
  }, { signal });
  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    if (!browse.disabled) zone.classList.add('dragging');
  }, { signal });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'), { signal });
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('dragging');
    if (browse.disabled) return;
    const transfer = event.dataTransfer;
    if (!transfer) return;
    const items = Array.from(transfer.items);
    if (items.some((item) => item.webkitGetAsEntry()?.isDirectory)) {
      onInvalidDrop('Folders cannot be uploaded directly. Compress the project into a single ZIP.');
      return;
    }
    onFiles(Array.from(transfer.files));
  }, { signal });
}
