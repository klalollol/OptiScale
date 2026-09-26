export type {
  SuggestionSeverity,
  AntiPatternCategory,
  AntiPatternHit,
  AntiPattern,
  CodeSuggestion,
  SuggestionReport,
} from './types';

export { ANTI_PATTERNS, DETECTORS, LINE_LOCATORS, matchLine } from './patterns';

export { runSuggestions } from './runSuggestions';
export type { SuggestionInput } from './runSuggestions';
