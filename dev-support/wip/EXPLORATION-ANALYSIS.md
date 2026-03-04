# Deepfield - Exploration Analysis

**Date**: 2026-02-11
**Status**: Design Validation Complete

This document captures the deep exploration and critical analysis of the Deepfield design before implementation.

---

## Executive Summary

Deepfield is an **ambitious but achievable** AI-driven knowledge base builder for Claude Code. The architecture is sound with well-thought-out separation of concerns. The main innovations are:

1. **Autonomous iterative learning** with intelligent stop conditions
2. **Four-space design** (source/wip/drafts/output) for clear boundaries
3. **Incremental scanning** to handle large codebases efficiently
4. **Three-layer knowledge accumulation** to prevent context explosion
5. **Honest gap documentation** via unknowns.md

### Critical Success Factors

Three areas need rigorous attention:

1. ✅ **Autonomous loop control** - needs measurable stop conditions
2. ✅ **Large codebase scaling** - needs shallow first-pass strategy
3. ✅ **Stop condition precision** - needs concrete metrics

---

## 1. Architecture Analysis: Command→Skill→Script→Agent

```
┌─────────────────────────────────────────────────────────┐
│                    ARCHITECTURE LAYERS                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  USER                                                    │
│   │                                                      │
│   ├─▶ /df-init ────────────────┐                       │
│   ├─▶ /df-start ───────────┐   │                       │
│   ├─▶ /df-iterate ─────┐   │   │                       │
│   └─▶ /df-status ───┐  │   │   │                       │
│                      │  │   │   │                       │
│   COMMAND LAYER      ▼  ▼   ▼   ▼                       │
│   ┌──────────────────────────────────┐                 │
│   │  Entry points, arg parsing       │                 │
│   │  State validation                │                 │
│   └──────────┬───────────────────────┘                 │
│              │                                           │
│   SKILL LAYER▼                                          │
│   ┌──────────────────────────────────┐                 │
│   │  Workflow orchestration          │                 │
│   │  Decision logic                  │                 │
│   └──────┬───────────────┬───────────┘                 │
│          │               │                              │
│          ▼               ▼                              │
│   ┌──────────┐    ┌──────────────┐                    │
│   │ SCRIPTS  │    │   AGENTS     │                    │
│   │          │    │              │                    │
│   │ • Atomic │    │ • learning   │                    │
│   │ • Tested │    │ • planning   │                    │
│   │ • Fast   │    │ • analysis   │                    │
│   └──────────┘    └──────────────┘                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### ✅ Strengths

**Separation of concerns is clean:**
- Commands = thin controllers (entry points)
- Skills = business logic (orchestration)
- Scripts = robust operations (file I/O, state management)
- Agents = AI reasoning (deep analysis)

**Testability:** Scripts can be tested independently. This is huge for reliability.

**Robustness:** Atomic file operations via scripts prevent corrupted state.

### ⚠️ Challenges & Recommendations

#### Challenge 1: Script vs AI Boundary

**Problem:** When does AI generate content vs when does a script template it?

```
Example tension:
┌─────────────────────────────────────────────┐
│ Q: Who writes findings.md?                  │
├─────────────────────────────────────────────┤
│                                             │
│  Option A: Script with template             │
│    → Consistent format                      │
│    → But AI needs freedom to structure      │
│                                             │
│  Option B: AI writes freely                 │
│    → Flexible content                       │
│    → But loses atomic write guarantee       │
│                                             │
│  Solution: Script creates, AI appends?      │
│            Script validates structure?      │
│                                             │
└─────────────────────────────────────────────┘
```

**Recommendation:** Scripts handle structure (create file, ensure sections exist), AI fills content. Use a "write proposal → validate → commit" pattern for AI-generated content.

#### Challenge 2: Agent Coordination Complexity

**Problem:** If multiple agents run in parallel, how do they coordinate writes to shared state?

```
Concurrent access scenario:
┌─────────────────────────────────────────────┐
│ learning-agent                plan-agent    │
│      │                             │        │
│      ├─ read knowledge-state.md    │        │
│      │                             │        │
│      │                  read plan.md ◀──────┤
│      │                             │        │
│      ├─ update domains/auth/       │        │
│      │                             │        │
│      │                  update plan.md ◀────┤
│      │                             │        │
│      ├─ write knowledge-state.md   │        │
│      │                             │        │
│      ▼                             ▼        │
│                                              │
│  What if knowledge-state changed while      │
│  plan-agent was reading it?                 │
└─────────────────────────────────────────────┘
```

**Recommendation:** Either:
- Run agents sequentially (simpler, slower) ← **START HERE**
- Define clear ownership zones (learning-agent owns knowledge-state, plan-agent owns plan.md)
- Use file locking (add complexity later if needed)

#### Challenge 3: Error Recovery

**Problem:** What happens if AI crashes mid-run? Is state corrupted?

```
Failure scenarios:
┌─────────────────────────────────────────────┐
│ 1. AI crashes after writing findings.md     │
│    but before updating knowledge-state.md   │
│    → run-N incomplete                       │
│                                             │
│ 2. User interrupts /df-iterate              │
│    → partial run artifacts exist            │
│                                             │
│ 3. Script fails (disk full, permission)     │
│    → which files got written?               │
└─────────────────────────────────────────────┘
```

**Recommendation:** Each run needs a transaction-like boundary:
- Write to `wip/run-N/.in-progress/`
- On success, move to `wip/run-N/`
- On failure, leave `.in-progress/` for inspection
- Add `df-recover` command to clean up

---

## 2. Four-Space Design Analysis

```
┌──────────────────────────────────────────────────────────┐
│                     FOUR SPACES                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  source/                    wip/                         │
│  ┌─────────────┐           ┌─────────────┐             │
│  │ baseline/   │           │ project-map │             │
│  │  • repos    │           │ domain-index│             │
│  │  • docs     │─────────▶ │ run-N/      │             │
│  │             │  READ     │  • findings │             │
│  │ run-N/      │           │  • plan     │             │
│  │  • notes    │           │  • state    │             │
│  └─────────────┘           └──────┬──────┘             │
│                                    │                     │
│                                    │ SYNTHESIZE          │
│                                    ▼                     │
│  output/                   drafts/                       │
│  ┌─────────────┐           ┌─────────────┐             │
│  │ v1/         │◀──────────│ architecture│             │
│  │ v2/         │  SNAPSHOT │ glossary    │             │
│  │ v3/         │           │ domains/    │             │
│  └─────────────┘           │ unknowns.md │             │
│                            └─────────────┘             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### ✅ Strengths

