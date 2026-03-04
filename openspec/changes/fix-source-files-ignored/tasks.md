## 1. Add Dependencies

- [x] 1.1 Add `pdf-parse`, `mammoth`, and `pptx-parser` to `plugin/package.json` dependencies

## 2. Create `scan-source-docs.js` Script

- [x] 2.1 Create `plugin/scripts/scan-source-docs.js` as a CJS module with CLI entry point accepting `--run-dir <path>` and `--source-dir <path>` and `--output-index <path>` flags
- [x] 2.2 Implement file discovery: recursively list all files under `deepfield/source/` excluding `baseline/repos/` and directories matching `run-*-staging`
- [x] 2.3 Implement plain-text read for `.md`, `.txt`, `.rst` files
- [x] 2.4 Implement PDF extraction using `pdf-parse`, writing output to `<run-dir>/source-docs/<filename>.md` with header (original path, page count)
- [x] 2.5 Implement DOCX extraction using `mammoth`, writing output to `<run-dir>/source-docs/<filename>.md`
- [x] 2.6 Implement PPTX extraction using `pptx-parser`, writing per-slide sections to `<run-dir>/source-docs/<filename>.md`
- [x] 2.7 Implement 50 000-character truncation with truncation notice in the markdown header
- [x] 2.8 Implement per-file error handling: on failure write a warning stub markdown and continue; unsupported extensions get a stub with conversion suggestions
- [x] 2.9 Implement stdout summary report (per-file status, totals)
- [x] 2.10 Write the `--output-index` JSON file containing paths of successfully generated markdown files

## 3. Update `deepfield-iterate` Skill

- [x] 3.1 In `plugin/skills/deepfield-iterate.md` Step 3 (Incremental Scanning), add a sub-step after hash comparison that invokes `scan-source-docs.js` with the current run directory
- [x] 3.2 Read the JSON index output by `scan-source-docs.js` and append the paths to `filesToRead`
- [x] 3.3 Surface the script's stdout summary to the user as part of the scan report
- [x] 3.4 Ensure the skill continues normally when the JSON index is empty (no source docs present)
