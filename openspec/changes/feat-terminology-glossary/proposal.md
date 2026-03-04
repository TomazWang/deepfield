## Why

During learning runs, domain-specific terms, acronyms, and jargon are scattered across findings with no central reference. This makes knowledge bases harder to navigate and forces AI and humans to re-learn vocabulary on every session. A living, cumulative glossary solves this by capturing terminology as it's discovered and evolving it across runs.

## What Changes

- New script `extract-terminology.js` that parses files for acronyms, definitions, and domain terms
- New script `merge-glossary.js` that merges per-run terms into the cumulative glossary
- New agent `deepfield-term-extractor.md` that extracts terminology from analyzed files
- New template `terminology.md` for the living glossary draft
- New template `new-terms.md` for per-run term discoveries
- Updated `deepfield-iterate.md` skill to invoke terminology extraction each run
- Updated `deepfield-bootstrap.md` skill to invoke terminology extraction during Run 0
- `df-output` command awareness: glossary included in output snapshots automatically (already covered by glob copy)

## Capabilities

### New Capabilities

- `terminology-extraction`: Detect and extract domain terms, acronyms, and definitions from source files during each learning run, then merge into a cumulative glossary at `drafts/cross-cutting/terminology.md`

### Modified Capabilities

- `plugin-skills`: The iterate and bootstrap skills gain a new step to invoke terminology extraction

## Impact

- New files: `plugin/scripts/extract-terminology.js`, `plugin/scripts/merge-glossary.js`, `plugin/agents/deepfield-term-extractor.md`, `plugin/templates/terminology.md`, `plugin/templates/new-terms.md`
- Modified files: `plugin/skills/deepfield-iterate.md`, `plugin/skills/deepfield-bootstrap.md`
- Runtime output: `deepfield/drafts/cross-cutting/terminology.md` (cumulative), `deepfield/wip/run-N/new-terms.md` (per-run)
- No breaking changes
