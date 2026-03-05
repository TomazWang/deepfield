## Context

Deepfield's learning loop (bootstrap + iterate) produces draft documents in `deepfield/drafts/` and run artifacts in `deepfield/wip/run-N/`. Currently, these outputs are raw files with no navigational layer. Users must manually browse directories to understand what changed, what confidence looks like per domain, and what needs their attention. This proposal adds three types of generated documents — a drafts index, per-domain READMEs, and a per-run review guide — plus a 200-line document length cap with splitting guidance for AI agents.

The existing iteration infrastructure writes domain drafts at `deepfield/drafts/domains/{domain}.md` and cross-cutting files at `deepfield/drafts/cross-cutting/`. The `deepfield-iterate` skill orchestrates all post-run synthesis. The `deepfield-bootstrap` skill handles Run 0.

## Goals / Non-Goals

**Goals:**
- Generate `deepfield/drafts/README.md` after each run as a navigation index
- Generate `deepfield/drafts/domains/{domain}/README.md` per domain (requires migrating domain docs from `{domain}.md` to `{domain}/README.md` or generating a companion README alongside existing flat files)
- Generate `deepfield/wip/run-N/review-guide.md` with tiered review priorities and open questions
- Provide AI agents with a 200-line max rule and clear splitting guidelines when creating or updating draft documents

**Non-Goals:**
- Changing the format or content of existing domain draft files
- Introducing a new AI agent solely for this purpose (generation is lightweight enough for the iterate skill to call new scripts directly)
- Generating HTML or non-Markdown output
- Per-run archiving of the drafts index (it is overwritten each run)

## Decisions

### Decision 1: Domain README alongside flat files vs. directory migration

**Options:**
- A) Migrate `drafts/domains/{domain}.md` → `drafts/domains/{domain}/README.md` (breaking change to existing structure)
- B) Generate `drafts/domains/{domain}-overview.md` alongside existing flat files (avoids migration, but clutters directory)
- C) Treat the per-domain README as the existing domain file and add an `_index.md` beside it (confusing naming)
- D) Generate `drafts/domains/{domain}/README.md` as a companion summary that links to the main `{domain}.md` file, keeping both flat and nested forms

**Decision:** Option D — generate the per-domain README as a compact companion summary (`drafts/domains/{domain}/README.md` is a new file; the existing `{domain}.md` remains unchanged). This is purely additive and avoids any migration. The domain README contains the overview, confidence, and recent changes; it links to the full domain file.

**Rationale:** Non-breaking. Keeps existing scripts and agents working. The README pattern is universally understood by developers browsing GitHub or filesystem.

### Decision 2: New scripts vs. inline skill generation

**Options:**
- A) Generate the documents inline in the iterate/bootstrap skills (no new scripts)
- B) Add dedicated Node.js scripts in `plugin/scripts/` called from iterate/bootstrap skills

**Decision:** Option B — add three scripts: `generate-drafts-index.js`, `generate-domain-readme.js`, `generate-run-review-guide.js`.

**Rationale:** Consistent with the project's Command → Skill → Script pattern. Scripts are independently testable. Skills stay orchestration-focused. The existing `generate-domain-index.js` script is a direct precedent.

### Decision 3: 200-line cap enforcement mechanism

**Options:**
- A) A runtime check script that warns when a file exceeds 200 lines
- B) Embedding the rule in agent prompt templates/instructions so AI agents self-enforce during generation
- C) Both A and B

**Decision:** Option B only — embed the 200-line rule and splitting guidelines in agent instructions and skill prompts. No runtime enforcement script for now.

**Rationale:** The documents are AI-generated. Embedding the constraint in the agent instructions is the lowest-friction approach. A runtime linting script can be added in a future iteration if violations are observed in practice.

### Decision 4: Review priority tiers

The review guide uses three tiers: HIGH (new findings that contradict existing knowledge or resolve long-standing unknowns), MEDIUM (new facts with moderate confidence), LOW (minor additions or confidence bumps). Tiers are derived from confidence delta data already tracked in `run-N.config.json`.

## Risks / Trade-offs

- **Domain README drift**: If the domain flat file (`{domain}.md`) is updated but the companion README is not regenerated, they fall out of sync. Mitigation: Always regenerate all companion READMEs at end of each run (not just updated domains).
- **Stats accuracy in drafts index**: Aggregate confidence stats require reading all domain files. If many domains exist, this adds script execution time. Mitigation: Read `run-N.config.json` for confidence data instead of parsing domain files — that data is already aggregated.
- **200-line guideline compliance**: AI agents may not always respect soft guidelines. Mitigation: Make the splitting guideline explicit in templates with examples, and note in the review guide when a document is approaching the limit.

## Migration Plan

1. Add three new scripts to `plugin/scripts/`
2. Add three new templates to `plugin/templates/`
3. Update `deepfield-iterate.md` skill to invoke new scripts at end-of-run synthesis phase
4. Update `deepfield-bootstrap.md` skill to invoke new scripts at end of Run 0
5. No data migration required — all new files are additive

Rollback: Remove the three new script invocations from the skills. No existing files are modified.

## Open Questions

- Should the drafts README be committed to version control by the user, or treated as ephemeral like `wip/`? (Recommend: yes, commit it — it is in `drafts/` which is user-readable space)
- Should the per-run review guide reference the diff between this run's confidence and the prior run, or just report current absolute confidence? (Recommend: delta — more actionable for users)
