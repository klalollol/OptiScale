import type { ReviewJob, ReviewResult } from '../types/review';

interface AppState {
  jobId: string | null;
  result: ReviewResult | null;
  selections: Map<string, Set<string>>;
}

const state: AppState = { jobId: null, result: null, selections: new Map() };

export const appStore = {
  setJob(job: ReviewJob): void {
    state.jobId = job.id;
    state.result = job.result;
  },
  setResult(result: ReviewResult): void {
    state.jobId = result.jobId;
    state.result = result;
  },
  getResult(jobId: string): ReviewResult | null {
    return state.jobId === jobId ? state.result : null;
  },
  toggleExtension(jobId: string, extensionId: string): boolean {
    const selections = state.selections.get(jobId) ?? new Set<string>();
    if (selections.has(extensionId)) selections.delete(extensionId);
    else selections.add(extensionId);
    state.selections.set(jobId, selections);
    return selections.has(extensionId);
  },
  selectedExtensions(jobId: string): readonly string[] {
    return [...(state.selections.get(jobId) ?? [])];
  },
};
