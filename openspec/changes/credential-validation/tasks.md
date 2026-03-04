## 1. check-credentials.js

- [x] 1.1 Create `plugin/scripts/check-credentials.js` with ESM shebang and imports
- [x] 1.2 Implement `detectRepoType(url)` — classify GitHub, GitLab, Azure DevOps, Bitbucket, self-hosted
- [x] 1.3 Implement `isLikelyPrivate(url)` — SSH always private; GitLab/ADO HTTPS private by default; GitHub HTTPS public by default
- [x] 1.4 Implement `hasCredentials(repoType, url)` — check git credential helper via `git credential fill`
- [x] 1.5 Implement `hasEnvToken(repoType)` — check known env vars per provider
- [x] 1.6 Implement `testCredentials(url)` — run `git ls-remote <url>` with stdio piped, return boolean
- [x] 1.7 Implement `validateRepositoryAccess(repos)` — iterate repos, compose result objects with all validation fields including `needsSetup`
- [x] 1.8 Add CLI entry point: parse `process.argv[2]` as JSON repos array, print results, exit 1 if any `needsSetup`

## 2. prompt-credentials.js

- [x] 2.1 Create `plugin/scripts/prompt-credentials.js` with ESM shebang and imports (inquirer, child_process)
- [x] 2.2 Implement `promptForCredentials(repo)` — display repo info header, show auth method menu (token, SSH, basic, skip)
- [x] 2.3 Implement `promptForToken(repo)` — show provider token URL, prompt with masked input, call `git credential approve`, return `{ method: 'token', stored: true }`
- [x] 2.4 Implement `setupSSH(repo)` — print step-by-step SSH instructions, confirm readiness, return `{ method: 'ssh', ready: boolean }`
- [x] 2.5 Implement `promptForBasicAuth(repo)` — prompt username (plain) and password (masked), call `git credential approve`, return `{ method: 'basic', stored: true }`
- [x] 2.6 Export `promptForCredentials` as named export

## 3. Validation

- [x] 3.1 Verify `check-credentials.js` runs standalone: `node plugin/scripts/check-credentials.js '[{"url":"https://github.com/octocat/Hello-World","name":"test"}]'`
- [x] 3.2 Verify all repo type detections return correct type strings
- [x] 3.3 Verify `needsSetup` is true for SSH URLs when access fails
- [x] 3.4 Verify exit code 1 when repos need setup, exit code 0 when all accessible
