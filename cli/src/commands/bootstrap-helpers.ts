import { Command } from 'commander';
import { pathExists } from 'fs-extra';
import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';
import chalk from 'chalk';

// ---------------------------------------------------------------------------
// Domain candidate detection
// ---------------------------------------------------------------------------

interface DomainCandidate {
  name: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Scan markdown/text files in sourceDir for top-level headings that look like
 * product behavior domains. Returns an array of DomainCandidate objects.
 *
 * Heuristic:
 *   - Every H1 or H2 in .md/.txt files is a candidate unless it matches a
 *     list of generic titles (README, Overview, Introduction, etc.).
 *   - Files with 3+ matching headings promote those headings to medium confidence.
 *   - The first 3 unique candidates are promoted to high confidence.
 *   - Duplicate names are deduplicated (first occurrence wins).
 */
function detectDomainCandidates(sourceDir: string): DomainCandidate[] {
  const SKIP_NAMES = new Set([
    'readme', 'overview', 'introduction', 'table of contents', 'contents',
    'index', 'license', 'changelog', 'contributing', 'faq', 'prerequisites',
    'installation', 'setup', 'getting started', 'usage', 'quickstart',
  ]);

  const candidates: Map<string, DomainCandidate> = new Map();

  function scanDir(dir: string): void {
    let dirents: ReturnType<typeof readdirSync>;
    try {
      dirents = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const dirent of dirents as import('fs').Dirent[]) {
      const fullPath = join(dir, dirent.name);
      if (dirent.isDirectory()) {
        scanDir(fullPath);
      } else if (dirent.isFile() && /\.(md|txt)$/i.test(dirent.name)) {
        let content: string;
        try {
          content = readFileSync(fullPath, 'utf-8');
        } catch {
          continue;
        }
        const lines = content.split('\n');
        let matchCount = 0;
        for (const line of lines) {
          const m = line.match(/^#{1,2}\s+(.+)/);
          if (!m) continue;
          const title = m[1].trim();
          const lower = title.toLowerCase();
          if (SKIP_NAMES.has(lower)) continue;
          matchCount++;
          if (!candidates.has(lower)) {
            candidates.set(lower, {
              name: title,
              description: `Detected from ${dirent.name}`,
              confidence: 'low',
            });
          }
        }
        // Files with many headings suggest a real domain catalog
        if (matchCount >= 3) {
          for (const [, cand] of candidates) {
            if (cand.description.includes(dirent.name) && cand.confidence === 'low') {
              cand.confidence = 'medium';
            }
          }
        }
      }
    }
  }

  scanDir(sourceDir);

  // Promote first 3 candidates to high confidence
  let promoted = 0;
  for (const [, cand] of candidates) {
    if (promoted >= 3) break;
    cand.confidence = 'high';
    promoted++;
  }

  return Array.from(candidates.values());
}

// ---------------------------------------------------------------------------
// bootstrap:detect-behavior-domains command
// ---------------------------------------------------------------------------

/**
 * bootstrap:detect-behavior-domains — scan baseline source docs for behavior
 * domain candidates and output a JSON array to stdout.
 *
 * Invoked by the deepfield-bootstrap skill (Step 3b). Detection logic lives
 * in the CLI layer per the one-way dependency rule: the plugin MUST NOT shell
 * out to plugin/scripts for deterministic file operations.
 */
export function createDetectBehaviorDomainsCommand(): Command {
  return new Command('bootstrap:detect-behavior-domains')
    .description(
      'Scan baseline source directory for behavior domain candidates (outputs JSON array)'
    )
    .option(
      '--source-dir <path>',
      'Path to the baseline source directory',
      'deepfield/source/baseline/'
    )
    .action(async (options: { sourceDir: string }) => {
      try {
        const sourceDir = join(process.cwd(), options.sourceDir);
        if (!(await pathExists(sourceDir))) {
          process.stderr.write(
            chalk.red('❌ detect-behavior-domains: source directory not found: ') +
              sourceDir +
              '\n'
          );
          process.exit(1);
        }

        const candidates = detectDomainCandidates(sourceDir);
        process.stdout.write(JSON.stringify(candidates) + '\n');
        process.exit(0);
      } catch (error) {
        process.stderr.write(
          chalk.red('❌ detect-behavior-domains failed: ') +
            (error instanceof Error ? error.message : String(error)) +
            '\n'
        );
        process.exit(1);
      }
    });
}
