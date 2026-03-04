## Why

The bootstrap skill (`deepfield-bootstrap.md`) exists only as a design document — running `/df-bootstrap` or `/df-continue` from BRIEF_READY state does nothing functional. Without a working bootstrap, no learning runs (Run 1+) can ever execute, making Deepfield unusable after init and start.

## What Changes

- Add `plugin/scripts/parse-brief.js` — reads and parses `deepfield/source/baseline/brief.md` into structured JSON (project name, repos, focus areas, topics)
- Add `plugin/scripts/scan-structure.js` — walks cloned repository directories and identifies top-level dirs, modules, build files, READMEs
- Add `plugin/scripts/generate-project-map.js` — produces `deepfield/wip/project-map.md` from scan data using existing template
- Add `plugin/scripts/generate-domain-index.js` — produces `deepfield/wip/domain-index.md` from folder analysis + brief hints
- Add `plugin/scripts/generate-learning-plan.js` — produces `deepfield/wip/learning-plan.md` with topics from brief focus areas
- Add `plugin/scripts/create-run-state.js` — writes `deepfield/wip/run-0/run-0.config.json` with status "completed" and file hashes
- Add `plugin/scripts/bootstrap-runner.js` — main orchestrator that calls all the above scripts in order
- Update `plugin/skills/deepfield-bootstrap.md` — replace agent-based orchestration with script-based workflow (simple version, no AI agents)

## Capabilities

### New Capabilities
- `bootstrap-execution`: End-to-end Run 0 execution using scripts and templates; reads brief, clones repos, scans structure, generates wip documents, creates run state

### Modified Capabilities
- `plugin-skills`: The bootstrap skill behavior changes from agent-based to script-based orchestration for the simple version

## Impact

- Affects `plugin/skills/deepfield-bootstrap.md` (orchestration logic rewritten)
- New scripts in `plugin/scripts/` (7 new files)
- Depends on existing scripts: `clone-repos.sh`, `hash-files.js`, `update-json.js`
- Depends on existing templates: `project-map.md`, `domain-index.md`, `learning-plan.md`
- No breaking changes to command interface (`/df-bootstrap` / `/df-continue` invocation unchanged)
- Produces artifacts in `deepfield/wip/` (project-map.md, domain-index.md, learning-plan.md, run-0/)
