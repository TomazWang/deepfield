## Context

Bootstrap (Run 0) currently completes and reports results with no mechanism for the user to review or correct AI findings. Domains may be misclassified, priorities may be wrong, and important context may be missing. The feedback loop adds an optional interactive checkpoint after each run where users can provide structured corrections.

The plugin follows a Command → Skill → Script pattern. Scripts handle file I/O, skills orchestrate workflows. New scripts for collecting and applying feedback fit naturally into this pattern.

## Goals / Non-Goals

**Goals:**
- Prompt user after Run 0 (and future runs) to review findings
- Collect structured feedback: domain corrections, missing context, priority adjustments, general comments
- Save feedback to `deepfield/wip/run-N/feedback.md`
- Apply feedback to `deepfield/wip/learning-plan.md` before next run
- Allow user to skip feedback entirely

**Non-Goals:**
- Web UI or visual diff views (future enhancement)
- Automatic AI re-classification based on feedback (feedback is human-readable guidance for the next AI run)
- Confidence scoring or explicit approve/reject per finding

## Decisions

### Decision: Two separate scripts (collect vs. apply)

`collect-feedback.js` and `apply-feedback.js` are separate scripts rather than one combined script.

**Rationale:** Collection is interactive (runs at end of bootstrap); application is non-interactive (runs at start of next run). Separating them keeps each script focused and independently testable. It also allows applying feedback even if the user edited the file manually between runs.

Alternative considered: single script with a mode flag (`--collect` / `--apply`). Rejected — harder to test, mixes concerns.

### Decision: Feedback stored as structured Markdown (not JSON)

Feedback is saved to `feedback.md` using the existing template format rather than as a JSON state file.

**Rationale:** Users should be able to read and edit feedback directly. The template already exists (`plugin/templates/feedback.md`). Markdown is more forgiving for human editing. The apply script uses section parsing to extract structured content.

Alternative considered: JSON file alongside the Markdown. Rejected — adds complexity without clear benefit at this stage.

### Decision: Feedback applied by appending to learning-plan.md

Rather than re-writing the learning plan, `apply-feedback.js` appends a "User Feedback Incorporated" section.

**Rationale:** Preserves original AI-generated plan for auditability. The learning agent reads the entire plan and will naturally prioritize user guidance in the appended section.

### Decision: inquirer for interactive prompts

Use `inquirer` npm package for CLI prompts (already a known dependency pattern in Node.js plugins).

**Rationale:** Provides confirm, editor, and input prompt types needed for the feedback flow. Handles TTY edge cases gracefully.

## Risks / Trade-offs

- **Risk: editor prompts require a TTY** → Mitigation: fall back to `input` type if editor fails; document that non-interactive environments should skip feedback
- **Risk: feedback.md section parsing is fragile** → Mitigation: keep parsing simple (extract by `##` header), treat any parse failure as "no feedback to apply" with a warning
- **Risk: user skips feedback on every run** → Accepted trade-off; the step is optional by design

## Open Questions

- Should feedback also be fed into the domain-index.md directly, or only into learning-plan.md? (Current design: only learning-plan.md, domain agent re-reads it on next run)