- **Clear boundaries:** Each space has distinct purpose and owner
- **Transparency:** User can inspect `wip/` to understand AI thinking
- **Versioning:** `output/` provides snapshots without disrupting ongoing learning

### ⚠️ Challenges & Recommendations

#### Challenge 1: Space Transitions

**Problem:** How does information flow between spaces? Who orchestrates?

```
Data flow questions:
┌─────────────────────────────────────────────┐
│ source/baseline/repos/app/                  │
│     ↓                                       │
│ Who decides to read src/auth.ts?            │
│     ↓                                       │
│ wip/run-3/domains/auth/notes.md            │
│     ↓                                       │
│ Who synthesizes into draft?                 │
│     ↓                                       │
│ drafts/domains/auth/overview.md            │
│     ↓                                       │
│ Who triggers snapshot?                      │
│     ↓                                       │
│ output/v2/domains/auth/overview.md         │
└─────────────────────────────────────────────┘
```

**Recommendation:** Make this explicit in the design:
- **Incremental Scanner** reads source → wip notes
- **Learning Agent** synthesizes wip → drafts
- **Output Command** snapshots drafts → output

#### Challenge 2: Source Classification Consistency

**Problem:** The design says "User can override classification. AI suggests, user confirms." What's the UX for this?

```
UX concern:
┌─────────────────────────────────────────────┐
│ /df-input ./meeting-notes.md                │
│                                             │
│ AI: "This looks like run-specific context.  │
│      Classifying as source/run-3/           │
│      Override? [baseline/trusted]"          │
│                                             │
│ User: "Actually it's authoritative"         │
│                                             │
│ AI: Moves to source/baseline/trusted-docs/  │
└─────────────────────────────────────────────┘
```

