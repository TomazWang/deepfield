## Why

Workspaces created before the glossary feature was added lack `deepfield/drafts/cross-cutting/terminology.md`, causing `extract-terminology.js` to fail silently and resulting in inconsistent term usage across domain drafts. The `deepfield upgrade` command does not scaffold missing cross-cutting files, and learning agents have no fallback to create them, making old workspaces permanently broken for terminology features without manual intervention.

## What Changes

- `deepfield upgrade` (CLI) detects and scaffolds missing cross-cutting files (`terminology.md`, `unknowns.md`) from templates when upgrading old workspaces
- The `deepfield-iterate` skill (Step 5.6) adds a guard to create `terminology.md` from template if it does not exist before invoking `extract-terminology.js`
- The `deepfield-knowledge-synth` agent adds a guard to create `unknowns.md` from template if it does not exist before writing
- Glossary alignment step added to learning workflow: after synthesis, canonical terms are enforced across domain drafts and synonyms are resolved to the canonical form
- Multilingual glossary support: if `DEEPFIELD.md` specifies a non-English or bilingual language, glossary entries are generated with definitions in both languages

## Capabilities

### New Capabilities

- `upgrade-cross-cutting-scaffold`: CLI upgrade command detects and creates missing cross-cutting files (`terminology.md`, `unknowns.md`) from templates
- `glossary-alignment`: After synthesis, an alignment step extracts terms from all domain drafts, resolves synonyms to canonical terms, and updates `terminology.md` and drafts consistently
- `glossary-agent-fallback`: Learning agents create `terminology.md` and `unknowns.md` from templates if missing, ensuring no silent skips
- `multilingual-glossary`: Glossary entries respect `DEEPFIELD.md` language settings, generating bilingual definitions when a non-English or bilingual language is configured

### Modified Capabilities

- `plugin-skills`: Step 5.6 of `deepfield-iterate` gains a pre-check guard and a post-synthesis glossary alignment step
- `plugin-commands`: `deepfield-knowledge-synth` agent gains guard for missing cross-cutting files

## Impact

- `cli/src/commands/upgrade.ts` and `upgrade-helpers.ts` — add new `upgrade:scaffold-cross-cutting` helper command
- `plugin/skills/deepfield-iterate.md` — Step 5.6 guard + new Step 5.8 glossary alignment
- `plugin/agents/deepfield-knowledge-synth.md` — guard for missing `unknowns.md`
- `plugin/templates/terminology.md` — already exists; used as scaffold source
- No breaking changes; all additions are backward-compatible with new workspaces
