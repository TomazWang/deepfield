## Why

When users add GitLab, Azure DevOps, or private GitHub repositories to `brief.md`, the bootstrap command fails mid-execution with cryptic auth errors during `git clone`. Pre-flight validation is needed to detect missing credentials upfront and prompt the user before any cloning begins.

## What Changes

- Add `plugin/scripts/check-credentials.js` — detects repo types, checks for existing credentials (git credential helper, SSH keys, env vars), tests access with `git ls-remote`
- Add `plugin/scripts/prompt-credentials.js` — interactive credential prompting with support for PAT, SSH, and basic auth methods
- Integrate validation into bootstrap pre-flight sequence so auth issues surface before cloning starts

## Capabilities

### New Capabilities
- `credential-check`: Detect repository type (GitHub, GitLab, Azure DevOps, Bitbucket, self-hosted), identify likely-private repos, check existing credentials, test access, and report which repos need setup
- `credential-prompt`: Interactive CLI prompts to collect credentials (PAT, SSH, basic auth), show provider-specific token instructions, and store credentials securely via git credential helper

### Modified Capabilities

(none — bootstrap integration is an implementation detail, not a spec-level requirement change)

## Impact

- New files: `plugin/scripts/check-credentials.js`, `plugin/scripts/prompt-credentials.js`
- Bootstrap execution flow gains a pre-flight validation phase
- No breaking changes to existing commands or plugin structure
- New runtime dependency: `inquirer` (already used elsewhere in the plugin)
