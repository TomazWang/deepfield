## Context

Deepfield workspaces created before the glossary/terminology feature was introduced lack `deepfield/drafts/cross-cutting/terminology.md` and sometimes `unknowns.md`. The `deepfield upgrade` CLI command currently only creates a backup and prompts the user to run `/df-upgrade` in Claude Code — it performs no file scaffolding. The `deepfield-iterate` skill's Step 5.6 calls `extract-terminology.js` with `--glossary deepfield/drafts/cross-cutting/terminology.md` and `merge-glossary.js` with the same path; both scripts fail or produce incorrect output if the file is missing. Additionally, the current workflow has no step to align canonical terms across domain drafts or to produce bilingual glossary entries.

## Goals / Non-Goals

**Goals:**
- Ensure `deepfield upgrade` scaffolds any missing cross-cutting files (`terminology.md`, `unknowns.md`) so old workspaces work correctly after upgrade
- Ensure learning agents never silently skip glossary operations due to missing files — they create from template if absent
- Add a glossary alignment step that enforces canonical terms and resolves synonyms across all domain drafts
- Support bilingual glossary entries when `DEEPFIELD.md` specifies a non-English or bilingual language

**Non-Goals:**
- Retroactively back-fill terminology for existing domain drafts (alignment only applies going forward, per run)
- Rewriting the `extract-terminology.js` or `merge-glossary.js` scripts beyond minor guard additions
- Supporting more than two languages simultaneously in glossary entries

## Decisions

### Decision 1: Scaffold in CLI upgrade helper, not in the plugin `/df-upgrade` command

**Chosen**: Add a new `upgrade:scaffold-cross-cutting` CLI helper command that checks for and creates missing cross-cutting files from templates. The plugin `/df-upgrade` skill calls this helper as one of its upgrade steps.

**Alternatives considered**:
- Plugin-only: The plugin could `cp` from template directly. Rejected because file creation is deterministic and mechanical — it belongs in the CLI layer per the Plugin/CLI decision tree (Q4: mechanical file creation → CLI-only).
- Inline in `upgrade.ts`: Could be woven into the existing `upgradeCommand` function. Rejected because it violates the existing helper pattern (`upgrade:backup`, `upgrade:apply-op`, etc.) and makes the CLI harder to test.

**Rationale**: Consistent with existing CLI helper pattern; keeps deterministic work in the CLI; plugin calls helpers for mechanical steps.

### Decision 2: Agent fallback guard in skill orchestrator, not in individual agents

**Chosen**: The `deepfield-iterate` skill (Step 5.6 pre-check) performs the `terminology.md` existence check and creates from template via `upgrade:scaffold-cross-cutting` before calling `extract-terminology.js`. Similarly, the skill checks for `unknowns.md` before invoking the synthesizer.

**Alternatives considered**:
- Guard inside each agent: Each agent could create the file if missing. Rejected because agents are AI workers — having them make filesystem decisions adds non-determinism and makes the guard harder to audit.
- Guard inside scripts: `extract-terminology.js` could self-scaffold. Rejected because the scripts are lean, single-purpose tools; adding scaffolding logic mixes concerns.

**Rationale**: The skill orchestrator is the right place for pre-condition checks; it already validates prerequisites before launching agents.

### Decision 3: Glossary alignment as a new Step 5.8 in the iterate skill (post-synthesis)

**Chosen**: Add Step 5.8 after terminology extraction (5.6) and confidence scoring (5.7). The step launches a `deepfield-glossary-aligner` agent that reads `terminology.md` and all domain drafts, identifies synonyms for canonical terms, and rewrites affected sections via `upgrade:apply-op`.

**Alternatives considered**:
- Inline in `deepfield-knowledge-synth`: The synthesizer could align while writing drafts. Rejected because the synthesizer runs per-findings and doesn't have a global view of all drafts at once.
- Separate `/df-align` command: User-invoked alignment. Rejected because alignment should be automatic to prevent drift; manual invocation defeats the autonomous learning goal.

**Rationale**: Post-synthesis is the right point — all drafts for the run have been updated before alignment runs, giving the aligner a complete picture.

### Decision 4: Multilingual glossary via language config in DEEPFIELD.md, rendered by the term extractor agent

**Chosen**: The `deepfield-term-extractor` agent already receives `output_language` from `deepfieldConfig.language`. Extend the agent's prompt to generate bilingual glossary entries when the language is not plain "English". The `merge-glossary.js` script merges entries verbatim — no script changes needed.

**Alternatives considered**:
- Post-process translation step: Translate existing entries separately. Rejected as more complex and risks translation inconsistency with newly discovered terms.

**Rationale**: The agent already has the language context; extending its instructions is the minimal-change approach.

## Risks / Trade-offs

- **Alignment rewrites domain drafts** → Mitigation: The aligner only replaces exact synonym strings; it logs every substitution to `deepfield/wip/run-N/alignment-log.md` so the user can review and revert if needed.
- **Template-created `terminology.md` starts empty** → This is expected and correct; it will be populated on the next `df-iterate` run. The user sees a note in the upgrade output.
- **Bilingual entries increase glossary file size** → Acceptable trade-off for teams using non-English documentation.
- **`upgrade:scaffold-cross-cutting` called on workspaces that already have the files** → Mitigation: The helper checks for existence before writing; existing files are never overwritten.

## Migration Plan

1. Publish new CLI version with `upgrade:scaffold-cross-cutting` helper
2. Users run `deepfield upgrade` — CLI creates backup, then `/df-upgrade` in Claude Code scaffolds missing cross-cutting files via the new helper
3. Users run `/df-iterate` — glossary is now populated and alignment runs automatically going forward
4. No rollback needed — all changes are additive; existing workspaces that already have `terminology.md` are unaffected

## Open Questions

- Should `deepfield-glossary-aligner` also flag terms that appear in domain drafts but are absent from `terminology.md` (undocumented terms)? Left as an enhancement for a follow-up issue.
- Should the alignment log be surfaced in the run review guide? Likely yes — add to run review guide template in a follow-up.
