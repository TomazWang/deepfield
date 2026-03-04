---
name: parallel-work
description: Orchestrate parallel implementation of multiple tasks using isolated git worktrees, background agents, and the OpenSpec workflow. Use when the user provides multiple issues or tasks to work on simultaneously.
argument-hint: "[#issue1 #issue2 | task-file1.md task-file2.md | mixed]"
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep, Agent
---

Orchestrate parallel work across multiple tasks. Each task gets its own worktree and background agent. The workflow has two gated phases: **spec review** (draft PR) then **implementation** (ready PR).

**Tasks:** $ARGUMENTS

---

## Phase 0 — Collect & confirm tasks

If `$ARGUMENTS` is empty, ask:
> "What tasks should I work on in parallel? Provide GitHub issue numbers (e.g. `#34 #35`), GitLab issue numbers, or paths to task definition files."

Parse each argument:
- `#N` or `N` → GitHub issue. Read with `gh issue view N --repo <owner>/<repo>`. Derive change name by slugifying the title. Use `fix/` branch prefix for bugs, `feat/` for features.
- `glab#N` → GitLab issue. Read with `glab issue view N`.
- `*.md` path → Read the file directly. Use filename (without extension, underscores → hyphens) as change name.

Display a confirmation table before proceeding:

| # | Source | Change name | Branch |
|---|--------|-------------|--------|
| 1 | #34 | findings-evidence | fix/findings-evidence |
| 2 | #35 | source-files-ignored | fix/source-files-ignored |

Ask for confirmation before creating worktrees.

---

## Phase 1 — Set up worktrees

For each task:

```bash
git pull origin main --quiet
git worktree add ../<change-name> -b <branch-name>
```

Report all created worktrees, then proceed.

---

## Phase 2 — Spec phase (parallel agents)

Launch one background agent per task using the **Agent tool** with `run_in_background: true`.

**Agent instructions (spec phase):**

> Your job is **spec only** — do NOT implement anything yet.
>
> - Worktree: `/path/to/<change-name>`
> - Branch: `<branch-name>`
> - Task: [issue / file]
>
> 1. Read the full task source (`gh issue view N` or read the file).
> 2. Use the **Skill tool**, skill=`opsx:ff`, args=`<change-name>`. This creates all spec artifacts (proposal, design, specs, tasks) in one shot. All files go inside the worktree.
> 3. **Stop here — do NOT run `opsx:apply`.**
> 4. Commit spec artifacts and push as a draft PR:
>    ```bash
>    cd <worktree-path>
>    git add openspec/
>    git commit -m "spec: add OpenSpec artifacts for <change-name>"
>    git push origin <branch-name>
>    gh pr create --draft \
>      --title "[SPEC REVIEW] <issue title>" \
>      --body "$(cat <<'EOF'
> ## Spec Review — awaiting approval before implementation
>
> Closes #N
>
> **⚠️ Draft PR — do not merge. Spec artifacts only. Implementation will begin after review.**
>
> ### Artifacts
> - `openspec/changes/<change-name>/proposal.md`
> - `openspec/changes/<change-name>/design.md`
> - `openspec/changes/<change-name>/specs/`
> - `openspec/changes/<change-name>/tasks.md`
> EOF
>    )"
>    ```
> 5. Report back with the draft PR URL and a 2-sentence summary of what the spec proposes.

Wait for **all** spec agents to complete before proceeding.

---

## Phase 3 — Spec review (orchestrator)

For each draft PR, review:

1. Read the spec artifacts from the worktree:
   - `proposal.md` — Is the why clear? Does scope match the issue?
   - `design.md` — Are decisions sound? No over-engineering?
   - `specs/*.md` — Are requirements complete and testable (SHALL + scenarios)?
   - `tasks.md` — Are tasks granular and implementable?

2. Check architecture alignment (see [architecture-rules.md](architecture-rules.md)).

3. **Decision:**
   - ✅ **Approved** → Add to approved list.
   - 🔁 **Changes needed** → Leave specific comments on the PR. Resume the agent to revise the spec artifacts, re-push, and notify when done. Re-review until approved.

4. **After reviewing all specs**, present a summary to the user:

   | Task | Draft PR | Status | Notes |
   |------|----------|--------|-------|
   | change-name | #N | ✅ Looks good | ... |

   Then ask:
   > "I've reviewed all spec PRs above. Would you like to review them on GitHub before I start implementing, or should I go ahead?"
   >
   > Options: **"Go ahead"** | **"I'll review — let me know when to proceed"**

5. **If user wants to review:**
   - Wait for the user's signal (e.g. "looks good, proceed" or specific change requests).
   - If user requests changes, leave comments on the PR, resume the agent to revise, re-push, and repeat from step 3.

6. **Once the user gives the go-ahead:**
   - Comment on each approved PR: `"Spec approved — proceeding to implementation."`

Do not proceed to Phase 4 until the user gives the go-ahead.

---

## Phase 4 — Implementation phase (parallel agents)

For each approved spec, launch or resume an agent:

**Agent instructions (implementation phase):**

> The spec is approved. Now implement.
>
> - Worktree: `/path/to/<change-name>`
> - Branch: `<branch-name>`
>
> 1. Use the **Skill tool**, skill=`opsx:apply`. Implement all tasks from `tasks.md`. All files go in the worktree.
> 2. When all tasks are done:
>    ```bash
>    cd <worktree-path>
>    git add -A
>    git commit -m "feat: implement <change-name>"
>    git push origin <branch-name>
>    gh pr ready <PR-number>
>    ```
> 3. Report back with the PR URL.

Wait for **all** implementation agents to complete before proceeding.

---

## Phase 5 — Implementation review (orchestrator)

For each ready PR:

1. `gh pr diff <N>` — review all changes.
2. Check (see [architecture-rules.md](architecture-rules.md) for full checklist):
   - Plugin scripts: CJS only (`require`/`module.exports`), no ESM, no `"type":"module"` in `plugin/package.json`
   - CLI changes: TypeScript compiles — `npm run build --prefix cli`
   - Merge conflicts: `gh pr view <N> --json mergeable -q .mergeable` must be `MERGEABLE`
   - All `tasks.md` checkboxes marked `[x]`

3. **Decision:**
   - ✅ **LGTM** → Leave approval comment and merge: `gh pr merge <N> --merge`
   - 🔁 **Fix needed** → Comment specific issues. Resume the agent. Re-review until clean.

---

## Phase 6 — Wrap up

```bash
git pull origin main
```

Report a summary:

| PR | Task | Status |
|----|------|--------|
| #N | change-name | ✅ Merged |

Close any resolved issues that weren't auto-closed via `Closes #N`.

---

For detailed architecture rules and review checklists, see [architecture-rules.md](architecture-rules.md).
