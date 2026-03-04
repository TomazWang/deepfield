## 1. Templates

- [x] 1.1 Create `plugin/templates/terminology.md` with alphabetical section skeleton, header metadata (last updated run, total terms), and example entry format
- [x] 1.2 Create `plugin/templates/new-terms.md` with per-run term format (term name, expansion, definition, domain, files, first-seen run)

## 2. Agent

- [x] 2.1 Create `plugin/agents/deepfield-term-extractor.md` agent that reads a file list and previous glossary, extracts domain terms/acronyms/definitions, and writes `wip/run-N/new-terms.md`

## 3. Scripts

- [x] 3.1 Create `plugin/scripts/extract-terminology.js` (CJS, module.exports) that accepts `--run <N>` and `--files-json <path>` args, reads the file list, constructs agent input, launches the term-extractor agent, and writes `wip/run-N/new-terms.md`
- [x] 3.2 Create `plugin/scripts/merge-glossary.js` (CJS, module.exports) that reads `wip/run-N/new-terms.md` and existing `drafts/cross-cutting/terminology.md`, merges entries (case-insensitive key on term name), and writes the result atomically using tmp-then-rename

## 4. Skill Integration

- [x] 4.1 Update `plugin/skills/deepfield-iterate.md` to add Step 5.5 (Terminology Extraction) between synthesis and learning plan update: invoke `extract-terminology.js` then `merge-glossary.js`, with warning-only on failure
- [x] 4.2 Update `plugin/skills/deepfield-bootstrap.md` to create an empty `drafts/cross-cutting/terminology.md` from the template during Step 2 (after the bootstrap runner script) and add it to the Step 3 verification list
