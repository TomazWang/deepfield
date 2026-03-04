#!/usr/bin/env node
import { execSync } from 'child_process';

/**
 * Detects repository type from URL.
 * @param {string} url
 * @returns {'github'|'gitlab'|'azuredevops'|'bitbucket'|'git'}
 */
function detectRepoType(url) {
  if (url.includes('github.com')) return 'github';
  if (url.includes('gitlab.com')) return 'gitlab';
  if (url.includes('dev.azure.com') || url.includes('visualstudio.com')) return 'azuredevops';
  if (url.includes('bitbucket.org')) return 'bitbucket';
  return 'git';
}

/**
 * Returns true if the repo URL is likely to require authentication.
 * @param {string} url
 * @returns {boolean}
 */
function isLikelyPrivate(url) {
  // SSH URLs always require auth
  if (url.startsWith('git@')) return true;

  const type = detectRepoType(url);

  // GitLab and Azure DevOps HTTPS repos are private by default
  if (type === 'gitlab' || type === 'azuredevops') return true;

  // GitHub HTTPS repos are assumed public unless proven otherwise
  return false;
}

/**
 * Checks if git credential helper has credentials for the given URL.
 * @param {string} url
 * @returns {boolean}
 */
function hasGitCredentials(url) {
  try {
    const result = execSync(
      `printf 'url=%s\\n\\n' "${url}" | git credential fill`,
      { encoding: 'utf-8', stdio: 'pipe', timeout: 5000 }
    );
    return result.includes('username=') || result.includes('password=');
  } catch {
    return false;
  }
}

/**
 * Checks if a known environment variable token is set for the repo type.
 * @param {'github'|'gitlab'|'azuredevops'|'bitbucket'|'git'} repoType
 * @returns {boolean}
 */
function hasEnvToken(repoType) {
  const envVars = {
    github: ['GITHUB_TOKEN', 'GH_TOKEN'],
    gitlab: ['GITLAB_TOKEN', 'GL_TOKEN'],
    azuredevops: ['AZURE_DEVOPS_TOKEN', 'ADO_TOKEN'],
    bitbucket: ['BITBUCKET_TOKEN', 'BB_TOKEN'],
    git: []
  };

  const vars = envVars[repoType] || [];
  return vars.some(v => Boolean(process.env[v]));
}

/**
 * Checks combined credential sources for a repository.
 * @param {'github'|'gitlab'|'azuredevops'|'bitbucket'|'git'} repoType
 * @param {string} url
 * @returns {boolean}
 */
function hasCredentials(repoType, url) {
  return hasGitCredentials(url) || hasEnvToken(repoType);
}

/**
 * Tests actual repository access using git ls-remote (no clone required).
 * @param {string} url
 * @returns {boolean}
 */
function testCredentials(url) {
  try {
    execSync(`git ls-remote "${url}" HEAD`, {
      stdio: 'pipe',
      timeout: 15000,
      env: {
        ...process.env,
        // Disable interactive prompts — we want a clean failure, not a hang
        GIT_TERMINAL_PROMPT: '0',
        GIT_ASKPASS: 'echo'
      }
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates access for an array of repositories.
 *
 * @param {{ url: string, name: string }[]} repos
 * @returns {{ url: string, name: string, type: string, isPrivate: boolean, hasCredentials: boolean, canAccess: boolean, needsSetup: boolean }[]}
 */
export function validateRepositoryAccess(repos) {
  // Cache test results to avoid double-testing the same URL
  const accessCache = new Map();

  const results = [];

  for (const repo of repos) {
    const type = detectRepoType(repo.url);
    const isPrivate = isLikelyPrivate(repo.url);
    const hasCreds = hasCredentials(type, repo.url);

    let canAccess;
    if (accessCache.has(repo.url)) {
      canAccess = accessCache.get(repo.url);
    } else {
      canAccess = testCredentials(repo.url);
      accessCache.set(repo.url, canAccess);
    }

    results.push({
      url: repo.url,
      name: repo.name,
      type,
      isPrivate,
      hasCredentials: hasCreds,
      canAccess,
      needsSetup: isPrivate && !canAccess
    });
  }

  return results;
}

// CLI usage: node check-credentials.js '<json-repos-array>'
const isMain = process.argv[1] && (
  process.argv[1] === import.meta.url ||
  process.argv[1].endsWith('check-credentials.js')
);

if (isMain && process.argv[2]) {
  let repos;
  try {
    repos = JSON.parse(process.argv[2]);
  } catch {
    console.error('Error: argument must be a valid JSON array of { url, name } objects');
    process.exit(2);
  }

  const results = validateRepositoryAccess(repos);
  console.log(JSON.stringify(results, null, 2));

  const needsSetup = results.filter(r => r.needsSetup);
  if (needsSetup.length > 0) {
    console.error(`\nWarning: ${needsSetup.length} repository/repositories need credentials setup:`);
    for (const r of needsSetup) {
      console.error(`  - ${r.name} (${r.type}): ${r.url}`);
    }
    process.exit(1);
  }
}
