## 1. CLI: upgrade:scaffold-cross-cutting helper command

- [ ] 1.1 Add `createScaffoldCrossCuttingCommand()` factory function in `cli/src/commands/upgrade-helpers.ts` following the existing helper pattern (`createApplyOpCommand`, `createBackupCommand`, etc.)
- [ ] 1.2 The command accepts `--deepfield-dir <path>` (default `./deepfield`) and `--templates-dir <path>` options
- [ ] 1.3 For each cross-cutting file (`terminology.md`, `unknowns.md`), check existence and create atomically from template if missing (write to `.tmp` then rename)
- [ ] 1.4 Print `Created: drafts/cross-cutting/<file>` or `Already exists: drafts/cross-cutting/<file>` per file; exit 0
- [ ] 1.5 Register `createScaffoldCrossCuttingCommand()` in `cli/src/index.ts` (or wherever other upgrade helpers are registered)
- [ ] 1.6 Verify: run `deepfield upgrade:scaffold-cross-cutting` on a workspace missing `terminology.md` and confirm the file is created from template

## 2. Plugin: /df-upgrade skill calls scaffold helper

- [ ] 2.1 Locate the `/df-upgrade` plugin skill (or command) and add a step that invokes `upgrade:scaffold-cross-cutting` via `node ${CLAUDE_PLUGIN_ROOT}/cli upgrade:scaffold-cross-cutting` after backup creation
- [ ] 2.2 Display a user-visible message: "Scaffolded missing cross-cutting files" (or "Cross-cutting files already present" if no changes were made)

## 3. Plugin skill: terminology.md guard in deepfield-iterate Step 5.6

- [ ] 3.1 In `plugin/skills/deepfield-iterate.md`, add a pre-check immediately before the Step 5.6 `extract-terminology.js` invocation: check if `deepfield/drafts/cross-cutting/terminology.md` exists
- [ ] 3.2 If missing, invoke `upgrade:scaffold-cross-cutting` (or equivalent CLI call) to create it, then log the warning message specified in the spec
- [ ] 3.3 Verify the guard does not abort the run when `terminology.md` is absent — learning continues normally

## 4. Plugin agent: unknowns.md guard in deepfield-knowledge-synth

- [ ] 4.1 In `plugin/agents/deepfield-knowledge-synth.md`, add a pre-check before the section that writes to `unknowns.md`: verify the file exists
- [ ] 4.2 If missing, the agent invokes `upgrade:scaffold-cross-cutting` (or direct CLI call) to create `unknowns.md` from template, then logs the warning specified in the spec
- [ ] 4.3 Verify synthesis continues normally after the guard creates the file

## 5. Plugin agent: deepfield-glossary-aligner (new agent)

- [ ] 5.1 Create `plugin/agents/deepfield-glossary-aligner.md` with role, input, and output sections
- [ ] 5.2 Agent reads `terminology.md` and extracts canonical terms with their synonyms list
- [ ] 5.3 Agent reads all `deepfield/drafts/domains/*.md` draft files
- [ ] 5.4 For each canonical term, agent performs word-boundary-aware synonym replacement in draft text (case-insensitive; skip plurals and partial matches as per spec)
- [ ] 5.5 Agent writes changes to each modified draft via `upgrade:apply-op --type update`
- [ ] 5.6 Agent writes `deepfield/wip/run-N/alignment-log.md` listing every substitution (file, canonical term, synonym replaced, count) or noting no changes / empty glossary

## 6. Plugin skill: Step 5.8 glossary alignment in deepfield-iterate

- [ ] 6.1 In `plugin/skills/deepfield-iterate.md`, add Step 5.8 after Step 5.7 (confidence scoring)
- [ ] 6.2 Step 5.8 launches the `deepfield-glossary-aligner` agent with the current run number, path to `terminology.md`, and the list of domain drafts
- [ ] 6.3 Step 5.8 is non-blocking: wrap in error-handling that logs a warning and continues if the agent fails
- [ ] 6.4 Step 5.8 handles empty glossary gracefully: if `terminology.md` has no terms, the aligner skips and logs accordingly
- [ ] 6.5 Verify: run `/df-iterate` with synonyms present in a domain draft and confirm the draft is updated and the alignment log is written

## 7. Plugin agent: bilingual glossary in deepfield-term-extractor

- [ ] 7.1 In the `deepfield-term-extractor` agent (locate or create at `plugin/agents/deepfield-term-extractor.md`), add instructions for bilingual entry generation when `output_language` is not plain "English"
- [ ] 7.2 For bilingual settings (e.g., "English + Zh-TW"): write definition and usage in English first, then the second language immediately below within the same entry block
- [ ] 7.3 For monolingual non-English settings: write definition and usage in the configured language; keep the term heading in English
- [ ] 7.4 Verify: set `DEEPFIELD.md` language to "English + Zh-TW", run `/df-iterate`, and confirm new glossary entries contain both language blocks

## 8. Verify merge-glossary.js handles bilingual entries

- [ ] 8.1 Review `plugin/scripts/merge-glossary.js` to confirm it treats entry content as opaque text and does not strip or reformat content between the `### TERM` header and the next `### ` header
- [ ] 8.2 If reformatting is found, add a test fixture with a bilingual entry and adjust the merge logic to preserve multi-line content verbatim
- [ ] 8.3 Verify: merge a bilingual new-terms file into an existing glossary and confirm both language blocks appear in the output unchanged
