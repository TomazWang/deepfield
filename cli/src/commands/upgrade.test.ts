/**
 * Unit tests for getProjectVersion() logic from upgrade.ts
 *
 * Run with: npx tsx src/commands/upgrade.test.ts
 *
 * getProjectVersion() is not exported, so we replicate its logic here.
 * If the implementation changes, update this test accordingly.
 */
import assert from 'assert';
import { join } from 'path';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';

/**
 * Replicates getProjectVersion() from upgrade.ts / upgrade-helpers.ts.
 *
 * Read deepfieldVersion from project.config.json (defaults to '0.0.0').
 * Special handling: Treats 1.0.0 as a legacy pre-0.2.0 version (0.1.0)
 * because the version numbering scheme changed during development.
 */
async function getProjectVersion(projectPath: string): Promise<string> {
  const configPath = join(projectPath, 'deepfield', 'project.config.json');
  if (!existsSync(configPath)) return '0.0.0';
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const rawVersion: string = config.deepfieldVersion ?? config.version ?? '0.0.0';

    // Legacy version mapping: 1.0.0 was used before version numbering change
    // Treat it as 0.1.0 (older than current 0.2.0) to trigger upgrades
    if (rawVersion === '1.0.0') {
      return '0.1.0';
    }

    return rawVersion;
  } catch {
    return '0.0.0';
  }
}

function makeProjectDir(version: string): string {
  const dir = join(
    tmpdir(),
    `deepfield-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  mkdirSync(join(dir, 'deepfield'), { recursive: true });
  writeFileSync(
    join(dir, 'deepfield', 'project.config.json'),
    JSON.stringify({ deepfieldVersion: version }),
    'utf-8'
  );
  return dir;
}

async function runTests(): Promise<void> {
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
      console.log(`  PASS  ${name}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL  ${name}`);
      console.error(`        ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  console.log('\ngetProjectVersion() tests\n');

  // input "1.0.0" → returns "0.1.0" (legacy version mapping)
  await test('maps "1.0.0" → "0.1.0"', async () => {
    const dir = makeProjectDir('1.0.0');
    try {
      const result = await getProjectVersion(dir);
      assert.strictEqual(result, '0.1.0', `Expected "0.1.0" but got "${result}"`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // input "0.2.0" → returns "0.2.0" (unchanged)
  await test('returns "0.2.0" unchanged', async () => {
    const dir = makeProjectDir('0.2.0');
    try {
      const result = await getProjectVersion(dir);
      assert.strictEqual(result, '0.2.0', `Expected "0.2.0" but got "${result}"`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // input "0.0.0" → returns "0.0.0" (unchanged)
  await test('returns "0.0.0" unchanged', async () => {
    const dir = makeProjectDir('0.0.0');
    try {
      const result = await getProjectVersion(dir);
      assert.strictEqual(result, '0.0.0', `Expected "0.0.0" but got "${result}"`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
