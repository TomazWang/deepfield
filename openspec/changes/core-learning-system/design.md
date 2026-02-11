## Context

The Deepfield plugin currently has Phase 1 complete (init, start, status commands) which provide scaffolding and interactive setup. Phase 2 (core learning system) needs to implement autonomous learning capabilities: bootstrap, classification, incremental scanning, multi-run iteration, and knowledge synthesis.

**Current State:**
- `/df-init` scaffolds kb/ structure
- `/df-start` conducts Q&A and generates brief.md
- `/df-status` displays current state
- Scripts for atomic file operations (read-state.js, update-json.js, scaffold-kb.sh)
- Templates for initial documents

**Constraints:**
- Must work with large codebases (1000+ files) efficiently
- Must preserve user data across runs (idempotent operations)
- Must be resumable at any point (crashes, user interruptions)
- Must maintain clear separation: Command → Skill → Script/Agent
- Must follow Claude Code plugin patterns (agents, skills, commands)

**Stakeholders:**
- Plugin users who need to understand brownfield codebases
- AI agents that need focused expertise and parallelizable work

## Goals / Non-Goals

**Goals:**
- Autonomous multi-run learning that requires minimal user intervention
- Efficient incremental scanning that scales to large repositories
- Clear learning plan that drives focus and tracks progress
- Agent-based architecture enabling parallel execution
- Script-backed robustness for all file operations
- Resumable execution at any point in the workflow
- Context-aware command behavior that adapts to current state

