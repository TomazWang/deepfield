## Context

The `deepfield-iterate` skill currently invokes `deepfield-knowledge-synth` at Step 5 to convert findings into draft documentation. That agent:

- Receives only: findings, existing drafts, unknowns, changelog, output_language
- Does NOT receive: staging feedback from the user, DEEPFIELD.md config priorities, per-domain findings details
- Produces only monolithic per-domain drafts — not the behavior-spec / tech-spec split required by issue #69
- Has no mechanism to apply priority or format preferences from DEEPFIELD.md at write time

The proposed `deepfield-document-generator` agent is a drop-in replacement for Step 5 that addresses all of these gaps from day one, preventing a repeat of the issue #70 pattern (config support added only after the fact).

Constraints:
- Plugin agent files are Markdown with YAML frontmatter
- Plugin scripts must use CJS (no ESM)
- No new CLI scripts are needed — all work is AI-driven prose generation
- The One-Way Dependency Rule means the agent cannot call back into the CLI beyond what the skill already passes to it

## Goals / Non-Goals

**Goals:**
- Create `plugin/agents/deepfield-document-generator.md` with full input specification covering findings, per-domain findings, staging feedback, DEEPFIELD.md config, existing drafts, and unknowns
- Update Step 5 of `plugin/skills/deepfield-iterate.md` to launch the new agent with the expanded input set
- Produce `behavior-spec.md` and `tech-spec.md` per domain (satisfying issue #69 architecture)
- Apply language settings, document length rules, evidence requirements, and confidence markers consistently
- Deprecate (but retain) `deepfield-knowledge-synth`

**Non-Goals:**
- Deleting or modifying `deepfield-knowledge-synth` behavior (keep for reference)
- Adding new CLI scripts
- Changing the staging feedback structure or DEEPFIELD.md schema (consume as-is)
- Incremental/diff-only doc generation (always full update per run for simplicity)

## Decisions

### Decision 1: New agent file, not enhancement of deepfield-knowledge-synth

**Chosen:** `plugin/agents/deepfield-document-generator.md` is a new file.

**Rationale:** The existing synthesizer has a different conceptual role (findings → prose notes) and a different name that would mislead future readers. A new file with a clear name makes the separation of concerns explicit and avoids polluting the synthesizer's well-established pattern with doc-generation responsibilities.

**Alternative considered:** Expand `deepfield-knowledge-synth` in place. Rejected because the name conflicts with the new broader mandate and the existing agent is already used in some contexts as a reference model for "synthesis lite."

### Decision 2: behavior-spec.md + tech-spec.md as the canonical output shape per domain

**Chosen:** The agent writes two files per domain:
- `deepfield/drafts/domains/<domain>/behavior-spec.md` — user stories, scenarios, business rules
- `deepfield/drafts/domains/<domain>/tech-spec.md` — architecture, implementation notes, data models

**Rationale:** This directly satisfies issue #69 and creates clear audience targeting: behavior spec for stakeholders, tech spec for developers. It also avoids the existing monolithic draft growing unboundedly.

**Alternative considered:** Keep single `<domain>.md` and add sections. Rejected because it doesn't solve the audience-targeting problem and perpetuates the length issue that issue #46 identified.

### Decision 3: Staging feedback injected as full file read, not pre-processed summary

**Chosen:** The skill passes the staging feedback path to the agent; the agent reads it directly.

**Rationale:** Staging feedback is free-form prose; pre-processing would introduce a lossy transformation. The agent has full context to interpret it against the findings. This also avoids adding a new script for a task that is inherently AI reasoning.

**Alternative considered:** A preprocessing script that extracts structured corrections. Rejected as over-engineering for a task that is fundamentally interpretive.

### Decision 4: DEEPFIELD.md config passed as a pre-parsed object from the skill

**Chosen:** The skill already parses DEEPFIELD.md via `parse-deepfield-config.js` in Pre-Run Step 0. The resulting `deepfieldConfig` object is passed to the agent as inline context (same pattern used for language and domain instructions in Step 4).

**Rationale:** Reuses the already-parsed config; avoids the agent needing to shell out to `parse-deepfield-config.js`. Consistent with how Step 4 currently passes language and domain instructions.

## Risks / Trade-offs

- **Two files per domain instead of one** → More files to navigate. Mitigated by the existing README generation in Step 5.5 (the domain READMEs link sub-files).
- **Agent scope is large** → A single agent now handles all documentation for all domains in one invocation. For projects with many domains this could hit context limits. Mitigated by the per-domain findings files being the primary input (not the raw source files), keeping context bounded. If this becomes an issue in practice, a future change can split into per-domain agent invocations.
- **deepfield-knowledge-synth becomes dead code** → Retained to avoid breaking any external callers, but no longer part of the primary flow. Risk is low; the agent file is documentation, not code.

## Open Questions

None — all decisions above have been made with sufficient confidence to begin implementation.
