# KB Builder — Component Architecture

## Package Structure

```
.claude/plugins/kb-builder/
├── PLUGIN.md                       # Package overview & orchestration
├── commands/
│   ├── kb-init.md
│   ├── kb-start.md
│   ├── kb-bootstrap.md
│   ├── kb-input.md
│   ├── kb-iterate.md
│   ├── kb-status.md
│   └── kb-output.md
├── skills/
│   ├── source-classifier.md        # Classify & index input sources
│   ├── incremental-scanner.md      # Diff-based source reading
│   ├── knowledge-synthesizer.md    # Cross-reference & merge findings
│   └── doc-generator.md            # Generate/update draft documents
├── agents/
│   ├── learning-agent.md           # Orchestrates the iterate cycle
│   └── plan-agent.md               # Generates/updates learning plan
└── templates/
    ├── project.config.json
    ├── run.config.json
    ├── brief.md
    └── ... (other templates)
```

## Component Type Rationale

### Commands (User entry points)

| Command | Type | Why |
|---------|------|-----|
| `/kb-init` | CLI-like (no AI) | Pure file operations, deterministic |
| `/kb-start` | Interactive | Light Q&A + file generation |
| `/kb-bootstrap` | Orchestrator | Triggers multiple skills in sequence |
| `/kb-input` | Hybrid | User provides source, AI classifies it |
| `/kb-iterate` | Agent trigger | Kicks off the learning-agent |
| `/kb-status` | CLI-like (read-only) | Reads state files, formats summary |
| `/kb-output` | CLI-like | File copying + optional AI polish |

### Skills (Focused, reusable capabilities)

| Skill | Input | Output |
|-------|-------|--------|
| **source-classifier** | File path / URL / text | Classification (type, trust level, domain) + filing |
| **incremental-scanner** | Source path + previous run's hashes | List of changed/new files worth reading |
| **knowledge-synthesizer** | New findings + existing topic files | Updated topic docs, updated knowledge-state |
| **doc-generator** | wip/ topic files + domain state | Polished draft documents in drafts/ |

### Agents (Autonomous multi-step workflows)

**learning-agent** — Core of `/kb-iterate`. Orchestrates one run:
1. Read project map + knowledge state + plan
2. Call incremental-scanner
3. Deep read focused sections
4. Call knowledge-synthesizer
5. Call doc-generator
6. Update project map + domain index
7. Call plan-agent
8. Evaluate stop conditions
9. Loop or stop

**plan-agent** — Generates/updates the learning plan:
1. Read current knowledge state
2. Read current plan
3. Identify gaps, contradictions, shallow areas
4. Generate updated plan with priorities
5. Suggest sources to request from user