This adds friction.

**Recommendation:** Start with AI auto-classification, add override flags later if needed:
```bash
/df-input ./doc.md --trust=baseline
/df-input ./notes.md --trust=run
```

#### Challenge 3: Cleanup Strategy

**Problem:** Run folders accumulate. After 50 runs, `wip/` has 50 run-N folders. Do you prune old ones?

**Recommendation:** Add to design:
- Keep last N runs (configurable, default 10)
- Archive older runs to `wip/.archive/` as `.tar.gz`
- Add `df-cleanup` or make it automatic

---

## 3. Autonomous Iteration & Stop Conditions

```
┌──────────────────────────────────────────────────────────┐
│                  AUTONOMOUS LOOP                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  START: /df-iterate                                      │
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │  LOOP (N times, N can be unbounded)      │           │
│  │                                           │           │
│  │  1. Read state (map, plan, knowledge)    │           │
│  │  2. Scan sources (incremental)           │           │
│  │  3. Deep read (focused)                  │           │
│  │  4. Learn (write findings)               │           │
│  │  5. Synthesize (update drafts)           │           │
│  │  6. Update maps                          │           │
│  │  7. Replan                                │           │
│  │  8. Check stop condition ──┐             │           │
│  │                            │             │           │
│  └────────────────────────────┼─────────────┘           │
│                               │                          │
│                               ▼                          │
│                     ┌──────────────────┐                │
│                     │  STOP IF:        │                │
│                     │  • Blocked       │                │
│                     │  • Diminishing   │                │
│                     │  • Coverage hit  │                │
│                     │  • Safety limit  │                │
│                     │  • Domain change │                │
│                     └──────────────────┘                │
│                                                          │
│  REPORT to user                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### ✅ Strengths

- **Autonomy:** User doesn't babysit (killer feature)
- **Safety limits:** Prevents runaway loops
- **Well-reasoned conditions:** Each addresses a real scenario

### 🔴 Critical Challenge: Stop Condition Evaluation

**Problem:** How does AI evaluate stop conditions? This is the hardest part.

```
Stop Condition Analysis:
┌─────────────────────────────────────────────────────────┐
│ 1. BLOCKED (needs unavailable source)                  │
│    ───────────────────────────────────────────────────  │
│    plan.md says: "Need database schema"                │
│    How does AI know it's not in source/?               │
│    → Must track "requested sources" separately          │
│    → Must check if request is fulfilled                 │
│                                                         │
│ 2. DIMINISHING RETURNS (2+ runs, minimal findings)     │
│    ───────────────────────────────────────────────────  │
│    What counts as "minimal"?                            │
│    → findings.md line count < threshold?                │
│    → knowledge-state.md diff < 10%?                     │
│    → New domain coverage < 5%?                          │
│    This needs CONCRETE METRICS                          │
│                                                         │
│ 3. COVERAGE REACHED (all topics high confidence)       │
│    ───────────────────────────────────────────────────  │
│    How is confidence tracked?                           │
│    → Per-topic confidence scores in knowledge-state?    │
│    → AI self-reports confidence (subjective!)           │
│    This needs STRUCTURE in knowledge-state.md           │
│                                                         │
│ 4. SAFETY LIMIT (max runs)                             │
│    ───────────────────────────────────────────────────  │
│    Easy: run_count >= max_runs                          │
│    ✓ This one is straightforward                        │
│                                                         │
│ 5. DOMAIN RESTRUCTURE (significant change)             │
│    ───────────────────────────────────────────────────  │
│    What's "significant"?                                │
│    → domain-index.md diff shows new domains?            │
│    → Existing domain split into sub-domains?            │
│    → Must compare domain-index versions                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 🎯 Critical Recommendation: Measurable Stop Conditions

