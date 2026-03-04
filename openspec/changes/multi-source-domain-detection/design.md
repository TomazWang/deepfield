## Context

Domain-index.md is currently generated entirely from `brief.md`. The brief is user-authored and represents their initial mental model, which is often incomplete for brownfield projects. Repository structure, build tooling, and README files contain hard evidence of how the codebase is actually organized.

Two new scripts implement this: `analyze-domains.js` (signal extraction from a single repo path) and `generate-domain-index.js` (orchestration across repos + brief merging + file output).

## Goals / Non-Goals

**Goals:**
- Extract domain signals from folder structure, monorepo manifests, framework dependencies, and README headings
- Merge signals from multiple repositories and brief hints into a unified, confidence-scored domain list
- Produce `domain-index.md` atomically (write-to-temp, rename) using the existing template
- Cite detection sources per domain so users understand why each domain was discovered

**Non-Goals:**
- AI-driven code analysis (import graph tracing, semantic clustering) — future enhancement
- Git history or CODEOWNERS analysis — future enhancement
- Modifying existing commands or skills directly (they delegate to the new scripts)

## Decisions

**Decision 1: Two-script split (analyze vs. generate)**
`analyze-domains.js` is a pure function over a repo path; `generate-domain-index.js` is the orchestrator. This keeps the analyzer testable independently without needing a full KB state. Alternative (single script) rejected because it couples repo analysis to file I/O and makes unit testing harder.

**Decision 2: Signal weighting over threshold filtering**
Each signal source gets a numeric weight (lerna-package: 0.9, framework-dependency: 0.8, folder-pattern: 0.7, readme: 0.6, brief-hint: 0.5). Domains accumulate scores; confidence tier (high/medium/low) is derived from final score. Alternative (boolean present/absent) rejected because it cannot express multi-signal corroboration.

**Decision 3: CJS (`require`) not ESM (`import`)**
All existing plugin scripts use `require`. Staying consistent avoids needing `"type": "module"` or `.mjs` extensions. ESM can be adopted project-wide later.

**Decision 4: Glob-less README search via recursive walk**
README discovery uses the same `findFiles` walk already present in `hash-files.js`, filtered by `/readme\.md$/i`. This avoids adding a `glob` dependency.

**Decision 5: Atomic output write**
`generate-domain-index.js` writes to `<output>.tmp` then `fs.renameSync` — matching the pattern in `hash-files.js`. Prevents partial writes on crash.

## Risks / Trade-offs

- **False-positive folder patterns** (e.g., a `lib/` folder that is not a domain): Mitigation — brief hints can override or suppress detected domains; confidence score will be low if only folder pattern fires.
- **pom.xml / settings.gradle parsing is text-based (not XML/AST)**: Simple string matching is fast and dependency-free but brittle for unusual formatting. Mitigation — mark as medium confidence; AI can refine on next iterate run.
- **Large monorepos with hundreds of packages**: Walk is synchronous; could be slow. Mitigation — lerna/nx package enumeration reads config files only, not full tree traversal.
