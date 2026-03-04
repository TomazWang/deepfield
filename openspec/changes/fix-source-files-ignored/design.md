## Context

The `deepfield-iterate` skill drives all learning cycles. In Step 3 (Incremental Scanning) it hashes files under `deepfield/source/baseline/repos/` to build `filesToRead`, then passes that list to the learner agent. Files that users place in `deepfield/source/source-doc/` (or any non-repo subdirectory of `source/`) are never discovered or read.

Binary document formats (PDF, PPTX, DOCX) cannot be read as raw text; they require extraction libraries to produce usable plain text before they can be passed to an agent.

## Goals / Non-Goals

**Goals:**
- Detect all user-provided files under `deepfield/source/` (excluding `baseline/repos/` and staging directories)
- Extract plain-text content from PDF, DOCX, and PPTX files
- Pass extracted content to the learner agent as additional context each run
- Warn clearly when a file format cannot be processed

**Non-Goals:**
- OCR for image-only PDFs (out of scope; warn and skip)
- Extracting embedded images from Office documents
- Re-extracting source docs that have not changed between runs (hash-based skip is a future optimisation; for now always re-extract)
- Modifying the classifier agent or df-input command

## Decisions

### Decision 1: New script `scan-source-docs.js`

Extraction logic is placed in a dedicated CJS script (`plugin/scripts/scan-source-docs.js`) rather than inline in the skill, consistent with the project's Command → Skill → Script → Agent pattern. The script is invoked by the skill and writes output to `deepfield/wip/run-N/source-docs/`.

Alternatives considered:
- Inline extraction in the skill: violates the architecture pattern and makes the skill harder to test.
- Separate agent for extraction: unnecessary for deterministic text extraction; agents are reserved for AI reasoning tasks.

### Decision 2: Extract to markdown files, not a single blob

Each source document gets its own `<filename>.md` file inside `deepfield/wip/run-N/source-docs/`. This keeps individual file provenance clear, lets the learner agent cite specific source documents, and makes the extracted content inspectable by the user.

### Decision 3: Extraction libraries

| Format | Library | Rationale |
|--------|---------|-----------|
| PDF | `pdf-parse` | Widely used, no native bindings required |
| DOCX | `mammoth` | Produces clean text, already referenced in issue |
| PPTX | `pptx-parser` | Provides per-slide text access |
| MD/TXT/RST | Node.js `fs` | Direct read, no extraction needed |

### Decision 4: Include extracted docs alongside repo files in `filesToRead`

The skill appends the paths of all generated `source-docs/*.md` files to `filesToRead` before launching the learner agent. This requires minimal changes to the existing skill flow.

## Risks / Trade-offs

- **Large documents slow down the agent context window** → Mitigation: truncate extracted text to 50 000 characters per file and note the truncation in the markdown header.
- **`pdf-parse` may fail on encrypted or scan-only PDFs** → Mitigation: catch errors per file, write a warning stub markdown, continue processing remaining files.
- **`pptx-parser` API may differ from examples in issue** → Mitigation: script verifies available API at runtime and falls back gracefully with a warning.
- **Re-extracting every run is wasteful for large doc sets** → Acceptable for v1; hash-based skip can be added later.

## Migration Plan

1. Add `pdf-parse`, `mammoth`, `pptx-parser` to `plugin/package.json` dependencies.
2. Add `plugin/scripts/scan-source-docs.js`.
3. Update `plugin/skills/deepfield-iterate.md` Step 3 to call the script and include results.
4. No state format changes; no migration required for existing deepfield projects.

## Open Questions

- None blocking implementation.