Stop conditions need **measurable criteria**, not vibes.

#### Proposed structure for `wip/run-N/knowledge-state.md`:

```markdown
# Knowledge State - Run 3

## Coverage Summary
- Total domains: 5
- High confidence: 2 (auth, api)
- Medium confidence: 2 (data, deploy)
- Low confidence: 1 (testing)
- Uncovered: 0

## Domain Confidence Scores
### auth (90% confident)
- Authentication flow: complete
- Authorization: complete
- Session management: gaps in edge cases

### api (85% confident)
- REST endpoints: complete
- GraphQL: complete
- Rate limiting: shallow understanding

... (continue for all domains)

## Metrics
- Total findings this run: 47 items
- New findings vs run-2: 12 items (25% new)
- Knowledge-state diff vs run-2: 15% changed
- Domains added this run: 0
- Domains split this run: 0

## Blocked Items
- Need: production deployment logs
- Need: database migration history
```

With this structure, stop conditions become **checkable**:
- **Blocked:** `len(blocked_items) > 0`
- **Diminishing:** `new_findings_pct < 20% AND state_diff < 10%`
- **Coverage:** `all(domain.confidence > 80%)`
- **Domain change:** `domains_added + domains_split > 0`

### Additional Safety Layers

Even with stop conditions, bugs could cause infinite loops.

**Recommendation:** Add multiple safety layers:

```
Safety layers:
1. Max runs per invocation (default: 5)
2. Max wall-clock time (default: 30 minutes)
3. User can Ctrl+C anytime (graceful stop, save state)
4. After each run, show progress + "Continue? [Y/n]" (optional flag)
```

### Progress Visibility

During `/df-iterate`, what does the user see? This could run for 10+ minutes.

**Recommendation:**

```
/df-iterate

Starting autonomous learning...

Run 1/5: Learning auth domain
  ✓ Scanned 47 files (12 new)
  ✓ Read 8 focused sections
  ✓ Updated 3 draft documents
  → Added 23 new findings
  → Confidence: auth (90%), api (75%)

Run 2/5: Learning data domain
  ✓ Scanned 52 files (5 new)
  ✓ Read 6 focused sections
  ✓ Updated 2 draft documents
  → Added 8 new findings
  → Confidence: data (70%), api (80%)

Run 3/5: Learning deploy domain
  ⚠ Blocked: Need production deployment logs

Stopping: Blocked on missing sources

Summary:
  • Completed 2 runs
  • Updated 5 draft documents
  • Confidence improved across 3 domains
  • Next: Provide deployment logs via /df-input
```

---

## 4. Incremental Scanning & Knowledge Accumulation

