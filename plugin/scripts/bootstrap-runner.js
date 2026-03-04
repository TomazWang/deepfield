#!/usr/bin/env node
/**
 * bootstrap-runner.js - Main orchestrator for Deepfield Run 0 (Bootstrap)
 *
 * Usage: node bootstrap-runner.js [--brief-path <path>] [--skip-clone] [--skip-hashing]
 *
 * Workflow:
 *   1. Parse brief.md
 *   2. Clone repositories
 *   3. Scan repository structure
 *   4. Generate project-map.md
 *   5. Generate domain-index.md
 *   6. Generate learning-plan.md
 *   7. Create run-0.config.json with file hashes
 *   8. Create run-1 staging area
 *   9. Update project.config.json
 *  10. Print completion summary
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load sibling scripts
const { parseBrief } = require('./parse-brief.js');
const { scanAllRepos } = require('./scan-structure.js');
const { generateProjectMap } = require('./generate-project-map.js');
const { generateLearningPlan } = require('./generate-learning-plan.js');
const { createRunState } = require('./create-run-state.js');

// generate-domain-index.js is CLI-only (merged from main via PR #23)
// It is invoked via execSync rather than require().

const SCRIPT_DIR = __dirname;
const CLONE_SCRIPT = path.join(SCRIPT_DIR, 'clone-repos.sh');
const UPDATE_JSON_SCRIPT = path.join(SCRIPT_DIR, 'update-json.js');

// Parse CLI options
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    briefPath: './deepfield/source/baseline/brief.md',
    skipClone: false,
    skipHashing: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--brief-path' && args[i + 1]) opts.briefPath = args[++i];
    else if (args[i] === '--skip-clone') opts.skipClone = true;
    else if (args[i] === '--skip-hashing') opts.skipHashing = true;
    else if (args[i] === '--help' || args[i] === '-h') {
      console.log('Usage: bootstrap-runner.js [--brief-path <path>] [--skip-clone] [--skip-hashing]');
      process.exit(0);
    }
  }

  return opts;
}

/**
 * Check prerequisites before running bootstrap.
 */
function checkPrerequisites(opts) {
  const briefPath = path.resolve(opts.briefPath);

  // 1. brief.md must exist
  if (!fs.existsSync(briefPath)) {
    console.error(`\nError: Brief not found at ${briefPath}`);
    console.error('\nPlease run /df-start to generate the brief template, then fill it out');
    console.error('with your project information before running bootstrap.\n');
    process.exit(1);
  }

  // 2. deepfield/ directory must exist
  if (!fs.existsSync('./deepfield')) {
    console.error('\nError: deepfield/ directory not found.');
    console.error('Please run /df-init first to create the project structure.\n');
    process.exit(1);
  }

  // 3. Don't re-run if already completed
  const run0Config = './deepfield/wip/run-0/run-0.config.json';
  if (fs.existsSync(run0Config)) {
    try {
      const existing = JSON.parse(fs.readFileSync(run0Config, 'utf-8'));
      if (existing.status === 'completed') {
        console.error('\nError: Bootstrap (Run 0) has already been completed.');
        console.error(`Completed at: ${existing.completedAt}`);
        console.error('\nTo re-run bootstrap, delete deepfield/wip/run-0/ first.');
        console.error('Or run /df-continue to start Run 1.\n');
        process.exit(1);
      }
    } catch {
      // Malformed config — allow re-run
    }
  }
}

/**
 * Clone repositories listed in the brief.
 */
function cloneRepositories(repositories) {
  if (repositories.length === 0) {
    console.log('  No repositories to clone (none found in brief.md)');
    return { cloned: 0, skipped: 0, failed: 0 };
  }

  const stats = { cloned: 0, skipped: 0, failed: 0 };
  const reposBaseDir = './deepfield/source/baseline/repos';
  fs.mkdirSync(path.resolve(reposBaseDir), { recursive: true });

  for (const repo of repositories) {
    const destDir = path.join(reposBaseDir, repo.name);
    console.log(`  Cloning ${repo.name} from ${repo.url} (branch: ${repo.branch})...`);

    if (fs.existsSync(path.resolve(destDir))) {
      console.log(`  Skipping ${repo.name} — already exists`);
      stats.skipped++;
      continue;
    }

    try {
      execSync(`bash "${CLONE_SCRIPT}" "${repo.url}" "${destDir}" "${repo.branch}"`, {
        stdio: 'inherit',
        timeout: 300000, // 5 minutes per repo
      });
      stats.cloned++;
    } catch (error) {
      console.error(`  Warning: Failed to clone ${repo.name}: ${error.message}`);
      stats.failed++;
    }
  }

  return stats;
}