**Non-Goals:**
- Real-time code analysis (we're building static documentation)
- Interactive debugging or code execution (read-only learning)
- Graph database or complex query system (markdown-based knowledge)
- Multi-user collaboration (single-user knowledge base)
- Version control integration beyond cloning (no git automation)

## Decisions

### Decision 1: Agent-Based Architecture for Learning Tasks

**Choice:** Use specialized agents for classification, scanning, learning, and synthesis rather than monolithic skills.

**Rationale:**
- **Parallelization**: Multiple agents can run concurrently (classify sources while scanning structure)
- **Focused expertise**: Each agent has narrow responsibility and specialized system prompt
- **Testability**: Agents can be tested independently with mock inputs
- **Context efficiency**: Agents only load context relevant to their task

**Alternatives considered:**
- Monolithic skill: Simpler but can't parallelize, context overload
- External services: More complex, requires infrastructure

**Implementation:**
```
agents/deepfield-classifier.md      # Source type/trust classification
agents/deepfield-scanner.md         # Incremental file scanning
agents/deepfield-domain-detector.md # Auto-detect domains
agents/deepfield-learner.md         # Deep reading + connection
agents/deepfield-plan-generator.md  # Learning plan creation/updates
agents/deepfield-knowledge-synth.md # Draft document updates
```

### Decision 2: Script-Backed File Operations

**Choice:** All file operations (create, update, hash, clone) use tested scripts, not AI-generated code.

**Rationale:**
- **Robustness**: Atomic writes (temp-then-rename) prevent corruption
- **Consistency**: Templates ensure uniform formatting
- **Speed**: Native bash/Node.js is faster than AI code generation
- **Testability**: Scripts can be unit tested independently
- **Reliability**: Scripts work the same way every time

**Alternatives considered:**
- AI-generated operations: More flexible but less reliable, not idempotent
- Manual file operations: Can't be automated or tested

**Implementation:**
```
scripts/clone-repos.sh      # Git clone with branch/tag support
scripts/hash-files.js       # SHA-256 hashing with ignore patterns
scripts/update-json.js      # Atomic JSON updates (existing)
scripts/read-state.js       # JSON validation (existing)
scripts/scaffold-kb.sh      # Structure creation (existing)
```

### Decision 3: Hash-Based Incremental Scanning

**Choice:** Use SHA-256 file hashes stored in run configs to detect changes between runs.

**Rationale:**
- **Efficiency**: Only read changed/new files, skip unchanged
- **Scalability**: Works with thousands of files
- **Accuracy**: Hash collision probability negligible for this use case
- **Simplicity**: Just compare hashes, no complex diffing

**Algorithm:**
```
1. Compute hashes for all relevant files in source/
2. Load hashes from previous run-N-1.config.json
3. Compare:
   - Same hash → skip (unchanged)
   - Different hash → deep read (changed)
   - No previous hash → deep read (new)
4. Store new hashes in run-N.config.json
```

**Alternatives considered:**
- Timestamp-based: Unreliable (timestamps can be wrong)
- Git diff: Only works for git repos, not all sources
- Full re-read: Wasteful, doesn't scale

**Trade-offs:**
- Must compute hashes (small overhead)
- Renamed files appear as delete+add (acceptable)

### Decision 4: Learning Plan as Central State Artifact

**Choice:** `wip/learning-plan.md` is the primary state artifact that drives all learning activities.

**Rationale:**
- **Single source of truth**: All runs reference the same plan
- **Human-readable**: Markdown format, user can read/edit if needed
- **Structured but flexible**: Can evolve as understanding grows
- **Drives focus**: Plan priorities determine what to learn next
- **Tracks progress**: Confidence levels show completion

**Structure:**
```markdown
# Learning Plan

## Topics

### Authentication (Priority: HIGH)
- Confidence: 30% → 95%
- Questions:
  - How does session management work?
  - What's the token refresh strategy?
- Sources needed:
  - Auth service code ✓
  - Security docs (missing)

### Data Flow (Priority: HIGH)
- Confidence: 20% → 90%
...
```

**Alternatives considered:**
- JSON config: Less readable, harder to maintain manually
- Database: Over-engineered for single-user tool
- Per-run plans: Loses continuity across runs

### Decision 5: Autonomous Execution with Configurable Stop Conditions

**Choice:** `/df-continue` runs multiple iterations (N, N+1, N+2...) automatically until stop condition.

**Stop Conditions (OR logic):**
1. Plan complete: All HIGH priority topics >80% confidence
2. Max runs: Configured limit reached (default: 5)
3. Blocked: Need unavailable sources
4. Diminishing returns: 2+ runs with minimal findings
5. Major restructure: Domain changes need user confirmation

**Rationale:**
- **Efficiency**: User doesn't have to manually trigger each run
- **Safety**: Stop conditions prevent runaway execution
- **Flexibility**: User can configure maxRuns or use --once flag
- **Transparency**: Clear reporting of why execution stopped

**Alternatives considered:**
- Always single run: Tedious for users
- Unlimited autonomous: Dangerous, could run forever
- Fixed run count: Inflexible

**Implementation:**
```
Skill: deepfield-iterate.md

Loop:
  1. Execute run N
  2. Evaluate stop conditions
  3. If should_continue:
       N++
       goto Loop
  4. Else:
       Report and exit
```

### Decision 6: Context-Aware Command Routing

**Choice:** `/df-continue` detects current state and dispatches to appropriate action (start, bootstrap, iterate).

**Rationale:**
- **User simplicity**: Single command, system figures out what to do
- **Consistency**: OpenSpec's `/opsx:continue` uses same pattern
- **Fewer commands**: Reduces surface area user needs to learn

**Routing Logic:**
```
/df-continue:
  State EMPTY → error "run /df-init first"
  State INITIALIZED → invoke start-interactive-setup skill
  State BRIEF_CREATED → prompt "fill out brief.md"
  State BRIEF_READY → invoke bootstrap-kb skill (Run 0)
  State LEARNING + new input → invoke iterate-learning skill
  State LEARNING + no input → prompt "add sources to staging"
  State COMPLETE → suggest /df-distill or /df-restart
```

**Alternatives considered:**
- Separate commands (/df-bootstrap, /df-iterate): More explicit but verbose
- Always prompt: Interrupts autonomous flow
- Auto-progress without user control: Can be surprising

### Decision 7: Staging Area Pattern for User Input

**Choice:** After each run, automatically create `source/run-N+1-staging/` with README, feedback.md, and sources/ subfolder.

**Rationale:**
- **Explicit intent**: Name makes it clear this is for next run
- **Guided input**: README explains what to add
- **Structured feedback**: Template helps users provide useful info
- **Implicit classification**: System handles filing on next run

**Structure:**
```
source/run-3-staging/
├── README.md           # Instructions
├── feedback.md         # Template with current open questions
└── sources/            # Drop new files here
```

**Alternatives considered:**
- User adds to baseline: Confusing, mixes persistent/ephemeral
- Separate /df-input command: More explicit but verbose
- No guidance: Users don't know what to provide

## Risks / Trade-offs

### Risk: Hash computation overhead on large repos

**Mitigation:**
- Batch processing to limit memory usage
- Skip ignored patterns (node_modules, .git, build/)
- Parallelize hashing with workers if needed
- Only hash files in relevant domains when focus is scoped

### Risk: Agent context overload on large codebases

**Mitigation:**
- Limit agent context to relevant domain only
- Use incremental scanning to avoid re-reading unchanged files
- Break large domains into sub-domains if needed
- Use project-map for high-level context, not full file reads

### Risk: Learning plan diverges from actual codebase

**Mitigation:**
- Plan generator re-evaluates structure after each run
- Major domain changes trigger user confirmation before continuing
- Confidence tracking surfaces when understanding is low
- Unknowns.md explicitly documents gaps

### Risk: Autonomous execution runs too long

**Mitigation:**
- Configurable maxRuns with safe default (5)
- Multiple stop conditions (not just max runs)
- User can interrupt with Ctrl+C (state is persisted per run)
- --once flag for manual control

### Risk: User adds malicious code in sources

**Mitigation:**
- Read-only operations (no code execution)
- Scripts don't eval user input
- Git clones use specified branch/tag (no arbitrary commands)
- User's responsibility to trust their sources

### Trade-off: Markdown state vs structured database

**Choice:** Markdown for human readability and simplicity
**Cost:** Less queryable, manual parsing needed
**Benefit:** User can read/edit, no external dependencies, portable

### Trade-off: Autonomous vs manual control

**Choice:** Autonomous by default with configurable stops
**Cost:** Less control per-run
**Benefit:** Much more efficient, better UX for common case

## Migration Plan

### Phase 2A: Bootstrap & Classification (First PR)

1. Implement scripts:
   - `clone-repos.sh`
   - `hash-files.js`

2. Implement agents:
   - `deepfield-classifier.md`
   - `deepfield-scanner.md`
   - `deepfield-domain-detector.md`
   - `deepfield-plan-generator.md`

3. Implement skill:
   - `deepfield-bootstrap.md` (orchestrates Run 0)

4. Update commands:
   - `df-continue.md` (add bootstrap routing)

5. Update templates:
   - `learning-plan.md`
   - `brief.md` (add maxRuns explanation)

6. Update specs:
   - Merge delta specs to main specs after implementation

**Testing:** Manual bootstrap on sample codebase, verify file hashes, check learning plan generation

### Phase 2B: Iteration & Synthesis (Second PR)

1. Implement agents:
   - `deepfield-learner.md`
   - `deepfield-knowledge-synth.md`

2. Implement skill:
   - `deepfield-iterate.md` (orchestrates autonomous loop)

3. Update commands:
   - `df-continue.md` (add iteration routing)
   - `df-status.md` (show learning progress)

4. Implement staging area creation logic

**Testing:** Run multiple iterations, verify incremental scanning, check draft updates, test stop conditions

### Phase 2C: Polish & Documentation (Third PR)

1. Add `/df-restart` command
2. Improve error handling and recovery
3. Add logging and debug output
4. Write user documentation
5. Create example workflows

**Rollback:** Each phase is independently functional. If issues arise, revert PR and address before proceeding.

## Open Questions

1. **How deep should initial bootstrap scan go?**
   - Option A: Very shallow (file tree + README only)
   - Option B: Moderate (entry points, configs, main components)
   - **Recommendation:** Option B - enough to build meaningful plan

2. **Should learning plan support sub-topics explicitly?**
   - Current: Flat list of topics
   - Alternative: Nested hierarchy (auth → [login, session, tokens])
   - **Recommendation:** Start flat, add nesting if users request it

3. **How to handle conflicting information in sources?**
   - Current: Document in unknowns.md, lower confidence
   - Alternative: Explicit contradiction tracking with source references
   - **Recommendation:** Current approach, can enhance later

4. **Should we support domain-specific agents?**
   - Current: Generic learner agent
   - Alternative: Specialized agents per domain (auth-learner, api-learner)
   - **Recommendation:** Start generic, specialize if needed
