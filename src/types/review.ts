import { z } from 'zod';

const count = z.number().int().nonnegative();
const percentage = z.number().min(0).max(100);
const nonempty = z.string().min(1);
// Keep JSON structurally type-checkable while validating vocabulary at runtime.
const choice = (values: readonly string[]) => nonempty.refine((value) => values.includes(value));
export const projectPathSchema = nonempty.refine((path) =>
  !path.startsWith('/') && !path.includes('\\') && !path.includes(':') &&
  [...path].every((character) => character.charCodeAt(0) >= 32) &&
  path.split('/').every((part) => part !== '..' && part !== '.'),
  'Expected a relative project path without traversal.',
);

export const fileDiffSchema = z.object({
  path: projectPathSchema, language: nonempty, original: z.string(), modernized: z.string(),
  changedLines: count, totalOriginalLines: count, newLOC: count,
});
export type FileDiff = z.infer<typeof fileDiffSchema>;

export const perfFindingSchema = z.object({
  id: nonempty, title: nonempty, severity: choice(['critical', 'high', 'medium', 'low']),
  file: projectPathSchema, line: z.number().int().positive(), whySlow: nonempty,
  fix: nonempty, expectedGain: nonempty, evidence: choice(['estimated', 'measured']),
});
export type PerfFinding = z.infer<typeof perfFindingSchema>;

export const perfMetricDeltaSchema = z.object({
  label: nonempty, before: z.number().nonnegative(), after: z.number().nonnegative(),
  unit: nonempty, direction: choice(['lower', 'higher']),
  evidence: choice(['estimated', 'measured']), note: nonempty,
});
export type PerfMetricDelta = z.infer<typeof perfMetricDeltaSchema>;

export const parityReportSchema = z.object({
  generatedTests: count, passed: count, failed: count, equivalencePercent: percentage,
  behaviouralDrift: z.array(z.string()), evidence: choice(['sample', 'measured']), note: nonempty,
}).refine((report) => report.passed + report.failed <= report.generatedTests,
  'Completed tests cannot exceed generated tests.');
export type ParityReport = z.infer<typeof parityReportSchema>;

export const deploymentArtifactSchema = z.object({
  name: nonempty, path: projectPathSchema, language: nonempty, content: nonempty,
});
export type DeploymentArtifact = z.infer<typeof deploymentArtifactSchema>;

export const extensionSuggestionSchema = z.object({
  id: nonempty, name: nonempty, category: choice(['IDE extension', 'Build dependency', 'Migration tool']),
  replaces: nonempty, why: nonempty, installCommand: nonempty,
  projectFile: projectPathSchema, projectContent: nonempty,
  sourceUrl: z.url().refine((url) => url.startsWith('https://')),
});
export type ExtensionSuggestion = z.infer<typeof extensionSuggestionSchema>;

export const reviewResultSchema = z.object({
  jobId: nonempty, projectName: nonempty, mode: choice(['demo', 'review']),
  filesScanned: count, originalLOC: count, detectedStack: z.array(nonempty).min(1),
  targetStack: z.array(nonempty).min(1), modernizationScore: percentage,
  engineerHoursBefore: z.number().nonnegative(), engineerHoursAfter: z.number().nonnegative(),
  effortNote: nonempty, findings: z.array(perfFindingSchema), files: z.array(fileDiffSchema),
  performance: z.array(perfMetricDeltaSchema), parity: parityReportSchema,
  artifacts: z.array(deploymentArtifactSchema), extensions: z.array(extensionSuggestionSchema),
  archiveName: nonempty.refine((name) => /^[a-zA-Z0-9._-]+\.zip$/.test(name)), archiveNote: nonempty,
});
export type ReviewResult = z.infer<typeof reviewResultSchema>;

export const subagentProgressSchema = z.object({
  id: nonempty, name: nonempty,
  status: z.enum(['queued', 'running', 'verifying', 'completed', 'failed']),
  progress: percentage, detail: z.string(),
});
export type SubagentProgress = z.infer<typeof subagentProgressSchema>;

export const reviewJobSchema = z.object({
  id: nonempty, status: z.enum(['queued', 'running', 'completed', 'empty', 'failed']),
  subagents: z.array(subagentProgressSchema), result: reviewResultSchema.nullable(), error: z.string().nullable(),
}).refine((job) => !job.result || job.result.jobId === job.id, 'Job/result ID mismatch.')
  .refine((job) => job.status !== 'completed' || job.result !== null, 'Completed job requires a result.');
export type ReviewJob = z.infer<typeof reviewJobSchema>;