/**
 * Create the run-1 staging area for user to prepare next run inputs.
 */
function createStagingArea(learningPlanPath) {
  const stagingDir = path.resolve('./deepfield/source/run-1-staging');
  const sourcesDir = path.join(stagingDir, 'sources');

  fs.mkdirSync(sourcesDir, { recursive: true });

  // README
  const readme = `# Run 1 Staging Area

Add new sources and feedback here before running \`/df-continue\`.

## How to use

- Drop source files into the \`sources/\` subdirectory
- Edit \`feedback.md\` to answer open questions or provide guidance
- Run \`/df-continue\` when ready to start Run 1

## What to add

- Architecture diagrams or design documents
- API specs (OpenAPI, GraphQL schemas)
- Meeting notes with domain knowledge
- Database schemas or ERDs
- Links to wikis or confluence pages
`;

  const readmePath = path.join(stagingDir, 'README.md');
  const readmeTmp = readmePath + '.tmp';
  fs.writeFileSync(readmeTmp, readme, 'utf-8');
  fs.renameSync(readmeTmp, readmePath);

  // Feedback template — pull open questions from learning plan if available
  let feedbackQuestions = '1. What is the primary purpose of this system?\n2. What are the main entry points?\n3. How do the major components interact?\n';
  if (fs.existsSync(learningPlanPath)) {
    try {
      const planContent = fs.readFileSync(learningPlanPath, 'utf-8');
      const questionMatches = planContent.match(/^\s+-\s+(.+\?)\s*$/gm) || [];
      if (questionMatches.length > 0) {
        feedbackQuestions = questionMatches
          .slice(0, 10)
          .map((q, i) => `${i + 1}. ${q.replace(/^\s+-\s+/, '').trim()}`)
          .join('\n');
      }
    } catch {
      // Use defaults
    }
  }

  const feedback = `# Feedback for Run 1

Answer these open questions to guide the next learning run.
You can also provide free-form guidance, corrections, or additional context.

## Open Questions

${feedbackQuestions}

## Additional Guidance

<!-- Add any other context, corrections, or focus areas here -->

`;

  const feedbackPath = path.join(stagingDir, 'feedback.md');
  const feedbackTmp = feedbackPath + '.tmp';
  fs.writeFileSync(feedbackTmp, feedback, 'utf-8');
  fs.renameSync(feedbackTmp, feedbackPath);

  return stagingDir;
}

/**
 * Update project.config.json after successful bootstrap.
 */
function updateProjectConfig(brief) {
  const configPath = './deepfield/project.config.json';

  const updates = {
    bootstrapCompleted: true,
    currentRun: 0,
    totalRuns: 1,
    projectName: brief.projectName,
    lastModified: new Date().toISOString(),
  };

  try {
    execSync(`node "${UPDATE_JSON_SCRIPT}" "${configPath}" '${JSON.stringify(updates)}'`, {
      stdio: 'pipe',
    });
  } catch (error) {
    console.error(`  Warning: Could not update project.config.json: ${error.message}`);
  }
}

/**
 * Print formatted completion summary.
 */
function printSummary(brief, repos, domains, cloneStats, artifacts) {
  const SEP = '━'.repeat(50);

  console.log(`\n${SEP}`);
  console.log(`Bootstrap Complete (Run 0)`);
  console.log(SEP);

  console.log(`\nProject Analysis:`);
  console.log(`  - Project: ${brief.projectName}`);
  console.log(`  - Repositories:`);
  console.log(`      Cloned: ${cloneStats.cloned}`);
  if (cloneStats.skipped > 0) console.log(`      Skipped (existing): ${cloneStats.skipped}`);
  if (cloneStats.failed > 0) console.log(`      Failed: ${cloneStats.failed}`);
  console.log(`  - Domains detected: ${domains.length}`);
  console.log(`  - Focus areas: ${brief.focusAreas.length}`);

  console.log(`\nArtifacts Created:`);
  artifacts.forEach(a => console.log(`  - ${a}`));

  console.log(`\nNext Steps:`);
  console.log(`  Run /df-continue to start autonomous learning (Run 1)`);
  console.log(`  Or add more sources to deepfield/source/run-1-staging/ first`);

  console.log(`\n${SEP}\n`);
}

/**
 * Main bootstrap workflow.
 */
