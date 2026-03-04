## 1. Parse Brief Script

- [x] 1.1 Create `plugin/scripts/parse-brief.js` with extractProjectName, extractRepositories, extractFocusAreas, extractTopics functions using regex
- [x] 1.2 Implement CLI entrypoint so `node parse-brief.js` prints JSON to stdout
- [x] 1.3 Export parseBrief function for use by bootstrap-runner.js

## 2. Scan Structure Script

- [x] 2.1 Create `plugin/scripts/scan-structure.js` with scanRepository function that identifies top-level dirs, modules (packages/services/apps/libs), build files, READMEs
- [x] 2.2 Implement scanAllRepos function that walks `deepfield/source/baseline/repos/`
- [x] 2.3 Export both functions; add CLI entrypoint

## 3. Document Generators

- [x] 3.1 Create `plugin/scripts/generate-project-map.js` that writes `deepfield/wip/project-map.md` from scan data (atomic write)
- [x] 3.2 Create `plugin/scripts/generate-domain-index.js` that detects domains from folder names + brief focus areas and writes `deepfield/wip/domain-index.md`
- [x] 3.3 Create `plugin/scripts/generate-learning-plan.js` that writes `deepfield/wip/learning-plan.md` with topics from brief focus areas

## 4. Run State and Config

- [x] 4.1 Create `plugin/scripts/create-run-state.js` that creates `deepfield/wip/run-0/` directory and writes `run-0.config.json` with runNumber, status, timestamps, fileHashes
- [x] 4.2 Ensure file hashes are computed via `hash-files.js` for each cloned repo and merged into run config

## 5. Bootstrap Runner Orchestrator

- [x] 5.1 Create `plugin/scripts/bootstrap-runner.js` that imports/requires all above scripts and runs them in order: parse brief → clone repos → scan → generate docs → create run state
- [x] 5.2 Add run-1 staging area creation (deepfield/source/run-1-staging/ with README.md and feedback.md)
- [x] 5.3 Add project.config.json update (bootstrapCompleted: true, currentRun: 0) via update-json.js
- [x] 5.4 Add formatted completion summary output
- [x] 5.5 Handle errors gracefully: missing brief exits with clear message; clone failures warn and continue

## 6. Update Bootstrap Skill

- [x] 6.1 Update `plugin/skills/deepfield-bootstrap.md` to replace agent-based steps with script invocation: `node ${PLUGIN_ROOT}/scripts/bootstrap-runner.js`
- [x] 6.2 Add prerequisite checks (brief.md exists, no existing run-0) to skill document
- [x] 6.3 Document state transition BRIEF_READY → RUN_0_COMPLETE in skill
