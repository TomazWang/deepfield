## 1. Update df-iterate command

- [x] 1.1 Remove `--parallel` flag definition from `plugin/commands/df-iterate.md` arguments section
- [x] 1.2 Add `--sequential` flag definition with description "Run in sequential mode instead of the parallel default (one domain at a time)"
- [x] 1.3 Update the `--parallel` argument handling section to explain the flag is no longer valid and parallel is now default
- [x] 1.4 Add `--sequential` argument handling section: when passed, set `sequentialMode: true` and pass to skill
- [x] 1.5 Update the command's `Pass to Skill` section to pass `parallelMode: true` by default (unless `--sequential` passed)
- [x] 1.6 Update the output documentation: remove "← only shown when --parallel" note; make parallel status line shown by default
- [x] 1.7 Update Tips section to recommend `--sequential` for debugging instead of recommending `--parallel` for large projects

## 2. Update deepfield-iterate skill — mode selection (Step 4 header)

- [x] 2.1 Replace the Step 4 header text from "Choose between Parallel Mode (`--parallel` flag was passed) and Sequential Mode (default)" to the new sequential-opt-out logic
- [x] 2.2 Add mode selection logic block: (1) if `--sequential` → sequential, (2) else if `domain-index.md` exists → parallel, (3) else → sequential with warning
- [x] 2.3 Update the fallback warning message to match: "domain-index.md not found — falling back to sequential learning. Run /df-bootstrap first to enable parallel learning."

## 3. Update deepfield-iterate skill — parallel mode section (Step 4d)

- [x] 3.1 Replace Step 4d "Launch all agents in the batch as parallel background Tasks" code block (the prose `Launch (background): ...` pattern) with explicit Agent tool call instructions
- [x] 3.2 Write the new Step 4d agent prompt template that embeds inline: role description, domain name, file list, previousFindingsPath, findingsOutputPath, unknownsOutputPath, open questions, currentDraftPath, and output format instructions
- [x] 3.3 Add explicit instruction: "Launch all agents for this batch in a single message (one tool call block with multiple Agent invocations) with `run_in_background: true`"
- [x] 3.4 Add instruction: "Wait for all agents in the batch to complete before launching the next batch or proceeding"

## 4. Update deepfield-iterate skill — agent ID tracking (Step 4e)

- [x] 4.1 After the batch completion check in Step 4e, add instruction to collect agent IDs returned by Agent tool calls
- [x] 4.2 Update the run config JSON example in Step 4e to include `agentIds: { "<domain>": "<agent-id>", ... }` field
- [x] 4.3 Add note: record agent IDs even for domains that failed (no findings file); omit domain from agentIds map only if Agent tool returned no ID

## 5. Verification

- [x] 5.1 Read through updated `plugin/commands/df-iterate.md` end-to-end and verify no remaining references to `--parallel` as a valid flag
- [x] 5.2 Read through updated `plugin/skills/deepfield-iterate.md` parallel mode sections and verify no remaining `Launch (background):` prose patterns
- [x] 5.3 Verify the mode selection logic in the skill matches design decision D5 (sequential flag → parallel default → sequential fallback)
- [x] 5.4 Verify run config JSON example in skill matches the shape specified in design decision D4
