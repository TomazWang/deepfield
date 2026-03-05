## Why

After each learning run, the `deepfield/drafts/` directory accumulates domain documents, unknowns, and changelogs — but there is no navigational layer to help users understand what changed, what needs review, or where to start. Without structured README indexes and a per-run review guide, the output of each run is hard to assess, review, or act on.

## What Changes

- Add generation of `deepfield/drafts/README.md` — a top-level navigation index with domain links, recent changes summary, review priorities, and stats
- Add generation of `deepfield/drafts/domains/{domain}/README.md` — per-domain overview with confidence breakdown and recent changes (one per domain folder)
- Add generation of `deepfield/wip/run-N/review-guide.md` — a human-readable summary of what was learned this run, tiered review priorities (high/medium/low), open questions needing user input, and next steps
- Enforce a maximum of ~200 lines per draft document with AI agent splitting guidelines
- These documents are generated at the end of each run by the iterate skill and at the end of bootstrap by the bootstrap skill

## Capabilities

### New Capabilities

- `drafts-index`: Top-level `drafts/README.md` navigation index — domain links, stats, recent changes, review priorities
- `domain-readme`: Per-domain `drafts/domains/{domain}/README.md` — confidence breakdown, recent changes, open questions for that domain
- `run-review-guide`: Per-run `wip/run-N/review-guide.md` — what was learned, tiered review priorities, questions needing user input, next steps
- `doc-length-enforcement`: Max ~200-line rule for AI-generated draft documents with splitting guidelines

### Modified Capabilities

- `plugin-skills`: The `deepfield-iterate` and `deepfield-bootstrap` skills must invoke the new document generation steps at the end of each run

## Impact

- `plugin/skills/deepfield-iterate.md` — add steps to generate drafts index, domain READMEs, and review guide after each run completes
- `plugin/skills/deepfield-bootstrap.md` — add steps to generate initial drafts index and review guide after Run 0 completes
- `plugin/scripts/` — new scripts for generating the three document types
- `plugin/templates/` — new templates for each document type
- No breaking changes to existing document formats; new files are additive
