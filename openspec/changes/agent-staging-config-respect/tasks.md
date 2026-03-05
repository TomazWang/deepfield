## 1. Update deepfield-iterate skill — read staging feedback in Step 1

- [ ] 1.1 In `plugin/skills/deepfield-iterate.md` Step 1 "Check for New User Input", add logic to read the full text of `deepfield/source/run-${nextRun}-staging/feedback.md` into a `stagingFeedback` variable (null if file does not exist)

## 2. Update deepfield-iterate skill — inject staging feedback into parallel-mode agent prompts (Step 4d)

- [ ] 2.1 In the Step 4d inline prompt template, add a conditional `## Staging Feedback (User Corrections)` section that is rendered when `stagingFeedback` is non-null, positioned before the "Files to analyze" section
- [ ] 2.2 Document in the prompt section that agents shall treat staging feedback as the primary source of truth for corrections

## 3. Update deepfield-iterate skill — inject staging feedback and domain instructions into synth launch (Step 5)

- [ ] 3.1 Add `"staging_feedback": stagingFeedback` to the `deepfield-knowledge-synth` launch input object (omit when null)
- [ ] 3.2 Add `"domain_instructions": deepfieldConfig.domainInstructions` to the `deepfield-knowledge-synth` launch input object

## 4. Update deepfield-iterate skill — inject staging feedback into sequential-mode learner launch (Step 4 sequential)

- [ ] 4.1 Add `"staging_feedback": stagingFeedback` to the `deepfield-learner` sequential-mode launch input object (omit when null)

## 5. Update deepfield-domain-learner agent

- [ ] 5.1 In `plugin/agents/deepfield-domain-learner.md`, add `staging_feedback` to the Inputs section (optional, null if no feedback)
- [ ] 5.2 Add a new "Step 0: Apply Staging Feedback" before Step 1 that instructs the agent to read and internalize the staging feedback as primary source of truth before loading any other context

## 6. Update deepfield-knowledge-synth agent

- [ ] 6.1 In `plugin/agents/deepfield-knowledge-synth.md`, add `staging_feedback` to the Input section (optional)
- [ ] 6.2 Add `domain_instructions` to the Input section (optional, from `deepfieldConfig.domainInstructions`)
- [ ] 6.3 Add a new synthesis task "0. Apply Staging Corrections" (before task 1) that instructs the agent to apply corrections from staging feedback before updating drafts
- [ ] 6.4 Add instructions for using `domain_instructions` to filter or focus draft content per domain (skip excluded areas, emphasize prioritized areas)
