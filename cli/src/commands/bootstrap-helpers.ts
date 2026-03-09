import { Command } from 'commander';
import { pathExists } from 'fs-extra';
import { join } from 'path';
import { readdirSync, readFileSync, statSync } from 'fs';
import chalk from 'chalk';

// ---------------------------------------------------------------------------
// Domain candidate detection
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 512 * 1024; // 512 KB

interface DomainCandidate {
  name: string;
  sourceFile: string;
  confidence: number;
}

/**
 * Scan .md, .txt, and .rst files in sourceDir for behavior domain candidates.
 * Skips hidden directories, node_modules, and files larger than 512 KB.
 *
 * Extraction heuristics (in order of confidence):
 *   1. Headings matching "## Feature: X", "## Epic: X" → high base confidence (0.8)
 *   2. User-story sections (lines starting with "As a ..." near a heading) → medium (0.5)
 *   3. Capability lists (bullet lines under a "## Capabilities" / "## Features" heading) → medium (0.5)
 *   4. Any other H1/H2 not in the generic skip list → low base confidence (0.2)
 *      - Files with 3+ qualifying headings promote their candidates to 0.5
 *      - The first 3 unique candidates across all files are promoted to 0.8
 *
 * Duplicate names are deduplicated (first occurrence wins).
 */
function detectDomainCandidates(sourceDir: string): DomainCandidate[] {
  const SKIP_NAMES = new Set([
    'readme', 'overview', 'introduction', 'table of contents', 'contents',
    'index', 'license', 'changelog', 'contributing', 'faq', 'prerequisites',
    'installation', 'setup', 'getting started', 'usage', 'quickstart',
  ]);

  // Headings that introduce capability/feature list sections
  const CAPABILITY_SECTION_RE = /^#{1,3}\s+(capabilities|features|feature list|epic list|epics)\s*$/i;

  const candidates: Map<string, DomainCandidate> = new Map();

  function addCandidate(name: string, sourceFile: string, confidence: number): void {
    const lower = name.toLowerCase().trim();
    if (!lower || SKIP_NAMES.has(lower)) return;
    if (!candidates.has(lower)) {
      candidates.set(lower, { name: name.trim(), sourceFile, confidence });
    }
  }

  function scanDir(dir: string): void {
    let dirents: ReturnType<typeof readdirSync>;
    try {
      dirents = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const dirent of dirents as import('fs').Dirent[]) {
      // Skip hidden directories and node_modules
      if (dirent.isDirectory()) {
        if (dirent.name.startsWith('.') || dirent.name === 'node_modules') continue;
        scanDir(join(dir, dirent.name));
        continue;
      }

      if (!dirent.isFile()) continue;
      if (!/\.(md|txt|rst)$/i.test(dirent.name)) continue;

      const fullPath = join(dir, dirent.name);

      // Skip files larger than 512 KB
      try {
        const stat = statSync(fullPath);
        if (stat.size > MAX_FILE_SIZE) continue;
      } catch {
        continue;
      }

      let content: string;
      try {
        content = readFileSync(fullPath, 'utf-8');
      } catch {
        continue;
      }

      const lines = content.split('\n');
      let genericMatchCount = 0;
      let inCapabilitySection = false;
      const fileGenericCandidateKeys: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detect Feature/Epic headings: "## Feature: X" or "## Epic: X"
        const featureEpicMatch = line.match(/^#{1,3}\s+(?:Feature|Epic):\s+(.+)/i);
        if (featureEpicMatch) {
          addCandidate(featureEpicMatch[1], fullPath, 0.8);
          inCapabilitySection = false;
          continue;
        }

        // Detect capability/feature list section headings
        if (CAPABILITY_SECTION_RE.test(line)) {
          inCapabilitySection = true;
          continue;
        }

        // Inside a capability section, treat bullet items as domain candidates
        if (inCapabilitySection) {
          const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);
          if (bulletMatch) {
            addCandidate(bulletMatch[1], fullPath, 0.5);
            continue;
          }
          // Any new heading ends the capability section
          if (/^#{1,3}\s/.test(line)) {
            inCapabilitySection = false;
          }
        }

        // Detect user-story lines: "As a <role>, I want ..."
        const userStoryMatch = line.match(/^\s*As an?\s+\w.+,\s+I want\s+(.+)/i);
        if (userStoryMatch) {
          // Use the preceding heading as the domain name if available
          // (look back up to 5 lines for a heading)
          let domainName: string | null = null;
          for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
            const hm = lines[j].match(/^#{1,3}\s+(.+)/);
            if (hm) { domainName = hm[1]; break; }
          }
          if (domainName) addCandidate(domainName, fullPath, 0.5);
          continue;
        }

        // Generic H1/H2 fallback
        const genericMatch = line.match(/^#{1,2}\s+(.+)/);
        if (genericMatch) {
          inCapabilitySection = false;
          const lower = genericMatch[1].trim().toLowerCase();
          if (!SKIP_NAMES.has(lower)) {
            genericMatchCount++;
            const beforeSize = candidates.size;
            addCandidate(genericMatch[1], fullPath, 0.2);
            if (candidates.size > beforeSize) {
              fileGenericCandidateKeys.push(lower);
            }
          }
        }
      }

      // Files with many generic headings suggest a real domain catalog — promote to 0.5
      if (genericMatchCount >= 3) {
        for (const key of fileGenericCandidateKeys) {
          const cand = candidates.get(key);
          if (cand && cand.confidence === 0.2) cand.confidence = 0.5;
        }
      }
    }
  }

  scanDir(sourceDir);

  // Promote up to 3 candidates to high confidence, but only if they already
  // have meaningful signal (>= 0.4). Generic H1/H2 fallbacks (base 0.2) are
  // not promoted — promoting them would misrepresent low-quality detections
  // as high-confidence to the user (the skill labels >= 0.7 as "high").
  let promoted = 0;
  for (const [, cand] of candidates) {
    if (promoted >= 3) break;
    if (cand.confidence >= 0.4 && cand.confidence < 0.8) {
      cand.confidence = 0.8;
      promoted++;
    }
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
