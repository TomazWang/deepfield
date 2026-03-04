## 1. Confidence Scoring Script

- [x] 1.1 Create `plugin/scripts/check-confidence.js` using CJS (require/module.exports)
- [x] 1.2 Implement logic to find the highest-numbered run-N.config.json in `deepfield/wip/`
- [x] 1.3 Implement confidence extraction from `confidenceChanges` field in run config
- [x] 1.4 Implement domain filter logic to restrict topic evaluation
- [x] 1.5 Implement threshold evaluation: compute `thresholdMet` boolean from HIGH-priority topics
- [x] 1.6 Output JSON result to stdout; write errors to stderr with non-zero exit code

## 2. deepfield-ff Skill

- [x] 2.1 Create `plugin/skills/deepfield-ff.md` with YAML frontmatter (name, description, trigger_mode, user_invocable)
- [x] 2.2 Document skill input parameters: max-runs, min-confidence, domains, stop-on-blocked, feedback-at-end
- [x] 2.3 Implement domain filter validation against domain-index.md (warn on unknown domains, error if all unknown)
- [x] 2.4 Implement the main ff loop: invoke deepfield-iterate in single-run mode, evaluate stop conditions, repeat
- [x] 2.5 Implement per-run progress line output after each completed run
- [x] 2.6 Implement all 5 stop condition checks using check-confidence.js output and run config data
- [x] 2.7 Implement staging area creation on loop exit (delegate to iterate skill pattern or replicate logic)
- [x] 2.8 Implement final summary report with stop reason, per-topic confidence table, and next-steps section
- [x] 2.9 Implement feedback-at-end prompt (shown by default, suppressed if feedback-at-end=false)

## 3. df-ff Command

- [x] 3.1 Create `plugin/commands/df-ff.md` with YAML frontmatter (name, description, allowed-tools, arguments)
- [x] 3.2 Document all arguments: --max-runs, --min-confidence, --domains, --stop-on-blocked, --feedback-at-end
- [x] 3.3 Implement prerequisite validation (deepfield/ exists, run-0 config exists, learning-plan.md exists)
- [x] 3.4 Implement argument parsing and validation (hard cap max-runs at 50, warn if exceeded)
- [x] 3.5 Implement start summary printout (config values before delegating)
- [x] 3.6 Implement skill invocation: delegate to deepfield-ff skill with parsed arguments
- [x] 3.7 Add error messages for each validation failure matching the spec scenarios
