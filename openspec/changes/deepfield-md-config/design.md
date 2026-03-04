## Context

Deepfield currently has `brief.md` describing WHAT to learn, but no file for HOW to learn it. Learning agents use hardcoded defaults for language (English), depth (standard), and output style. Users cannot specify priorities, exclusions, language, domain quirks, or trust hierarchy without editing the AI prompt files directly. As the plugin gains users with diverse needs (multilingual teams, large codebases, domain-heavy projects), this lack of configurability limits adoption.

The existing `parse-brief.js` script shows the established pattern: read a markdown file, extract structured sections, return a typed object. The same pattern applies here.

## Goals / Non-Goals

**Goals:**
- Introduce `DEEPFIELD.md` as an optional config file in `deepfield/`
- Implement `parse-deepfield-config.js` script (CJS) to parse it into a structured JSON object
- Update `/df-init` to scaffold the template after initialization
- Update learning skills (`deepfield-iterate.md`, `deepfield-bootstrap.md`) to read config and inject it into their logic
- Maintain full backward compatibility when `DEEPFIELD.md` is absent

**Non-Goals:**
- Not a replacement for `brief.md` — the two files are complementary
- Not a formal schema/validation system — config is read with graceful fallbacks
- Not a GUI/interactive editor for the config

## Decisions

### D1: File location is `deepfield/DEEPFIELD.md` (not project root)

**Why:** Keeps the deepfield workspace self-contained. The `deepfield/` directory is the workspace root and users already know to look there. The project root should not be polluted with tool-specific config files.

**Alternative considered:** Project root (like `.deepfieldrc` or `DEEPFIELD.md` in root). Rejected because it scatters config outside the workspace and is inconsistent with `brief.md` location.

### D2: Markdown format (not JSON/YAML)

**Why:** Users write free-form instructions (domain quirks, trust rationale, team conventions) that don't fit structured formats well. Markdown is human-readable, diff-friendly, and consistent with `brief.md`. The parser extracts structured sections while preserving raw content for injection into agent prompts.

**Alternative considered:** YAML frontmatter or JSON config. Rejected because domain-specific instructions are inherently prose, not key-value pairs.

### D3: Return raw section text alongside parsed primitives

**Why:** Skills inject config into agent prompts. For domain-specific instructions, the raw markdown text (not a parsed object) should be injected verbatim. Agents understand markdown naturally. The parser returns both structured fields (language, priorities list, exclusions list) and raw section text (domainInstructions, outputPrefs, trustHierarchy).

### D4: Config is optional — missing file returns defaults

**Why:** Existing projects must continue working without change. Defaults are sensible: language=English, depth=standard, no exclusions, no domain instructions.

### D5: Skills read config themselves (no central loader)

**Why:** Skills already read multiple files during their workflow. Adding one more read (of `DEEPFIELD.md`) fits naturally into existing skill workflow. A central loader would add unnecessary abstraction for the current scale.

## Risks / Trade-offs

- **Markdown parsing fragility**: Section detection uses regex on headings. If users use unconventional markdown (e.g., setext headings), sections may not parse. Mitigation: Fall back to defaults gracefully; document expected format in the template.
- **Agent prompt bloat**: Injecting the full DEEPFIELD.md content into every agent prompt increases token usage. Mitigation: Skills inject only the relevant section per agent context (domain agents get only domain instructions for their domain, not all domains).
- **Stale config**: If DEEPFIELD.md contradicts brief.md (e.g., different trust hierarchy), agents may be confused. Mitigation: Document that DEEPFIELD.md overrides defaults, does not override brief.md facts.
