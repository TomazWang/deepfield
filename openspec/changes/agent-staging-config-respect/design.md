## Context

The `deepfield-iterate` skill already loads `DEEPFIELD.md` configuration at the top of every run (Step 0) and uses it in two places: topic priority selection (Step 2) and the sequential-mode learner launch (Step 4 sequential). The parallel-mode inline prompt (Step 4d) already injects `domainInstructions` and `output_language` per domain. However, neither agent receives `staging_feedback`.

The staging area is created at `deepfield/source/run-N-staging/` at the end of every run. The skill already reads `feedback.md` from this directory in Step 1 ("Check for New User Input"), but it only uses the feedback for source classification — it never passes the feedback text to the learning or synthesis agents that run later in the same iteration.

The knowledge-synth agent (Step 5) receives `output_language` but no `priority_config` beyond that, and no staging feedback at all.

## Goals / Non-Goals

**Goals:**
- Pass the content of `deepfield/source/run-N-staging/feedback.md` (if it exists) to `deepfield-domain-learner` agents (parallel mode) via the inline prompt
- Pass `staging_feedback` to `deepfield-knowledge-synth` so corrections are applied during synthesis
- Ensure `deepfield-domain-learner` treats staging feedback as primary source of truth, applying corrections and following guidance before analyzing code
- Ensure `deepfield-knowledge-synth` applies staging corrections when updating drafts
- Keep the sequential-mode learner consistent (pass staging feedback to it too)

**Non-Goals:**
- Formalizing a staging folder schema beyond what already exists (`feedback.md`)
- Domain-scoped or run-scoped staging sub-directories (issue mentions them but they are out of scope for this change)
- Creating a CLI staging template or scaffolding command
- Changing how priority config is used in Step 2 (already implemented)
- Adding staging feedback to the `deepfield-term-extractor` or `deepfield-learner` (sequential) agents in this change — sequential mode already has a path for domain instructions; staging feedback should be added for consistency but is lower priority

## Decisions

### Decision 1: Read feedback.md once in Step 1, pass as string to agents

**Choice**: Read `deepfield/source/run-${nextRun}-staging/feedback.md` in Step 1 (where the skill already looks at the staging directory), capture the full text as `stagingFeedback`, and pass it as a string field in every agent launch in Steps 4 and 5.

**Rationale**: The skill already accesses the staging directory in Step 1. Centralizing the read there avoids duplicate file reads and keeps context loading in one place. Agents receive a flat string — no parsing required. If `feedback.md` does not exist, `stagingFeedback` is `null` and the agent section is omitted from the prompt.

**Alternative considered**: Have each agent read `feedback.md` itself. Rejected because agents are scoped to their own file list (domain-learner has a strict scope constraint), and passing it from the skill keeps agents stateless with respect to directory layout.

### Decision 2: Inject staging_feedback as a conditional prompt section

**Choice**: In the inline prompt for `deepfield-domain-learner` and in the Step 5 synth launch, include a `## Staging Feedback (User Corrections)` section only when `stagingFeedback` is non-null. The section instructs the agent to treat the feedback as primary source of truth.

**Rationale**: Conditional injection keeps prompts clean when no feedback exists. The heading makes the purpose unambiguous to the agent.

### Decision 3: priority_config for synth is already partially covered — add domain instructions explicitly

**Choice**: The synth already receives `output_language`. Add `domain_instructions` as a separate field in the synth launch so the synth can apply per-domain instructions when updating drafts (e.g., "ignore legacy basic auth").

**Rationale**: Without domain instructions, the synth may synthesize content that the user explicitly told the system to skip. The synth is the final writer of user-visible documentation, so this is the highest-leverage place to enforce user instructions.

## Risks / Trade-offs

- **Prompt length**: Staging feedback could be arbitrarily long. Mitigation: document that `feedback.md` should be concise (a few hundred lines). No truncation logic added in this change — treat as acceptable for now.
- **Agent ignoring feedback**: Agents are non-deterministic. Making staging feedback "primary source of truth" is an instruction, not a guarantee. Mitigation: position the staging feedback section at the top of agent prompts (before file analysis instructions) to maximize attention.
- **Sequential mode inconsistency**: Sequential-mode learner launch already passes `domain_instructions` and `output_language` but not `staging_feedback`. This change adds `staging_feedback` to sequential mode for consistency.
