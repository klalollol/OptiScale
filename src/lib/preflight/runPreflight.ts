import { buildFacts } from './detect';
import { RULES, type RuleContext } from './rules';
import type { ArchiveEntry, MeasurementTier, PreflightReport } from './types';

export interface PreflightInput {
  entries: ArchiveEntry[];
  readText: (path: string) => string | null;
}

export function runPreflight({ entries, readText }: PreflightInput): PreflightReport {
  const facts = buildFacts(entries, readText);
  const ctx: RuleContext = { entries, facts, readText };
  const checks = RULES.map((rule) => rule(ctx));

  const blockers = checks.filter((c) => c.severity === 'blocker' && c.status === 'fail');
  const warnings = checks.filter((c) => c.severity === 'warning' && c.status === 'fail');

  const tier: MeasurementTier = blockers.length
    ? 'unavailable'
    : facts.buildTool === 'ant'
      ? 'estimated'
      : 'measured';

  const scored = checks.filter((c) => c.status !== 'skip');
  const score = scored.length
    ? Math.round((scored.filter((c) => c.status === 'pass').length / scored.length) * 100)
    : 0;

  return {
    ok: blockers.length === 0,
    facts,
    checks,
    blockers,
    warnings,
    tier,
    score,
    generatedAt: new Date().toISOString(),
  };
}
