## Why

Users place PDF, PPTX, and other document files in `deepfield/source/source-doc/` expecting Deepfield to read them during learning, but the learning skill only scans baseline repository code — it never reads user-provided source documents. This silently discards answers to open questions and breaks the core workflow.

## What Changes

- Add a `scan-source-docs.js` script that discovers all files under `deepfield/source/` (excluding `baseline/repos/` and staging dirs) and extracts readable text from them
- Support `.md`, `.txt`, `.rst` (direct read), `.pdf` (text extraction via `pdf-parse`), `.docx` (extraction via `mammoth`), and `.pptx` (slide text via `pptx-parser`); warn and skip unsupported binary types
- Save extracted content as markdown files in `deepfield/wip/run-N/source-docs/` so they are available to the learner agent
- Update `deepfield-iterate` skill (Step 3 – Incremental Scanning) to invoke `scan-source-docs.js` and include the resulting markdown files in `filesToRead` passed to the learner agent
- Report what was found, extracted, and any unsupported-format warnings to the user during iteration

## Capabilities

### New Capabilities
- `source-doc-extraction`: Detect and extract text from user-provided source documents (PDF, DOCX, PPTX, plain text) and make content available to the learning agent

### Modified Capabilities
- `plugin-skills`: The `deepfield-iterate` skill's scanning step is extended to include source-doc extraction — the requirement that "files to read" covers user-provided documents is new spec-level behaviour

## Impact

- **New script**: `plugin/scripts/scan-source-docs.js` (Node.js CJS)
- **Modified skill**: `plugin/skills/deepfield-iterate.md` — Step 3 (Incremental Scanning) updated to call `scan-source-docs.js` and include results in `filesToRead`
- **New dependencies**: `pdf-parse`, `mammoth`, `pptx-parser` added to `plugin/package.json`
- No breaking changes to existing commands or state format
