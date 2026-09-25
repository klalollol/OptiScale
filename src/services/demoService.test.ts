import { describe, expect, it, vi } from 'vitest';
import { BlobReader, TextWriter, ZipReader } from '@zip.js/zip.js';
import { getDemoResult } from './demoService';
import { modernizedZip, reportMarkdown } from './exportService';
import { reviewResultSchema } from '../types/review';

describe('bundled demo and exports', () => {
  it('passes the ReviewResult schema and has accurate compared LOC', () => {
    const result = getDemoResult();
    expect(reviewResultSchema.safeParse(result).success).toBe(true);
    for (const file of result.files) {
      expect(file.original.split('\n').length).toBe(file.totalOriginalLines);
      expect(file.modernized.split('\n').length).toBe(file.newLOC);
    }
  });
  it('returns an isolated copy and does not fetch the sample', () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));
    getDemoResult().projectName = 'Changed';
    expect(getDemoResult().projectName).not.toBe('Changed');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('exports a real ZIP offline with selected setup files and the full report', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));
    const result = getDemoResult();
    const selection = result.extensions[0];
    const blob = await modernizedZip(result, [selection.id], new AbortController().signal);
    const reader = new ZipReader(new BlobReader(blob), { useWebWorkers: false });
    const entries = await reader.getEntries();
    const paths = entries.map((entry) => entry.filename);
    expect(paths).toContain(selection.projectFile);
    expect(paths).not.toContain(result.extensions[1].projectFile);
    for (const file of result.files) {
      const entry = entries.find((item) => item.filename === file.path);
      expect(entry).toBeDefined();
      if (entry && !entry.directory) expect(await entry.getData(new TextWriter(), { checkSignature: true })).toBe(file.modernized);
    }
    expect(paths).toContain('optiscale/review-report.md');
    expect(fetch).not.toHaveBeenCalled();
    await reader.close();
  });
  it('includes all findings, source comparisons and estimate labels in the report', () => {
    const result = getDemoResult();
    const report = reportMarkdown(result);
    for (const finding of result.findings) expect(report).toContain(finding.title);
    for (const file of result.files) expect(report).toContain(file.modernized);
    expect(report).toContain('estimated');
    expect(report).toContain(result.parity.note);
    expect(report).toContain(result.archiveNote);
  });
});
