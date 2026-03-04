## ADDED Requirements

### Requirement: Detect repository type from URL
The system SHALL classify a repository URL into one of: `github`, `gitlab`, `azuredevops`, `bitbucket`, or `git` (self-hosted/unknown).

#### Scenario: GitHub URL detection
- **WHEN** URL contains `github.com`
- **THEN** repo type is `github`

#### Scenario: GitLab URL detection
- **WHEN** URL contains `gitlab.com`
- **THEN** repo type is `gitlab`

#### Scenario: Azure DevOps URL detection
- **WHEN** URL contains `dev.azure.com` or `visualstudio.com`
- **THEN** repo type is `azuredevops`

#### Scenario: Bitbucket URL detection
- **WHEN** URL contains `bitbucket.org`
- **THEN** repo type is `bitbucket`

#### Scenario: Unknown host fallback
- **WHEN** URL matches none of the known hosts
- **THEN** repo type is `git`

### Requirement: Identify likely-private repositories
The system SHALL flag a repository as `isPrivate: true` when it is likely to require authentication.

#### Scenario: SSH URL is private
- **WHEN** URL starts with `git@`
- **THEN** `isPrivate` is `true`

#### Scenario: GitLab HTTPS is private by default
- **WHEN** URL is HTTPS and repo type is `gitlab` or `azuredevops`
- **THEN** `isPrivate` is `true`

#### Scenario: GitHub HTTPS is public by default
- **WHEN** URL is HTTPS and repo type is `github`
- **THEN** `isPrivate` is `false`

### Requirement: Check for existing credentials
The system SHALL detect whether credentials are available for a repository before testing access.

#### Scenario: Git credential helper has credentials
- **WHEN** `git credential fill` returns output containing `username` or `password` for the URL
- **THEN** `hasCredentials` is `true`

#### Scenario: Environment variable token present
- **WHEN** a known env var for the repo type is set (e.g., `GITHUB_TOKEN`, `GITLAB_TOKEN`, `AZURE_DEVOPS_TOKEN`, `BITBUCKET_TOKEN`)
- **THEN** `hasCredentials` is `true`

#### Scenario: No credentials found
- **WHEN** git credential helper returns nothing and no env var is set
- **THEN** `hasCredentials` is `false`

### Requirement: Test repository access
The system SHALL verify actual access by running `git ls-remote` against the repository URL.

#### Scenario: Accessible repository
- **WHEN** `git ls-remote <url>` exits with code 0
- **THEN** `canAccess` is `true`

#### Scenario: Inaccessible repository
- **WHEN** `git ls-remote <url>` exits with non-zero code
- **THEN** `canAccess` is `false`

### Requirement: Return structured validation result per repository
The system SHALL return a result object for each input repository containing all validation fields.

#### Scenario: Result structure
- **WHEN** `validateRepositoryAccess(repos)` is called with an array of `{ url, name }` objects
- **THEN** it returns an array of objects each containing: `url`, `name`, `type`, `isPrivate`, `hasCredentials`, `canAccess`, `needsSetup`

#### Scenario: needsSetup flag
- **WHEN** a repo is private and `canAccess` is `false`
- **THEN** `needsSetup` is `true`

### Requirement: CLI invocation support
The system SHALL be executable as a standalone CLI script accepting a JSON array of repos as argument.

#### Scenario: Successful CLI run
- **WHEN** script is invoked with a JSON repos array and all repos are accessible
- **THEN** results are printed as JSON to stdout and exit code is 0

#### Scenario: Failed CLI run with repos needing setup
- **WHEN** one or more repos have `needsSetup: true`
- **THEN** a warning is printed to stderr and exit code is 1
