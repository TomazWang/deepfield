## 1. Templates

- [x] 1.1 Create `plugin/templates/behavior-spec.md` with audience boundary comment, metadata header (Last Updated, Confidence), and sections: User Stories, Scenarios, Product Features, Business Rules, Open Questions
- [x] 1.2 Create `plugin/templates/tech-spec.md` with audience boundary comment, metadata header (Last Updated, Confidence), and sections: Architecture (ASCII diagram placeholder), Key Implementations, Design Patterns, Data Models, Dependencies, Technical Decisions, Open Questions

## 2. deepfield-document-generator Agent

- [x] 2.1 Create `plugin/agents/deepfield-document-generator.md` with frontmatter (`name`, `description`, `color`)
- [x] 2.2 Define agent input contract: domain name, findings path, existing behavior-spec path, existing tech-spec path, output language, optional legacy_draft_path for migration mode
- [x] 2.3 Write agent Role section: responsibility to generate and update behavior-spec.md and tech-spec.md from findings
- [x] 2.4 Write agent content-split enforcement rules (no file paths in behavior-spec; no user stories in tech-spec)
- [x] 2.5 Write agent Output Tasks section: create from template when files don't exist; integrate (expand, don't replace) when files exist
- [x] 2.6 Write agent Migration Mode section: read legacy flat file, classify sections as behavior or tech, write both files, add uncertain-classification comment for ambiguous sections
- [x] 2.7 Write agent Changelog Update section: append to `deepfield/drafts/_changelog.md` after writing spec files
- [x] 2.8 Write agent Confidence Metadata section: update Last Updated and Confidence header in each spec file after writing
- [x] 2.9 Write agent Cross-Reference section: add `./tech-spec.md` / `./behavior-spec.md` links between files for features mentioned in both

## 3. deepfield-knowledge-synth Agent Update

- [x] 3.1 Update `plugin/agents/deepfield-knowledge-synth.md` Section 1 (Draft Document Creation): change output path from `deepfield/drafts/domains/<topic>.md` to `deepfield/drafts/domains/<topic>/behavior-spec.md` and `deepfield/drafts/domains/<topic>/tech-spec.md`; delegate actual writing to `deepfield-document-generator`
- [x] 3.2 Update Section 5 (Add Cross-References): change relative link examples from `./authentication.md` to `./authentication/tech-spec.md` (or behavior-spec) to match new paths
- [x] 3.3 Update the template/structure example in Section 1 to reflect the two-file output format

## 4. deepfield-iterate Skill Update

- [x] 4.1 Update Step 4b `agentTasks` preparation: replace `currentDraftPath: deepfield/drafts/domains/${domain.name}.md` with `behaviorSpecPath: deepfield/drafts/domains/${domain.name}/behavior-spec.md` and `techSpecPath: deepfield/drafts/domains/${domain.name}/tech-spec.md`
- [x] 4.2 Update the inline agent prompt in Step 4d: replace `- Current draft: ${domain.currentDraftPath}` with `- Behavior spec: ${domain.behaviorSpecPath}` and `- Tech spec: ${domain.techSpecPath}`
- [x] 4.3 Update Step 5 `deepfield-knowledge-synth` invocation: change `existing_drafts` glob from `deepfield/drafts/domains/*.md` to `deepfield/drafts/domains/**/*.md`
- [x] 4.4 Update Step 5 completion report message listing updated documentation: change example paths from `deepfield/drafts/domains/authentication.md` to `deepfield/drafts/domains/authentication/behavior-spec.md` and `deepfield/drafts/domains/authentication/tech-spec.md`
- [x] 4.5 Update Step 5.5.2 domain enumeration comment and bash example: replace the `*.md`-listing approach with subdirectory enumeration (`ls -d deepfield/drafts/domains/*/`)
- [x] 4.6 Update `generate-domain-readme.js` script call in Step 5.5.2: the script must receive paths to both `behavior-spec.md` and `tech-spec.md` so the generated README can link to both

## 5. generate-domain-readme.js Script Update

- [x] 5.1 Update `plugin/scripts/generate-domain-readme.js` to enumerate domain subdirectories instead of `*.md` files at the `domains/` level
- [x] 5.2 Update the script to include links to both `./behavior-spec.md` and `./tech-spec.md` in the generated README, showing confidence score and last-updated run for each

## 6. /df-upgrade Plugin Command Update

- [x] 6.1 Locate the `/df-upgrade` plugin command file (e.g., `plugin/commands/df-upgrade.md`) and add a Draft Migration section after the standard upgrade steps
- [x] 6.2 Add detection logic: scan `deepfield/drafts/domains/` for `{domain}.md` flat files; list detected legacy domains before prompting
- [x] 6.3 Add confirmation prompt before starting migration
- [x] 6.4 For each legacy domain: invoke `deepfield-document-generator` in migration mode (pass `legacy_draft_path`), wait for completion, check that both output files exist
- [x] 6.5 On success per domain: rename `{domain}.md` to `{domain}/_legacy.md`
- [x] 6.6 On failure per domain: leave `{domain}.md` in place; record failure in migration report; continue with remaining domains
- [x] 6.7 After all domains processed: run cross-reference link update (scan all `*.md` files under `drafts/` and replace `](./{domain}.md)` → `](../{domain}/tech-spec.md)`)
- [x] 6.8 Write migration report to `deepfield/wip/migration-split-spec.md` with per-domain status and link-update summary
- [x] 6.9 Display human-readable migration summary table to user and print path to the full report
- [x] 6.10 Add re-run safety check: if `/df-upgrade` is run again, skip domains that already have both split files; only retry domains with remaining legacy files

## 7. Verification

- [x] 7.1 Verify `plugin/templates/behavior-spec.md` exists and contains all required sections (audience comment, metadata, User Stories, Scenarios, Product Features, Business Rules, Open Questions)
- [x] 7.2 Verify `plugin/templates/tech-spec.md` exists and contains all required sections (audience comment, metadata, Architecture, Key Implementations, Design Patterns, Data Models, Dependencies, Technical Decisions, Open Questions)
- [x] 7.3 Verify `plugin/agents/deepfield-document-generator.md` exists with valid frontmatter and covers: new domain creation, existing domain update, migration mode, content split enforcement, changelog update, confidence metadata update, cross-references
- [x] 7.4 Verify `plugin/agents/deepfield-knowledge-synth.md` no longer references `drafts/domains/<topic>.md` as a write target (read-only references via `**/*.md` glob are acceptable)
- [x] 7.5 Verify `plugin/skills/deepfield-iterate.md` Step 4b uses `behaviorSpecPath` and `techSpecPath` instead of `currentDraftPath`
- [x] 7.6 Verify `plugin/skills/deepfield-iterate.md` Step 5 `existing_drafts` uses `deepfield/drafts/domains/**/*.md`
- [x] 7.7 Verify `plugin/skills/deepfield-iterate.md` Step 5.5.2 uses subdirectory enumeration
- [x] 7.8 Verify `/df-upgrade` command handles detection, confirmation, migration, archive, link-update, report, and re-run safety for draft migration
