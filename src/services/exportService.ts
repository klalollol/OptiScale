import { BlobReader, BlobWriter, TextReader, ZipReader, ZipWriter } from '@zip.js/zip.js';
import { projectPathSchema, type ReviewResult } from '../types/review';
import { improvement, overallDifference, percent, difference } from '../utils/metrics';
import { httpError, jobUrl } from './api';
import { MAX_EXPANDED_MB, MAX_ARCHIVE_ENTRIES, MAX_UPLOAD_BYTES } from './uploadService';

export function reportMarkdown(result: ReviewResult, selectedIds: readonly string[] = []): string {
  const overall = overallDifference(result.files);
  const effort = improvement({ before: result.engineerHoursBefore, after: result.engineerHoursAfter, direction: 'lower' });
  const lines = [
    `# OptiScale review: ${result.projectName}`, '',
    `Job: ${result.jobId} | Mode: ${result.mode}`, '',
    `Files scanned: ${result.filesScanned} | Original LOC: ${result.originalLOC}`,
    `Detected: ${result.detectedStack.join(' + ')} | Target: ${result.targetStack.join(' + ')}`,
    `Modernization score: ${result.modernizationScore}%`,
    `Estimated engineer-hours: ${result.engineerHoursBefore} -> ${result.engineerHoursAfter} (${percent(effort)} saved)`,
    result.effortNote, '', '## Performance findings', '',
  ];
  for (const finding of result.findings) lines.push(`### ${finding.title} [${finding.severity}]`, `${finding.file}:${finding.line}`, `Why slow: ${finding.whySlow}`, `Fix: ${finding.fix}`, `Expected gain (${finding.evidence}): ${finding.expectedGain}`, '');
  lines.push('## Code comparison', `Overall compared files: change ${percent(overall.change)}, similarity ${percent(overall.similarity)}, LOC delta ${percent(overall.locDelta)}.`, '',
    'Code change % = changedLines / totalOriginalLines × 100', 'Similarity % = 100 − change %',
    'LOC delta % = (newLOC − oldLOC) / oldLOC × 100', 'Zero original baseline: N/A. Overall uses summed counts.', '');
  for (const file of result.files) {
    const values = difference(file.changedLines, file.totalOriginalLines, file.newLOC);
    lines.push(`### ${file.path}`, `${file.changedLines} changed / ${file.totalOriginalLines} original lines; ${file.newLOC} modernized lines.`,
      `Change ${percent(values.change)} | Similarity ${percent(values.similarity)} | LOC delta ${percent(values.locDelta)}`, '',
      'Original:', '````' + file.language, file.original, '````', 'Modernized:', '````' + file.language, file.modernized, '````', '');
  }
  lines.push('## Performance deltas', 'Improvement = (before − after) / before × 100 for lower-is-better metrics; (after − before) / before × 100 for throughput. A zero baseline is N/A.', '');
  for (const metric of result.performance) lines.push(`${metric.label}: ${metric.before} -> ${metric.after} ${metric.unit}; ${percent(improvement(metric))} improvement (${metric.evidence}). ${metric.note}`);
  lines.push('', '## Parity verification', `Generated: ${result.parity.generatedTests} | Passed: ${result.parity.passed} | Failed: ${result.parity.failed} | Equivalence: ${result.parity.equivalencePercent}%`,
    `Evidence: ${result.parity.evidence}. ${result.parity.note}`, ...result.parity.behaviouralDrift.map((drift) => `- ${drift}`));
  if (!result.parity.behaviouralDrift.length) lines.push('No behavioural drift listed in this report.');
  lines.push('', '## Deployment artifacts');
  for (const artifact of result.artifacts) lines.push(`### ${artifact.name} (${artifact.path})`, '````' + artifact.language, artifact.content, '````', '');
  lines.push('## Recommended extensions and dependencies');
  for (const extension of result.extensions) lines.push(`### ${extension.name} (${extension.category})`,
    `Replaces: ${extension.replaces}`, extension.why, '````', extension.installCommand, '````',
    `Documentation: ${extension.sourceUrl}`, `Included setup file: ${selectedIds.includes(extension.id) ? extension.projectFile : 'Not selected'}`, '');
  lines.push('## Export scope', result.archiveNote, '', 'Selected recommendations are reviewable setup files. Merge dependency snippets into the build, choose compatible versions/BOMs, and run installation commands locally. They are not automatically installed.');
  return lines.join('\n');
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function modernizedZip(result: ReviewResult, selectedIds: readonly string[], signal: AbortSignal): Promise<Blob> {
  signal.throwIfAborted();
  const writer = new ZipWriter(new BlobWriter('application/zip'), { useWebWorkers: false });
  const paths = new Set<string>();
  const additions = new Map<string, string>();
  additions.set('optiscale/review-report.md', reportMarkdown(result, selectedIds));
  for (const extension of result.extensions) {
    if (selectedIds.includes(extension.id)) additions.set(extension.projectFile, extension.projectContent);
  }
  if (result.mode === 'demo') {
    for (const file of result.files) additions.set(file.path, file.modernized);
    for (const artifact of result.artifacts) additions.set(artifact.path, artifact.content);
    additions.set('README.md', `# ${result.projectName}\n\n${result.archiveNote}\n\nThe Java excerpts can be compiled with JDK 17 and Maven. Deployment examples require the full Spring Boot service.\n`);
  } else {
    const response = await fetch(`${jobUrl(result.jobId)}/archive`, { signal });
    if (!response.ok) throw httpError(response.status);
    if (!response.headers.get('content-type')?.includes('zip')) throw new Error('The service did not return a ZIP. Retry the download.');
    const archive = await response.blob();
    if (archive.size > MAX_UPLOAD_BYTES) throw new Error('The returned ZIP is too large to prepare in this browser.');
    const reader = new ZipReader(new BlobReader(archive), { useWebWorkers: false, strictness: 'strict' });
    let expandedSize = 0;
    try {
      for await (const entry of reader.getEntriesGenerator()) {
        signal.throwIfAborted();
        expandedSize += entry.uncompressedSize;
        if (!projectPathSchema.safeParse(entry.filename).success || paths.has(entry.filename) || paths.size >= MAX_ARCHIVE_ENTRIES || expandedSize > MAX_EXPANDED_MB * 1024 * 1024) {
          throw new Error('The returned archive has invalid paths or exceeds browser export limits.');
        }
        paths.add(entry.filename);
        if (additions.has(entry.filename)) throw new Error(`The archive already contains ${entry.filename}. Download without additions or resolve the name conflict in the backend.`);
        if (entry.directory) await writer.add(entry.filename, undefined, { directory: true });
        else {
          const blob = await entry.getData(new BlobWriter(), { signal, checkSignature: true, checkOverlappingEntry: true });
          await writer.add(entry.filename, new BlobReader(blob), { signal });
        }
      }
    } finally { await reader.close(); }
  }
  for (const [path, content] of additions) {
    signal.throwIfAborted();
    await writer.add(path, new TextReader(content), { signal });
  }
  return writer.close();
}
