## Why

The current domain model conflates two fundamentally different concerns: product features (what stakeholders care about) and technical components (how engineers build them). This 1:1 mapping breaks down in real brownfield projects where one product feature spans many services and one service implements many features — producing knowledge-base docs that are neither useful to PMs nor to engineers.

## What Changes

- **BREAKING**: `deepfield/wip/domain-index.md` is replaced by two separate indexes: `behavior-index.md` (product view) and `tech-index.md` (implementation view)
- **BREAKING**: `deepfield/drafts/domains/{name}/` restructures to `drafts/behavior/{name}/` and `drafts/tech/{name}/`
- New wip file: `domain-links.md` — many-to-many mapping between behavior and tech domains
- Bootstrap (Run 0) now generates both indexes in parallel and runs an interactive Q&A to elicit stakeholder priorities
- Iterate runs separate learning tracks: `--track behavior` reads reference docs/user stories; `--track tech` reads source code
- New agent `deepfield-domain-linker` infers and maintains behavior↔tech links
- Document generator writes to `drafts/behavior/` or `drafts/tech/` depending on track
- Upgrade skill migrates existing `domains/` structure to the dual layout
- `detect-behavior-domains.js` script: new CLI helper to extract behavior domains from reference docs

## Capabilities

### New Capabilities

- `behavior-domain-detection`: Detect product features / stakeholder concerns from reference docs and interactive Q&A; produce `behavior-index.md`
- `tech-domain-detection`: Detect technical components from source code structure; produce `tech-index.md` (replaces current single-track detection)
- `domain-linking`: Infer and maintain many-to-many behavior↔tech mapping in `domain-links.md`
- `dual-track-learning`: Run behavior or tech learning cycles independently; route output to the correct `drafts/` subtree

### Modified Capabilities

- `plugin-skills`: `deepfield-bootstrap` adds behavior detection + interactive Q&A step; `deepfield-iterate` gains `--track` flag and dual output routing
- `plugin-commands`: `df-upgrade` adds Step 6 migration of `drafts/domains/` → `drafts/behavior/` + `drafts/tech/`
- `state-management`: workspace state schema gains `behaviorDomains`, `techDomains`, `domainLinks` fields; existing `domains` field deprecated

## Impact

- `plugin/skills/deepfield-bootstrap.md` — add behavior detection step, interactive Q&A, dual index generation
- `plugin/skills/deepfield-iterate.md` — add `--track` flag, route learner agents to correct draft subtree
- `plugin/agents/deepfield-document-generator.md` — output path now `drafts/{track}/{domain}/` instead of `drafts/domains/{domain}/`
- `plugin/agents/deepfield-domain-learner.md` — receives track context; scopes file list accordingly
- `plugin/agents/deepfield-domain-linker.md` — **new file**
- `plugin/commands/df-upgrade.md` — add migration step
- `plugin/skills/deepfield-upgrade.md` — handle dual-layout migration
- `plugin/scripts/detect-behavior-domains.js` — **new file**
- Workspace folder structure: `drafts/behavior/` and `drafts/tech/` subdirectories
