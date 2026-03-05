import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import chalk from 'chalk';

/**
 * The three files that must carry identical version values.
 */
interface VersionFile {
  label: string;
  path: string;
  field: string;
  getValue: (parsed: Record<string, unknown>) => string | undefined;
}

interface VersionEntry {
  label: string;
  path: string;
  version: string;
  found: boolean;
}

function getRepoRoot(): string {
  // tsup bundles everything into a single dist/cli.js file.
  // __filename → .../cli/dist/cli.js
  // dirname    → .../cli/dist/
  // ..         → .../cli/
  // ..         → repo root
  return join(dirname(__filename), '..', '..');
}

function readVersion(filePath: string, getValue: (obj: Record<string, unknown>) => string | undefined): { version: string; found: boolean } {
  if (!existsSync(filePath)) {
    return { version: '(not found)', found: false };
  }
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const value = getValue(parsed);
    if (!value || value === 'null') {
      return { version: '(missing field)', found: false };
    }
    return { version: value, found: true };
  } catch {
    return { version: '(parse error)', found: false };
  }
}

function collectVersions(repoRoot: string): VersionEntry[] {
  const files: VersionFile[] = [
    {
      label: 'cli/package.json (.version)',
      path: join(repoRoot, 'cli', 'package.json'),
      field: '.version',
      getValue: (obj) => obj.version as string | undefined,
    },
    {
      label: 'plugin/package.json (.version)',
      path: join(repoRoot, 'plugin', 'package.json'),
      field: '.version',
      getValue: (obj) => obj.version as string | undefined,
    },
    {
      label: 'plugin/package.json (.peerDependencies.deepfield)',
      path: join(repoRoot, 'plugin', 'package.json'),
      field: '.peerDependencies.deepfield',
      getValue: (obj) => {
        const peer = obj.peerDependencies as Record<string, string> | undefined;
        return peer?.deepfield;
      },
    },
    {
      label: 'plugin/.claude-plugin/plugin.json (.version)',
      path: join(repoRoot, 'plugin', '.claude-plugin', 'plugin.json'),
      field: '.version',
      getValue: (obj) => obj.version as string | undefined,
    },
  ];

  return files.map((f) => {
    const { version, found } = readVersion(f.path, f.getValue);
    return { label: f.label, path: f.path, version, found };
  });
}

function checkSync(entries: VersionEntry[]): boolean {
  const validVersions = entries.filter((e) => e.found).map((e) => e.version.replace(/^\^/, ''));
  if (validVersions.length < entries.length) {
    return false; // Some files missing
  }
  const first = validVersions[0];
  return validVersions.every((v) => v === first);
}

/**
 * Create the `deepfield version` command.
 */
export function createVersionCommand(): Command {
  return new Command('version')
    .description('Display and verify version sync across all Deepfield package files')
    .option('--json', 'Output as JSON')
    .action((options: { json?: boolean }) => {
      const repoRoot = getRepoRoot();
      const entries = collectVersions(repoRoot);
      const inSync = checkSync(entries);

      if (options.json) {
        const output = {
          inSync,
          versions: entries.map((e) => ({
            label: e.label,
            version: e.version,
            found: e.found,
          })),
        };
        console.log(JSON.stringify(output, null, 2));
        if (!inSync) process.exit(1);
        return;
      }

      // Human-readable output
      const colWidth = 52;
      const line = '─'.repeat(colWidth + 16);

      console.log('');
      console.log(chalk.bold('Deepfield version sync'));
      console.log(chalk.gray(line));

      for (const entry of entries) {
        const label = entry.label.padEnd(colWidth);
        const versionText = entry.found
          ? chalk.cyan(entry.version)
          : chalk.red(entry.version);
        console.log(`  ${label}  ${versionText}`);
      }

      console.log(chalk.gray(line));

      if (inSync) {
        const ver = entries.find((e) => e.found)?.version ?? 'unknown';
        console.log(`  ${chalk.green('RESULT:')} All versions are in sync ${chalk.green('(' + ver + ')')} ${chalk.green('✓')}`);
        console.log('');
      } else {
        console.log(`  ${chalk.red('RESULT:')} Versions are ${chalk.red('OUT OF SYNC')} ${chalk.red('✗')}`);
        console.log('');
        console.log(chalk.yellow("  Run './scripts/bump-version.sh patch|minor|major' to sync all files."));
        console.log('');
        process.exit(1);
      }
    });
}
