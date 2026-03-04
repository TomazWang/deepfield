## Context

The deepfield plugin's bootstrap command accepts repository URLs from `brief.md` and clones them for analysis. Currently, when a repo requires authentication, the failure happens mid-execution inside `git clone`, producing cryptic errors with no recovery path. The fix is a pre-flight validation phase that runs before any cloning occurs.

Two new scripts handle this: `check-credentials.js` (pure validation — no prompts, no side effects) and `prompt-credentials.js` (interactive credential collection). Bootstrap calls check first, then conditionally calls prompt.

## Goals / Non-Goals

**Goals:**
- Detect repository types from URL patterns
- Identify repos likely requiring authentication
- Check for existing credentials across all common sources (git credential helper, SSH agent, env vars, `.netrc`)
- Test actual access via `git ls-remote` (zero cost, no clone)
- Interactively collect credentials when missing, with provider-specific token instructions
- Store collected credentials via git credential helper (OS keychain where available)
- Allow users to skip individual repos rather than blocking bootstrap entirely

**Non-Goals:**
- OAuth flows or browser-based auth
- Managing SSH key generation (instructions only)
- Credential rotation or expiry detection
- Supporting non-git source types (files, URLs, wikis)
- GUI or web UI

## Decisions

**Decision: Two-script split (check vs prompt)**
Rationale: `check-credentials.js` must be callable non-interactively (CI, headless) and should have no side effects. Prompting logic belongs separately. This mirrors the existing pattern in the plugin where scripts are composable units.

**Decision: `git ls-remote` for access testing**
Rationale: The cheapest real access test — no clone overhead, works for any git host, returns immediately on auth failure. Alternative (`git clone --depth 1`) is 10-100x slower and leaves cleanup work.

**Decision: git credential helper for storage**
Rationale: git already has OS-native secure storage (macOS Keychain, Windows Credential Manager, libsecret on Linux) wired through `git credential approve/fill`. Writing credentials here means they work for subsequent `git clone` calls automatically with zero extra config.

**Decision: Treat GitLab and Azure DevOps as private-by-default**
Rationale: Public GitLab/ADO repos are rare in the brownfield codebases deepfield targets. False-positive prompts are less harmful than false-negative silent failures. GitHub HTTPS URLs default to public-assumed since public GitHub repos are common.

**Decision: SSH URLs always treated as private**
Rationale: SSH is only used when someone has already set up a key pair — the question is whether the key is in the agent, not whether the repo is public.

## Risks / Trade-offs

- **git ls-remote hangs on unreachable hosts** → Mitigation: wrap with `--timeout` via `git -c core.sshCommand="ssh -o ConnectTimeout=5"` for SSH; for HTTPS rely on git's default timeout (configurable via `git config http.lowSpeedLimit`)
- **credential helper not configured** → Mitigation: detect before calling `git credential approve` and fall back to showing manual instructions; never fail silently
- **Tokens logged accidentally** → Mitigation: all token inputs use `mask: '*'` in inquirer; scripts never log credential values; `stdio: 'pipe'` prevents credential content reaching terminal logs
- **inquirer version mismatch** → Mitigation: check package.json for existing inquirer version and use compatible API (v8 vs v9 ESM difference)

## Open Questions

- Should `check-credentials.js` accept a timeout flag for `git ls-remote`? (Lean: yes, default 10s)
- Should we cache the validation results within a run to avoid double-testing the same URL? (Lean: yes, simple Map keyed on URL)
