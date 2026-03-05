## Why

Current draft documents in `deepfield/drafts/domains/` mix stakeholder-level product descriptions with low-level technical implementation details in a single flat file per domain. This conflates two distinct audiences — product managers and stakeholders who need to understand behavior, and developers and architects who need implementation guidance — making both harder to serve.

## What Changes

- **BREAKING**: Replace each `deepfield/drafts/domains/{domain}.md` flat file with a subdirectory `deepfield/drafts/domains/{domain}/` containing two split files: `behavior-spec.md` (stakeholder-level) and `tech-spec.md` (implementation-level).
- New templates created in `plugin/templates/` for `behavior-spec.md` and `tech-spec.md` to standardize content and structure.
- The `deepfield-knowledge-synth` agent updated to write both files instead of the single flat draft.
- The `deepfield-iterate` skill updated to pass and read the new split paths (replacing `deepfield/drafts/domains/*.md` globs).
- A `deepfield-document-generator` agent spec introduced to support AI-driven generation of both docs from findings (aligns with issue #71).
- Migration path via `deepfield upgrade` (`/df-upgrade` plugin command): reads existing `{domain}.md`, uses AI to split content into the two files, archives the original.
- `deepfield/drafts/domains/{domain}/README.md` domain companion files remain supported under the new subdirectory structure (no path change needed — they already use subdirectory convention per the iterate skill's Step 5.5.2).
- Cross-reference links between `behavior-spec.md` and `tech-spec.md` within the same domain use relative paths (`./tech-spec.md`, `./behavior-spec.md`).

## Capabilities

### New Capabilities

- `split-domain-drafts`: New two-file-per-domain structure under `deepfield/drafts/domains/{domain}/` with `behavior-spec.md` and `tech-spec.md`, including templates and cross-reference conventions.
- `draft-migration`: Migration path that reads an existing single-file `{domain}.md`, AI-classifies sections, writes both split files, and archives the original. Invoked during `deepfield upgrade` / `/df-upgrade`.
- `document-generator-agent`: Spec for the `deepfield-document-generator` agent (issue #71) that generates `behavior-spec.md` and `tech-spec.md` from per-run findings, replacing the synthesis step in `deepfield-knowledge-synth` for document output.

### Modified Capabilities

- `plugin-skills`: The `deepfield-iterate` skill references `deepfield/drafts/domains/*.md` in multiple places (Steps 4b, 5). These paths must change to the new split structure (`deepfield/drafts/domains/{domain}/behavior-spec.md` and `{domain}/tech-spec.md`).
- `plugin-commands`: The `/df-upgrade` command must be updated to invoke the AI-driven migration step after backup creation.

## Impact

- **plugin/skills/deepfield-iterate.md**: Step 4b `currentDraftPath`, Step 5 `existing_drafts` input, Step 5.5.2 domain README generation loop — all reference single `.md` per domain; must be updated.
- **plugin/agents/deepfield-knowledge-synth.md**: Output section writes single `deepfield/drafts/domains/<topic>.md`; must be replaced with two-file output.
- **plugin/templates/**: Two new template files to create: `behavior-spec.md` and `tech-spec.md`.
- **plugin/commands/df-upgrade.md** (or equivalent): Must add a migration step after backup to split existing drafts.
- **cli/src/commands/upgrade.ts**: No AI logic — migration is plugin-driven. CLI upgrade command already routes to `/df-upgrade` for AI work; no CLI changes needed.
- **deepfield/drafts/**: Existing workspaces have `{domain}.md` flat files that must be migrated before the new agents can update them.
- **Cross-references in existing drafts**: Links like `./authentication.md` must update to `./authentication/tech-spec.md` or `./authentication/behavior-spec.md` after migration.
