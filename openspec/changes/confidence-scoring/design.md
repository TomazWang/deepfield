## Context

Deepfield's learning agents currently emit confidence scores as subjective percentages ("I feel about 70% confident"). These scores are optimistic, cannot decrease between runs, and give users no insight into why confidence is high or low. The fix is to replace the subjective assessment with a deterministic formula using four observable signals that agents already produce (or can easily produce): question coverage, evidence quality tags, source type coverage, and contradiction counts.

Current state: agents write a single `confidence: N%` field. No formula, no breakdown, no history of change.

## Goals / Non-Goals

**Goals:**
- Define a deterministic four-component formula for confidence scores
- Allow scores to decrease between runs (bidirectional change)
- Store per-domain breakdowns so users can see why confidence is what it is
- Show confidence deltas in run review guides (both increases and decreases)

**Non-Goals:**
- Changing the learning agent's core analysis behavior
- Retroactively recalculating confidence for archived outputs
- Per-file or per-section confidence granularity (domain-level only)
- User-configurable formula weights (fixed weights for now)

## Decisions

### Decision 1: Four-component weighted formula

Formula:
```
confidence = (0.40 × questions_answered) + (0.30 × evidence_strength) + (0.20 × source_coverage) + (0.10 × contradiction_resolution)
```

Component definitions:
- `questions_answered` = answered_questions / (answered_questions + unanswered_questions + unknowns)
- `evidence_strength` = weighted average of evidence tags: strong=1.0, medium=0.5, weak=0.2
- `source_coverage` = analyzed_source_types / required_source_types (capped at 1.0)
- `contradiction_resolution` = 1 - (unresolved_contradictions / total_contradictions); defaults to 1.0 if no contradictions

#### Why these four components?

Each component maps to a distinct, observable gap in knowledge. Together they cover the four ways a knowledge base can be incomplete or untrustworthy:

**`questions_answered` (40%)** — "Do we know what we need to know?"

This is the most direct signal. The learning agent maintains an explicit list of questions about each domain. If 70% of those questions have no answer, the domain knowledge is incomplete by definition — no amount of strong evidence or broad source coverage can compensate.

"Answered" means "the agent has verified the answer", not merely "a human stated something". Human-provided answers are the starting point, not the finish line. The agent records every human answer as `[weak]` by default — the human does not need to tag anything — and then verifies it against source code and reasoning. Verification can promote the answer:

- Confirmed by code or tests → `[strong]`
- Plausible and uncontradicted → `[medium]`
- No corroboration found → remains `[weak]`

A special case: humans sometimes correctly override what source code appears to show. Developers know when code is future scaffolding — written ahead of time, feature-flagged off, or present but never called. When a human says "we don't use that" and the code shows unused imports, disabled feature flags, or uncalled functions, the agent validates the scaffolding pattern and promotes the human answer to `[medium]` or `[strong]`, noting "likely future scaffolding". If the code is clearly active, the contradiction is flagged and the answer remains `[weak]` pending resolution.

These tags feed directly into the `evidence_strength` component (30%), which naturally discounts unverified answers. A human statement kept at `[weak]` can still move a question from "unanswered" to "answered" in the `questions_answered` numerator — incrementally improving coverage — but the low evidence tag limits its contribution to overall confidence through the evidence_strength component. This separation keeps the formula honest without discarding human input entirely.

**`evidence_strength` (30%)** — "Can we trust what we claim to know?"

Knowing something is different from knowing it reliably. A claim backed by source code + tests + API documentation (strong evidence) is far more trustworthy than one inferred from a README or a comment (weak evidence). Evidence strength penalizes domains where claims rest on shaky foundations. It is the second largest weight because confident-sounding answers backed by weak evidence are worse than admitting uncertainty — they mislead users.

**`source_coverage` (20%)** — "Have we looked in the right places?"

If the learning agent never read the test suite, or never examined the configuration files, it has a structural blind spot regardless of how many questions it answered or how strong the evidence tags are. Source coverage measures whether the agent has checked all the source types that are required to understand the domain. Missing source types cap what can be known, so they cap the score — but they are a weaker signal than the first two because a domain can sometimes be well understood from a subset of sources.

**`contradiction_resolution` (10%)** — "Is what we know internally consistent?"

Unresolved contradictions indicate that the knowledge base holds conflicting claims about the same thing — a clear sign something is wrong. However, contradictions carry the smallest weight for two reasons: (1) contradictions often surface during active discovery and get resolved within the same run or the next, so their presence can signal progress rather than failure; (2) a domain with zero contradictions but mostly unanswered questions is far less trustworthy than a domain with one unresolved contradiction but high question coverage and strong evidence.

#### Why these weights (40/30/20/10)?

The weights reflect the information value of each signal:

- **40% questions answered**: The clearest, most direct measure of completeness. If 70% of questions remain unanswered, the overall confidence cannot be high regardless of other signals. A domain is not "known" if most of its key questions lack answers.
- **30% evidence strength**: Knowing something with weak evidence is a liability. Strong evidence (code + tests + docs corroborating each other) is qualitatively more reliable than inference from a single comment. Downgrading this signal would allow agents to report high confidence on poorly-supported claims.
- **20% source coverage**: Missing source types create structural blind spots, but the penalty is proportional — not all domains require all source types equally. A backend service may not need UI source coverage. The smaller weight acknowledges that partial coverage is still informative.
- **10% contradictions**: Real but modest penalty. Contradictions are often a sign of active learning (the agent found something surprising) rather than a final state of failure. Unresolved ones are penalized, but not enough to dominate the score when question coverage and evidence are strong.

The weights sum to 1.0. Equal weights (25/25/25/25) were considered and rejected because they would treat source coverage and contradiction state as equally important as question completeness and evidence quality — which does not match the information value of each signal.

#### Why can the score decrease between runs?

Decreasing scores are a feature, not a defect. When a learning agent reads new sources, it often discovers questions it did not know to ask before. Those new unknowns lower `questions_answered`, which lowers the overall score. This is correct behavior: the agent learned that the domain is more complex than previously thought, and the score should reflect that.

Preventing score decreases — for example by clamping to the previous value — would hide this signal. Users would see a score that appears to grow monotonically and would interpret it as growing understanding, when in reality the agent may have found significant gaps. The original bug (optimistic subjective scores) was precisely this: scores that could not reflect newly discovered uncertainty.

#### Concrete example

**Domain**: authentication service, after Run 2.

Inputs the agent writes to `wip/confidence-scores.md`:

```
questions_answered:   8 answered, 4 unanswered, 2 unknowns  →  8/14 = 0.571
evidence_strength:    tags: strong×3, medium×5, weak×2       →  (3×1.0 + 5×0.5 + 2×0.2)/10 = 0.54
source_coverage:      analyzed: code, docs — missing: tests, config  →  2/4 = 0.50
contradiction_resolution: 1 unresolved out of 3 total        →  1 - 1/3 = 0.667
```

Formula:

```
confidence = (0.40 × 0.571) + (0.30 × 0.54) + (0.20 × 0.50) + (0.10 × 0.667)
           = 0.228 + 0.162 + 0.100 + 0.067
           = 0.557  →  56%
```

The run review guide would show:

```
auth domain: 56% (was 71% last run)  ↓15%
  questions answered: 57%  (8/14 — 4 new unknowns found)
  evidence strength:  54%  (mix of strong and medium)
  source coverage:    50%  (tests and config not yet analyzed)
  contradictions:     67%  (1 of 3 unresolved)
```

This tells the user exactly why confidence dropped (new unknowns found, test suite not yet read) and what to address next (add tests as a source, resolve the outstanding contradiction). A subjective "I feel 71% confident" would have hidden all of this.

**Alternatives considered**: Equal 25% weights — rejected because question coverage and evidence quality are more informative than source coverage or contradiction state. Single-signal approach — rejected because no single signal captures the full picture.

### Decision 2: Agents emit formula inputs, not scores

Agents write structured inputs to `wip/confidence-scores.md` (counts and tags). A dedicated script (`calculate-confidence.js`) computes the formula. The confidence score in `knowledge-state.md` is updated by the script, not the agent.

**Rationale**: Keeps the formula in one place. Agents do not need to know the formula weights. If weights change, only the script changes.

**Alternatives considered**: Agents compute the score directly — rejected because formula logic would be scattered across multiple agent prompts.

### Decision 3: Confidence can decrease

The script writes the new score unconditionally. If new unknowns are discovered, `questions_answered` drops, which lowers the score. No floor/ceiling beyond [0.0, 1.0].

**Rationale**: Overconfident scores are the bug. Preventing decreases would reintroduce the bug. Users need to see when a run reveals gaps.

### Decision 4: `wip/confidence-scores.md` stores per-domain breakdown

Format: one section per domain with component scores, input counts, and aggregate. Overwritten each run (not append-only) so it reflects current state.

**Rationale**: `wip/` is AI's private workspace. The file is human-readable but exists to support run review guide generation, not as a primary deliverable.

## Risks / Trade-offs

- [Risk: Agents may not tag evidence strength consistently] → Mitigation: Define allowed tags in agent prompt templates; script defaults untagged evidence to `weak=0.2`.
- [Risk: `required_source_types` is ambiguous] → Mitigation: Define required types in `brief.md` or fall back to a fixed default list (code, tests, docs, config); source coverage formula uses that list.
- [Risk: Score volatility confuses users] → Mitigation: Run review guide shows both old and new score with delta, and explains which component changed most.
- [Risk: Existing `knowledge-state.md` files have incompatible confidence format] → No migration needed; scores are recomputed fresh each run from current wip data.

## Open Questions

- Should `required_source_types` be configurable in `brief.md`, or always use a fixed default list? (Lean: configurable with fixed fallback.)
- Should the run review guide flag confidence decreases with a warning marker, or just show the delta neutrally? (Lean: neutral delta; let the score speak for itself.)
