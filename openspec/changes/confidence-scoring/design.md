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

**Rationale**: Questions-answered is the dominant signal (40%) because unanswered questions are the clearest indicator of incomplete knowledge. Evidence strength (30%) penalizes domains where only weak/indirect evidence supports claims. Source coverage (20%) penalizes missing required inputs. Contradictions (10%) have the smallest weight since their presence often indicates active discovery, not failure.

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
