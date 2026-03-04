## 1. analyze-domains.js — Core Script

- [x] 1.1 Create `plugin/scripts/analyze-domains.js` with `analyzeDomains(repoPath)` as the main export and CLI entry point
- [x] 1.2 Implement `analyzeFolderStructure(repoPath)` — top-level dir scan with regex patterns for frontend/backend/database/shared/auth/admin/mobile
- [x] 1.3 Implement `analyzeModules(repoPath)` — parse lerna.json (packages globs), nx.json (projects), settings.gradle (include directives), pom.xml (<modules>)
- [x] 1.4 Implement `analyzeDependencies(repoPath)` — read package.json, requirements.txt, pom.xml and map framework names to domain hints
- [x] 1.5 Implement `analyzeReadmes(repoPath)` — recursive walk for README.md files, extract first H1 and first paragraph
- [x] 1.6 Implement `detectArchitecturalPatterns(repoPath)` — detect microservices, monolith, clean-architecture from directory presence
- [x] 1.7 Implement `detectDomainsFromSignals(signals)` — aggregate all signal arrays, weight by source type, sort by score, assign confidence tiers
- [x] 1.8 Add CLI interface: accepts `<repoPath>` positional arg, `--output <file>` option; writes JSON result atomically

## 2. generate-domain-index.js — Orchestrator Script

- [x] 2.1 Create `plugin/scripts/generate-domain-index.js` with CLI args `--repos`, `--brief`, `--output`
- [x] 2.2 Implement multi-repo loop: call `analyzeDomains` per repo, merge results into unified Map (sum scores, collect sources + repo names)
- [x] 2.3 Implement brief hints integration: read focus areas from brief JSON, add each at weight 0.5, merge into domain map
- [x] 2.4 Implement markdown rendering: sort domains by score, format table rows with name/confidence/sources/repos columns
- [x] 2.5 Write output atomically to `--output` path using temp-file + rename pattern
- [x] 2.6 Add input validation: exit 1 with descriptive stderr messages for missing --output, unreadable --repos, unreadable --brief

## 3. Template Update

- [x] 3.1 Update `plugin/templates/domain-index.md` to add a "Detection Sources" column to the domain table and a brief "How Domains Were Detected" note

## 4. Verification

- [x] 4.1 Manually test `analyze-domains.js` against this repo's own root (should detect domains from package.json/folder structure)
- [x] 4.2 Manually test `generate-domain-index.js` with a minimal brief JSON and single repo path, verify domain-index.md is produced
- [x] 4.3 Test brief-only mode (no repos) — verify brief hints appear with low confidence
