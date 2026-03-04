---
name: "Parallel Work"
description: "Orchestrate parallel work across multiple tasks using worktrees, agents, and OpenSpec workflow with spec review before implementation"
category: Workflow
tags: [workflow, parallel, worktrees, agents, openspec]
---

Run multiple tasks in parallel using isolated git worktrees and background agents. Each task follows the full OpenSpec workflow with a mandatory spec review step (draft PR) before implementation begins.

**Input**: One or more task sources after `/parallel-work`:
- GitHub issue numbers: `/parallel-work #34 #35 #36`
- Task definition files: `/parallel-work TASK-001.md TASK-002.md`
- Mixed: `/parallel-work #34 TASK-002.md`
- No input: prompted to provide tasks

---

## Orchestrator Steps

### Step 1 — Collect tasks

If no arguments provided, ask the user:
> "What tasks should I work on in parallel? Provide GitHub issue numbers (e.g. #34 #35), GitLab issue numbers, or paths to task definition files."

Parse the input into a task list. For each task, determine:
- **Type**: `github-issue` | `gitlab-issue` | `task-file`
- **ID / path**: the issue number or file path
- **Change name**: derive a kebab-case name
  - GitHub issue: read title via `gh issue view <N> --repo <owner>/<repo>` → slugify
  - GitLab issue: read via `glab issue view <N>` → slugify
  - Task file: use filename without extension, replace underscores with hyphens

Display the task list for confirmation before proceeding.

---

### Step 2 — Set up worktrees

For each task, create an isolated git worktree:

```bash
# Derive branch name from change name
BRANCH="feat/<change-name>"   # or fix/ for bugs

git worktree add ../<change-name> -b "$BRANCH"
```

Use a naming convention:
- Feature: `feat/<change-name>`
- Bug fix: `fix/<change-name>`

Display all created worktrees before launching agents.

---

### Step 3 — Launch parallel agents (SPEC PHASE ONLY)

Launch one background agent per task using the **Agent tool** with `run_in_background: true`.

Each agent receives the following instructions:

> **Your job is SPEC ONLY — do NOT implement yet.**
>
> Worktree: `../<change-name>`
> Branch: `<branch-name>`
> Task: [issue number / task file path]
>
> 1. Read the task: `gh issue view <N>` or read the task file
> 2. Use the **Skill tool** with skill=`opsx:ff` and args=`<change-name>` to generate all spec artifacts (proposal, design, specs, tasks) in one shot. All files go to the worktree directory.
> 3. **Stop here — do NOT run opsx:apply yet.**
> 4. Commit the spec artifacts and push as a **draft PR**:
>    ```bash
>    cd <worktree-path>
>    git add openspec/
>    git commit -m "spec: <change-name> — spec artifacts for review"
>    git push origin <branch-name>
>    gh pr create --draft \
>      --title "spec(<change-name>): [SPEC REVIEW] <issue title>" \
>      --body "## Spec Review\n\nSpec artifacts created for review before implementation.\n\nCloses #<N>\n\n**⚠️ Draft — awaiting spec approval before implementation begins.**"
>    ```
> 5. Report back with the draft PR URL.

Wait for **all** spec agents to complete before proceeding to Step 4.

---

### Step 4 — Review specs (orchestrator)

For each draft PR:

1. Read the spec artifacts:
   - `openspec/changes/<change-name>/proposal.md`
   - `openspec/changes/<change-name>/design.md`
   - `openspec/changes/<change-name>/specs/**/*.md`
   - `openspec/changes/<change-name>/tasks.md`

2. Review for:
   - Correctness and completeness of requirements
   - Alignment with project architecture (`plugin/` patterns: CJS scripts, markdown commands/skills/agents)
   - No over-engineering — only what the issue asks for
   - Tasks are granular and implementable
   - No ESM (`import`/`export`) in plugin scripts — must use CJS

3. Leave a PR review comment via:
   ```bash
   gh pr comment <PR-number> --body "<review feedback>"
   ```

4. **Decision per PR**:
   - ✅ **Approved**: Comment "Spec approved — proceeding to implementation." Mark the PR URL as ready.
   - 🔁 **Changes needed**: Comment with specific requested changes. Resume the agent to revise the spec, re-push, and notify when done. Re-review until approved.

Do not proceed to Step 5 until ALL specs are approved.

---

### Step 5 — Launch parallel agents (IMPLEMENTATION PHASE)

For each approved spec, resume or launch a new agent:

> **Spec is approved — now implement.**
>
> Worktree: `../<change-name>`
> Branch: `<branch-name>`
>
> 1. Use the **Skill tool** with skill=`opsx:apply` to implement all tasks from `tasks.md`.
> 2. All implementation files go to the worktree directory.
> 3. When complete, commit and convert the draft PR to ready-for-review:
>    ```bash
>    cd <worktree-path>
>    git add -A
>    git commit -m "feat: implement <change-name>"
>    git push origin <branch-name>
>    gh pr ready <PR-number>
>    ```
> 4. Report back with the PR URL.

Wait for **all** implementation agents to complete before proceeding to Step 6.

---

### Step 6 — Review implementation PRs (orchestrator)

For each ready PR:

1. Run `gh pr diff <N>` to review all changes.

2. Check for:
   - CJS consistency in plugin scripts (no ESM `import`/`export`, no `"type": "module"` in `plugin/package.json`)
   - TypeScript compiles cleanly for CLI changes: `npm run build --prefix cli`
   - No merge conflicts with main (check mergability)
   - All `tasks.md` checkboxes marked done
   - Implementation matches the approved spec

3. Leave a review comment with findings.

4. **Decision**:
   - ✅ **LGTM**: Comment approval and merge: `gh pr merge <N> --merge`
   - 🔁 **Fix needed**: Comment specific issues, resume the agent to fix, re-push. Re-review until resolved.

---

### Step 7 — Pull and report

After all PRs are merged:

```bash
git pull origin main
```

Report a summary table:

| PR | Task | Status |
|----|------|--------|
| #N | change-name | ✅ Merged |

---

## Rules

- **Never skip the draft PR spec review** — Step 4 is mandatory before any implementation
- **All plugin scripts must use CJS** (`require`/`module.exports`) — never ESM
- **TypeScript builds must pass** before merging CLI changes
- **Merge conflicts must be resolved** before merging — never force-merge
- **One worktree per task** — agents never share a working directory
- **Use OpenSpec commands** (`opsx:ff`, `opsx:apply`) via the Skill tool — never manually create artifacts
