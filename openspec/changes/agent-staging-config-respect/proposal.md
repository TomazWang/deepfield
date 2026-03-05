## Why

Learning agents currently ignore two critical user-provided inputs — staging feedback placed in `deepfield/source/run-N-staging/` and per-domain instructions in `DEEPFIELD.md` — breaking the user feedback loop and making it impossible to steer learning behavior, correct errors, or enforce documentation priorities without rewriting code.

## What Changes

- Pass `staging_feedback` (content of `deepfield/source/run-N-staging/feedback.md`) into the inline prompt for each `deepfield-domain-learner` agent launched in parallel mode
- Pass `priority_config` (from the already-loaded `deepfieldConfig`) into the inline prompt for each `deepfield-domain-learner` agent
- Pass `staging_feedback` into the `deepfield-knowledge-synth` agent launch in Step 5
- Pass `priority_config` (domain instructions + language, already passed as `output_language`) explicitly into `deepfield-knowledge-synth` so it can apply user corrections during synthesis
- Update `deepfield-domain-learner.md` agent to declare and use a new `staging_feedback` input and to treat it as primary source of truth for corrections
- Update `deepfield-knowledge-synth.md` agent to declare and use a new `staging_feedback` input and to apply corrections before writing drafts

## Capabilities

### New Capabilities

- `agent-staging-feedback`: Domain-learner and knowledge-synth agents receive and act on user feedback from the run-N staging area before performing analysis or synthesis
- `agent-priority-config`: Domain-learner and knowledge-synth agents receive domain-specific instructions from DEEPFIELD.md (beyond the language field already passed) and apply them during analysis

### Modified Capabilities

- `plugin-skills`: `deepfield-iterate.md` Step 4 parallel-mode inline prompt and Step 5 synth launch updated to include staging feedback and full priority config

## Impact

- `plugin/skills/deepfield-iterate.md` — Step 1 (load staging feedback), Step 4d parallel prompt template, Step 5 synth launch
- `plugin/agents/deepfield-domain-learner.md` — new input field + new Step 0 to process staging feedback
- `plugin/agents/deepfield-knowledge-synth.md` — new input field + new step to apply corrections from staging before synthesis
