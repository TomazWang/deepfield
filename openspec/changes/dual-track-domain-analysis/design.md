## Context

Deepfield's current domain model uses a single `domain-index.md` and writes all docs to `drafts/domains/{name}/`. This model conflates product features (stakeholder view) and technical components (engineering view), producing docs that serve neither audience well.

The `deepfield-document-generator` agent already produces `behavior-spec.md` and `tech-spec.md` within each domain folder — the split already exists at the document level. This change elevates it to the domain-index level and draft folder structure.

**Current state:**
- `wip/domain-index.md` — single flat list of domains (mixed product + tech)
- `drafts/domains/{name}/behavior-spec.md` + `tech-spec.md` — split at file level
- Bootstrap detects domains from source code only; no behavior-domain detection
- Iterate has no track concept; runs all domains in one loop

**Constraints:**
- CLI One-Way Dependency Rule: plugin calls CLI, CLI never calls plugin
- Atomic writes on all file operations (tmp → rename)
- All new wip/draft paths must be created by CLI scripts, not AI free-writing
- Existing workspaces must migrate cleanly via `df-upgrade`

## Goals / Non-Goals

**Goals:**
- Split domain discovery into two independent tracks: behavior (product) and tech (code)
- Produce `wip/behavior-index.md`, `wip/tech-index.md`, `wip/domain-links.md`
- Route draft output to `drafts/behavior/{name}/` and `drafts/tech/{name}/`
- Add interactive Q&A in bootstrap to elicit stakeholder-facing domain names
- Add `--track behavior|tech|both` flag to iterate
- New `deepfield-domain-linker` agent infers behavior↔tech links
- New `detect-behavior-domains.js` CLI script extracts behavior domains from reference docs
- Upgrade skill migrates `drafts/domains/` → `drafts/behavior/` + `drafts/tech/`

**Non-Goals:**
- Nested domains (e.g. `behavior/ecommerce/checkout/`) — flat list only
- Manual curation UI for domain-links
- Tech components with no behavior mapping are valid (infra, utilities) — do not force a link
- Versioned domain links separately from specs

## Decisions

### Decision 1: Elevate existing file-level split to folder-level split

The document generator already writes `behavior-spec.md` and `tech-spec.md` in the same folder. Rather than changing the agent's output format, we change the output path: `drafts/behavior/{name}/spec.md` and `drafts/tech/{name}/spec.md`.

**Why:** Minimal change to agent behavior; folder-level split makes it easy to enumerate all behavior or tech domains independently.

**Alternative considered:** Keep flat `drafts/domains/` but add metadata to distinguish — rejected because it requires parsing file contents to know the domain type, and makes it harder to build behavior-only or tech-only views.

### Decision 2: Bootstrap runs behavior detection after technical detection, using interactive Q&A as fallback

Technical domains come from directory structure (fast, deterministic). Behavior domains come from reference docs if available; if not, bootstrap asks the user interactively: "What product features do your stakeholders care about?"

**Why:** Reference docs may not exist yet on first run. Interactive Q&A captures institutional knowledge that cannot be inferred from code. The user's answers seed `behavior-index.md` with real stakeholder vocabulary.

**Alternative considered:** Infer behavior domains from code alone (e.g. controller names, README headings) — kept as a fallback but insufficient as a primary source.

### Decision 3: `domain-links.md` maintained by the `deepfield-domain-linker` agent, not by hand

After both indexes exist, the linker agent reads `behavior-index.md`, `tech-index.md`, and available source code to infer the many-to-many mapping. Users can edit `domain-links.md` directly; the agent treats user-edited entries as authoritative and extends them.

**Why:** Fully manual maintenance doesn't scale. Fully automated inference misses institutional knowledge. Hybrid (AI infers, user corrects) is the right tradeoff.

### Decision 4: `--track` flag defaults to `both`

Running `df-iterate` with no flag runs both tracks. `--track behavior` or `--track tech` narrows focus when the user wants to go deep on one side.

**Why:** Default behavior should be comprehensive. Power users who know they only have new reference docs can use `--track behavior` to skip source code re-scanning.

### Decision 5: detect-behavior-domains.js is a read-only CLI script

It scans reference doc files and returns candidate behavior domain names as JSON. It does not write any files. The bootstrap skill calls it, then uses the results in interactive Q&A, then writes `behavior-index.md` via a template/atomic write.

**Why:** Keeps the CLI deterministic and testable. The AI skill does the reasoning (which candidates to keep, what to ask the user); the script just does the file reading.

### Decision 6: Migration in upgrade is AI-driven (existing pattern)

The upgrade skill already handles `drafts/domains/` → `behavior-spec.md` + `tech-spec.md` split (added previously). This change extends migration to:
1. Move `drafts/domains/{name}/behavior-spec.md` → `drafts/behavior/{name}/spec.md`
2. Move `drafts/domains/{name}/tech-spec.md` → `drafts/tech/{name}/spec.md`
3. Rename `wip/domain-index.md` → `wip/tech-index.md` (source-code-derived domains become tech domains)
4. Create empty `wip/behavior-index.md` (populated on next iterate run)
5. Create empty `wip/domain-links.md`

**Why:** AI-driven migration is already the pattern; the linker agent can infer links after migration.

## Risks / Trade-offs

- **[Risk] Behavior Q&A during bootstrap adds latency** → Mitigation: make it skippable with `--skip-behavior-qa`; user can add behavior domains manually later
- **[Risk] domain-links.md can go stale if domains are renamed** → Mitigation: linker agent checks for broken references and reports them; no auto-delete
- **[Risk] Upgrade migration loses data if `behavior-spec.md` and `tech-spec.md` don't exist in old domains** → Mitigation: skip move for missing files; log warning; never delete source
- **[Risk] `--track both` doubles agent execution time** → Mitigation: parallel batch execution already in iterate; both tracks run in same batch, not sequentially

## Migration Plan

1. User updates plugin
2. User runs `deepfield upgrade`
3. Upgrade skill detects workspace version < 0.7.0
4. Scaffold new dirs: `drafts/behavior/`, `drafts/tech/`
5. For each `drafts/domains/{name}/`:
   - If `behavior-spec.md` exists → move to `drafts/behavior/{name}/spec.md`
   - If `tech-spec.md` exists → move to `drafts/tech/{name}/spec.md`
   - If only flat `spec.md` exists → AI decides: split it or copy to both
6. Rename `wip/domain-index.md` → `wip/tech-index.md`
7. Create `wip/behavior-index.md` (empty template)
8. Create `wip/domain-links.md` (empty template)
9. Update `project.config.json` workspace version to 0.7.0

**Rollback:** Backup created by upgrade before migration; user can restore with `deepfield restore`.

## Open Questions

1. Should `domain-links.md` use a structured format (YAML/JSON front-matter) or free markdown? → Lean toward free markdown with a consistent heading pattern (easier for AI to parse and write)
2. Should behavior domains support aliases? (e.g. "User Login" = "Authentication") → Out of scope for 0.7.0; can be added to `behavior-index.md` as a future field
3. What if the user never provides reference docs? Should `behavior-index.md` be seeded from code alone? → Yes, as a fallback — note confidence as "inferred from code, unverified"
