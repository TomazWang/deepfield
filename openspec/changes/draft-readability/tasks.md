## 1. Templates

- [x] 1.1 Create `plugin/templates/drafts-index.md` template for `deepfield/drafts/README.md`
- [x] 1.2 Create `plugin/templates/domain-readme.md` template for `deepfield/drafts/domains/{domain}/README.md`
- [x] 1.3 Create `plugin/templates/run-review-guide.md` template for `deepfield/wip/run-N/review-guide.md`

## 2. Scripts

- [x] 2.1 Create `plugin/scripts/generate-drafts-index.js` — reads all domain drafts and `run-N.config.json`, writes `deepfield/drafts/README.md`
- [x] 2.2 Create `plugin/scripts/generate-domain-readme.js` — reads a single domain draft and run config, writes `deepfield/drafts/domains/{domain}/README.md`; accepts domain name as CLI argument
- [x] 2.3 Create `plugin/scripts/generate-run-review-guide.js` — reads run config, learning plan, and unknowns, writes `deepfield/wip/run-N/review-guide.md`; accepts run number as CLI argument

## 3. Skill Updates

- [x] 3.1 Update `plugin/skills/deepfield-iterate.md` — add post-synthesis step to invoke `generate-drafts-index.js`, `generate-domain-readme.js` (for all domains), and `generate-run-review-guide.js` after domain drafts are written
- [x] 3.2 Update `plugin/skills/deepfield-bootstrap.md` — add post-Run-0 step to invoke the same three scripts after initial drafts and learning plan are created

## 4. Agent Instructions

- [x] 4.1 Add 200-line maximum rule and splitting guidelines to the domain-draft-writing sections in `plugin/skills/deepfield-iterate.md`
- [x] 4.2 Add 200-line maximum rule and splitting guidelines to the domain-draft-writing sections in `plugin/skills/deepfield-bootstrap.md`
- [x] 4.3 Verify splitting convention documented: sub-files named `{domain}-{section}.md`, primary file links to sub-files via "See also" section
