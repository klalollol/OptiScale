export type {
  Severity,
  CheckStatus,
  BuildTool,
  MeasurementTier,
  ArchiveEntry,
  ProjectFacts,
  CheckResult,
  PreflightReport,
} from './types';

export {
  findRootPrefix,
  detectBuildTool,
  detectJavaVersion,
  buildFacts,
} from './detect';

export { RULES } from './rules';
export type { RuleContext, Rule } from './rules';

export { runPreflight } from './runPreflight';
export type { PreflightInput } from './runPreflight';
