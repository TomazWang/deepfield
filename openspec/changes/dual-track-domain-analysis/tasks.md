## 1. CLI Script: detect-behavior-domains.js (new)

- [ ] 1.1 Create `plugin/scripts/detect-behavior-domains.js` — reads reference doc files from `--source-dir`, extracts candidate behavior domain names, outputs JSON array of `{ name, confidence, sourceFile }`
- [ ] 1.2 Register `bootstrap:detect-behavior-domains` subcommand in CLI (`cli/src/commands/bootstrap.ts` or equivalent)
- [ ] 1.3 Add unit test or smoke-test for `detect-behavior-domains.js` with a sample reference doc

## 2. Bootstrap Script: dual index generation

- [ ] 2.1 Update `plugin/scripts/bootstrap-runner.js` to write `wip/tech-index.md` instead of `wip/domain-index.md`
- [ ] 2.2 Add behavior domain detection step to `bootstrap-runner.js`: invoke `detect-behavior-domains`, store candidates for skill to use in Q&A
- [ ] 2.3 Add `wip/behavior-index.md` template to `plugin/templates/` (blank scaffold with header and domain list placeholder)
- [ ] 2.4 Add `wip/tech-index.md` template to `plugin/templates/` (blank scaffold matching new format)
- [ ] 2.5 Add `wip/domain-links.md` template to `plugin/templates/` (blank scaffold with Behavior/Tech sections)

## 3. Bootstrap Skill: interactive Q&A + dual indexes

- [ ] 3.1 Update `plugin/skills/deepfield-bootstrap.md` — replace domain detection step with dual-track step: (a) run bootstrap script for tech-index, (b) call detect-behavior-domains for candidates, (c) interactive Q&A unless `--skip-behavior-qa`, (d) write behavior-index.md
- [ ] 3.2 Update `plugin/skills/deepfield-bootstrap.md` — add step to invoke `deepfield-domain-linker` agent after both indexes exist
- [ ] 3.3 Update success criteria in `plugin/skills/deepfield-bootstrap.md` to check for `behavior-index.md`, `tech-index.md`, and `domain-links.md`

## 4. New Agent: deepfield-domain-linker

- [ ] 4.1 Create `plugin/agents/deepfield-domain-linker.md` — inputs: `behavior-index.md`, `tech-index.md`, source file list; output: `wip/domain-links.md`; preserves `<!-- user-confirmed -->` entries; adds `## Unmapped Tech Domains` for orphans
- [ ] 4.2 Update `plugin/skills/deepfield-iterate.md` to invoke `deepfield-domain-linker` after any batch that discovers new domains

## 5. Iterate Skill: --track flag + dual output routing

- [ ] 5.1 Update `plugin/skills/deepfield-iterate.md` — add `--track behavior|tech|both` parsing at command entry; default to `both`
- [ ] 5.2 Update `plugin/skills/deepfield-iterate.md` — scope domain queue based on track: behavior → read `behavior-index.md`; tech → read `tech-index.md`; both → read both
- [ ] 5.3 Update `plugin/skills/deepfield-iterate.md` — construct output path as `drafts/behavior/{name}/` or `drafts/tech/{name}/` based on domain track
- [ ] 5.4 Update `plugin/agents/deepfield-domain-learner.md` — add `track` input parameter; behavior track = focus on user-facing concerns, exclude implementation details; tech track = focus on architecture, exclude business justifications

## 6. Document Generator: output path update

- [ ] 6.1 Update `plugin/agents/deepfield-document-generator.md` — change output path from `drafts/domains/{name}/` to `drafts/{track}/{name}/spec.md`; agent receives `track` in its input
- [ ] 6.2 Update `plugin/agents/deepfield-document-generator.md` — support multiple spec files per domain (not just `behavior-spec.md`/`tech-spec.md`); default file is `spec.md`

## 7. State Management: project.config.json schema update

- [ ] 7.1 Update CLI init scaffolding (`cli/src/`) to write `behaviorDomains: []`, `techDomains: []`, `domainLinks: []` in new workspaces; remove `domains` field
- [ ] 7.2 Update any CLI scripts that read/write `project.config.json.domains` to use `techDomains` instead
- [ ] 7.3 Update `plugin/scripts/bootstrap-runner.js` to write `techDomains` and `behaviorDomains` to config (not `domains`)

## 8. Upgrade: migration to dual-track structure

- [ ] 8.1 Update `plugin/commands/df-upgrade.md` — add migration step 6: scaffold `drafts/behavior/` and `drafts/tech/`; move `drafts/domains/{name}/behavior-spec.md` → `drafts/behavior/{name}/spec.md`; move `drafts/domains/{name}/tech-spec.md` → `drafts/tech/{name}/spec.md`
- [ ] 8.2 Update `plugin/commands/df-upgrade.md` — add migration step for `wip/domain-index.md` → `wip/tech-index.md`; create empty `wip/behavior-index.md` and `wip/domain-links.md`
- [ ] 8.3 Update `plugin/skills/deepfield-upgrade.md` — handle flat `spec.md` case (no behavior/tech split yet): invoke AI to split, write both tracks, preserve original until validated
- [ ] 8.4 Update `plugin/skills/deepfield-upgrade.md` — update `project.config.json`: move `domains` → `techDomains`; add empty `behaviorDomains` and `domainLinks`; bump `workspaceVersion` to `0.7.0`

## 9. Scaffold: new directory templates

- [ ] 9.1 Update `cli/src/` init scaffolding to create `drafts/behavior/` and `drafts/tech/` directories (not `drafts/domains/`)
- [ ] 9.2 Update `plugin/scripts/generate-domain-readme.js` (if it exists) to enumerate `drafts/behavior/` and `drafts/tech/` instead of `drafts/domains/`
- [ ] 9.3 Update any path references to `drafts/domains/` in remaining plugin files (grep for `drafts/domains`)