```
┌──────────────────────────────────────────────────────────┐
│              INCREMENTAL SCANNING STRATEGY               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Run N-1: Read files, compute hashes                     │
│  ┌────────────────────────────────────────────┐         │
│  │ run-N-1.config.json                        │         │
│  │ {                                          │         │
│  │   "file_hashes": {                         │         │
│  │     "src/auth.ts": "abc123",               │         │
│  │     "src/api.ts": "def456",                │         │
│  │     ...                                    │         │
│  │   }                                        │         │
│  │ }                                          │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  Run N: Compare hashes                                   │
│  ┌────────────────────────────────────────────┐         │
│  │ Scan source/baseline/repos/                │         │
│  │ For each file:                             │         │
│  │   current_hash = hash(file)                │         │
│  │   if current_hash != previous_hash:        │         │
│  │     mark as CHANGED                        │         │
│  │   if file not in previous_hashes:          │         │
│  │     mark as NEW                            │         │
│  │                                            │         │
│  │ Result: [CHANGED, NEW] → focus these       │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### ✅ Strengths

- **Efficiency:** Don't re-read unchanged files (essential for large codebases)
- **Git integration:** Use `git diff` for baseline repos (smart)

### ⚠️ Challenges & Recommendations

#### Challenge 1: First Run Has No Hashes

**Problem:** Run 0 must read everything. For a large monorepo, this could be **thousands of files**. How do you prevent AI from drowning in context?

```
Large codebase problem:
┌─────────────────────────────────────────────┐
│ Monorepo: 10,000 files                      │
│ Run 0: Read all?                            │
│   → Context explosion                       │
│   → Takes hours                             │
│   → AI can't hold it all                    │
│                                             │
│ Solution: Staged scanning                   │
│   Run 0: Structure only (tree, READMEs)     │
│   Run 1+: Deep read per domain              │
└─────────────────────────────────────────────┘
```

**Recommendation:** Make Run 0 **deliberately shallow**:
- Read file tree (structure)
- Read top-level READMEs, package.json, configs
- Detect domains from structure
- **Don't deep-read yet**
- Mark everything as "unread" for future runs

#### Challenge 2: Hash Algorithm

**Question:** What hash? MD5, SHA256, git blob hash?

**Recommendation:** Use **git blob hash** for git repos (leverage `git ls-tree`), MD5 for other sources (fast enough).

#### Challenge 3: Partial File Changes

**Problem:** If a 5000-line file changes 1 line, do you re-read all 5000 lines?

```
Granularity problem:
┌─────────────────────────────────────────────┐
│ auth.ts: 5000 lines                         │
│ Change: Line 247 (added log statement)      │
│                                             │
│ Option A: Re-read entire file               │
│   → Inefficient, but simple                 │
│                                             │
│ Option B: Git diff, read changed sections   │
│   → Efficient, but complex                  │
│   → Need context around changes             │
│                                             │
│ Option C: Hybrid                            │
│   → If small change: read changed section   │
│   → If large change: re-read file           │
└─────────────────────────────────────────────┘
```

**Recommendation:** Start with Option A (simple), add Option B later if needed.

### Knowledge Accumulation Layers

The design has 3 layers:
- `findings.md` (per-run, write-only)
- `knowledge-state.md` (rewritten each run)
- Draft docs (cumulative, refined)

This is **clever** but raises a critical question:

#### 🔴 Critical Question: How Are Draft Docs Updated?

```
Accumulation questions:
┌─────────────────────────────────────────────┐
│ Run 1: Learn "auth uses JWT"                │
│   → findings.md: "JWT tokens, 15min expiry" │
│   → knowledge-state.md: "Auth: JWT (70%)"   │
│   → drafts/auth.md: "Auth uses JWT..."      │
│                                             │
│ Run 2: Learn "actually, also OAuth"         │
│   → findings.md: "OAuth2 flow discovered"   │
│   → knowledge-state.md: "Auth: JWT+OAuth"   │
│   → drafts/auth.md: HOW TO UPDATE?          │
│      • Append new section?                  │
│      • Rewrite entire doc?                  │
│      • Merge intelligently?                 │
└─────────────────────────────────────────────┘
```

**Option A: Append-only**
```markdown
# Auth System

## JWT Tokens (Run 1)
Auth uses JWT tokens with 15-minute expiry...

