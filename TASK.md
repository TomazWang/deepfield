# Task: Implement /df-output command

## Branch: feat/df-output-command

## Goal
The command spec at `plugin/commands/df-output.md` is complete but needs to be reviewed and refined so it's fully implementable by Claude Code as a plugin command.

## What to do

1. **Review `plugin/commands/df-output.md`** — the spec is already written. Check for:
   - Path consistency (`deepfield/` everywhere)
   - Completeness of snapshot flow
   - SNAPSHOT.md metadata generation

2. **Flesh out the polish pass** (`--polish` flag):
   - Define what "polish" means concretely
   - What internal markers should be stripped?
   - Should it fix markdown formatting?
   - Should it add a table of contents?

3. **Add confidence summary logic**:
   - The SNAPSHOT.md template includes a confidence table
   - Where does confidence data come from? (`deepfield/wip/learning-plan.md`)
   - Define how to extract topic confidence percentages

4. **Handle edge cases**:
   - What if output directory already exists with same tag?
   - What if drafts are empty (only template content)?
   - What if no runs have been completed yet?

5. **Consider adding an index** — if multiple snapshots exist, should there be a `deepfield/output/INDEX.md` listing all versions?

## Key files
- `plugin/commands/df-output.md` — the command to refine
- `plugin/skills/deepfield-iterate.md` — reference for confidence tracking
- `plugin/templates/unknowns.md` — cross-cutting unknowns template
- `plugin/templates/_changelog.md` — changelog template

## Done when
- Command spec is complete and handles all edge cases
- Polish pass is well-defined
- Confidence extraction is documented
- Snapshot metadata is comprehensive
- Commit and push to `feat/df-output-command`
