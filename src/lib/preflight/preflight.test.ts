/**
 * Unit tests for the preflight pipeline.
 * No test runner ships with this project — these are plain functions that
 * throw on failure.  Run with:  node --loader ts-node/esm src/lib/preflight/preflight.test.ts
 * (or integrate into a future test runner without changing the assertions).
 *
 * Assertion helper:
 */

import { runPreflight } from './runPreflight';
import { detectJavaVersion } from './detect';
import type { ArchiveEntry } from './types';

// ─── tiny assertion helper ───────────────────────────────────────────────────
function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function eq<T>(a: T, b: T, msg: string): void {
  if (a !== b) throw new Error(`FAIL: ${msg} — expected ${String(b)}, got ${String(a)}`);
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function makeEntry(path: string, size = 100): ArchiveEntry {
  return { path, size, isDirectory: false };
}

function dirEntry(path: string): ArchiveEntry {
  return { path, size: 0, isDirectory: true };
}

const javaEntry = (path: string) => makeEntry(path, 500);
const readNothing = (_p: string) => null;

// ─── runPreflight: build tool detection ─────────────────────────────────────
{
  // maven
  const r = runPreflight({
    entries: [makeEntry('pom.xml'), javaEntry('src/main/java/App.java')],
    readText: (p) => (p === 'pom.xml' ? '<project></project>' : 'class App {}'),
  });
  eq(r.facts.buildTool, 'maven', 'maven build tool');
  assert(r.ok, 'maven: no blockers');
  assert(r.tier === 'measured', 'maven: tier=measured');
}

{
  // gradle-groovy
  const r = runPreflight({
    entries: [makeEntry('build.gradle'), javaEntry('src/main/java/App.java')],
    readText: (p) => (p === 'build.gradle' ? 'apply plugin: "java"' : 'class App {}'),
  });
  eq(r.facts.buildTool, 'gradle-groovy', 'gradle-groovy build tool');
  assert(r.ok, 'gradle-groovy: no blockers');
}

{
  // gradle-kotlin
  const r = runPreflight({
    entries: [makeEntry('build.gradle.kts'), javaEntry('src/main/java/App.java')],
    readText: (p) =>
      p === 'build.gradle.kts' ? 'plugins { java }' : 'class App {}',
  });
  eq(r.facts.buildTool, 'gradle-kotlin', 'gradle-kotlin build tool');
  assert(r.ok, 'gradle-kotlin: no blockers');
}

{
  // ant
  const r = runPreflight({
    entries: [makeEntry('build.xml'), javaEntry('src/main/java/App.java')],
    readText: (p) => (p === 'build.xml' ? '<project></project>' : 'class App {}'),
  });
  eq(r.facts.buildTool, 'ant', 'ant build tool');
  assert(r.ok, 'ant: no blockers');
  assert(r.tier === 'estimated', 'ant: tier=estimated (no Docker harness)');
}

{
  // unknown
  const r = runPreflight({
    entries: [javaEntry('src/main/java/App.java')],
    readText: () => 'class App {}',
  });
  eq(r.facts.buildTool, 'unknown', 'unknown build tool');
  assert(!r.ok, 'unknown: has blockers');
  assert(r.tier === 'unavailable', 'unknown: tier=unavailable');
  assert(
    r.blockers.some((c) => c.id === 'build-tool'),
    'unknown: build-tool blocker present',
  );
}

{
  // wrapper folder — zip has single top-level dir wrapping the project
  const r = runPreflight({
    entries: [
      dirEntry('myapp/'),
      makeEntry('myapp/pom.xml'),
      javaEntry('myapp/src/main/java/App.java'),
    ],
    readText: (p) =>
      p === 'myapp/pom.xml' ? '<project></project>' : 'class App {}',
  });
  eq(r.facts.buildTool, 'maven', 'wrapper folder: maven detected through prefix');
  eq(r.facts.rootPrefix, 'myapp/', 'wrapper folder: rootPrefix stripped');
}

{
  // zip-slip
  const r = runPreflight({
    entries: [makeEntry('pom.xml'), makeEntry('../etc/passwd'), javaEntry('src/main/java/App.java')],
    readText: (p) => (p === 'pom.xml' ? '<project></project>' : 'class App {}'),
  });
  assert(!r.ok, 'zip-slip: blocker raised');
  assert(
    r.blockers.some((c) => c.id === 'zip-slip'),
    'zip-slip: correct blocker id',
  );
}

{
  // zero .java files
  const r = runPreflight({
    entries: [makeEntry('pom.xml'), makeEntry('README.md')],
    readText: (p) => (p === 'pom.xml' ? '<project></project>' : ''),
  });
  assert(!r.ok, 'zero java: blocker raised');
  assert(
    r.blockers.some((c) => c.id === 'java-sources'),
    'zero java: correct blocker id',
  );
}

// ─── detectJavaVersion ───────────────────────────────────────────────────────
{
  eq(detectJavaVersion('<maven.compiler.source>1.8</maven.compiler.source>'), '8', 'detect 1.8 → 8');
  eq(detectJavaVersion('<maven.compiler.source>8</maven.compiler.source>'), '8', 'detect 8');
  eq(detectJavaVersion('<maven.compiler.source>17</maven.compiler.source>'), '17', 'detect 17');
  eq(
    detectJavaVersion('sourceCompatibility = JavaVersion.VERSION_17'),
    '17',
    'detect VERSION_17',
  );
  eq(detectJavaVersion('<groupId>com.example</groupId>'), null, 'absent → null');
}

console.log('preflight.test.ts: all assertions passed');