async function runBootstrap() {
  const opts = parseArgs();
  const startedAt = new Date().toISOString();

  console.log('\nStarting Bootstrap (Run 0)...\n');

  // Prerequisites check
  checkPrerequisites(opts);

  // Step 1: Parse brief
  console.log('Step 1/9: Reading brief.md...');
  let brief;
  try {
    brief = parseBrief(opts.briefPath);
  } catch (error) {
    console.error(`\nError: ${error.message}\n`);
    process.exit(1);
  }
  console.log(`  Project: ${brief.projectName}`);
  console.log(`  Repositories: ${brief.repositories.length}`);
  console.log(`  Focus areas: ${brief.focusAreas.length}`);

  // Step 2: Clone repositories
  console.log('\nStep 2/9: Cloning repositories...');
  let cloneStats = { cloned: 0, skipped: 0, failed: 0 };
  if (!opts.skipClone) {
    cloneStats = cloneRepositories(brief.repositories);
  } else {
    console.log('  Skipping clone (--skip-clone flag set)');
  }

  // Step 3: Scan structure
  console.log('\nStep 3/9: Scanning repository structure...');
  const repos = scanAllRepos('./deepfield/source/baseline/repos');
  console.log(`  Scanned ${repos.length} repositories`);

  // Step 4: Generate project-map.md
  console.log('\nStep 4/9: Generating project-map.md...');
  const projectMapPath = generateProjectMap(brief, repos);
  console.log(`  Written: ${projectMapPath}`);

  // Step 5: Generate domain-index.md (via CLI — generate-domain-index.js has no module.exports)
  console.log('\nStep 5/9: Generating domain-index.md...');
  const domainIndexPath = path.resolve('./deepfield/wip/domain-index.md');
  fs.mkdirSync(path.dirname(domainIndexPath), { recursive: true });

  // Write brief JSON for the CLI to consume
  const briefJsonPath = path.resolve('./deepfield/wip/run-0/.brief-tmp.json');
  fs.mkdirSync(path.dirname(briefJsonPath), { recursive: true });
  fs.writeFileSync(briefJsonPath, JSON.stringify({ focusAreas: brief.focusAreas }), 'utf-8');

  // Build repos arg: array of { name, path } objects pointing to cloned repos
  const reposBaseDir = path.resolve('./deepfield/source/baseline/repos');
  const reposArg = repos.map(r => ({ name: r.name, path: path.join(reposBaseDir, r.name) }));

  const generateDomainIndexScript = path.join(SCRIPT_DIR, 'generate-domain-index.js');
  execSync(
    `node "${generateDomainIndexScript}" --repos '${JSON.stringify(reposArg)}' --brief "${briefJsonPath}" --output "${domainIndexPath}"`,
    { stdio: 'inherit' }
  );

  // Clean up temp file
  try { fs.unlinkSync(briefJsonPath); } catch { /* ignore */ }

  console.log(`  Written: ${domainIndexPath}`);

  // Step 6: Generate learning-plan.md
  console.log('\nStep 6/9: Generating learning-plan.md...');
  const learningPlanPath = generateLearningPlan(brief, repos);
  console.log(`  Written: ${learningPlanPath}`);

  // Step 7: Create run-0 state
  console.log('\nStep 7/9: Creating run-0 state and computing file hashes...');
  const runStateResult = createRunState({
    reposDir: './deepfield/source/baseline/repos',
    runDir: './deepfield/wip/run-0',
    startedAt,
    skipHashing: opts.skipHashing,
  });
  console.log(`  Written: ${runStateResult.configPath}`);
  console.log(`  Written: ${runStateResult.findingsPath}`);
  console.log(`  Files hashed: ${runStateResult.fileCount}`);

  // Step 8: Create staging area
  console.log('\nStep 8/9: Creating run-1 staging area...');
  const stagingDir = createStagingArea(learningPlanPath);
  console.log(`  Created: ${stagingDir}`);

  // Step 9: Update project config
  console.log('\nStep 9/9: Updating project configuration...');
  updateProjectConfig(brief);
  console.log('  Updated: deepfield/project.config.json');

  // Summary — count domains detected (repos + brief focus areas as rough estimate)
  const detectedDomainCount = brief.focusAreas.length + repos.reduce((acc, r) => acc + (r.modules ? r.modules.length : 0), 0);
  const artifacts = [
    projectMapPath,
    domainIndexPath,
    learningPlanPath,
    runStateResult.configPath,
    runStateResult.findingsPath,
    path.join(stagingDir, 'README.md'),
    path.join(stagingDir, 'feedback.md'),
  ];

  printSummary(brief, repos, { length: detectedDomainCount }, cloneStats, artifacts);
}

// Run
runBootstrap().catch(error => {
  console.error(`\nBootstrap failed: ${error.message}`);
  if (process.env.DEBUG) console.error(error.stack);
  process.exit(1);
});