## OAuth2 Integration (Run 2)
Also supports OAuth2 for third-party...
```

**Option B: Rewrite**
AI rewrites entire draft each run. Risky: might lose details from earlier runs.

**Option C: Intelligent merge** ← **RECOMMENDED**
AI reads current draft + new findings → produces updated draft. This is complex but what you probably want.

**Recommendation:** Start with **Option C** but make it explicit:

Each run, for each relevant draft:
1. AI reads current draft (full text)
2. AI reads new findings from this run
3. AI produces "draft update" (additions, modifications)
4. Script applies update to draft (via Edit tool or structured merge)

This way, drafts evolve rather than being rewritten from scratch.

---

## 5. Domain Decomposition

```
┌──────────────────────────────────────────────────────────┐
│                 DOMAIN DECOMPOSITION                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Run 0: Initial detection                                │
│  ┌────────────────────────────────────────┐             │
│  │ Signals:                               │             │
│  │ • Directory structure (src/auth/, ...)│             │
│  │ • Service boundaries (microservices)   │             │
│  │ • API route grouping (/api/v1/auth)    │             │
│  │ • Database ownership (auth_db)         │             │
│  │ • CODEOWNERS files                     │             │
│  └────────────────┬───────────────────────┘             │
│                   ▼                                      │
│  ┌────────────────────────────────────────┐             │
│  │ domain-index.md                        │             │
│  │                                        │             │
│  │ Domains (initial):                     │             │
│  │ 1. auth (confidence: 30%)              │             │
│  │ 2. api (confidence: 20%)               │             │
│  │ 3. data (confidence: 10%)              │             │
│  │ 4. deploy (confidence: 5%)             │             │
│  └────────────────────────────────────────┘             │
│                                                          │
│  Run 1-2: Validate and refine                            │
│  • Read code, confirm boundaries                         │
│  • Merge domains if overlap                              │
│  • Split domains if too large                            │
│                                                          │
│  Run 3+: Deep dive per domain                            │
│  • Each run focuses on 1-2 domains                       │
│  • Update confidence as learning progresses              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### ✅ Strengths

- **Adaptive:** Domains emerge rather than being fixed upfront
- **Scalable:** Focus on one domain at a time prevents overwhelming context
- **User can override:** If AI gets domains wrong, user can correct

### ⚠️ Challenges & Recommendations

#### Challenge 1: Domain Detection Signal Reliability

The design lists signals (directory structure, services, etc.). But how reliable are these?

```
Signal reliability:
┌─────────────────────────────────────────────┐
│ Directory structure:                        │
│   src/auth/ → Likely a domain ✓             │
│   src/utils/ → Shared, not a domain ✗       │
│   → Need heuristics: size, coupling         │
│                                             │
│ Service boundaries:                         │
│   Microservices → Clear domains ✓           │
│   Monolith → Fuzzy ⚠                        │
│                                             │
│ API routes:                                 │
│   /api/v1/auth → Likely auth domain ✓       │
│   /api/v1/users → Auth or user-mgmt? ⚠      │
│   → Need deeper analysis                    │
│                                             │
│ CODEOWNERS:                                 │
│   @auth-team src/auth/ → Strong signal ✓    │
│   But not all projects have CODEOWNERS ⚠    │
└─────────────────────────────────────────────┘
```

**Recommendation:** Use **multiple signals** and weight them:
- **Strong:** service boundaries, CODEOWNERS, database ownership
- **Medium:** directory structure, API grouping
- **Weak:** file naming patterns

Also, **involve user early**:
```
/df-bootstrap

Detecting domains...

Found potential domains:
  1. auth (strong confidence)
  2. api (medium confidence)
  3. data (medium confidence)
  4. utils (weak - might be shared code)

Proceed with these domains? Modify? [Y/n/edit]
```

#### Challenge 2: Domain Granularity

**Problem:** When to split vs merge?

```
Granularity dilemma:
┌─────────────────────────────────────────────┐
│ Too coarse:                                 │
│   "backend" domain → 5000 files             │
│   → Still overwhelming                      │
│                                             │
│ Too fine:                                   │
│   "auth-login", "auth-signup", "auth-reset" │
│   → Overhead of tracking many domains       │
│                                             │
│ Goldilocks:                                 │
│   "auth" covers login, signup, session      │
│   → ~200-500 files per domain               │
│   → Can deep-dive in one run                │
└─────────────────────────────────────────────┘
```

**Recommendation:** Add size heuristics:
- Target: 200-1000 files per domain
- If domain > 1000 files → suggest split
- If domain < 50 files → suggest merge with related domain
- Let user override

