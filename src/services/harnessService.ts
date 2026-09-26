/**
 * harnessService.ts
 *
 * Node-side service (runs outside the browser bundle — execute via tsx/ts-node).
 * Three exported functions:
 *   injectHarness(projectDir, facts)  — copies templates, fills placeholders, records tree hash
 *   runBench(projectDir)              — shells out to run-bench.sh with sandbox limits
 *   revert(projectDir)                — restores the project to its pre-injection state
 *
 * Injection contract (non-negotiable):
 *   • Everything generated goes under <project>/.modernization/
 *   • ONLY the root aggregator (pom.xml / settings.gradle[.kts]) may be modified
 *   • Back it up as *.optiscale.bak FIRST, append-only, never regenerate
 *   • SHA-256 of project tree recorded before injection; revert restores it
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { execSync, spawnSync } from 'node:child_process';
import type { ProjectFacts } from '../lib/preflight/types';

// ─── constants ───────────────────────────────────────────────────────────────

const TEMPLATES_DIR = path.resolve(
  new URL('.', import.meta.url).pathname,
  '../../templates/modernization',
);

const MOD_SUBDIR = '.modernization';
const HASH_FILE = '.tree-sha256';

// Default sandbox timeout in seconds (overridden by BENCH_TIMEOUT env var)
const DEFAULT_TIMEOUT = 900;

// ─── tree hasher ─────────────────────────────────────────────────────────────

/**
 * Stable SHA-256 of all non-.modernization files under dir.
 * Sorted by relative path for determinism.
 */
function hashTree(dir: string): string {
  const h = crypto.createHash('sha256');
  const collect = (cur: string) => {
    for (const name of fs.readdirSync(cur).sort()) {
      const abs = path.join(cur, name);
      const rel = path.relative(dir, abs);
      if (rel === MOD_SUBDIR || rel.startsWith(MOD_SUBDIR + path.sep)) continue;
      const stat = fs.statSync(abs);
      if (stat.isDirectory()) {
        collect(abs);
      } else {
        h.update(rel + '\n');
        h.update(fs.readFileSync(abs));
      }
    }
  };
  collect(dir);
  return h.digest('hex');
}

// ─── placeholder substitution ────────────────────────────────────────────────

type Placeholders = Record<string, string>;

function fillPlaceholders(text: string, vars: Placeholders): string {
  return text.replace(/@([A-Z_]+)@/g, (_, key) => vars[key] ?? `@${key}@`);
}

function placeholdersFromFacts(facts: ProjectFacts): Placeholders {
  return {
    LEGACY_GROUP: 'io.optiscale.legacy',
    LEGACY_ARTIFACT: 'app',
    LEGACY_VERSION: '1.0.0-legacy',
    MODERN_VERSION: '1.0.0-modern',
    LEGACY_JAVA: facts.javaSourceVersion ?? '8',
    MODERN_JAVA: '17',
    SPRING_BOOT_VERSION: facts.springBootVersion ?? '3.2.0',
  };
}

// ─── recursive template copy ──────────────────────────────────────────────────

function copyTemplate(src: string, dest: string, vars: Placeholders): void {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyTemplate(path.join(src, name), path.join(dest, name), vars);
    }
  } else {
    const raw = fs.readFileSync(src, 'utf8');
    const filled = fillPlaceholders(raw, vars);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, filled, 'utf8');
    // Preserve executable bit for shell scripts
    if (src.endsWith('.sh')) {
      fs.chmodSync(dest, 0o755);
    }
  }
}

// ─── root aggregator patching ────────────────────────────────────────────────

const AGGREGATOR_FILES = ['pom.xml', 'settings.gradle', 'settings.gradle.kts'];

