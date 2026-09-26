import type { ArchiveEntry, BuildTool, ProjectFacts } from './types';

const rel = (p: string, prefix: string) =>
  prefix && p.startsWith(prefix) ? p.slice(prefix.length) : p;

/** Handles the classic "zip contains one wrapper folder" case. */
export function findRootPrefix(entries: ArchiveEntry[]): string {
  const tops = new Set(
    entries
      .filter((e) => !e.path.startsWith('__MACOSX/'))
      .map((e) => e.path.split('/')[0]),
  );
  if (tops.size !== 1) return '';
  const only = [...tops][0];
  const hasRootMarker = entries.some((e) =>
    ['pom.xml', 'build.gradle', 'build.gradle.kts'].includes(e.path),
  );
  return hasRootMarker ? '' : `${only}/`;
}

export function detectBuildTool(
  entries: ArchiveEntry[],
  prefix: string,
): BuildTool {
  const names = entries.map((e) => rel(e.path, prefix));
  if (names.includes('pom.xml')) return 'maven';
  if (names.includes('build.gradle.kts')) return 'gradle-kotlin';
  if (names.includes('build.gradle')) return 'gradle-groovy';
  if (names.includes('build.xml')) return 'ant';
  return 'unknown';
}

const MAVEN_JAVA = [
  /<maven\.compiler\.(?:source|release)>\s*(?:1\.)?(\d+)\s*</,
  /<java\.version>\s*(?:1\.)?(\d+)\s*</,
];

export function detectJavaVersion(buildFile: string): string | null {
  for (const re of MAVEN_JAVA) {
    const m = buildFile.match(re);
    if (m) return m[1];
  }
  const g = buildFile.match(
    /(?:sourceCompatibility|targetCompatibility)\s*=?\s*['"]?(?:JavaVersion\.VERSION_)?(?:1[._])?(\d+)/,
  );
  return g ? g[1] : null;
}

const SPRING_BOOT_RE =
  /<parent>[\s\S]*?<artifactId>spring-boot-starter-parent<\/artifactId>[\s\S]*?<version>([\d.]+)<\/version>/;

function detectSpringBootVersion(src: string): string | null {
  const m = src.match(SPRING_BOOT_RE);
  return m ? m[1] : null;
}

/**
 * Derives all ProjectFacts from the archive entry list and a text reader.
 * Called by runPreflight before any rules run.
 */
export function buildFacts(
  entries: ArchiveEntry[],
  readText: (path: string) => string | null,
): ProjectFacts {
  const rootPrefix = findRootPrefix(entries);
  const buildTool = detectBuildTool(entries, rootPrefix);

  const buildFileNames: Record<BuildTool, string> = {
    maven: 'pom.xml',
    'gradle-groovy': 'build.gradle',
    'gradle-kotlin': 'build.gradle.kts',
    ant: 'build.xml',
    unknown: '',
  };
  const buildFileName = buildFileNames[buildTool];
  const buildFilePath = rootPrefix + buildFileName;
  const buildFileText = buildFileName ? readText(buildFilePath) ?? '' : '';

  const javaSourceVersion = detectJavaVersion(buildFileText);
  const springBootVersion = detectSpringBootVersion(buildFileText);

  // Count build files for multi-module detection
  const moduleCount = entries.filter(
    (e) =>
      !e.isDirectory &&
      (e.path.endsWith('/pom.xml') ||
        e.path.endsWith('/build.gradle') ||
        e.path.endsWith('/build.gradle.kts')),
  ).length || (buildFileName ? 1 : 0);

  const javaEntries = entries.filter(
    (e) => !e.isDirectory && e.path.endsWith('.java'),
  );
  const javaFileCount = javaEntries.length;

  const sqlFileCount = entries.filter(
    (e) => !e.isDirectory && e.path.endsWith('.sql'),
  ).length;

  // Rough LOC: sum non-empty lines in all .java files
  let totalLoc = 0;
  for (const e of javaEntries) {
    const src = readText(e.path);
    if (src) totalLoc += src.split('\n').filter((l) => l.trim().length > 0).length;
  }

  const totalBytes = entries
    .filter((e) => !e.isDirectory)
    .reduce((s, e) => s + e.size, 0);

  const hasTests = entries.some((e) =>
    e.path.replace(rootPrefix, '').startsWith('src/test'),
  );
  const hasDocs = entries.some((e) => {
    const p = e.path.replace(rootPrefix, '');
    return p === 'docs' || p.startsWith('docs/');
  });
  const hasDockerfile = entries.some(
    (e) => !e.isDirectory && e.path.replace(rootPrefix, '') === 'Dockerfile',
  );
  const hasLockedDependencies = entries.some(
    (e) =>
      !e.isDirectory &&
      (e.path.endsWith('package-lock.json') ||
        e.path.endsWith('yarn.lock') ||
        e.path.endsWith('gradle.lockfile') ||
        e.path.endsWith('.mvn/wrapper/maven-wrapper.properties')),
  );

  return {
    rootPrefix,
    buildTool,
    javaSourceVersion,
    springBootVersion,
    hasTests,
    hasDocs,
    hasDockerfile,
    hasLockedDependencies,
    moduleCount,
    javaFileCount,
    sqlFileCount,
    totalLoc,
    totalBytes,
  };
}
