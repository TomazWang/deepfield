## Context

The Deepfield plugin already has a `deepfield-iterate` skill that runs learning iterations in an autonomous loop with stop condition evaluation. The `/df-iterate` command invokes this skill with optional single-run (`--once`) and focus (`--focus`) flags.

The fast-forward command adds a higher-level loop controller that: (1) suppresses user feedback prompts between runs, (2) enforces a configurable max-runs cap, (3) targets a minimum confidence threshold across selected domains, and (4) reports progress after all runs complete rather than after each one.

The confidence score is the key new concept — it represents the percentage of HIGH-priority topics in the learning plan that have reached their confidence target (>= min-confidence).

## Goals / Non-Goals

**Goals:**
- Run multiple iterations without user intervention
- Stop when any stop condition fires: confidence reached, max runs hit, diminishing returns, blocked, domain restructure
- Report per-run progress and final summary
- Support domain filtering (`--domains`) and configurable thresholds
- Optionally collect feedback at end of all runs

**Non-Goals:**
- Replace or modify the existing `deepfield-iterate` skill behavior
- Implement a new learning algorithm — reuse iterate skill per run
- Implement a background/daemon process — runs synchronously in Claude session
- Parallel iteration across domains simultaneously

## Decisions

### Decision 1: Reuse deepfield-iterate skill per run rather than duplicating logic

**Chosen:** The `deepfield-ff` skill invokes the `deepfield-iterate` skill logic for each individual run, passing `--once` mode to execute exactly one run, then evaluates stop conditions in the outer ff loop.

**Alternative considered:** Copy the iterate skill logic into df-ff. Rejected because this creates duplication and maintenance burden. The iterate skill already handles scanning, learning, synthesis, and run config updates correctly.

**Rationale:** Single responsibility. The ff skill only adds: loop control, confidence threshold evaluation, and suppression of between-run user prompts.

### Decision 2: Confidence scoring reads from run-N.config.json

**Chosen:** `check-confidence.js` reads the most recent run config's `confidenceChanges` field and the learning plan's topic list to compute the percentage of HIGH-priority topics at or above the threshold.

**Alternative considered:** Parse confidence directly from `learning-plan.md` markdown. Rejected because markdown parsing is fragile; the structured JSON in run configs is more reliable.

**Rationale:** run-N.config.json is already written by the iterate skill with per-topic confidence. The script can compute a single aggregate score from this.

### Decision 3: --domains filter limits both topic selection and threshold evaluation

**Chosen:** When `--domains auth,api` is passed, the confidence threshold check only evaluates topics belonging to those domains. Topics outside the filter are ignored for stop condition purposes.

**Alternative considered:** Filter only affects topic selection but threshold still checks all domains. Rejected because users running `--domains auth` don't want to wait for unrelated domains.

**Rationale:** Domain-focused runs should have domain-scoped exit criteria.

### Decision 4: Feedback collection at end is opt-out (default: true)

**Chosen:** After all runs complete, if `--feedback-at-end` is not explicitly `false`, Claude prompts the user to review findings and add feedback before running again.

**Alternative considered:** Default off, require explicit `--feedback-at-end` flag. Rejected because silent completion without any feedback hook removes the human-in-the-loop entirely, which could lead to divergent knowledge bases.

**Rationale:** The feedback prompt is lightweight (just a message with instructions) and preserves the iterative review cycle that makes Deepfield trustworthy.

## Risks / Trade-offs

- **Long-running sessions**: Many runs in a single Claude session may hit context limits. Mitigation: Hard cap `--max-runs` at 50, default 10. Warn user at runs > 20.
- **Confidence stagnation without detection**: If confidence scores don't update (bug in iterate skill), the ff loop could run to max-runs silently. Mitigation: Diminishing returns check (2+ runs with <5% net change) catches this case.
- **No graceful Ctrl+C handling in Claude**: Claude Code doesn't expose signal handling. Mitigation: Document that cancellation leaves state in the last completed run; user can resume with `/df-continue`.
- **Domain filter typos**: If user specifies `--domains auth` but domain is named `authentication`, the filter silently matches nothing. Mitigation: Validate domains against domain-index.md and warn if no topics matched.

## Open Questions

- Should `--stop-on-blocked` default to false (as per issue) or true? Kept as false per issue spec — run continues even if some topics are blocked, unless ALL high-priority topics are blocked.
- Is 80% min-confidence threshold the right default? Matches the existing stop condition in iterate skill (`confidence > 80`). Kept consistent.