#### Challenge 3: Cross-Cutting Concerns

**Problem:** Some things span domains: logging, error handling, config. Where do these go?

```
Cross-cutting placement:
┌─────────────────────────────────────────────┐
│ drafts/                                     │
│   domains/                                  │
│     auth/                                   │
│     api/                                    │
│     data/                                   │
│   cross-cutting/                            │
│     logging.md       ← Spans all domains    │
│     error-handling.md                       │
│     config.md                               │
│     unknowns.md                             │
└─────────────────────────────────────────────┘
```

The design already has this! `cross-cutting/` folder. Good.

But **how does AI decide** something is cross-cutting vs domain-specific?

**Recommendation:** During domain analysis, track:
- If a topic appears in 3+ domains → cross-cutting
- Examples: auth might mention logging, api mentions logging, data mentions logging → logging is cross-cutting

---

## Overall Assessment

### 🟢 Strengths

1. **Well-architected**: Command→Skill→Script→Agent is solid
2. **Clever knowledge management**: 3-layer accumulation prevents context explosion
3. **Autonomous iteration**: This is the killer feature if done right
4. **Honest gaps**: unknowns.md builds trust
5. **Versioned snapshots**: Low-risk experimentation

### 🟡 Needs Refinement

1. **Stop conditions need metrics**: Define measurable criteria
2. **Draft update strategy**: Clarify append vs rewrite vs merge
3. **Error recovery**: Add transaction-like boundaries
4. **Progress visibility**: User needs to see what's happening
5. **First-run strategy**: Make Run 0 deliberately shallow

### 🔴 Critical Risks

1. **Autonomous loop control**: Buggy stop conditions could cause runaway
2. **Large codebase handling**: 10K+ file repos might break Run 0
3. **Agent coordination**: Parallel writes need clear ownership or locking
4. **Knowledge-state bloat**: Rewriting knowledge-state.md every run could grow unbounded

---

## Implementation Priorities

Recommended phased approach:

```
Phase 1: Foundation (No AI autonomy yet)
├─ /df-init (pure scaffolding)
├─ /df-start (Q&A + brief generation)
├─ /df-status (read state files)
└─ Core scripts (file ops, hashing)

Phase 2: Manual Learning (User-driven)
├─ /df-input (classification + filing)
├─ /df-bootstrap (Run 0: shallow scan)
├─ incremental-scanner skill
└─ Manual iterate (user reviews each step)

Phase 3: Semi-Autonomous
├─ learning-agent (single-run version)
├─ plan-agent (generates plans)
├─ knowledge-synthesizer skill
└─ /df-iterate (runs ONE cycle, stops)

Phase 4: Full Autonomy
├─ Multi-run loops
├─ Stop condition logic
├─ Progress reporting
└─ /df-output (snapshots)

Phase 5: Polish
├─ Domain decomposition refinement
├─ Error recovery
├─ Performance optimization
└─ User overrides/configuration
```

**Key Principle:** Start simple, add autonomy incrementally.

---

## Example User Journey

