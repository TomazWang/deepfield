## Why

After each learning run, the AI may misclassify domains, miss context, or set wrong priorities — with no mechanism for the user to correct course. A structured feedback loop after each run lets users review findings and guide the next iteration, improving overall accuracy and trust.

## What Changes

- Add `plugin/scripts/collect-feedback.js` — interactive CLI script that prompts user for feedback after a run completes
- Add `plugin/scripts/apply-feedback.js` — reads saved feedback and applies it to the learning plan for the next run
- Update `plugin/skills/deepfield-bootstrap.md` — add post-bootstrap feedback collection step (Step 13.5)
- Use existing `plugin/templates/feedback.md` as the saved feedback file format

## Capabilities

### New Capabilities
- `collect-feedback`: Interactive post-run feedback collection via CLI prompts (domain corrections, missing context, priority adjustments, general comments)
- `apply-feedback`: Read and apply saved feedback from a previous run into the learning plan and domain index

### Modified Capabilities
- `deepfield-bootstrap`: Extend bootstrap skill to invoke feedback loop after completion and apply feedback before reporting done

## Impact

- New scripts: `plugin/scripts/collect-feedback.js`, `plugin/scripts/apply-feedback.js`
- Modified skill: `plugin/skills/deepfield-bootstrap.md`
- Feedback saved to: `deepfield/wip/run-N/feedback.md`
- Applied to: `deepfield/wip/learning-plan.md`
- No breaking changes; feedback step is optional (user can skip)
