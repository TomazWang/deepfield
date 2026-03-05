## Why

The current `deepfield-knowledge-synth` agent mixes "learning" and "writing" concerns inside a single step in `deepfield-iterate`, has no access to staging feedback or DEEPFIELD.md priority config, and produces only a flat monolithic draft per domain — making it hard to improve output quality independently of the learning pipeline. Issue #71 calls for a dedicated document generation agent that separates synthesis from discovery.

## What Changes

- Create `plugin/agents/deepfield-document-generator.md` — a new specialized agent responsible for all documentation output after each learning run
- Replace Step 5 in `plugin/skills/deepfield-iterate.md` (inline `deepfield-knowledge-synth` invocation) with a new Step 5 that launches `deepfield-document-generator`
- The new agent reads: consolidated findings, per-domain findings, existing drafts, staging feedback, DEEPFIELD.md config, and unknowns
- The new agent generates: `behavior-spec.md` + `tech-spec.md` per domain (enabling issue #69), updated cross-cutting docs, and navigation READMEs
- The new agent applies language settings, format preferences, evidence requirements, and confidence markers from the start (not retrofitted like issue #70)
- The existing `deepfield-knowledge-synth` agent is retained but no longer invoked from `deepfield-iterate` (deprecated in place)

## Capabilities

### New Capabilities

- `doc-generator-agent`: Dedicated document generation agent (`deepfield-document-generator`) that transforms consolidated findings + staging feedback + DEEPFIELD.md config into structured per-domain behavior specs, tech specs, cross-cutting docs, and navigation files

### Modified Capabilities

- `plugin-skills`: Step 5 of `deepfield-iterate` skill changes from launching `deepfield-knowledge-synth` to launching `deepfield-document-generator` with an expanded input set (adds staging feedback path, config object, per-domain findings paths)

## Impact

- `plugin/agents/deepfield-document-generator.md` — new file
- `plugin/skills/deepfield-iterate.md` — Step 5 launch target and inputs change
- `plugin/agents/deepfield-knowledge-synth.md` — deprecated (no longer called by the iterate skill; kept for reference)
- Output structure gains `behavior-spec.md` and `tech-spec.md` per domain under `deepfield/drafts/domains/<domain>/`
- No CLI changes; no script changes; no breaking changes to state files
