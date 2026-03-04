# Run [N] - Findings

**Run:** N
**Date:** [ISO date]
**Focus Topics:** [Topics focused on this run]
**Files Read:** [Count]

---

<!-- Add one section per discovery below. Every finding MUST include an Evidence block. -->

## [Domain or Topic Name]

### [Finding Title]

**Summary:** [One sentence description of what was discovered.]

**Evidence:**
- **Source:** `[file:line]` or `[file:line-range]`
- **Type:** [code | comment | doc | test]
- **Quote:**
  ```
  [Actual content found — code snippet, comment text, or doc excerpt]
  ```
- **Confidence:** [high | medium | low]

**Related Findings:**
- [Link or reference to related discoveries]

**Unknowns:**
- [What is still unclear about this finding]

---

<!-- Repeat the ### [Finding Title] block for each additional discovery in this domain -->

---

## Cross-Cutting Observations

### Patterns Across Topics
- [Pattern seen in multiple topics with source references]

### Contradictions Detected

#### Contradiction: [Brief description]
- **Side A:** [What documentation/comments say] (`path/to/docs.md:line`)
- **Side B:** [What code actually does] (`path/to/impl.ts:line`)
- **Impact:** [Effect on confidence]
- **Needs:** [What would clarify this]

### Architectural Insights
- [High-level observations about system design, with source references]

---

## Summary

**Confidence Changes:**
- [Domain]: [old]% → [new]% ([+/-change]%)

**Questions Answered:** [Count]
**New Questions Raised:** [Count]
**Contradictions Found:** [Count]

**Next Focus Suggestions:**
Based on findings, Run [N+1] should focus on: [Suggestions]

---

<!-- CONFIDENCE LEVEL DEFINITIONS
  high   — Multiple independent sources confirm (e.g., code + tests + docs agree)
  medium — Single authoritative source (e.g., running code, definitive config)
  low    — Inference or assumption from indirect evidence; needs verification
-->
