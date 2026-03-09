# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [0.7.0] - 2026-03-09

### Added

- **Dual-track domain analysis** (#86, #87, #88, #89) — splits the single domain model into two independent tracks:
  - **Behavior domains** (product view): what stakeholders care about → `wip/behavior-index.md`
  - **Tech domains** (implementation view): how engineers build it → `wip/tech-index.md`
  - **Domain links**: many-to-many behavior↔tech mapping → `wip/domain-links.md`
- New `deepfield-domain-linker` agent: infers and maintains behavior↔tech mapping; preserves user-confirmed entries
- New `detect-behavior-domains.js` CLI script: extracts behavior domain candidates from reference docs (read-only, returns JSON)
- New `bootstrap:detect-behavior-domains` CLI subcommand
- Interactive Q&A during bootstrap (Run 0) to elicit stakeholder-facing domain names; skippable with `--skip-behavior-qa`
- `--track behavior|tech|both` flag for `/df-iterate`; defaults to `both`
- Track-scoped output routing: `drafts/behavior/{name}/` and `drafts/tech/{name}/`
- Multiple spec files per domain supported (e.g. `user-stories.md`, `api-spec.md`); default is `spec.md`
- New templates: `behavior-index.md`, `tech-index.md`, `domain-links.md`
- Upgrade migration for workspaces < 0.7.0:
  - Moves `drafts/domains/{name}/behavior-spec.md` → `drafts/behavior/{name}/spec.md`
  - Moves `drafts/domains/{name}/tech-spec.md` → `drafts/tech/{name}/spec.md`
  - AI-splits flat `spec.md` files into behavior + tech (original preserved as `.bak`)
  - Renames `wip/domain-index.md` → `wip/tech-index.md`; scaffolds new wip files
  - Migrates `project.config.json`: `domains` → `techDomains`, adds `behaviorDomains` and `domainLinks`
- Plugin install instructions in README; Claude Code 2.1.69+ requirement documented (#83)

### Changed

- `deepfield-bootstrap.md`: domain detection step replaced with dual-track detection; domain-linker agent invoked after both indexes exist
- `deepfield-iterate.md`: domain queue scoped by `--track`; output paths routed to `drafts/behavior/` or `drafts/tech/`
- `deepfield-domain-learner.md`: receives `track` parameter; behavior track focuses on user-facing concerns, tech track on implementation
- `deepfield-document-generator.md`: output path changed from `drafts/domains/{name}/` to `drafts/{track}/{name}/`
- `bootstrap-runner.js`: writes `wip/tech-index.md` (not `wip/domain-index.md`); detects behavior domain candidates
- `scaffold.ts` / `scaffold-kb.sh`: init creates `drafts/behavior/` and `drafts/tech/` instead of `drafts/domains/`
- `project.config.json` schema: new workspaces use `behaviorDomains`, `techDomains`, `domainLinks` (no `domains` field)

### Fixed

- `marketplace.json`: plugin source now uses `git-subdir` with `ref: "latest"` (tracks latest release tag) — after two intermediate reverts (#80, #81, #82)
- `df-upgrade` command: wrong skill invocation name `deepfield-upgrade` → `Deepfield Upgrade` (Title Case) (#84)
- `deepfield-upgrade` skill: `scaffold-cross-cutting` called without `--templates-dir`; now passes `${CLAUDE_PLUGIN_ROOT}/templates` explicitly (#85)

### Deprecated

- `wip/domain-index.md` — replaced by `wip/tech-index.md` + `wip/behavior-index.md`; auto-migrated on upgrade
- `drafts/domains/` folder layout — replaced by `drafts/behavior/` + `drafts/tech/`; auto-migrated on upgrade
- `project.config.json` `domains` field — renamed to `techDomains`; auto-migrated on upgrade

---

## [0.6.0] - 2026-03-06

### Added

- CI release workflow (`release.yml`): tag-triggered versioning on `release/**` branches — sets all 4 version files, rebuilds CLI, tags `vX.Y.Z` + moves `latest` tag (#78)
- `version-check.yml`: excludes `main` and `release/**` from push trigger; runs on feature branches + PRs to main (#78)
- Separate `behavior-spec.md` and `tech-spec.md` per domain in drafts (#77)
- Glossary upgrade: scaffold missing cross-cutting files, alignment step, multilingual output support (#76)
- Agents respect staging feedback and `DEEPFIELD.md` per-run instructions (#74)

### Changed

- Version files on `main` permanently set to `0.0.0-dev`; real semver only on release branches and tags

### Fixed

- `npm install` instead of `npm ci` in release workflow (no lockfile) (#79)

---

## [0.5.0] - 2026-03-05

### Added

- Parallel domain learning as default: multiple domain-learner agents run concurrently in batches via Agent tool (#60)
- `DEEPFIELD.md` project-specific config: override learning priorities, excluded paths, parallel settings (#63)
- Confidence scores: deterministic formula using evidence-tagged inputs (`[strong]`/`[medium]`/`[weak]`) (#49)
- Reality-based confidence calculation replacing overly optimistic estimates (#49)

### Fixed

- Parallel domain agents: correct `subagent_type: "general-purpose"` and lowercase slug names (#65, #67, #68)
- `DEEPFIELD.md` config respected in learning skills and agents (#63)

---

## [0.4.0] - 2026-03-05

### Added

- Formal version upgrade workflow: CLI detects version mismatch, backs up workspace, invokes AI skill for intelligent migration (#56)
- `repo-mapping.json` config and `clone-repos` CLI command for multi-repo setups (#54)
- Handle legacy workspace version `1.0.0` in upgrade detection (#52)

---

## [0.3.0] - 2026-03-05

### Added

- Human-readable draft documents: `drafts-index.md`, per-domain `README.md`, run review guide generated each iteration (#50)
- Root `package.json` added to version sync (#58)

---

## [0.2.0] - 2026-03-05

### Added

- `/parallel-work` skill for multi-agent parallel development using git worktrees (#43, #48)
- AI-based workspace upgrade system: CLI orchestrates, AI skill applies structural changes intelligently (#39, #45)
- Plugin vs CLI architectural decision guidelines (#44)
- Run feedback loop: user staging feedback incorporated into next learning cycle (#24)

### Fixed

- Require evidence and source references in findings — no unsourced claims (#38)
- Read user-provided source files during learning (#37)

---

## [0.1.0] - 2026-03-04

### Added

- Bootstrap skill: Run 0 scaffolding, repo cloning, domain detection, learning plan generation (#25)
- Multi-source domain detection from directory structure, README, and package manifests (#23)
- Automatic terminology index and glossary built across runs (#31)
- `/df-ff` fast-forward command for accelerated bootstrap (#32)
- `DEEPFIELD.md` per-project config file support (#33)
- Input validation and credential checking (#22)
- CLI `bootstrap` command (#21)

---

## [0.0.x] - 2026-02-15 to 2026-03-03

### Added

- Initial plugin structure: commands (`/df-init`, `/df-start`, `/df-bootstrap`, `/df-input`, `/df-iterate`, `/df-status`, `/df-output`)
- Claude Code plugin marketplace registration (#20)
- `df-input`, `df-output`, `df-bootstrap`, `df-continue` command specs (#13, #14, #15, #16, #17)
- Initial CLI plugin architecture and spec (#1)

[Unreleased]: https://github.com/TomazWang/deepfield/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/TomazWang/deepfield/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/TomazWang/deepfield/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/TomazWang/deepfield/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/TomazWang/deepfield/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/TomazWang/deepfield/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/TomazWang/deepfield/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/TomazWang/deepfield/compare/v0.0.1...v0.1.0
