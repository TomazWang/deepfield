# Task 003: Input Validation & Credential Management

**Feature:** Validate inputs and check credentials before execution
**Priority:** 🟡 High
**Status:** Not Started
**Estimated Time:** 4-8 hours
**OpenSpec Change:** `feat/credential-validation`

---

## Objective

Add pre-flight validation to detect missing/invalid inputs and prompt for credentials before bootstrap/continue commands execute.

---

## Problem

User adds GitLab/VSTS repos to brief.md without providing credentials, then bootstrap fails mid-execution with auth errors.

**Expected:** Validate upfront and prompt for credentials
**Actual:** Fails during git clone with cryptic errors

---

## What to Implement

### 1. Repository URL Detection

Detect repository types and check if private:
- GitHub (public vs private)
- GitLab
- Azure DevOps / VSTS
- Bitbucket
- Self-hosted Git

### 2. Credential Validation

**Check for existing credentials:**
- Git credential helper
- SSH keys
- Environment variables (GITHUB_TOKEN, GITLAB_TOKEN, etc.)
- `.netrc` file

**Prompt if missing:**
- Ask user for token/credentials
- Offer to set up git credential helper
- Show instructions for obtaining tokens

### 3. Pre-flight Checks

Before bootstrap/continue:
- [ ] Parse brief.md for repo URLs
- [ ] Detect which are private
- [ ] Check if credentials available
- [ ] Prompt for missing credentials
- [ ] Validate credentials work (test clone)
- [ ] Store securely (git credential helper)

---

## Files to Create

### `plugin/scripts/check-credentials.js`

```javascript
#!/usr/bin/env node
import { execSync } from 'child_process';

/**
 * Detects repository type from URL
 */
function detectRepoType(url) {
  if (url.includes('github.com')) return 'github';
  if (url.includes('gitlab.com')) return 'gitlab';
  if (url.includes('dev.azure.com') || url.includes('visualstudio.com')) return 'azuredevops';
  if (url.includes('bitbucket.org')) return 'bitbucket';
  return 'git';
}

/**
 * Check if URL is likely private
 */
function isLikelyPrivate(url) {
  // SSH URLs are usually private
  if (url.startsWith('git@')) return true;

  // HTTPS URLs might be public or private
  // Can't tell without trying, but check common patterns
  if (url.includes('gitlab.com') || url.includes('dev.azure.com')) {
    return true; // Assume private unless proven otherwise
  }

  return false; // Assume public for GitHub unless specified
}

/**
 * Check if credentials exist for repo type
 */
function hasCredentials(repoType, url) {
  try {
    // Check git credential helper
    const result = execSync(
      `echo "url=${url}" | git credential fill`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );

    return result.includes('username') || result.includes('password');
  } catch (error) {
    return false;
  }
}

/**
 * Check environment variables for tokens
 */
function hasEnvToken(repoType) {
  const envVars = {
    github: ['GITHUB_TOKEN', 'GH_TOKEN'],
    gitlab: ['GITLAB_TOKEN', 'GL_TOKEN'],
    azuredevops: ['AZURE_DEVOPS_TOKEN', 'ADO_TOKEN'],
    bitbucket: ['BITBUCKET_TOKEN', 'BB_TOKEN']
  };

  const vars = envVars[repoType] || [];
  return vars.some(v => process.env[v]);
}

/**
 * Test if credentials work (dry-run clone)
 */
function testCredentials(url) {
  try {
    execSync(`git ls-remote ${url}`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Main validation function
 */
export function validateRepositoryAccess(repos) {
  const results = [];

  for (const repo of repos) {
    const type = detectRepoType(repo.url);
    const isPrivate = isLikelyPrivate(repo.url);
    const hasCreds = hasCredentials(type, repo.url) || hasEnvToken(type);
    const canAccess = testCredentials(repo.url);

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

// CLI usage
if (process.argv[1] === import.meta.url) {
  const reposJson = process.argv[2];
  const repos = JSON.parse(reposJson);
  const results = validateRepositoryAccess(repos);

  console.log(JSON.stringify(results, null, 2));

  const needsSetup = results.filter(r => r.needsSetup);
  if (needsSetup.length > 0) {
    console.error(`\\n⚠️  ${needsSetup.length} repositories need credentials setup`);
    process.exit(1);
  }
}
```

### `plugin/scripts/prompt-credentials.js`

