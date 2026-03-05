## 1. Create deepfield-document-generator agent

- [ ] 1.1 Create `plugin/agents/deepfield-document-generator.md` with YAML frontmatter (name, description, color)
- [ ] 1.2 Write the Role section: specialized documentation agent focused on transforming findings into structured docs
- [ ] 1.3 Write the Input section documenting all eight inputs: findings, domain_findings_dir, existing_drafts_dir, staging_feedback, config, unknowns, changelog, run_number
- [ ] 1.4 Write the Output Language section: apply config.language to all new content (bilingual support, English fallback)
- [ ] 1.5 Write the Process section — Step 1: load staging feedback (if present) and parse user corrections
- [ ] 1.6 Write the Process section — Step 2: for each domain with findings, read existing behavior-spec.md (if any) and generate/update it with user stories, scenarios (Given-When-Then), business rules
- [ ] 1.7 Write the Process section — Step 3: for each domain with findings, read existing tech-spec.md (if any) and generate/update it with architecture, key components, data flow, integration points, open questions
- [ ] 1.8 Write the Process section — Step 4: apply domain-specific instructions from config.domainInstructions to the relevant domain's generated docs
- [ ] 1.9 Write the Process section — Step 5: update cross-cutting/unknowns.md (add new unknowns, remove resolved ones)
- [ ] 1.10 Write the Process section — Step 6: append run summary entry to _changelog.md
- [ ] 1.11 Write the Document Length Rule section referencing the ~350 prose lines guideline and sub-file splitting strategy
- [ ] 1.12 Write the Evidence Rules section: every technical claim must include a `[Evidence: file:line]` citation; low-confidence sections must be marked
- [ ] 1.13 Write the Guardrails section: never lose existing content, cite all claims, mark uncertainty, respect language config, update changelog

## 2. Update deepfield-iterate skill Step 5

- [ ] 2.1 In `plugin/skills/deepfield-iterate.md`, locate the Step 5 block (currently launches `deepfield-knowledge-synth`)
- [ ] 2.2 Replace the agent name from `deepfield-knowledge-synth` to `deepfield-document-generator`
- [ ] 2.3 Expand the Input block to add: `domain_findings_dir`, `staging_feedback` (path or null), `config` (deepfieldConfig object), `run_number`
- [ ] 2.4 Add staging feedback path resolution logic before the launch: check if `deepfield/source/run-${nextRun}-staging/feedback.md` exists; pass the path or null
- [ ] 2.5 Update the "Process Synthesis Output" comment block to describe the new output files (behavior-spec.md, tech-spec.md, cross-cutting updates) instead of the old monolithic draft update
- [ ] 2.6 Verify that the Document Length Rule reference in Step 5 still applies (update section heading if needed)

## 3. Deprecate deepfield-knowledge-synth

- [ ] 3.1 Add a deprecation notice comment block at the top of `plugin/agents/deepfield-knowledge-synth.md` stating it is no longer invoked by `deepfield-iterate` as of this change, and referencing `deepfield-document-generator` as the replacement
- [ ] 3.2 Do NOT delete or modify the agent's logic — preserve it in full for reference

## 4. Verify the changes are consistent

- [ ] 4.1 Read the updated Step 5 in `deepfield-iterate.md` and confirm all eight inputs are present in the launch block
- [ ] 4.2 Read `deepfield-document-generator.md` and confirm every input field named in the launch block has a corresponding documented section in the agent
- [ ] 4.3 Confirm the agent documents the behavior-spec.md and tech-spec.md output paths explicitly
- [ ] 4.4 Confirm the agent's output language section covers bilingual and English-only cases
- [ ] 4.5 Confirm the deprecation notice in `deepfield-knowledge-synth.md` is present and accurate
