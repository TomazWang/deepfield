## 1. Create findings.md template

- [x] 1.1 Create `plugin/templates/findings.md` with run header (run number, date, files read, focus topics)
- [x] 1.2 Add a finding entry section with `### [Finding Title]`, `**Summary:**`, `**Evidence:**` block containing `**Source:**`, `**Type:**`, `**Quote:**`, and `**Confidence:**` fields
- [x] 1.3 Add confidence level definitions inline in the template (high/medium/low with descriptions)
- [x] 1.4 Add `**Related Findings:**` and `**Unknowns:**` fields to the finding entry section
- [x] 1.5 Add Cross-Cutting Observations section (patterns, contradictions, architectural insights)
- [x] 1.6 Add Summary section (confidence changes, questions answered/raised, contradiction count, next focus suggestions)

## 2. Update deepfield-learner agent

- [x] 2.1 Strengthen the "Link Findings to Source Files" section (section 7) to require evidence block for every discovery — not just inline citations
- [x] 2.2 Update the Output Format section to add `**Evidence:**` block with `**Source:**`, `**Type:**`, `**Quote:**`, and `**Confidence:**` fields under each `### Discovery:` entry
- [x] 2.3 Add confidence level definitions to the Output Format section
- [x] 2.4 Update the Guardrails section to add explicit rule: never write a finding without a source reference and evidence block

## 3. Update deepfield-domain-learner agent

- [x] 3.1 Update Key Patterns output format to include `**Evidence:**`, `**Type:**`, `**Quote:**`, and `**Confidence:**` fields under each pattern (not just a bare `file:line` reference)
- [x] 3.2 Update Open Questions Answered output format to include `**Type:**`, `**Quote:**`, and `**Confidence:**` alongside the existing `**Evidence:**` line
- [x] 3.3 Update the Guardrails section to explicitly prohibit claims without source references in any section of the findings output
