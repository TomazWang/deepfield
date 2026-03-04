# Domain Index

> This file tracks how the AI decomposes the project into domains. Domains help focus learning and prevent overwhelming context.

## What is a Domain?

A domain is a cohesive area of the codebase, typically:
- 200-1000 files
- Clear boundaries (service, module, feature area)
- Can be understood in one focused learning session

## Current Domains

<!-- Auto-detected and refined by AI -->

| Domain | Confidence | File Count | Status | Detection Sources | Repositories |
|--------|-----------|------------|--------|-------------------|--------------|
| | | | | | |

## How Domains Were Detected

<!-- Auto-populated by generate-domain-index.js — lists each domain's signal sources and score -->

## Domain Detection Signals

**How domains are identified (priority order):**
1. Monorepo manifests (lerna.json, nx.json, settings.gradle, pom.xml modules)
2. Framework dependencies (package.json, requirements.txt, pom.xml)
3. Directory structure (folder name patterns matching known domain types)
4. README files (H1 heading per sub-directory)
5. Brief hints (user-provided focus areas, lowest weight)

## Domain Relationships

<!-- How domains interact -->

```
[Domain A] <-- depends on --> [Domain B]
```

## Split/Merge History

<!-- Track domain structure changes -->

**Run N:** Split "backend" into "api" and "data" (too large, 3000 files)
**Run M:** Merged "utils" into "shared" (too small, overlapping concerns)

---

*This index is automatically updated by the AI during each learning run.*
