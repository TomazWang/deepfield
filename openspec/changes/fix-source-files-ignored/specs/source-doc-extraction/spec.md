## ADDED Requirements

### Requirement: Script SHALL discover all user-provided source files
The `scan-source-docs.js` script MUST recursively list all files under `deepfield/source/` while excluding `baseline/repos/` subdirectories and any directory matching `run-*-staging`.

#### Scenario: Files in source-doc are discovered
- **WHEN** the script runs and `deepfield/source/source-doc/` contains files
- **THEN** all files in that directory are included in the discovered list

#### Scenario: Baseline repo files are excluded
- **WHEN** `deepfield/source/baseline/repos/` contains code files
- **THEN** those files are NOT included in the discovered list

#### Scenario: Staging directories are excluded
- **WHEN** `deepfield/source/run-2-staging/` exists with content
- **THEN** those files are NOT included in the discovered list

### Requirement: Script SHALL extract text from supported document formats
The script MUST extract plain text from PDF (`.pdf`), DOCX (`.docx`), and PPTX (`.pptx`) files using appropriate libraries, and read plain text directly from `.md`, `.txt`, and `.rst` files.

#### Scenario: PDF text extraction
- **WHEN** a `.pdf` file with a text layer is discovered
- **THEN** the script extracts the text content
- **THEN** a markdown file is written to `deepfield/wip/run-N/source-docs/<filename>.md` containing the extracted text and a header noting the original file path and page count

#### Scenario: DOCX text extraction
- **WHEN** a `.docx` file is discovered
- **THEN** the script extracts the raw text via mammoth
- **THEN** a markdown file is written to `deepfield/wip/run-N/source-docs/<filename>.md`

#### Scenario: PPTX text extraction
- **WHEN** a `.pptx` file is discovered
- **THEN** the script extracts text from each slide
- **THEN** a markdown file is written to `deepfield/wip/run-N/source-docs/<filename>.md` with per-slide sections

#### Scenario: Plain text direct read
- **WHEN** a `.md`, `.txt`, or `.rst` file is discovered
- **THEN** the file content is copied as-is into the output markdown file

### Requirement: Script SHALL truncate very large extracted content
Extracted text exceeding 50 000 characters MUST be truncated to that limit and the markdown output MUST include a note that the content was truncated.

#### Scenario: Large PDF is truncated
- **WHEN** a PDF produces more than 50 000 characters of extracted text
- **THEN** the written markdown contains only the first 50 000 characters
- **THEN** a truncation notice is appended to the markdown header

### Requirement: Script SHALL handle extraction failures gracefully
When a file cannot be read or extraction fails, the script MUST write a warning stub markdown file and continue processing remaining files. It MUST NOT exit with a non-zero code due to a single file failure.

#### Scenario: Encrypted PDF cannot be parsed
- **WHEN** `pdf-parse` throws an error on a file
- **THEN** the script writes a stub markdown noting the file path and failure reason
- **THEN** the script continues to process remaining files

#### Scenario: Unsupported file format encountered
- **WHEN** a file with an unrecognised extension (e.g., `.ppt`, `.xls`) is found
- **THEN** the script writes a stub markdown warning about the unsupported format
- **THEN** the stub suggests converting the file to PDF or plain text

### Requirement: Script SHALL report a summary of what was processed
The script MUST print a human-readable summary to stdout listing each processed file, its type, and outcome (extracted / warning / skipped).

#### Scenario: Summary printed after processing
- **WHEN** the script finishes running
- **THEN** each discovered file is listed with status (extracted / warning / skipped)
- **THEN** total counts of extracted, warned, and skipped files are shown

### Requirement: Script SHALL output the list of generated markdown paths as JSON
The script MUST write a JSON array of absolute paths of all successfully generated markdown files to the path given by the `--output-index` flag, so the calling skill can consume them.

#### Scenario: Output index written
- **WHEN** the script completes and `--output-index` is provided
- **THEN** a JSON file is written at that path containing an array of markdown file paths
- **THEN** the array contains only files that were successfully written (not stubs for failures)
