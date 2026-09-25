import { BlobReader, ZipReader } from '@zip.js/zip.js';
import { projectPathSchema, type ReviewJob } from '../types/review';
import { httpError, parseJob, uploadUrl } from './api';

export const MAX_UPLOAD_MB = 100;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
export const MAX_EXPANDED_MB = 500;
export const MAX_ARCHIVE_ENTRIES = 10000;
export const ZIP_MIME_TYPES: readonly string[] = ['application/zip', 'application/x-zip-compressed'];

export interface UploadOptions {
  signal: AbortSignal;
  onProgress: (percent: number) => void;
}

export class ZipValidationError extends Error {
  override name = 'ZipValidationError';
}

export async function validateZip(files: readonly File[], signal?: AbortSignal): Promise<File> {
  signal?.throwIfAborted();
  if (files.length !== 1) throw new ZipValidationError('Choose exactly one ZIP. Remove extra files and try again.');
  const file = files[0];
  if (!/\.zip$/i.test(file.name)) throw new ZipValidationError('Only .zip files are accepted. Compress the project as a ZIP and try again.');
  if (file.size === 0) throw new ZipValidationError('This file is empty (zero bytes). Create a ZIP containing your project.');
  if (file.size > MAX_UPLOAD_BYTES) throw new ZipValidationError(`The ZIP exceeds ${MAX_UPLOAD_MB} MB. Remove build output or split the project.`);
  // Some browsers supply no MIME type. In that case, signature and full archive validation still apply.
  if (file.type && !ZIP_MIME_TYPES.includes(file.type.toLowerCase())) {
    throw new ZipValidationError('The file MIME type is not ZIP. Re-export it as application/zip or application/x-zip-compressed.');
  }
  const magic = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (magic[0] !== 0x50 || magic[1] !== 0x4b || magic[2] !== 0x03 || magic[3] !== 0x04) {
    throw new ZipValidationError('This is an empty or corrupt ZIP, or a renamed file. Create a new ZIP with project files.');
  }
  const reader = new ZipReader(new BlobReader(file), { useWebWorkers: false, strictness: 'strict' });
  try {
    let expandedSize = 0;
    let entriesCount = 0;
    let actualSize = 0;
    let hasContent = false;
    const paths = new Set<string>();
    const buildRoots = new Set<string>();
    const sourcePaths: string[] = [];
    // Read one entry at a time; decompressed bytes go to a bounded sink instead of being retained.
    for await (const entry of reader.getEntriesGenerator()) {
      signal?.throwIfAborted();
      entriesCount += 1;
      if (entriesCount > MAX_ARCHIVE_ENTRIES) throw new ZipValidationError(`Too many ZIP entries. Keep at most ${MAX_ARCHIVE_ENTRIES.toLocaleString()} files and folders.`);
      if (!projectPathSchema.safeParse(entry.filename).success || paths.has(entry.filename)) {
        throw new ZipValidationError('The ZIP contains an unsafe or duplicate path. Re-create it from the project root.');
      }
      paths.add(entry.filename);
      if (entry.encrypted) throw new ZipValidationError('Password-protected ZIPs are not supported. Export an unencrypted ZIP.');
      expandedSize += entry.uncompressedSize;
      if (expandedSize > MAX_EXPANDED_MB * 1024 * 1024) throw new ZipValidationError(`Expanded contents exceed ${MAX_EXPANDED_MB} MB. Remove generated files and retry.`);
      if (entry.directory) continue;
      const path = entry.filename;
      if (/(^|\/)(pom\.xml|build\.gradle(?:\.kts)?)$/.test(path)) buildRoots.add(path.slice(0, path.lastIndexOf('/') + 1));
      sourcePaths.push(path);
      const sink = new WritableStream<Uint8Array>({
        write(chunk) {
          actualSize += chunk.byteLength;
          if (actualSize > MAX_EXPANDED_MB * 1024 * 1024) throw new ZipValidationError(`Expanded contents exceed ${MAX_EXPANDED_MB} MB. Remove generated files and retry.`);
          if (chunk.byteLength) hasContent = true;
        },
      });
      await entry.getData(sink, { checkSignature: true, checkOverlappingEntry: true, signal });
    }
    if (!hasContent) throw new ZipValidationError('The archive contains no file content. Add the project files and create a new ZIP.');
    if (![...buildRoots].some((root) => sourcePaths.some((path) => path.startsWith(`${root}src/`)))) {
      throw new ZipValidationError('Project structure not found. Include pom.xml or build.gradle and src/ under the same project root.');
    }
    return file;
  } catch (error: unknown) {
    if (signal?.aborted) throw signal.reason;
    if (error instanceof ZipValidationError) throw error;
    throw new ZipValidationError('The ZIP is corrupt or unsupported. Re-create a standard, unencrypted ZIP and try again.');
  } finally {
    await reader.close();
  }
}

export async function uploadZip(file: File, options: UploadOptions): Promise<ReviewJob> {
  // Validate here too so calling the service directly cannot bypass the disabled button.
  await validateZip([file], options.signal);
  options.signal.throwIfAborted();
  return new Promise<ReviewJob>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', uploadUrl);
    request.responseType = 'json';
    request.timeout = 120000;
    const abort = (): void => request.abort();
    const finish = (): void => options.signal.removeEventListener('abort', abort);
    options.signal.addEventListener('abort', abort, { once: true });
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) options.onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      finish();
      if (request.status < 200 || request.status >= 300) return reject(httpError(request.status));
      try { resolve(parseJob(request.response)); } catch (error: unknown) { reject(error); }
    };
    request.onerror = () => { finish(); reject(new Error('Upload failed. Check your connection and backend, then retry or use Try Demo.')); };
    request.ontimeout = () => { finish(); reject(new Error('Upload timed out. Check your connection and try again.')); };
    request.onabort = () => { finish(); reject(new DOMException('Upload cancelled.', 'AbortError')); };
    const form = new FormData();
    form.append('file', file, file.name);
    request.send(form);
  });
}

export function fileSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
