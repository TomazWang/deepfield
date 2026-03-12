import fsExtra from 'fs-extra';
const { pathExists, readJson, ensureDir, copy, writeFile, readFile } = fsExtra;
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { transformSnapshot, generateSidebars, detectStructure } from './transform.js';
import type { BuildOptions, ProjectConfig } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Path to the bundled Docusaurus template inside this package */
const TEMPLATE_DIR = join(__dirname, 'template');

/**
 * Substitute {{PLACEHOLDER}} tokens in a string.
 */
function substitute(content: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{{${k}}}`, v),
    content
  );
}

/**
 * Read a file, substitute placeholders, write it out.
 */
async function copyWithSubstitution(
  src: string,
  dest: string,
  vars: Record<string, string>
): Promise<void> {
  const content = await readFile(src, 'utf-8');
  await ensureDir(dirname(dest));
  await writeFile(dest, substitute(content, vars), 'utf-8');
}

/**
 * Read project config from deepfield/project.config.json relative to CWD,
 * or fall back to empty config.
 */
async function readProjectConfig(snapshotPath: string): Promise<ProjectConfig> {
  // Try workspace root (two levels up from snapshot output dir)
  const candidates = [
    join(snapshotPath, '..', '..', 'project.config.json'),       // output/version/ → deepfield/
    join(snapshotPath, '..', 'project.config.json'),
    join(process.cwd(), 'deepfield', 'project.config.json'),
  ];
  for (const p of candidates) {
    if (await pathExists(p)) {
      return readJson(p);
    }
  }
  return {};
}

/**
 * Slugify a project name.
 */
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Build a Docusaurus site from a deepfield snapshot directory.
 *
 * Flow:
 *  1. Determine output path ({snapshotPath}/docusaurus/ by default)
 *  2. Copy Docusaurus template with placeholder substitution
 *  3. Transform snapshot markdown → docs/ with frontmatter injection
 *  4. Generate sidebars.js adapted to workspace structure
 *  5. Write Giscus config into docusaurus.config.ts if feedback is enabled
 */
export async function buildSite(options: BuildOptions): Promise<void> {
  const snapshotPath = resolve(options.snapshotPath);

  if (!(await pathExists(snapshotPath))) {
    throw new Error(`Snapshot path not found: ${snapshotPath}`);
  }

  const sitePath = resolve(options.outputPath ?? join(snapshotPath, 'docusaurus'));

  // Read project config for placeholders
  const config = await readProjectConfig(snapshotPath);
  const projectName = options.projectName ?? config.projectName ?? 'Knowledge Base';
  const projectSlug = slugify(projectName);
  const snapshotVersion = snapshotPath.split('/').pop() ?? 'latest';
  const snapshotDate = new Date().toISOString().split('T')[0];

  const vars: Record<string, string> = {
    PROJECT_NAME: projectName,
    PROJECT_SLUG: projectSlug,
    SNAPSHOT_VERSION: snapshotVersion,
    SNAPSHOT_DATE: snapshotDate,
    GISCUS_REPO: options.giscusRepo ?? '',
    GISCUS_REPO_ID: options.giscusRepoId ?? '',
    GISCUS_CATEGORY_ID: options.giscusCategoryId ?? '',
    FEEDBACK_ENABLED: options.giscusRepo ? 'true' : 'false',
  };

  // Step 1: Copy template (with substitution for text files)
  const textExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.html']);

  async function copyEntry(src: string, dest: string): Promise<void> {
    const stat = await fsExtra.stat(src);
    if (stat.isDirectory()) {
      const entries = await fsExtra.readdir(src);
      for (const e of entries) {
        await copyEntry(join(src, e), join(dest, e));
      }
    } else {
      const ext = src.match(/\.[^.]+$/)?.[0] ?? '';
      if (textExtensions.has(ext)) {
        await copyWithSubstitution(src, dest, vars);
      } else {
        await ensureDir(dirname(dest));
        await fsExtra.copyFile(src, dest);
      }
    }
  }

  await copyEntry(TEMPLATE_DIR, sitePath);

  // Step 2: Transform snapshot docs into docusaurus/docs/
  const docsPath = join(sitePath, 'docs');
  const result = await transformSnapshot(snapshotPath, docsPath);

  // Step 3: Generate sidebars.js
  const structure = await detectStructure(snapshotPath);
  const sidebarsContent = generateSidebars(structure);
  await writeFile(join(sitePath, 'sidebars.js'), sidebarsContent, 'utf-8');

  // Done — caller (CLI) handles logging
  void result;
}

/**
 * Serve an existing Docusaurus site via `npm start`.
 * Requires npm to be installed and node_modules to exist (run npm install first).
 */
export async function serveSite(sitePath: string, port = 3000): Promise<void> {
  const { spawn } = await import('child_process');

  const absPath = resolve(sitePath);
  if (!(await pathExists(join(absPath, 'package.json')))) {
    throw new Error(`No package.json found at ${absPath}. Is this a Docusaurus site?`);
  }

  const nodeModulesExists = await pathExists(join(absPath, 'node_modules'));
  if (!nodeModulesExists) {
    throw new Error(
      `node_modules not found. Run: cd ${absPath} && npm install`
    );
  }

  spawn('npm', ['start', '--', `--port=${port}`], {
    cwd: absPath,
    stdio: 'inherit',
    shell: true,
  });
}
