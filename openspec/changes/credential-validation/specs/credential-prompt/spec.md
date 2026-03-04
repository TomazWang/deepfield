## ADDED Requirements

### Requirement: Prompt user to choose an authentication method
The system SHALL present an interactive menu allowing the user to choose between Personal Access Token, SSH, Username/Password, or skipping the repository.

#### Scenario: User selects token method
- **WHEN** user chooses "Personal Access Token" from the auth method menu
- **THEN** system proceeds to token collection flow

#### Scenario: User selects SSH method
- **WHEN** user chooses "SSH Key" from the auth method menu
- **THEN** system displays SSH setup instructions

#### Scenario: User selects basic auth method
- **WHEN** user chooses "Username/Password" from the auth method menu
- **THEN** system proceeds to username/password collection flow

#### Scenario: User skips repository
- **WHEN** user chooses "Skip this repository"
- **THEN** function returns `{ skip: true }` and no credentials are stored

### Requirement: Display provider-specific token instructions
The system SHALL show the token creation URL for the repository's provider before prompting for a token value.

#### Scenario: GitHub token instructions
- **WHEN** repo type is `github` and user selects token method
- **THEN** system displays `https://github.com/settings/tokens`

#### Scenario: GitLab token instructions
- **WHEN** repo type is `gitlab` and user selects token method
- **THEN** system displays `https://gitlab.com/-/profile/personal_access_tokens`

#### Scenario: Azure DevOps token instructions
- **WHEN** repo type is `azuredevops` and user selects token method
- **THEN** system displays `https://dev.azure.com/{org}/_usersSettings/tokens`

#### Scenario: Bitbucket token instructions
- **WHEN** repo type is `bitbucket` and user selects token method
- **THEN** system displays `https://bitbucket.org/account/settings/app-passwords/`

### Requirement: Collect token securely and store via git credential helper
The system SHALL prompt for a token with masked input and store it using `git credential approve`.

#### Scenario: Token input is masked
- **WHEN** token prompt is displayed
- **THEN** input characters are replaced with `*`

#### Scenario: Token stored in credential helper
- **WHEN** user submits a token
- **THEN** system calls `git credential approve` with `protocol`, `host`, `username=token`, and `password=<token>`
- **AND** returns `{ method: 'token', stored: true }`

### Requirement: Collect basic auth credentials and store via git credential helper
The system SHALL prompt for username and password (masked) and store via `git credential approve`.

#### Scenario: Basic auth stored
- **WHEN** user submits username and password
- **THEN** system calls `git credential approve` with the provided username and password
- **AND** returns `{ method: 'basic', stored: true }`

### Requirement: Display SSH setup instructions
The system SHALL display step-by-step SSH setup instructions and confirm readiness with the user.

#### Scenario: SSH instructions shown
- **WHEN** user selects SSH method
- **THEN** system displays commands for key generation, SSH agent setup, and public key registration

#### Scenario: User confirms SSH ready
- **WHEN** user answers yes to "Have you set up SSH?"
- **THEN** function returns `{ method: 'ssh', ready: true }`

#### Scenario: User confirms SSH not ready
- **WHEN** user answers no to "Have you set up SSH?"
- **THEN** function returns `{ method: 'ssh', ready: false }`

### Requirement: Never log credential values
The system SHALL ensure token and password values are never written to stdout, stderr, or any log output.

#### Scenario: Token not logged
- **WHEN** any credential collection function runs
- **THEN** the raw token or password value does not appear in any console output
