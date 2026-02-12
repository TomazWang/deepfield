# Run [N] Staging Area

This directory is for adding feedback and new sources for the next learning run.

## What to Add Here

### 1. Feedback (`feedback.md`)

Open `feedback.md` and add:
- Corrections to current understanding
- Areas that need more focus
- Questions you want answered
- Things that seem wrong or confusing in the drafts

### 2. New Sources (`sources/` directory)

Drop new files in the `sources/` folder:
- **Code:** Additional repositories, specific files, modules
- **Documentation:** API specs, architecture docs, runbooks
- **Context:** Meeting notes, Slack threads, design decisions
- **Configuration:** Infrastructure configs, deployment scripts

## How Sources Are Classified

When you run `/df-continue`, sources in this staging area will be automatically classified:

- **Type:** code, doc, config, schema, conversation, spec
- **Trust Level:** trusted, reference, exploratory
- **Relevance:** Which topics/domains this source relates to

Trusted sources go to `source/baseline/`, context goes to `source/run-N/`.

## What Happens Next

When you run `/df-continue`:
1. System reads your feedback
2. Classifies and files new sources
3. Focuses learning on topics you mentioned or that relate to new sources
4. Updates drafts with new findings
5. Creates next staging area (`run-N+1-staging/`) for more input

---

**Ready to continue?** Run `/df-continue` to start the next learning cycle.
