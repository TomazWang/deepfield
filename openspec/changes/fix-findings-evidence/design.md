## Context

The learning agents (`deepfield-learner` and `deepfield-domain-learner`) produce findings files during iterative learning cycles. Currently, findings contain claim text without mandatory source references, evidence types, quotes, or confidence levels. The `deepfield-domain-learner` already includes `file:line` in some output format examples but does not enforce it for every claim. There is no `findings.md` template to guide the scaffolding process. This fix brings both agents and a new template into alignment with the expected evidence-backed findings format from issue #34.

## Goals / Non-Goals

**Goals:**
- Every finding claim is backed by at least one source reference (`file:line`)
- Evidence includes type classification (code/comment/doc/test) and a quote/snippet
- Confidence level (high/medium/low) is assigned to every finding
- A `findings.md` template exists in `plugin/templates/` for scaffolding
- Agent prompts enforce evidence collection as a hard requirement

**Non-Goals:**
- Retroactive migration of existing findings files in user projects
- Automatic validation that agents actually cited sources (enforcement is prompt-based)
- Confidence scoring algorithm or automated confidence calculation
- Clickable hyperlinks to source files (noted as future enhancement in the issue)

## Decisions

### Decision 1: Template mirrors issue's expected output format exactly

The `findings.md` template will use the structured format from the issue: `### [Finding Title]`, `**Summary:**`, `**Evidence:**` (with Source/Type/Quote sub-fields), `**Confidence:**`, `**Related Findings:**`, `**Unknowns:**`. This makes the format immediately recognizable to users who read the issue and provides a concrete contract for agents.

**Alternative considered:** A lighter format with just `file:line` inline citations. Rejected because it doesn't enforce evidence type or quote, which the issue specifically requires.

### Decision 2: Agent prompt changes are additive, not structural rewrites

Rather than restructuring the entire agent files, we add explicit evidence-mandate sections to the Output Format and Guardrails sections. The `deepfield-learner` already has a "Link Findings to Source Files" section — we strengthen it. The `deepfield-domain-learner` already uses `file:line` in some places — we make it uniform across all sections.

**Alternative considered:** Full agent rewrite. Rejected as high-risk; existing content is well-structured and only the evidence requirements need tightening.

### Decision 3: Confidence levels are three-tier (high/medium/low) with definitions

Definitions match the issue: High = multiple sources confirm, Medium = single authoritative source, Low = inference or assumption. These definitions will appear in the template and agent prompts so they are applied consistently.

## Risks / Trade-offs

- **Agent compliance risk** → Agents may still write findings without full evidence if context window is constrained. Mitigation: Make the guardrails section explicit ("NEVER write a finding without an Evidence block") and put the mandate early in the agent prompt.
- **Template verbosity** → The evidence block adds lines per finding. Mitigation: The template is a scaffold — agents fill in what applies and can compress when evidence is a single inline citation.

## Migration Plan

No migration needed. Changes are to plugin source files only. Existing user project findings files are unaffected. New runs after plugin update will produce evidence-backed findings automatically.
