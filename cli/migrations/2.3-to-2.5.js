'use strict';

const fs = require('fs');
const path = require('path');

const CONFIDENCE_SCORES_TEMPLATE = `# Confidence Scores

<!-- Deepfield tracks confidence per topic/domain across learning runs.
     Updated automatically after each run. -->

## Scores

| Topic | Confidence | Last Updated | Notes |
|-------|-----------|--------------|-------|
| <!-- topic --> | 0.0 | <!-- run-0 --> | <!-- initial --> |

## Legend

- **0.0 – 0.3**: Low confidence — needs more sources
- **0.4 – 0.6**: Medium confidence — basic understanding
- **0.7 – 0.9**: High confidence — well understood
- **1.0**: Full confidence — exhaustively documented
`;

const UNKNOWNS_TEMPLATE = `# Unknowns & Open Questions

<!-- Deepfield maintains this file to track what it doesn't know.
     This makes the knowledge base trustworthy — gaps are explicit. -->

## Open Questions

<!-- Questions that came up during learning but couldn't be answered -->

## Missing Sources

<!-- Sources that would help answer open questions -->
- Source type: <!-- e.g., "architecture decision records" -->
  Reason: <!-- why this would help -->

## Contradictions

<!-- Conflicting information found in different sources -->

## Low-Confidence Areas

<!-- Topics with confidence below threshold — need more investigation -->
`;

module.exports = {
  from: '2.3.0',
  to: '2.5.0',
  description: 'Add df-ff command support: confidence scoring and unknowns tracking',

  async check(projectPath) {
    const confidencePath = path.join(projectPath, 'deepfield', 'wip', 'confidence-scores.md');
    return !fs.existsSync(confidencePath);
  },

  async migrate(projectPath) {
    const deepfieldDir = path.join(projectPath, 'deepfield');
    const changes = [];

    // 1. Create wip/confidence-scores.md
    const wipDir = path.join(deepfieldDir, 'wip');
    fs.mkdirSync(wipDir, { recursive: true });
    const confidencePath = path.join(wipDir, 'confidence-scores.md');
    if (!fs.existsSync(confidencePath)) {
      fs.writeFileSync(confidencePath, CONFIDENCE_SCORES_TEMPLATE);
      changes.push('Created wip/confidence-scores.md');
    }

    // 2. Create drafts/cross-cutting/unknowns.md (if not present)
    const crossCuttingDir = path.join(deepfieldDir, 'drafts', 'cross-cutting');
    fs.mkdirSync(crossCuttingDir, { recursive: true });
    const unknownsPath = path.join(crossCuttingDir, 'unknowns.md');
    if (!fs.existsSync(unknownsPath)) {
      fs.writeFileSync(unknownsPath, UNKNOWNS_TEMPLATE);
      changes.push('Created drafts/cross-cutting/unknowns.md');
    }

    return { success: true, changes, filesCreated: changes.length, filesUpdated: 0 };
  },

  async rollback(projectPath) {
    const deepfieldDir = path.join(projectPath, 'deepfield');

    const confidencePath = path.join(deepfieldDir, 'wip', 'confidence-scores.md');
    if (fs.existsSync(confidencePath)) fs.unlinkSync(confidencePath);

    // Do not remove unknowns.md on rollback — it may contain user content
    // and was already present in earlier versions

    return { success: true };
  },
};