```javascript
#!/usr/bin/env node
import inquirer from 'inquirer';
import { execSync } from 'child_process';

/**
 * Prompt user for credentials
 */
async function promptForCredentials(repo) {
  console.log(`\\n🔐 Credentials needed for: ${repo.name}`);
  console.log(`Repository: ${repo.url}`);
  console.log(`Type: ${repo.type}\\n`);

  const { method } = await inquirer.prompt([{
    type: 'list',
    name: 'method',
    message: 'How would you like to authenticate?',
    choices: [
      { name: 'Personal Access Token (recommended)', value: 'token' },
      { name: 'SSH Key', value: 'ssh' },
      { name: 'Username/Password', value: 'basic' },
      { name: 'Skip this repository', value: 'skip' }
    ]
  }]);

  if (method === 'skip') {
    return { skip: true };
  }

  if (method === 'token') {
    return await promptForToken(repo);
  }

  if (method === 'ssh') {
    return await setupSSH(repo);
  }

  if (method === 'basic') {
    return await promptForBasicAuth(repo);
  }
}

async function promptForToken(repo) {
  console.log(`\\n📖 To create a ${repo.type} token:`);

  const instructions = {
    github: 'https://github.com/settings/tokens',
    gitlab: 'https://gitlab.com/-/profile/personal_access_tokens',
    azuredevops: 'https://dev.azure.com/{org}/_usersSettings/tokens',
    bitbucket: 'https://bitbucket.org/account/settings/app-passwords/'
  };

  if (instructions[repo.type]) {
    console.log(`Visit: ${instructions[repo.type]}`);
    console.log(`Required scopes: repo (or read_repository)\\n`);
  }

  const { token } = await inquirer.prompt([{
    type: 'password',
    name: 'token',
    message: 'Enter your personal access token:',
    mask: '*'
  }]);

  // Store in git credential helper
  const domain = new URL(repo.url).hostname;
  execSync(`git credential approve`, {
    input: `protocol=https\\nhost=${domain}\\nusername=token\\npassword=${token}\\n`
  });

  console.log('✅ Token stored in git credential helper');
  return { method: 'token', stored: true };
}

async function setupSSH(repo) {
  console.log('\\n🔑 SSH Setup:');
  console.log('1. Generate SSH key: ssh-keygen -t ed25519 -C "your@email.com"');
  console.log('2. Add to SSH agent: ssh-add ~/.ssh/id_ed25519');
  console.log('3. Add public key to your Git provider');
  console.log('4. Convert URL to SSH format\\n');

  const { proceed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'proceed',
    message: 'Have you set up SSH?',
    default: false
  }]);

  return { method: 'ssh', ready: proceed };
}

async function promptForBasicAuth(repo) {
  const { username, password } = await inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      message: 'Username:'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password:',
      mask: '*'
    }
  ]);

  // Store in git credential helper
  const domain = new URL(repo.url).hostname;
  execSync(`git credential approve`, {
    input: `protocol=https\\nhost=${domain}\\nusername=${username}\\npassword=${password}\\n`
  });

  console.log('✅ Credentials stored in git credential helper');
  return { method: 'basic', stored: true };
}

export { promptForCredentials };
```

---

## Integration Points

### In bootstrap-runner.js

Add validation before cloning:

```javascript
import { validateRepositoryAccess } from './check-credentials.js';
import { promptForCredentials } from './prompt-credentials.js';

async function runBootstrap() {
  // ... parse brief ...

  // Validate repository access
  console.log('\\n🔐 Validating repository access...');
  const validation = validateRepositoryAccess(briefData.repositories);

  const needsSetup = validation.filter(r => r.needsSetup);

  if (needsSetup.length > 0) {
    console.log(`\\n⚠️  ${needsSetup.length} repositories need credentials:\\n`);

    for (const repo of needsSetup) {
      console.log(`- ${repo.name} (${repo.type})`);
    }

    const { setupNow } = await inquirer.prompt([{
      type: 'confirm',
      name: 'setupNow',
      message: 'Set up credentials now?',
      default: true
    }]);

    if (!setupNow) {
      console.log('\\n⚠️  Skipping repositories without credentials');
      console.log('You can set up credentials later and re-run bootstrap\\n');
      // Filter out repos that need setup
      briefData.repositories = briefData.repositories.filter(r =>
        !needsSetup.find(n => n.url === r.url)
      );
    } else {
      // Prompt for each
      for (const repo of needsSetup) {
        await promptForCredentials(repo);
      }

      // Re-validate
      const revalidation = validateRepositoryAccess(briefData.repositories);
      const stillNeedsSetup = revalidation.filter(r => r.needsSetup);

      if (stillNeedsSetup.length > 0) {
        console.log('\\n⚠️  Some repositories still cannot be accessed');
        console.log('Skipping:', stillNeedsSetup.map(r => r.name).join(', '));
      }
    }
  } else {
    console.log('✅ All repositories accessible');
  }

  // Continue with clone...
}
```

---

## Acceptance Criteria

- [ ] Detects repository types (GitHub, GitLab, Azure DevOps, etc.)
- [ ] Identifies likely private repositories
- [ ] Checks for existing credentials (git credential helper, SSH, env vars)
- [ ] Tests access with `git ls-remote`
- [ ] Prompts for credentials if missing
- [ ] Offers multiple auth methods (token, SSH, basic)
- [ ] Shows instructions for obtaining tokens
- [ ] Stores credentials securely in git credential helper
- [ ] Validates credentials work before proceeding
- [ ] Allows skipping repositories without credentials
- [ ] Clear error messages if auth fails

---

## Testing

1. **Public GitHub repo** - Should work without prompting
2. **Private GitHub repo** - Should detect and prompt for token
3. **GitLab repo** - Should detect type and prompt appropriately
4. **Azure DevOps** - Should handle ADO URLs correctly
5. **SSH URL** - Should detect and offer SSH setup
6. **Invalid credentials** - Should detect and re-prompt
7. **No credentials** - Should explain clearly and offer options

---

## Security Notes

- Never store plain text credentials in deepfield/
- Use git credential helper (secure storage)
- Recommend SSH over HTTPS when possible
- Don't log tokens/passwords
- Mask token input
- Respect git's existing credential configuration

---

## Dependencies

- **Depends on:** Task 002 (bootstrap implementation)
- **Enhances:** Bootstrap and future input/iterate commands

---

## References

- Git credential helpers: https://git-scm.com/docs/gitcredentials
- GitHub tokens: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
- GitLab tokens: https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html
