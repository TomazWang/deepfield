## Context

Deepfield currently generates one markdown file per domain at `deepfield/drafts/domains/{domain}.md`. This single file is written and updated by the `deepfield-knowledge-synth` agent after each learning run. The `deepfield-iterate` skill references this path in multiple places (Step 4b `currentDraftPath`, Step 5 synthesis input, Step 5.5.2 README companion loop).

The change splits each domain file into two: `behavior-spec.md` (stakeholder-level) and `tech-spec.md` (implementation-level), both living under `deepfield/drafts/domains/{domain}/`. This is the largest structural change to the drafts workspace to date and carries migration risk for existing Deepfield workspaces.

Stakeholders:
- Users with existing Deepfield workspaces (migration impact)
- The `deepfield-knowledge-synth` agent (must write two files)
- The `deepfield-iterate` skill (must reference new paths)
- A new `deepfield-document-generator` agent (issue #71) that takes over document output
- The `deepfield upgrade` / `/df-upgrade` workflow (migration path)

## Goals / Non-Goals

**Goals:**
- Define the exact directory and file structure under `deepfield/drafts/domains/{domain}/`
- Define the content contract for `behavior-spec.md` and `tech-spec.md` (what goes where)
- Define cross-reference conventions between the two files
- Define migration strategy for existing `{domain}.md` flat files
- Update `deepfield-iterate` skill and `deepfield-knowledge-synth` agent to use the new paths
- Introduce the `deepfield-document-generator` agent spec
- Provide a safe, reversible migration via `/df-upgrade`

**Non-Goals:**
- Changing the `wip/` or `output/` directory structure (output snapshots will mirror the new `drafts/` structure — this is automatic, no separate change needed)
- Changing the `cross-cutting/` documents (`unknowns.md`, `terminology.md`)
- Changing the `deepfield-domain-learner` agent (it writes `findings.md`, not drafts)
- Implementing issue #71 (`deepfield-document-generator`) fully — this change writes the spec only

## Decisions

### Decision 1: Directory layout under `drafts/domains/`

**Choice:** `deepfield/drafts/domains/{domain}/behavior-spec.md` + `{domain}/tech-spec.md`

**Rationale:** Subdirectory-per-domain is already a half-established pattern — the iterate skill's Step 5.5.2 writes `deepfield/drafts/domains/{domain}/README.md` companion files. Adopting a full subdirectory layout keeps all per-domain artifacts co-located and avoids a proliferation of files at the `domains/` level.

**Alternative considered:** Keep flat `{domain}-behavior.md` and `{domain}-tech.md` alongside each other. Rejected because the `domains/` directory would become crowded and companion README files would be orphaned.

### Decision 2: Content split contract

**Choice:** Strict separation by audience:
- `behavior-spec.md`: user stories, Given-When-Then scenarios, product features, business rules, user flows. No implementation details (no file paths, no class names, no SQL schemas).
- `tech-spec.md`: architecture diagrams, key classes/functions with file paths, design patterns, data models, external dependencies, technical decisions. No user stories or stakeholder language.
- Cross-references allowed: each file MAY link to the other using relative path (`./tech-spec.md`, `./behavior-spec.md`).

**Rationale:** Hard separation prevents content drift back to a mixed document over time. The prohibition on file paths in behavior-spec enforces the stakeholder audience boundary.

**Alternative considered:** Soft separation (no rule against mixing). Rejected because agents would default to their previous mixed style and the audience split would erode within a few runs.

### Decision 3: Migration strategy — AI-driven split via `/df-upgrade`

**Choice:** `/df-upgrade` plugin command performs AI-driven migration:
1. Detect domains with legacy `{domain}.md` (file at `drafts/domains/{domain}.md` where no `{domain}/` subdirectory exists).
2. For each legacy domain, invoke the `deepfield-document-generator` agent to read the flat file and classify each section as behavior or tech.
3. Write `drafts/domains/{domain}/behavior-spec.md` and `{domain}/tech-spec.md`.
4. Move (archive) the original `{domain}.md` to `drafts/domains/{domain}/_legacy.md` (preserved, not deleted).
5. Update cross-reference links in all other drafts (simple regex replace `({domain}.md)` → `({domain}/tech-spec.md)` as default; agent may refine).
6. Write migration summary to `deepfield/wip/migration-split-spec.md`.

**Rationale:** AI classification is necessary because existing flat files have no machine-readable section markers to split on. The CLI cannot do this mechanically. Archiving as `_legacy.md` (not deleting) provides a safety net. The `deepfield upgrade` CLI command already handles backup before invoking `/df-upgrade`.

**Alternative considered:** Gradual migration — set a flag in `project.config.json` and migrate domains lazily on next `df-iterate`. Rejected because it leaves the workspace in a mixed state (some domains split, some flat) which complicates all path-referencing logic in the skill.

**Alternative considered:** Force-delete the original. Rejected — loss of data risk with no benefit since the subdirectory is already a logical archive.

### Decision 4: Agent responsibility for document output

**Choice:** Introduce a new `deepfield-document-generator` agent (spec in this change, implementation in issue #71) that takes over the document-writing responsibility from `deepfield-knowledge-synth`. The synth agent continues to handle unknowns.md and changelog updates; document generation is delegated.

**Rationale:** `deepfield-knowledge-synth` is already complex. Splitting responsibilities aligns with single-responsibility and makes the document generation logic independently testable and replaceable. The document-generator agent can be given the content split contract as an explicit instruction.

**Alternative considered:** Keep all logic in `deepfield-knowledge-synth`, add two-file output there. Workable but makes the agent harder to maintain and the content split rule harder to enforce.

### Decision 5: Backward compatibility of path references in `deepfield-iterate`

**Choice:** Replace all occurrences of `deepfield/drafts/domains/*.md` glob and `deepfield/drafts/domains/${domain.name}.md` path patterns in `deepfield-iterate.md` with dual references to the new split files.

Specifically:
- Step 4b `currentDraftPath` → split into `behaviorSpecPath` + `techSpecPath`
- Step 5 `existing_drafts` input → updated glob `deepfield/drafts/domains/**/*.md` (captures both split files and README companions)
- Step 5.5.2 README generation loop → domain enumeration switches from listing `*.md` files to listing subdirectories under `drafts/domains/`

**Rationale:** The glob `drafts/domains/**/*.md` captures all files in the new structure with a single expression, minimising changes to downstream consumers. Domain enumeration must switch from file-listing to directory-listing since there is no longer a flat `{domain}.md` to derive domain names from.

## Risks / Trade-offs

**Risk: Partial migration leaves workspace inconsistent** → Mitigation: Migration is all-or-none per run of `/df-upgrade`. The command checks for any remaining `{domain}.md` flat files after migration and reports them as warnings. The user can re-run `/df-upgrade` to retry failed domains.

**Risk: AI classification puts tech content in behavior-spec or vice versa** → Mitigation: Templates include clear audience-boundary reminders at the top. The document-generator agent receives explicit content split rules. Users can correct manually; the next `df-iterate` run will add to whichever file it reads.

**Risk: Cross-reference links break after migration** → Mitigation: The migration step performs a scan-and-replace of `](./{domain}.md)` → `](../{domain}/tech-spec.md)` patterns across all draft files (defaulting tech-spec for cross-references, which are almost always implementation citations). Agent refines if needed.

**Risk: Existing `openspec/specs/` capabilities that reference `deepfield/drafts/domains/*.md` paths become stale** → Mitigation: This change updates the relevant specs (`plugin-skills`, `plugin-commands`) as delta specs.

**Risk: `generate-domain-readme.js` script (Step 5.5.2) enumerates `*.md` files to find domains** → Mitigation: Script must be updated to enumerate subdirectories instead. This is a small script change included in the tasks.

**Trade-off: Two files per domain doubles the number of draft files.** Accepted — the readability and audience-separation benefit outweighs the file count increase.

## Migration Plan

### Phase 1 — New structure in place (this change)
1. Add templates `plugin/templates/behavior-spec.md` and `plugin/templates/tech-spec.md`.
2. Update `deepfield-knowledge-synth` agent to write two files per domain.
3. Update `deepfield-iterate` skill path references.
4. Write spec for `deepfield-document-generator` agent.
5. Update `/df-upgrade` plugin command to invoke migration step.

### Phase 2 — Existing workspace migration (user-triggered)
1. User runs `deepfield upgrade` (CLI) → creates backup.
2. CLI instructs user to run `/df-upgrade` in Claude Code.
3. `/df-upgrade` detects legacy `{domain}.md` files.
4. Invokes `deepfield-document-generator` per domain to split content.
5. Archives originals as `_legacy.md`.
6. Updates cross-references.
7. Reports migration summary.

**Rollback:** The backup created by `deepfield upgrade` (CLI) contains a full copy of `deepfield/` before migration. User can restore from backup. The `_legacy.md` archives also allow manual reconstruction.

## Open Questions

1. **Naming**: Issue #69 asks whether "behavior-spec" or "product-spec" is the right name. This design uses `behavior-spec` for alignment with BDD conventions. Implementer should confirm with issue author before finalising templates.
2. **Confidence tracking**: Should `project.config.json` track confidence separately for behavior vs tech aspects of a domain, or remain a single score per domain? Current design keeps a single score. Revisit in a follow-up if users report this is limiting.
3. **Domain README content**: Should `drafts/domains/{domain}/README.md` summarise both specs or just link to them? Current design: link only (one-liner per spec with the spec's confidence score). Avoids duplication.
4. **Issue #71 timeline**: The `deepfield-document-generator` agent is specced here but implemented in #71. The `deepfield-knowledge-synth` agent change (writing two files) should ship first as an interim measure, then be replaced by the document-generator agent when #71 lands.
