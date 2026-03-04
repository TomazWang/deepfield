# Deepfield Instructions

*Instructions for how Deepfield should learn and document this project.*
*This file controls HOW Deepfield works — see brief.md for WHAT to learn.*

---

## Language & Format

<!-- Set the primary output language for all generated documentation. -->
**Documentation Language:** English

<!-- Set the language for code examples (e.g., TypeScript, Python, Java, Go). -->
**Code Examples:** TypeScript

<!-- Specify how code comments encountered in source should be handled. -->
<!-- Options: Preserve original | Translate | Bilingual -->
**Code Comments:** Preserve original

<!-- Diagram format to use in documentation (Mermaid is recommended for version control). -->
<!-- Options: Mermaid | PlantUML | ASCII -->
**Diagrams:** Mermaid

<!-- How deep should documentation go by default? -->
<!-- Options: Overview | Standard | Detailed -->
**Detail Level:** Standard

---

## Learning Priorities

*Control which domains get deep analysis vs. a quick overview.*
*Domains not listed here are treated as Standard priority.*

### High Priority
<!-- Domains to learn deeply with full detail. List one per line. -->
<!-- Example: authentication, payment-processing, order-management -->
-

### Medium Priority
<!-- Domains to learn at a moderate level. -->
-

### Low Priority
<!-- Domains to cover at overview level only (key files, no deep dive). -->
-

### Exclude
<!-- Paths or domain names to skip completely. Supports glob patterns. -->
<!-- Example: /legacy/**, /vendor/**, deprecated-module -->
-

---

## Domain-Specific Instructions

*Provide special context, known quirks, and focus areas for specific domains.*
*These instructions are passed directly to the AI agent analyzing that domain.*

<!-- Add a subsection for each domain that needs special handling. -->
<!-- Replace "domain-name" with the actual domain identifier (kebab-case). -->

### domain-name

<!-- Describe any important context, non-standard patterns, or known gotchas. -->
<!-- Example: -->
<!-- ⚠️ Uses custom OAuth2 flow — NOT standard RFC 6749 -->
<!-- Focus: Token refresh mechanism, Redis session integration -->

**Important:**
-

**Focus areas:**
1.

**Related domains:**

---

## Output Preferences

*Customize how documentation is formatted and what it emphasizes.*

### Code Examples
<!-- What to include/avoid in code snippets. -->
- **Include:** Error handling, edge cases
- **Avoid:** Pseudocode — show real implementation
- **Style:** Match codebase conventions (no reformatting)

### Documentation Style
<!-- How should the documentation read? -->
- Explain "why" not just "what"
- Always link to actual code in file:line format when referencing specifics
- Concise but complete — avoid filler text

### Terminology
<!-- Should Deepfield build a glossary? -->
- **Build glossary:** Yes
- **Include:** Business terms, acronyms, domain jargon
- **Format:** Alphabetical with cross-references

---

## Trust Hierarchy

*When sources conflict, prioritize them in this order (top = highest trust).*
*The default hierarchy is shown below — customize as needed.*

1. Running code ← Highest trust
2. Integration tests
3. Git history (commit messages, blame)
4. Unit tests
5. Design docs and ADRs
6. Comments and inline docs
7. External documentation ← Lowest trust

---

## Special Notes

*Any other instructions or context for the AI that don't fit above.*

-
