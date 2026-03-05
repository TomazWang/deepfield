## Why

Current confidence scores are subjective AI assessments that tend to be overly optimistic and cannot decrease between runs even when new unknowns are discovered. A formula-based calculation using observable signals is needed to make confidence scores trustworthy and actionable.

## What Changes

- Replace subjective AI-generated confidence percentage with a deterministic formula using four weighted components
- Allow confidence scores to decrease between runs when new unknowns are discovered
- Store per-domain confidence breakdowns in `wip/confidence-scores.md`
- Surface confidence changes (increases and decreases) in run review guides

## Capabilities

### New Capabilities

- `confidence-scoring`: Formula-based confidence calculation: 40% questions answered (answered / total questions including unknowns), 30% evidence strength (strong=1.0, medium=0.5, weak=0.2 weighted avg), 20% source coverage (analyzed source types / required source types), 10% contradiction resolution (1 - unresolved/total). Stored in `wip/confidence-scores.md` with per-component breakdown.

### Modified Capabilities

- `state-management`: Confidence score storage format changes to include formula breakdown fields (component scores, input counts) alongside the aggregate score.

## Impact

- `plugin/`: Learning agents that currently produce confidence scores must switch to formula inputs (question counts, evidence tags, source types, contradiction counts) instead of raw percentages
- `wip/confidence-scores.md`: New file format with per-domain, per-component breakdown
- Run review guide generation: Must show confidence delta and flag decreases
- Any existing `knowledge-state.md` files referencing confidence scores may need migration notes