function patchAggregator(projectDir: string, modRelPath: string): void {
  for (const name of AGGREGATOR_FILES) {
    const abs = path.join(projectDir, name);
    if (!fs.existsSync(abs)) continue;

    const bak = abs + '.optiscale.bak';
    if (!fs.existsSync(bak)) {
      fs.copyFileSync(abs, bak); // backup first
    }

    const orig = fs.readFileSync(abs, 'utf8');

    let patch: string;
    if (name === 'pom.xml') {
      // Maven: append <module> before </modules> or append <modules> block
      if (orig.includes('</modules>')) {
        patch = orig.replace('</modules>', `  <module>${modRelPath}</module>\n  </modules>`);
      } else if (orig.includes('</project>')) {
        patch = orig.replace(
          '</project>',
          `  <modules>\n    <module>${modRelPath}</module>\n  </modules>\n</project>`,
        );
      } else {
        patch = orig + `\n<!-- OptiScale bench module -->\n`;
      }
    } else {
      // Gradle settings: append include
      patch = orig + `\ninclude("${modRelPath}")\n`;
    }

    fs.writeFileSync(abs, patch, 'utf8');
    return; // Only patch the first aggregator found
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

/**
 * Copies the verification harness templates into <projectDir>/.modernization/,
 * fills all @PLACEHOLDER@ tokens, backs up the root aggregator, patches it to
 * include the bench module, and records the pre-injection tree SHA-256.
 */
export function injectHarness(projectDir: string, facts: ProjectFacts): void {
  const modDir = path.join(projectDir, MOD_SUBDIR);

  // Record tree hash BEFORE any writes
  const treeHash = hashTree(projectDir);

  fs.mkdirSync(modDir, { recursive: true });
  fs.writeFileSync(path.join(modDir, HASH_FILE), treeHash, 'utf8');

  const vars = placeholdersFromFacts(facts);

  // Copy entire templates/modernization tree into .modernization/
  copyTemplate(TEMPLATES_DIR, modDir, vars);

  // Patch root aggregator (append-only, never regenerate)
  patchAggregator(projectDir, '.modernization/bench');
}

/**
 * Runs run-bench.sh inside the .modernization directory.
 * Enforces BENCH_TIMEOUT.  Returns parsed report JSON on success.
 * Throws with exit code 2 if the project build failed (caller falls back to estimated).
 */
export function runBench(projectDir: string): Record<string, unknown> {
  const scriptPath = path.join(projectDir, MOD_SUBDIR, 'run-bench.sh');
  if (!fs.existsSync(scriptPath)) {
    throw new Error('run-bench.sh not found — call injectHarness() first');
  }

  const timeout = parseInt(process.env['BENCH_TIMEOUT'] ?? String(DEFAULT_TIMEOUT), 10);

  const result = spawnSync('bash', [scriptPath], {
    cwd: projectDir,
    timeout: timeout * 1000,
    env: {
      ...process.env,
      BENCH_TIMEOUT: String(timeout),
    },
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) throw result.error;
  if (result.status === 2) {
    const err = new Error('bench build failed — falling back to estimated tier') as Error & { code: number };
    err.code = 2;
    throw err;
  }
  if (result.status !== 0) {
    throw new Error(`run-bench.sh exited with status ${result.status ?? 'unknown'}`);
  }

  return JSON.parse(result.stdout) as Record<string, unknown>;
}

/**
 * Restores the project to its pre-injection state:
 *   1. Moves *.optiscale.bak back to original names.
 *   2. Removes .modernization/.
 *   3. Tears down any leftover bench Docker containers.
 * Also verifies the post-revert tree hash matches the recorded value.
 */
export function revert(projectDir: string): void {
  const modDir = path.join(projectDir, MOD_SUBDIR);
  const hashFile = path.join(modDir, HASH_FILE);

  // Read expected hash before we start deleting things
  const expectedHash = fs.existsSync(hashFile)
    ? fs.readFileSync(hashFile, 'utf8').trim()
    : null;

  // Restore aggregator backups
  for (const name of AGGREGATOR_FILES) {
    const bak = path.join(projectDir, name + '.optiscale.bak');
    if (fs.existsSync(bak)) {
      fs.renameSync(bak, path.join(projectDir, name));
    }
  }

  // Remove .modernization/
  if (fs.existsSync(modDir)) {
    fs.rmSync(modDir, { recursive: true, force: true });
  }

  // Best-effort: tear down any leftover Docker containers
  try {
    execSync('docker compose -p optiscale-bench down -v --remove-orphans', {
      stdio: 'ignore',
      timeout: 30_000,
    });
  } catch {
    // Not fatal — containers may never have started
  }

  // Verify tree hash
  if (expectedHash !== null) {
    const actual = hashTree(projectDir);
    if (actual !== expectedHash) {
      throw new Error(
        `Revert hash mismatch!\n  expected: ${expectedHash}\n  actual:   ${actual}`,
      );
    }
  }
}
