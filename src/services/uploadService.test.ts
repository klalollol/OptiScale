import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js';
import { describe, expect, it, vi } from 'vitest';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, ZipValidationError, uploadZip, validateZip } from './uploadService';

async function archive(entries: Record<string, string> = { 'pom.xml': '<project/>', 'src/Main.java': 'class Main {}' }, level = 0): Promise<File> {
  const writer = new ZipWriter(new BlobWriter('application/zip'), { useWebWorkers: false, level });
  for (const [path, content] of Object.entries(entries)) await writer.add(path, new TextReader(content));
  return new File([await writer.close()], 'project.zip', { type: 'application/zip' });
}

describe('client ZIP validation', () => {
  it.each([0, 6])('accepts complete project ZIPs at compression level %s', async (level) => {
    const file = await archive(undefined, level);
    await expect(validateZip([file])).resolves.toBe(file);
  });
  it('accepts a wrapped Gradle root, uppercase extension and Windows ZIP MIME', async () => {
    const file = await archive({ 'project/build.gradle': 'plugins {}', 'project/src/Main.java': 'class Main {}', 'project/docs/architecture.md': '# Target' });
    const windowsFile = new File([file], 'PROJECT.ZIP', { type: 'application/x-zip-compressed' });
    await expect(validateZip([windowsFile])).resolves.toBe(windowsFile);
  });
  it('allows unavailable MIME only after full content validation', async () => {
    const file = new File([await archive()], 'project.zip');
    await expect(validateZip([file])).resolves.toBe(file);
  });
  it('rejects multiple files and no selection', async () => {
    const file = await archive();
    await expect(validateZip([])).rejects.toThrow('exactly one');
    await expect(validateZip([file, file])).rejects.toThrow('exactly one');
  });
  it.each(['project.rar', 'project.7z', 'project.tar.gz'])('rejects %s', async (name) => {
    await expect(validateZip([new File(['PK'], name)])).rejects.toThrow('Only .zip');
  });
  it('rejects conflicting MIME despite a .zip extension', async () => {
    await expect(validateZip([new File([await archive()], 'project.zip', { type: 'image/png' })])).rejects.toThrow('MIME');
  });
  it('rejects zero bytes and empty ZIP archives', async () => {
    await expect(validateZip([new File([], 'empty.zip')])).rejects.toThrow('zero bytes');
    await expect(validateZip([await archive({})])).rejects.toThrow('empty or corrupt');
  });
  it('uses the exported limit and rejects an oversized file before reading it', async () => {
    expect(MAX_UPLOAD_BYTES).toBe(MAX_UPLOAD_MB * 1024 * 1024);
    const file = await archive();
    Object.defineProperty(file, 'size', { value: MAX_UPLOAD_BYTES + 1 });
    await expect(validateZip([file])).rejects.toThrow(`exceeds ${MAX_UPLOAD_MB} MB`);
  });
  it('allows a file at the inclusive size boundary to reach archive validation', async () => {
    const file = new File(['not a ZIP'], 'boundary.zip');
    Object.defineProperty(file, 'size', { value: MAX_UPLOAD_BYTES });
    await expect(validateZip([file])).rejects.toThrow('empty or corrupt');
  });
  it('rejects renamed files and magic-byte-only files', async () => {
    await expect(validateZip([new File(['not a zip'], 'renamed.zip')])).rejects.toThrow('renamed');
    await expect(validateZip([new File([new Uint8Array([0x50, 0x4b, 3, 4, 0, 0])], 'fake.zip')])).rejects.toThrow('corrupt');
  });
  it('checks CRC, not only the ZIP signature', async () => {
    const bytes = new Uint8Array(await (await archive()).arrayBuffer());
    const header = new DataView(bytes.buffer);
    const dataOffset = 30 + header.getUint16(26, true) + header.getUint16(28, true);
    bytes[dataOffset] ^= 0xff;
    await expect(validateZip([new File([bytes], 'broken.zip')])).rejects.toThrow('corrupt');
  });
  it('rejects truncated archives', async () => {
    const file = await archive();
    await expect(validateZip([new File([file.slice(0, file.size - 20)], 'truncated.zip')])).rejects.toThrow('corrupt');
  });
  it('rejects directory-only and zero-content archives', async () => {
    await expect(validateZip([await archive({ 'src/': '' })])).rejects.toThrow('no file content');
    await expect(validateZip([await archive({ 'pom.xml': '', 'src/Main.java': '' })])).rejects.toThrow('no file content');
  });
  it('requires a build file and source files beneath the same root', async () => {
    await expect(validateZip([await archive({ 'pom.xml': '<project/>', 'other/src/Main.java': 'class Main {}' })])).rejects.toThrow('Project structure');
  });
  it('rejects traversal paths', async () => {
    await expect(validateZip([await archive({ '../pom.xml': '<project/>' })])).rejects.toBeInstanceOf(ZipValidationError);
  });
  it('cancels validation before reading a file', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(validateZip([await archive()], controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('prevents direct service calls from sending invalid files', async () => {
    const xhr = vi.fn();
    vi.stubGlobal('XMLHttpRequest', xhr);
    try {
      await expect(uploadZip(new File(['wrong'], 'wrong.zip'), { signal: new AbortController().signal, onProgress: vi.fn() })).rejects.toThrow();
      expect(xhr).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
});
