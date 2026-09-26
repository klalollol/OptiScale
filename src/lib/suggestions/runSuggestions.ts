/**
 * runSuggestions — code suggestion engine entry point.
 * Browser-safe — no Node APIs.
 *
 * Scans every .java file in the archive for known anti-patterns, collects
 * hit locations, and computes projected performance boosts.
 */

import { ANTI_PATTERNS, DETECTORS, LINE_LOCATORS, matchLine } from './patterns';
import type { AntiPatternHit, CodeSuggestion, SuggestionReport } from './types';
import type { ArchiveEntry } from '../preflight/types';

export interface SuggestionInput {
  entries: ArchiveEntry[];
  readText: (path: string) => string | null;
  rootPrefix: string;
}

export function runSuggestions({
  entries,
  readText,
  rootPrefix,
}: SuggestionInput): SuggestionReport {
  const javaEntries = entries.filter(
    (e) => !e.isDirectory && e.path.endsWith('.java'),
  );

  // For each pattern, collect every file hit
  const hitsByPattern = new Map<string, AntiPatternHit[]>();
  for (const pattern of ANTI_PATTERNS) {
    hitsByPattern.set(pattern.id, []);
  }

  for (const entry of javaEntries) {
    const src = readText(entry.path);
    if (!src) continue;
    const relPath = entry.path.startsWith(rootPrefix)
      ? entry.path.slice(rootPrefix.length)
      : entry.path;

    for (const pattern of ANTI_PATTERNS) {
      const detector = DETECTORS[pattern.id];
      if (!detector) continue;
      const snippet = detector(src);
      if (!snippet) continue;

      const locator = LINE_LOCATORS[pattern.id];
      const line = locator ? matchLine(src, locator) : null;

      hitsByPattern.get(pattern.id)!.push({ file: relPath, line, snippet });
    }
  }

  // Build CodeSuggestion[] — only patterns with at least one hit
  const suggestions: CodeSuggestion[] = [];

  for (const pattern of ANTI_PATTERNS) {
    const hits = hitsByPattern.get(pattern.id) ?? [];
    if (hits.length === 0) continue;

    // Scale projected boost by hit count (more hits = more potential gain),
    // capped at 2× the base range to avoid unrealistic numbers
    const scale = Math.min(hits.length, 2);
    const projectedBoostMin = Math.round(pattern.estimatedImpact.min * (1 + (scale - 1) * 0.2));
    const projectedBoostMax = Math.round(pattern.estimatedImpact.max * (1 + (scale - 1) * 0.2));

    suggestions.push({ pattern, hits, projectedBoostMin, projectedBoostMax });
  }

  // Sort: critical first, then major, then minor; within tier by hit count desc
  const severityOrder: Record<string, number> = { critical: 0, major: 1, minor: 2 };
  suggestions.sort((a, b) => {
    const sd = severityOrder[a.pattern.severity] - severityOrder[b.pattern.severity];
    return sd !== 0 ? sd : b.hits.length - a.hits.length;
  });

  const totalHits = suggestions.reduce((s, sg) => s + sg.hits.length, 0);

  // Composite boost: sum of all performance-category min/max, capped at 80%
  // (patterns interact — full additive compounding is unrealistic)
  const perfSuggestions = suggestions.filter(
    (sg) => sg.pattern.category === 'performance',
  );
  const compositeBoostMin = Math.min(
    perfSuggestions.reduce((s, sg) => s + sg.projectedBoostMin, 0),
    80,
  );
  const compositeBoostMax = Math.min(
    perfSuggestions.reduce((s, sg) => s + sg.projectedBoostMax, 0),
    80,
  );

  return {
    suggestions,
    totalPatterns: suggestions.length,
    totalHits,
    compositeBoostMin,
    compositeBoostMax,
    generatedAt: new Date().toISOString(),
  };
}
