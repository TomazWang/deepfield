## ADDED Requirements

### Requirement: check-confidence.js reads confidence from run config and learning plan
The `check-confidence.js` script SHALL read the most recent completed run's config JSON and the learning plan markdown to compute confidence scores, and output a JSON result.

Script signature:
```
node check-confidence.js <deepfield-dir> [--domains <comma-separated>] [--threshold <number>]
```

Output JSON:
```json
{
  "overallConfidence": 72,
  "thresholdMet": false,
  "threshold": 80,
  "topics": [
    { "name": "Authentication", "priority": "HIGH", "confidence": 85, "meetsThreshold": true },
    { "name": "API Structure", "priority": "HIGH", "confidence": 60, "meetsThreshold": false }
  ],
  "highPriorityCount": 2,
  "highPriorityMeetingThreshold": 1,
  "domainsFilter": ["auth"]
}
```

#### Scenario: Confidence computed from latest run config
- **WHEN** script is run with a valid deepfield directory containing run configs
- **THEN** script reads the highest-numbered run-N.config.json, extracts confidenceChanges, and computes per-topic confidence as the "after" value for each topic

#### Scenario: Threshold met
- **WHEN** all HIGH-priority topics (in domain filter if specified) have confidence >= threshold
- **THEN** output JSON has `"thresholdMet": true`

#### Scenario: Threshold not met
- **WHEN** any HIGH-priority topic in scope has confidence < threshold
- **THEN** output JSON has `"thresholdMet": false`

#### Scenario: Domain filter applied
- **WHEN** `--domains auth,api` is passed
- **THEN** `topics` array in output only includes topics whose domain matches one of the filter values; `thresholdMet` only considers those topics

#### Scenario: No run configs found
- **WHEN** no run-N.config.json files exist (only run-0 or none)
- **THEN** script outputs `{ "error": "No completed learning runs found. Run /df-iterate or /df-ff first." }` and exits with code 1

#### Scenario: Script failure does not crash
- **WHEN** deepfield-dir does not exist or is malformed
- **THEN** script prints error to stderr and exits with non-zero code; calling skill treats this as a non-fatal error and continues with confidence assumed as 0

### Requirement: check-confidence.js uses CJS module format
The script SHALL use `require` and `module.exports` (CommonJS), consistent with all other scripts in `plugin/scripts/`.

#### Scenario: Script loads without ESM errors
- **WHEN** script is executed with `node check-confidence.js`
- **THEN** no "Cannot use import statement" errors occur; script uses `require('fs')`, `require('path')`, etc.
