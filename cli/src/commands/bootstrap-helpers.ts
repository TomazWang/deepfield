import { Command } from 'commander';
import { join, dirname } from 'path';
import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';

/**
 * Resolve the path to a plugin script, searching from the CLI package location.
 * In production the CLI and plugin are co-located; during development we walk
 * up from __filename to find plugin/scripts/.
 */
function resolvePluginScript(scriptName: string): string | null {
  // Walk up from the CLI dist/src directory looking for plugin/scripts/<name>
  const candidates: string[] = [];

  // dist → package root → repo root → plugin/scripts
  let dir = dirname(__filename);
  for (let i = 0; i < 5; i++) {
    candidates.push(join(dir, 'plugin', 'scripts', scriptName));
    dir = dirname(dir);
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

/**
 * bootstrap:detect-behavior-domains
 *
 * Shells out to detect-behavior-domains.js and writes the result to stdout
 * as a JSON array of { name, confidence, sourceFile }.
 *
 * Usage:
 *   deepfield bootstrap:detect-behavior-domains --source-dir <path>
 */
export function createDetectBehaviorDomainsCommand(): Command {
  return new Command('bootstrap:detect-behavior-domains')
    .description('Detect behavior domain candidates from reference docs (outputs JSON array)')
    .requiredOption('--source-dir <path>', 'Directory to scan for markdown/text reference docs')
    .action(async (options: { sourceDir: string }) => {
      const scriptPath = resolvePluginScript('detect-behavior-domains.js');

      if (!scriptPath) {
        process.stderr.write(
          'Error: detect-behavior-domains.js not found. ' +
          'Ensure the plugin is installed alongside the CLI.\n'
        );
        process.exit(1);
      }

      // Shell out to the CJS script so we stay in the CLI process model
      try {
        const output = execFileSync(
          process.execPath, // node
          [scriptPath, '--source-dir', options.sourceDir, '--output', 'json'],
          { encoding: 'utf-8', stdio: ['inherit', 'pipe', 'pipe'] }
        );
        process.stdout.write(output);
        process.exit(0);
      } catch (err: unknown) {
        const execErr = err as { stderr?: string; message?: string; status?: number };
        if (execErr.stderr) process.stderr.write(execErr.stderr);
        process.stderr.write(
          `Error: detect-behavior-domains.js exited with code ${execErr.status ?? 1}: ` +
          `${execErr.message ?? ''}\n`
        );
        process.exit(execErr.status ?? 1);
      }
    });
}
