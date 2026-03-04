## 1. New Domain-Learner Agent

- [x] 1.1 Create `plugin/agents/deepfield-domain-learner.md` — focused single-domain learning agent with inputs (domain name, file list, previous findings path, output paths) and outputs (domain findings + unknowns files)

## 2. Consolidation Script

- [x] 2.1 Create `plugin/scripts/gather-domain-findings.js` — reads all `<run-dir>/domains/*.md` files, concatenates with domain-header delimiters into `<run-dir>/findings.md`, logs warnings for missing domains, exits non-zero only if no findings exist at all

## 3. Command Updates

- [x] 3.1 Update `plugin/commands/df-iterate.md` — add `--parallel` and `--max-agents` argument definitions, document parallel mode behavior, pass flags through to skill

## 4. Skill Updates

- [x] 4.1 Update `plugin/skills/deepfield-iterate.md` — add "Parallel Mode" execution path section that: reads domain-index.md to get domains, splits into batches of max-agents (default 5), launches `deepfield-domain-learner` as background Tasks per domain in each batch, waits for batch completion, then calls `gather-domain-findings.js` to consolidate before proceeding to synthesis
- [x] 4.2 Update `plugin/skills/deepfield-iterate.md` — add partial failure handling: after all Tasks complete, verify each `<domain>-findings.md` exists, list missing ones in a warning, proceed with available findings
- [x] 4.3 Update `plugin/skills/deepfield-iterate.md` — add parallel mode progress reporting: print number of domains, batch count, per-batch status as agents complete
