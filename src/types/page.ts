export type Navigate = (path: string) => void;

export interface PageContext {
  root: HTMLElement;
  navigate: Navigate;
  signal: AbortSignal;
  jobId?: string;
}

export type PageRenderer = (context: PageContext) => void;
