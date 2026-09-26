export type Severity = 'blocker' | 'warning' | 'info';

export type CheckStatus = 'pass' | 'fail' | 'skip';

export type BuildTool =
  | 'maven'
  | 'gradle-groovy'
  | 'gradle-kotlin'
  | 'ant'
  | 'unknown';

export type MeasurementTier = 'measured' | 'estimated' | 'unavailable';

export interface ArchiveEntry {
  path: string;
  size: number;
  isDirectory: boolean;
}

export interface ProjectFacts {
  rootPrefix: string;
  buildTool: BuildTool;
  javaSourceVersion: string | null;
  springBootVersion: string | null;
  hasTests: boolean;
  hasDocs: boolean;
  hasDockerfile: boolean;
  hasLockedDependencies: boolean;
  moduleCount: number;
  javaFileCount: number;
  sqlFileCount: number;
  totalLoc: number;
  totalBytes: number;
}

export interface CheckResult {
  id: string;
  label: string;
  severity: Severity;
  status: CheckStatus;
  detail: string;
  remediation?: string;
}

export interface PreflightReport {
  ok: boolean;
  facts: ProjectFacts;
  checks: CheckResult[];
  blockers: CheckResult[];
  warnings: CheckResult[];
  tier: MeasurementTier;
  score: number;
  generatedAt: string;
}
