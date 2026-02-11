## Context

Deepfield is designed to help developers understand brownfield projects through autonomous, iterative learning. The system will eventually support autonomous AI-driven learning cycles, but requires a solid foundation first.

**Current State:** Design documentation exists in `kb-design-purpose/` covering:
- Command→Skill→Script→Agent architecture pattern
- Four-space design (source/, wip/, drafts/, output/)
- Autonomous iteration with stop conditions
- Incremental scanning and knowledge accumulation
- Domain decomposition approach

**Constraints:**
- Must be a standalone Claude Code plugin
- File operations must be atomic (prevent corrupted state)
- No AI autonomy in Phase 1 (building foundation only)
- Must support future incremental scanning (file hashing)
- Scripts must be testable independently

**Stakeholders:**
- Plugin users: Developers trying to understand legacy codebases
- Future implementation phases: Need robust, tested foundation

## Goals / Non-Goals

**Goals:**
- Establish plugin structure that supports Command→Skill→Script→Agent pattern
- Create atomic file operation scripts for reliable state management
- Implement scaffolding command (`/df-init`) that creates kb/ directory structure
- Implement interactive setup command (`/df-start`) for project initialization
- Implement status command (`/df-status`) for state inspection
- Build state management utilities for tracking configuration and runs
- Create templates for config files
- Add file hashing utilities (prepare for Phase 2 incremental scanning)

**Non-Goals:**
- AI autonomy or learning capabilities (Phase 3+)
- Incremental scanning implementation (Phase 2)
- Agent system (Phase 3+)
- Skills orchestration (Phase 2+)
- Source classification or input handling (Phase 2)
- Knowledge synthesis or draft generation (Phase 2+)

## Decisions

### 1. Plugin Structure: Flat Commands vs Nested

**Decision:** Use flat command structure with commands/ directory at plugin root.

**Rationale:**
- Phase 1 has only 3 simple commands, no complex orchestration
- Nested structure (commands/, skills/, agents/, scripts/) adds overhead for foundation
- Can refactor to nested structure in Phase 2 when skills are introduced
- Claude Code plugin conventions support both patterns

**Alternatives Considered:**
- Full nested structure now: Premature for 3 simple commands
- No structure: Doesn't scale to future phases

### 2. Script Language: Shell vs Node.js

**Decision:** Use Node.js for all scripts requiring JSON manipulation, shell for simple file operations.

**Rationale:**
- JSON manipulation is cleaner in Node.js (native support)
- State management requires frequent JSON read/write/update
- Shell is sufficient for directory creation and simple operations
- Node.js scripts are easier to test with proper tooling

**File operations breakdown:**
- Shell: `mkdir-recursive.sh`, `scaffold-kb.sh`
- Node.js: `update-json.js`, `read-state.js`, `hash-files.js`

**Alternatives Considered:**
- Pure shell with jq: More dependencies, harder JSON manipulation
- Pure Node.js: Overkill for simple directory operations

### 3. Atomic File Operations Strategy

**Decision:** Write-to-temp-then-rename pattern for all state modifications.

**Rationale:**
- Prevents partial writes on failure (disk full, interrupt)
- Standard pattern for atomic operations on POSIX systems
- Minimal overhead for small files (all configs are < 1MB)
- Enables transaction-like boundaries for future error recovery

**Implementation:**
```javascript
// update-json.js pattern
const tempFile = `${targetFile}.tmp`;
fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
fs.renameSync(tempFile, targetFile); // atomic on POSIX
```

**Alternatives Considered:**
- Direct writes: Risk of corruption on failure
- Lock files: Additional complexity, not needed for Phase 1
- Database (SQLite): Overkill for simple config files

### 4. State Management: Files vs Database

**Decision:** Use JSON files for all state management in Phase 1.

**Rationale:**
- Simple to inspect and debug (human-readable)
- No additional dependencies (SQLite, etc.)
- Sufficient for Phase 1 scale (single project, < 100 runs)
- Easy to version control for testing
- Atomic writes via temp-then-rename pattern

**State files:**
- `kb/project.config.json`: Project configuration (persistent)
- `kb/wip/run-N/run-N.config.json`: Per-run metadata and file hashes
- `kb/wip/domain-index.md`: Domain decomposition (Markdown for readability)
- `kb/wip/project-map.md`: Living overview (Markdown for readability)

**Alternatives Considered:**
- SQLite: Better for Phase 3+ with queries, but premature optimization
- YAML: Less tooling support, not native in Node.js
- Plain text: Harder to parse and update programmatically

### 5. Template System: Embedded vs Separate Files

**Decision:** Embed templates in command files as heredocs/template literals.

**Rationale:**
- Phase 1 has few templates (brief.md, 2 config files)
- Embedding keeps commands self-contained
- No need to manage separate template/ directory yet
- Easier to modify during rapid development

