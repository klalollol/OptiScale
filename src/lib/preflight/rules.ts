import type { ArchiveEntry, CheckResult, ProjectFacts } from './types';

export interface RuleContext {
  entries: ArchiveEntry[];
  facts: ProjectFacts;
  readText: (path: string) => string | null;
}

export type Rule = (ctx: RuleContext) => CheckResult;

const pass = (
  id: string,
  label: string,
  detail: string,
): CheckResult => ({ id, label, severity: 'info', status: 'pass', detail });

export const RULES: Rule[] = [
  // ---------- structural blockers ----------
  ({ facts }) =>
    facts.buildTool === 'unknown'
      ? {
          id: 'build-tool',
          label: 'Build tool detected',
          severity: 'blocker',
          status: 'fail',
          detail: 'No pom.xml, build.gradle or build.gradle.kts at project root.',
          remediation:
            'Zip the folder that directly contains your build file, not its parent.',
        }
      : pass('build-tool', 'Build tool detected', `Detected ${facts.buildTool}.`),

  ({ facts }) =>
    facts.javaFileCount === 0
      ? {
          id: 'java-sources',
          label: 'Java sources present',
          severity: 'blocker',
          status: 'fail',
          detail: 'Archive contains zero .java files.',
          remediation: 'Include src/main/java in the archive.',
        }
      : pass(
          'java-sources',
          'Java sources present',
          `${facts.javaFileCount} files, ${facts.totalLoc.toLocaleString()} LOC.`,
        ),

  ({ entries }) => {
    const bad = entries.find((e) => e.path.includes('..') || e.path.startsWith('/'));
    return bad
      ? {
          id: 'zip-slip',
          label: 'Archive path safety',
          severity: 'blocker',
          status: 'fail',
          detail: `Unsafe entry path: ${bad.path}`,
          remediation: 'Re-create the archive without absolute or traversal paths.',
        }
      : pass('zip-slip', 'Archive path safety', 'No traversal or absolute paths.');
  },

  // ---------- harness prerequisites ----------
  ({ facts }) =>
    facts.hasTests
      ? pass('existing-tests', 'Existing test sources', 'src/test found — usable as parity seed.')
      : {
          id: 'existing-tests',
          label: 'Existing test sources',
          severity: 'warning',
          status: 'fail',
          detail: 'No src/test directory.',
          remediation:
            'Parity fixtures will be recorded from live traffic instead of existing tests.',
        },

  ({ facts }) =>
    facts.javaSourceVersion
      ? pass(
          'java-version',
          'Source level declared',
          `Java ${facts.javaSourceVersion} declared in build file.`,
        )
      : {
          id: 'java-version',
          label: 'Source level declared',
          severity: 'warning',
          status: 'fail',
          detail: 'Could not read maven.compiler.source / sourceCompatibility.',
          remediation: 'Toolchain will default to Java 8 for the legacy module.',
        },

  ({ facts }) =>
    facts.hasDockerfile
      ? pass('dockerfile', 'Dockerfile present', 'Existing Dockerfile will be reused as the legacy baseline image.')
      : {
          id: 'dockerfile',
          label: 'Dockerfile present',
          severity: 'warning',
          status: 'fail',
          detail: 'No Dockerfile found.',
          remediation: 'Subagent 3 will generate one; baseline timing may differ from prod.',
        },

  ({ facts }) =>
    facts.hasDocs
      ? pass('docs', 'Documentation folder', 'docs/ found — fed to Document Understanding.')
      : {
          id: 'docs',
          label: 'Documentation folder',
          severity: 'info',
          status: 'skip',
          detail: 'No docs/ folder. Architecture intent inferred from code only.',
        },

  // ---------- performance surface ----------
  ({ entries, facts, readText }) => {
    const hits: string[] = [];
    for (const e of entries) {
      if (!e.path.endsWith('.java')) continue;
      const src = readText(e.path);
      if (!src) continue;
      if (/FetchType\.EAGER|@OneToMany(?![\s\S]{0,80}fetch)/.test(src))
        hits.push(e.path.replace(facts.rootPrefix, ''));
    }
    return hits.length
      ? {
          id: 'n-plus-one',
          label: 'N+1 query risk',
          severity: 'warning',
          status: 'fail',
          detail: `${hits.length} entity mappings likely to trigger N+1.`,
          remediation: 'p6spy will count actual statements to confirm during the benchmark run.',
        }
      : pass('n-plus-one', 'N+1 query risk', 'No eager collection mappings detected.');
  },

  ({ facts }) =>
    facts.moduleCount > 1
      ? {
          id: 'multi-module',
          label: 'Module topology',
          severity: 'warning',
          status: 'fail',
          detail: `${facts.moduleCount} build files — multi-module reactor.`,
          remediation: 'Bench module attaches to the root aggregator only.',
        }
      : pass('multi-module', 'Module topology', 'Single module.'),
];
