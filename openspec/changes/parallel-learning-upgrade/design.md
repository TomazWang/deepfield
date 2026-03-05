## Context

The `deepfield-iterate` skill currently requires `--parallel` to opt into parallel domain learning. Parallel mode is almost always superior after Run 0 (domain index exists), yet it is rarely used because it is opt-in. Additionally, the existing launch mechanism is prose text (`Launch (background): deepfield-domain-learner`) that relies on Claude to interpret natural language as an Agent tool call — this is fragile and non-deterministic.

The `.claude/skills/parallel-work/SKILL.md` skill demonstrates a reliable pattern: explicit Agent tool call instructions with `run_in_background: true` and inline context in the prompt string. This pattern must be adopted for domain learner agents.

Current files involved:
- `plugin/skills/deepfield-iterate.md` lines 275–500 (mode selection + parallel execution)
- `plugin/commands/df-iterate.md` (flag definitions)

## Goals / Non-Goals

**Goals:**
- Make parallel execution the default when `domain-index.md` exists
- Replace prose agent launch with explicit Agent tool call instructions
- Ensure all agents in a batch are launched in a single message (one tool-call block)
- Record agent IDs in run config for traceability
- Keep `--max-agents` flag and default-5 batch size

**Non-Goals:**
- Changing consolidation or synthesis steps
- Changing sequential mode behavior (it still works identically, just requires `--sequential` to opt in)
- Modifying the `deepfield-domain-learner` agent itself
- Adding retry logic for failed agents (out of scope for this change)

## Decisions

### D1: Replace `--parallel` with `--sequential`

**Decision**: Remove `--parallel` flag. Add `--sequential` flag. When neither is specified and `domain-index.md` exists, the skill runs in parallel by default.

**Rationale**: Parallel is the better default for any project that has completed bootstrap. Forcing users to remember `--parallel` each time is friction. The sequential fallback for missing domain index is unchanged.

**Alternatives considered**:
- Keep `--parallel` and also add a config option — adds complexity without benefit; the flag approach is sufficient.
- Auto-detect based on domain count — overcomplicated; domain index presence is the right signal.

### D2: Inline domain context in Agent prompt string

**Decision**: Embed all domain-specific context (domain name, file list, paths, open questions) directly in the Agent tool call prompt string. Do not reference the agent file by path in the prompt — instead, embed all instructions inline.

**Rationale**: The `parallel-work/SKILL.md` pattern demonstrates that inline context is more reliable for background agents. Referencing an agent file by path requires the sub-agent to resolve the path and read the file — an extra step that can fail or be skipped. Inline context is self-contained.

**What to embed per-agent**:
- Role and scope description (1 paragraph from agent file)
- Domain name
- Exact file list for this domain
- `previousFindingsPath` (read if exists)
- `findingsOutputPath` (write findings here)
- `unknownsOutputPath` (write unknowns here)
- Open questions for this domain
- `currentDraftPath` (read if exists)
- Output format instructions (findings + unknowns file structure)

**Alternatives considered**:
- Reference the agent file by path and pass JSON inputs — fragile; agent file must be readable by sub-agent, and JSON parsing adds another potential failure mode.
- Hybrid: reference agent file but also include a brief context block — still requires agent file read; not meaningfully better.

### D3: Single-message batch launch

**Decision**: The skill instructs Claude to launch all agents for a batch in a **single message** containing multiple Agent tool calls. This ensures they are submitted concurrently in one round-trip.

**Rationale**: If agents are launched one per message, they run sequentially. The explicit instruction "launch all agents for this batch in a single message" is the minimal reliable instruction to achieve concurrency.

### D4: Agent ID recording

**Decision**: After each batch completes, record the agent IDs (returned by Agent tool calls) in the run config under `agentIds: { "<domain>": "<id>", ... }`.

**Rationale**: Agent IDs enable post-hoc debugging and are a prerequisite for any future resume-on-failure feature. Low cost to record, high value for traceability.

**Format in run config**:
```json
{
  "parallelMode": true,
  "domainsAnalyzed": ["api", "database", "ui"],
  "domainsFailed": ["auth"],
  "agentIds": {
    "api": "agent-abc123",
    "database": "agent-def456",
    "ui": "agent-ghi789",
    "auth": "agent-jkl012"
  }
}
```

Agent IDs for failed agents (no findings file written) are still recorded if the Agent tool returned an ID.

### D5: Mode selection logic order

**Decision**: Mode selection in the skill follows this order:
1. If `--sequential` was passed → sequential mode
2. Else if `domain-index.md` exists → parallel mode (default)
3. Else → sequential mode with warning ("domain-index.md not found — run /df-bootstrap first for parallel learning")

**Rationale**: Explicit flag always wins. Missing domain index is a graceful fallback, not an error.

## Risks / Trade-offs

- **Inline prompt verbosity**: Each agent prompt is longer due to inline instructions. This consumes more tokens per batch. Mitigation: Keep the embedded instructions concise (role + critical rules only, not the full agent file). The file list dominates token count anyway for large domains.
- **Breaking change to `--parallel` flag**: Any user scripts or docs referencing `--parallel` will need to be updated. Mitigation: The flag is optional and rarely scripted; document in PR description.
- **Agent IDs may not always be available**: If the Agent tool does not return an ID in some contexts, the agentIds map will have null/undefined entries. Mitigation: Record only when available; missing entries are acceptable.

## Open Questions

- None. All decisions are made above.