**Future:** Move to separate templates/ directory in Phase 2 when template count grows.

**Alternatives Considered:**
- Separate template files: Better organization but overhead for 3 templates
- External template library: Overkill for simple templates

### 6. File Hashing: Algorithm Choice

**Decision:** Use git blob hash for git repos, MD5 for other files.

**Rationale:**
- Git repos: Leverage existing git infrastructure (`git ls-tree`)
- Other sources: MD5 is fast and sufficient (not cryptographic use)
- Prepares for Phase 2 incremental scanning
- Phase 1 only implements hashing, not diff comparison

**Alternatives Considered:**
- SHA256 everywhere: Slower, overkill for non-security use
- MD5 everywhere: Can't leverage git's existing hashes
- No hashing in Phase 1: Would delay Phase 2 implementation

### 7. Command Implementation: Pure AI vs Script-backed

**Decision:** Commands delegate file operations to scripts, use AI for Q&A only.

**Rationale:**
- Robust: Scripts are tested, AI generation can be inconsistent
- Testable: Scripts can be tested independently
- Follows design principle: Command→Script pattern
- AI used for interactive Q&A in `/df-start`, not file operations

**Command responsibilities:**
- `/df-init`: Parse args → call `scaffold-kb.sh`
- `/df-start`: Interactive Q&A → call scripts to create files
- `/df-status`: Read state files → format output

**Alternatives Considered:**
- AI generates everything: Risky, harder to test, violates design principles
- Pure CLI (no AI): Less interactive, harder to use

## Risks / Trade-offs

### Risk 1: JSON Schema Drift
**Risk:** project.config.json and run.config.json schemas may evolve, breaking backward compatibility.

**Mitigation:**
- Add `version` field to all JSON files from start
- Document schema in DESIGN.md
- Plan for migration utilities in Phase 2

### Risk 2: Script Dependencies
**Risk:** Node.js scripts require Node runtime, may not be available in all environments.

**Mitigation:**
- Document Node.js requirement (v16+) in README
- Provide clear error messages if Node not found
- Keep scripts simple (no external npm dependencies)

### Risk 3: File Permission Issues
**Risk:** Script failures due to file permissions in kb/ directory.

**Mitigation:**
- Check write permissions in `/df-init` before scaffolding
- Provide clear error messages with suggested fixes
- Document required permissions in README

### Risk 4: Premature Abstraction
**Risk:** Over-engineering Phase 1 for future phases that may change.

**Mitigation:**
- Keep it simple: Only build what's needed for Phase 1
- Document refactoring points in code comments
- Accept some rework in Phase 2 (prefer working code over perfect code)

### Trade-off 1: JSON vs YAML
**Trade-off:** JSON is verbose but has better Node.js tooling. YAML is cleaner but needs parsing library.

**Decision:** Use JSON for programmatic files (configs), Markdown for human-readable files (maps, plans).

### Trade-off 2: Shell vs Node
**Trade-off:** Shell is ubiquitous but limited. Node.js is powerful but requires runtime.

**Decision:** Use both - shell for simple ops, Node.js for JSON manipulation. Document Node requirement.

### Trade-off 3: Embedded vs Separate Templates
**Trade-off:** Embedded templates are convenient but harder to maintain at scale.

**Decision:** Start embedded, refactor to separate files in Phase 2 when template count grows.

## Migration Plan

Not applicable for Phase 1 (greenfield implementation). No existing system to migrate from.

**Deployment:**
1. Create plugin directory structure
2. Add plugin.json manifest
3. Implement scripts
4. Implement commands
5. Test scaffolding flow (`/df-init` → `/df-start` → `/df-status`)
6. Document usage in README

**Rollback:** Delete `.claude/plugins/deepfield/` directory (no state to preserve in Phase 1).

## Open Questions

### Q1: Should `/df-init` prompt for kb/ location or always use current directory?
**Options:**
- Always use `./kb/` in current directory (simple, predictable)
- Prompt for location (flexible, more complex)

**Recommendation:** Start with `./kb/`, add `--path` flag later if needed.

### Q2: How verbose should `/df-status` be by default?
**Options:**
- Minimal: Just state and run count
- Detailed: Include all config values
- Tiered: Minimal by default, `--verbose` flag for details

**Recommendation:** Tiered approach with `--verbose` flag.

### Q3: Should scripts handle errors or delegate to commands?
**Options:**
- Scripts exit with error codes, commands handle messaging
- Scripts output error messages directly

**Recommendation:** Scripts exit with codes, commands handle user-facing messages (better for testing).

### Q4: File hashing in Phase 1: Implement now or stub?
**Options:**
- Implement fully: Ready for Phase 2
- Stub only: Faster Phase 1 delivery

**Recommendation:** Implement fully (hash-files.js) - small scope, needed soon anyway.
