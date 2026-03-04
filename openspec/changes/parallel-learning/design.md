## Context

The `deepfield-iterate` skill currently runs domain learning sequentially: one domain's learner agent finishes before the next begins. For projects with 4-8 domains this means the total run time grows linearly with domain count.

Claude Code supports parallel Task execution — multiple agents can run concurrently in background Tasks. This feature can be used to spawn one `deepfield-domain-learner` agent per domain and wait for all of them before synthesizing.

Current sequential flow:
```
Orchestrator → learner(auth) → learner(api) → learner(db) → synth → done
```

Target parallel flow:
```
Orchestrator → spawn learner(auth) + learner(api) + learner(db) in parallel
              → wait for all
              → gather-findings script consolidates per-domain files
              → synth → done
```

## Goals / Non-Goals

**Goals:**
- Run domain-learner agents concurrently within a single run
- Consolidate per-domain findings into the existing run-N findings format
- Expose `--parallel` and `--max-agents` flags on `/df-iterate`
- Sequential mode remains the default (no breaking change)
- Graceful failure: if one domain agent fails, continue with others and report

**Non-Goals:**
- Changing the knowledge synthesizer or draft update workflow
- Implementing parallel runs (multiple run numbers at once)
- Parallel mode for bootstrap (Run 0)
- Auto-tuning concurrency based on API rate limits

## Decisions

### Decision 1: Domain-learner agent is a new agent file

Rather than parameterizing the existing `deepfield-learner` agent to handle single-domain work, a dedicated `deepfield-domain-learner` agent is cleaner. The existing learner handles multi-topic sessions; the domain learner is scoped to a single domain with a narrower mandate. This keeps responsibilities clear and avoids conditional logic in the agent prompt.

_Alternative considered_: Pass `--domain` flag to existing learner. Rejected because agent prompts are not CLI tools; conditional sections in markdown make them harder to maintain.

### Decision 2: Orchestration lives in the skill, not a standalone script

The parallel orchestration logic (spawn N agents, wait for all, call gather script) belongs in `deepfield-iterate.md` as an alternate execution path. A standalone `run-parallel-learning.js` script cannot launch Claude agents — only the skill (running inside Claude Code) can use the Task tool. The script layer handles only file-system work (consolidating findings files).

_Alternative considered_: New `run-parallel-learning.js` as orchestrator. Rejected because scripts cannot spawn Claude agents; that's a Claude Code skill concern.

### Decision 3: Per-domain findings files, then consolidation

Each domain-learner agent writes to `deepfield/wip/run-N/domains/<domain>-findings.md`. After all agents finish, a `gather-domain-findings.js` script concatenates them into the canonical `deepfield/wip/run-N/findings.md`. This preserves the existing downstream interface (synthesizer reads `findings.md`) without modification.

### Decision 4: Max agents cap defaults to 5

To avoid overwhelming the API, default `--max-agents=5`. If there are more domains, batch them into groups of `maxAgents`, running each group in parallel sequentially. This bounds concurrency while still delivering meaningful speedup.

## Risks / Trade-offs

- **Agent failure isolation**: If one domain agent crashes, it should not abort others. The skill must check which per-domain files exist after all tasks complete and report missing ones. → Mitigation: after all Tasks resolve, verify each `<domain>-findings.md` exists before calling the gather script.
- **API rate limits**: Many concurrent agents on large projects may hit rate limits. → Mitigation: `--max-agents` cap and batching.
- **Findings quality**: Parallel agents cannot share context in real time, so cross-domain relationships may be missed. → Mitigation: the synthesis agent still runs after consolidation and can detect cross-domain patterns from the combined findings file.
- **No sequential fallback on partial failure**: If 2 of 5 agents fail, we still synthesize findings for the 3 that succeeded — a partial run. → Acceptable trade-off; the learning plan will show unchanged confidence for failed domains and they'll be retried next run.

## Open Questions

- Should `--parallel` become the default after a future maturity period? Deferred — leave sequential as default for now.
