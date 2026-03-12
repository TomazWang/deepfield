import { Command } from 'commander';
import { join, resolve } from 'path';
import chalk from 'chalk';
import fsExtra from 'fs-extra';
const { pathExists, readdir } = fsExtra;

/**
 * Resolve the snapshot path from user input.
 * Accepts:
 *   - Explicit path (absolute or relative)
 *   - "latest" → most recently modified version in deepfield/output/
 *   - omitted → same as "latest"
 */
async function resolveSnapshotPath(input: string | undefined): Promise<string> {
  if (input && input !== 'latest') {
    const p = resolve(input);
    if (!(await pathExists(p))) {
      throw new Error(`Snapshot path not found: ${p}`);
    }
    return p;
  }

  // Auto-detect latest snapshot
  const outputDir = join(process.cwd(), 'deepfield', 'output');
  if (!(await pathExists(outputDir))) {
    throw new Error(
      'No deepfield/output/ directory found. Run /df-output first to create a snapshot.'
    );
  }

  const entries = await readdir(outputDir, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory() && e.name !== 'INDEX.md')
    .map((e) => e.name);

  if (dirs.length === 0) {
    throw new Error('No snapshots found in deepfield/output/. Run /df-output first.');
  }

  // Sort by name descending (run-N naming → last is latest)
  dirs.sort().reverse();
  return join(outputDir, dirs[0]);
}

export function createDocsCommand(): Command {
  const docs = new Command('docs')
    .description('Build and serve Docusaurus documentation site from a knowledge base snapshot');

  // deepfield docs build [snapshot-path] [options]
  docs
    .command('build [snapshot-path]')
    .description(
      'Build a Docusaurus site from a deepfield snapshot (default: latest snapshot)'
    )
    .option('-o, --output <path>', 'Output path for the Docusaurus site')
    .option('--giscus-repo <owner/repo>', 'GitHub repo for Giscus feedback (e.g. owner/repo)')
    .option('--giscus-repo-id <id>', 'Giscus repo ID (from giscus.app)')
    .option('--giscus-category-id <id>', 'Giscus discussion category ID')
    .action(async (snapshotArg: string | undefined, options) => {
      try {
        const snapshotPath = await resolveSnapshotPath(snapshotArg);
        const sitePath = options.output
          ? resolve(options.output)
          : join(snapshotPath, 'docusaurus');

        console.log('');
        console.log(chalk.bold('Building Docusaurus site...'));
        console.log(`  Snapshot : ${chalk.cyan(snapshotPath)}`);
        console.log(`  Site     : ${chalk.cyan(sitePath)}`);
        if (options.giscusRepo) {
          console.log(`  Feedback : ${chalk.cyan(options.giscusRepo)} (Giscus)`);
        }
        console.log('');

        // Dynamically import doc-site builder to avoid hard dependency at startup
        let buildSite: (opts: import('deepfield-doc-site').BuildOptions) => Promise<void>;
        try {
          const mod = await import('deepfield-doc-site');
          buildSite = mod.buildSite;
        } catch {
          throw new Error(
            'deepfield-doc-site package not found.\n' +
            'If running from source: cd doc-site && npm install && npm run build'
          );
        }

        await buildSite({
          snapshotPath,
          outputPath: sitePath,
          giscusRepo: options.giscusRepo,
          giscusRepoId: options.giscusRepoId,
          giscusCategoryId: options.giscusCategoryId,
        });

        console.log(chalk.green('✓ Docusaurus site generated'));
        console.log('');
        console.log('  To preview:');
        console.log(chalk.cyan(`    cd ${sitePath}`));
        console.log(chalk.cyan(`    npm install && npm start`));
        console.log('');
        process.exit(0);
      } catch (err) {
        console.error(chalk.red('❌'), err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  // deepfield docs serve [snapshot-path] [options]
  docs
    .command('serve [snapshot-path]')
    .description('Serve the Docusaurus site for a snapshot locally')
    .option('-p, --port <number>', 'Port to serve on', '3000')
    .action(async (snapshotArg: string | undefined, options) => {
      try {
        const snapshotPath = await resolveSnapshotPath(snapshotArg);
        const sitePath = join(snapshotPath, 'docusaurus');

        if (!(await pathExists(join(sitePath, 'package.json')))) {
          console.error(chalk.red('❌ No Docusaurus site found at:'), sitePath);
          console.error(chalk.yellow('   Run first:'), chalk.cyan('deepfield docs build'));
          process.exit(1);
        }

        const nodeModulesExist = await pathExists(join(sitePath, 'node_modules'));
        if (!nodeModulesExist) {
          console.error(chalk.red('❌ Dependencies not installed.'));
          console.error(chalk.yellow('   Run:'), chalk.cyan(`cd ${sitePath} && npm install`));
          process.exit(1);
        }

        console.log('');
        console.log(chalk.bold(`Starting Docusaurus on port ${options.port}...`));
        console.log(`  Site: ${chalk.cyan(sitePath)}`);
        console.log('');

        let serveSite: (path: string, port: number) => Promise<void>;
        try {
          const mod = await import('deepfield-doc-site');
          serveSite = mod.serveSite;
        } catch {
          throw new Error('deepfield-doc-site package not found.');
        }

        await serveSite(sitePath, parseInt(options.port, 10));
      } catch (err) {
        console.error(chalk.red('❌'), err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  return docs;
}
