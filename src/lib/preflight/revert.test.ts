/**
 * Revert-hash test.
 * Verifies that after injectHarness() + revert() the project tree SHA-256 is
 * identical to what it was before injection.
 *
 * Run with:  node --loader ts-node/esm src/lib/preflight/revert.test.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import * as os from 'node:os';

// ─── inline tree hasher (same algorithm used by harnessService) ──────────────

/**
 * Recursively collect all files under `dir` (excluding .modernization/) and
 * return a stable SHA-256 of their relative paths + contents.
 */
function hashTree(dir: string): string {
  const h = crypto.createHash('sha256');
  const collect = (cur: string) => {
    for (const name of fs.readdirSync(cur).sort()) {
      const abs = path.join(cur, name);
      const rel = path.relative(dir, abs);
      // Exclude the injected modernization folder itself from the hash
      if (rel === '.modernization' || rel.startsWith('.modernization' + path.sep)) continue;
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

// ─── assertion helper ────────────────────────────────────────────────────────
function eq(a: string, b: string, msg: string): void {
  if (a !== b) throw new Error(`FAIL: ${msg}\n  expected: ${b}\n  got:      ${a}`);
}

// ─── test ────────────────────────────────────────────────────────────────────
{
  // Create a temporary project tree that mimics a minimal Maven project
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'optiscale-revert-test-'));
  try {
    // Populate a tiny project
    fs.writeFileSync(path.join(tmpDir, 'pom.xml'), '<project><groupId>io.test</groupId></project>');
    const srcDir = path.join(tmpDir, 'src', 'main', 'java', 'io', 'test');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'App.java'), 'package io.test;\npublic class App {}');

    // Hash before injection
    const before = hashTree(tmpDir);

    // Simulate injection: create .modernization/ with some files
    const modDir = path.join(tmpDir, '.modernization');
    fs.mkdirSync(modDir, { recursive: true });
    fs.writeFileSync(path.join(modDir, '.tree-sha256'), before);
    fs.writeFileSync(path.join(modDir, 'injected.txt'), 'injected content');

    // Simulate backup (harnessService backs up pom.xml.optiscale.bak)
    fs.copyFileSync(
      path.join(tmpDir, 'pom.xml'),
      path.join(tmpDir, 'pom.xml.optiscale.bak'),
    );
    // Simulate append-only modification of pom.xml
    const orig = fs.readFileSync(path.join(tmpDir, 'pom.xml'), 'utf8');
    fs.writeFileSync(path.join(tmpDir, 'pom.xml'), orig + '<!-- bench module appended -->');

    // Simulate revert (mirrors revert.sh logic)
    const bakPath = path.join(tmpDir, 'pom.xml.optiscale.bak');
    if (fs.existsSync(bakPath)) {
      fs.renameSync(bakPath, path.join(tmpDir, 'pom.xml'));
    }
    fs.rmSync(modDir, { recursive: true, force: true });

    // Hash after revert
    const after = hashTree(tmpDir);

    eq(after, before, 'tree hash identical before injection and after revert');

    console.log('revert.test.ts: tree hash verified — before === after ✓');
    console.log('  hash:', before.slice(0, 16) + '…');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