```
USER JOURNEY: Understanding a legacy Rails monolith
═══════════════════════════════════════════════════════

Day 1: Setup
┌────────────────────────────────────────────────────┐
│ $ /df-init                                         │
│   ✓ Created kb/ structure                          │
│                                                    │
│ $ /df-start                                        │
│   Q: What is this project?                         │
│   A: Legacy Rails e-commerce app                   │
│   Q: What's your goal?                             │
│   A: Onboarding new team, need architecture docs   │
│   ✓ Created source/baseline/brief.md               │
│                                                    │
│ [User fills brief.md with repo URL, key docs]      │
│                                                    │
│ $ /df-bootstrap                                    │
│   ✓ Cloned repo at main                            │
│   ✓ Detected domains: auth, cart, payment, admin   │
│   ✓ Initial scan: 847 files                        │
│   ✓ Generated project-map.md                       │
│   ✓ Generated plan.md                              │
│                                                    │
└────────────────────────────────────────────────────┘

Day 2: First Learning Cycle
┌────────────────────────────────────────────────────┐
│ $ /df-iterate                                      │
│                                                    │
│   Run 1: Learning auth domain                      │
│   ✓ Scanned 124 files (auth-related)               │
│   ✓ Read controllers, models, tests                │
│   ✓ Updated drafts/domains/auth/overview.md        │
│   → Findings: Uses Devise gem, session cookies      │
│   → Confidence: auth (65%)                          │
│                                                    │
│   Run 2: Learning cart domain                      │
│   ✓ Scanned 89 files                               │
│   ✓ Read cart logic, state machine                 │
│   ✓ Updated drafts/domains/cart/data-flow.md       │
│   → Findings: Cart persists to Redis               │
│   → Confidence: cart (60%), auth (70%)              │
│                                                    │
│   Run 3: Learning payment domain                   │
│   ⚠ Blocked: Need Stripe webhook docs              │
│                                                    │
│   Stopping: Blocked on missing source              │
│                                                    │
│   Summary:                                         │
│   • 2 runs completed                               │
│   • 4 draft documents updated                      │
│   • Next: Add Stripe docs via /df-input            │
│                                                    │
└────────────────────────────────────────────────────┘

Day 3: Unblock and Continue
┌────────────────────────────────────────────────────┐
│ $ /df-input https://stripe.com/docs/webhooks      │
│   ✓ Fetched and classified → baseline/trusted-docs/│
│                                                    │
│ $ /df-iterate                                      │
│                                                    │
│   Run 4: Learning payment domain (resumed)         │
│   ✓ Read Stripe docs + payment code                │
│   ✓ Updated drafts/domains/payment/api-surface.md  │
│   → Confidence: payment (75%)                       │
│                                                    │
│   Run 5: Cross-cutting concerns                    │
│   ✓ Identified common error handling               │
│   ✓ Created drafts/cross-cutting/error-handling.md │
│                                                    │
│   Stopping: Diminishing returns                    │
│   (Last 2 runs added < 15% new knowledge)           │
│                                                    │
│   Summary:                                         │
│   • 5 runs completed                               │
│   • All domains > 70% confidence                   │
│   • Suggest: Snapshot with /df-output              │
│                                                    │
└────────────────────────────────────────────────────┘

Day 4: Snapshot and Share
┌────────────────────────────────────────────────────┐
│ $ /df-output                                       │
│   ✓ Snapshotted drafts/ → output/v1/               │
│   ✓ Added metadata: 5 runs, 4 domains, 89% coverage│
│                                                    │
│ [User shares output/v1/ with team]                 │
│                                                    │
│ [Team member asks about admin panel]               │
│                                                    │
│ $ /df-iterate                                      │
│   Run 6: Learning admin domain                     │
│   ...                                              │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Open Questions for Implementation

1. **What's the minimal viable product?** Could you ship Phase 1-2 first and get user feedback before autonomous loops?

2. **How do you test this?** Autonomous AI systems are hard to test. Test suite strategy?

3. **What's the target codebase size?** 100 files? 10,000 files? This affects architecture choices.

4. **How domain-agnostic is this really?** You list 5 use cases. Are there structural differences that need different workflows?

5. **What's the learning curve?** Is this for Claude Code power-users or should it "just work" for beginners?

---

## Final Recommendation

This design is **ambitious but achievable**. The architecture is sound. The three main risks can be mitigated:

1. ✅ **Autonomous loop control** → Add measurable stop conditions + safety layers
2. ✅ **Large codebase scaling** → Make Run 0 deliberately shallow
3. ✅ **Stop condition precision** → Structure knowledge-state.md with metrics

**Key Strategy:** Start with semi-autonomous (user reviews each run) before going full-autonomous. Get feedback on whether the learning quality is good enough to trust.

---

## Next Steps

Ready to create an OpenSpec change and start implementation planning!
