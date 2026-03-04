## Context

Deepfield's learning runs currently extract findings, synthesize knowledge into drafts, and track unknowns — but domain-specific terminology is left implicit. Terms, acronyms, and jargon discovered in comments, docs, and code are scattered and never consolidated. This design adds a cumulative terminology index as a cross-cutting draft that evolves each run.

The plugin follows the Command → Skill → Script → Agent pattern. Scripts handle file operations (atomic writes), agents handle AI-driven extraction, and skills orchestrate the workflow. This feature adds one new agent (term extractor), two new scripts (extract-terminology.js and merge-glossary.js), two new templates, and hooks into the iterate skill.

## Goals / Non-Goals

**Goals:**
- Extract domain terms, acronyms, and definitions from files analyzed each run
- Write per-run `new-terms.md` to `wip/run-N/`
- Maintain a cumulative `drafts/cross-cutting/terminology.md` merged across runs
- Integrate seamlessly into `/df-iterate` and `/df-bootstrap` workflows
- Follow existing script conventions (CJS, atomic writes, module.exports)

**Non-Goals:**
- Synonym deduplication across runs (complex NLP, deferred to future)
- Exporting to JSON or HTML formats (future enhancement)
- Cross-domain term conflict detection (future enhancement)
- Modifying how the learner agent reads files

## Decisions

### Decision 1: Agent extracts terms, script merges them

**Choice:** The term-extractor agent reads raw source content and outputs a structured `new-terms.md`. A separate `merge-glossary.js` script reads both the existing glossary and new-terms and writes the updated glossary.

**Why:** Agents are suited for open-ended pattern recognition (finding terms in arbitrary code/comments/docs). Scripts are suited for deterministic merging logic. Keeping them separate follows the established separation of concerns in the codebase.

**Alternative considered:** Single script that both extracts and merges — rejected because extraction requires AI judgment on context, definitions, and relevance.

### Decision 2: Glossary stored as Markdown, index is alphabetical

**Choice:** `drafts/cross-cutting/terminology.md` uses alphabetically organized sections (## A, ## B, ...) with a fixed entry format per term.

**Why:** Consistent with the existing `unknowns.md` template style. Markdown is readable by both humans and AI in subsequent runs. Alphabetical organization enables quick lookup.

**Alternative considered:** JSON glossary — rejected because humans need to read the glossary directly and Markdown is the established format for all drafts.

### Decision 3: Merge script uses term name as key

**Choice:** When merging, if a term with the same name (case-insensitive) already exists, the script updates it with any new information (adds new files seen, updates lastUpdated). If new, it appends the entry.

**Why:** Simple, deterministic, and handles the common case (same term discovered across multiple runs). Avoids AI inference during merge, keeping it fast and reliable.

### Decision 4: Integrate as a new step in iterate skill (Step 5.5)

**Choice:** Add terminology extraction between knowledge synthesis (Step 5) and learning plan update (Step 6) in `deepfield-iterate.md`.

**Why:** After the learner agent has analyzed files and findings are written, there's a natural point to extract terminology from those same files. The findings are complete but the learning plan hasn't been updated yet, so this is a non-blocking insertion.

## Risks / Trade-offs

- [Risk: Agent extracts too many false positives (common English words treated as domain terms)] → Mitigation: Agent prompt instructs to focus on acronyms, domain-specific jargon, and explicitly commented/documented terms only
- [Risk: merge-glossary.js grows the terminology.md file without bound] → Mitigation: Script counts entries and includes statistics; users can prune manually
- [Risk: New step slows down iterate runs noticeably] → Mitigation: Term extraction is a lightweight read of already-loaded files; agent scope is narrow

## Open Questions

- None blocking implementation. Synonym detection and cross-domain conflict resolution are explicitly deferred.
