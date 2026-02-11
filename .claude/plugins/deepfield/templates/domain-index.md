# Domain Index

> This file tracks how the AI decomposes the project into domains. Domains help focus learning and prevent overwhelming context.

## What is a Domain?

A domain is a cohesive area of the codebase, typically:
- 200-1000 files
- Clear boundaries (service, module, feature area)
- Can be understood in one focused learning session

## Current Domains

<!-- Auto-detected and refined by AI -->

| Domain | Confidence | File Count | Status | Notes |
|--------|-----------|------------|--------|-------|
| | | | | |

## Domain Detection Signals

**How domains are identified:**
- Directory structure (e.g., `src/auth/`, `services/payment/`)
- Service boundaries (microservices architecture)
- API route grouping (e.g., `/api/v1/auth/*`)
- Database ownership (separate databases/schemas)
- CODEOWNERS file entries
- Team ownership patterns

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
