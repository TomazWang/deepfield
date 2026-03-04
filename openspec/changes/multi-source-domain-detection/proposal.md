## Why

Domain detection currently relies solely on `brief.md`, which reflects the user's initial (often incomplete or incorrect) understanding of the project. Analyzing actual repository structure, build configurations, and README files produces significantly more accurate domain boundaries — especially for brownfield projects where the user may not yet fully understand the codebase.

## What Changes

- **New script** `plugin/scripts/analyze-domains.js`: Scans a repository path and returns domain signals from folder structure, build configs (package.json, pom.xml, settings.gradle, lerna.json, nx.json), README files, and dependency declarations.
- **New script** `plugin/scripts/generate-domain-index.js`: Combines signals from one or more repositories with brief hints, weights them by confidence, and writes `domain-index.md` using the existing template.
- **Updated template** `plugin/templates/domain-index.md`: Adds a "Detection Sources" column and a "Detection Method" section so each domain cites where it was discovered.

## Capabilities

### New Capabilities
- `domain-analysis`: Multi-signal analysis of a repository path — folder patterns, monorepo manifests (lerna/nx/gradle/maven), README headings, framework dependencies — returning a scored, ranked list of detected domains with source attribution.
- `domain-index-generation`: Orchestrates domain-analysis across multiple repos, merges results with brief hints at lower weight, and renders the domain-index.md file atomically.

### Modified Capabilities

(none — the domain-index template gains a new column but existing behavior is additive, not breaking)

## Impact

- `plugin/scripts/analyze-domains.js` — new file
- `plugin/scripts/generate-domain-index.js` — new file
- `plugin/templates/domain-index.md` — minor additive update (new column)
- Skills/agents that currently generate domain-index.md manually will delegate to `generate-domain-index.js` instead (no API change, implementation detail)
