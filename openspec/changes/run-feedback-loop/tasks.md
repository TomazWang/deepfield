## 1. collect-feedback.js Script

- [x] 1.1 Create `plugin/scripts/collect-feedback.js` with ESM imports
- [x] 1.2 Implement `collectFeedback(runNumber)` — initial confirm prompt (skip if "no")
- [x] 1.3 Implement domain correctness question with editor fallback for corrections
- [x] 1.4 Implement missing context question with editor prompt
- [x] 1.5 Implement priority adjustment question with editor prompt
- [x] 1.6 Implement general comments input prompt
- [x] 1.7 Implement `saveFeedback(runNumber, feedback)` — write structured Markdown to `deepfield/wip/run-N/feedback.md`
- [x] 1.8 Export `runFeedbackLoop(runNumber)` as named export
- [x] 1.9 Add CLI entry point (invocable via `node collect-feedback.js <runNumber>`)

## 2. apply-feedback.js Script

- [x] 2.1 Create `plugin/scripts/apply-feedback.js` with ESM imports
- [x] 2.2 Implement `readFeedback(runNumber)` — check for file existence, read and parse Markdown
- [x] 2.3 Implement `extractSection(content, heading)` helper — extract text under a `##` heading
- [x] 2.4 Implement `applyFeedbackToLearningPlan(feedback)` — append "User Feedback Incorporated" section to `deepfield/wip/learning-plan.md`
- [x] 2.5 Implement stub `applyFeedbackToDomains(feedback)` — placeholder for future domain updates
- [x] 2.6 Export all three functions as named exports
- [x] 2.7 Guard against null/undefined feedback in apply functions

## 3. Bootstrap Skill Integration

- [x] 3.1 Add Step 12.5 to `plugin/skills/deepfield-bootstrap.md` — invoke feedback loop after staging area creation
- [x] 3.2 Document import of `runFeedbackLoop` from `collect-feedback.js`
- [x] 3.3 Document import of `applyFeedbackToLearningPlan` from `apply-feedback.js`
- [x] 3.4 Update Step 13 (Report Completion) to note feedback was applied if provided

## 4. Validation

- [x] 4.1 Verify `collect-feedback.js` exits cleanly when user skips (returns null, no file written)
- [x] 4.2 Verify `collect-feedback.js` writes all sections when user provides full feedback
- [x] 4.3 Verify `apply-feedback.js` returns null gracefully when file missing
- [x] 4.4 Verify `apply-feedback.js` appends correct sections to learning-plan.md
- [x] 4.5 Verify bootstrap skill text correctly references both new scripts
