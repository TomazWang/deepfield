## Why

Findings produced by the learning agents lack source references and evidence, making it impossible for users to verify claims or trace back to source material. This erodes trust in the knowledge base and forces users to manually search the codebase to validate each finding.

## What Changes

- Add a `findings.md` template to `plugin/templates/` that enforces evidence structure (source reference, evidence type, quote/snippet, confidence level)
- Update `plugin/agents/deepfield-learner.md` to explicitly require evidence collection with file:line citations for every finding
- Update `plugin/agents/deepfield-domain-learner.md` to strengthen its existing evidence requirements — currently the output format shows `file:line` references in some sections but does not mandate them for every claim

## Capabilities

### New Capabilities

- `findings-template`: A new `findings.md` template that enforces structured evidence — source reference (file:line), evidence type (code/comment/doc/test), quote/snippet, and confidence level — for every finding entry

### Modified Capabilities

- `plugin-skills`: No spec-level changes — agent behavior changes only, no skill interface changes

## Impact

- `plugin/templates/findings.md` — new file
- `plugin/agents/deepfield-learner.md` — update Output Format section and Guardrails
- `plugin/agents/deepfield-domain-learner.md` — update Output Format section to mandate evidence for every claim in Key Patterns, Architecture, and Data Flow sections
