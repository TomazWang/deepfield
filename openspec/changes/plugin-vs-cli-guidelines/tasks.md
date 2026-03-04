## 1. Draft Decision Tree Section for CLAUDE.md

- [ ] 1.0 Add a clearly labelled "One-Way Dependency Rule" constraint block at the top of the "Plugin vs CLI Guidelines" section, before the decision tree, stating: "The Plugin MAY invoke the CLI. The CLI SHALL NEVER invoke or depend on the Plugin." Include a brief rationale (headless environments, circular dependency prevention) and state that it is an architectural invariant, not a guideline.
- [ ] 1.1 Write the four-question decision tree in prose under a new "Plugin vs CLI Guidelines" section in CLAUDE.md
- [ ] 1.2 Add the classification examples table (minimum six rows: two Plugin-only, two CLI-only, two Hybrid) immediately after the decision tree
- [ ] 1.3 Add the Hybrid ownership boundary subsection with an ownership table and `df-input` as the primary worked example. The subsection MUST describe the hybrid call direction as "Plugin skill calls CLI helper" and MUST include a note that the reverse direction is prohibited by the one-way dependency rule.

## 2. Inline Rationale Comments

- [ ] 2.1 Identify one ambiguous file in `plugin/` (e.g., a skill or command that could be mistaken for CLI logic) and add an inline comment explaining its Plugin classification and referencing the CLAUDE.md section
- [ ] 2.2 Identify one ambiguous file in `cli/` (e.g., a command that invokes file operations that could be mistaken for plugin work) and add an inline comment explaining its CLI classification and referencing the CLAUDE.md section

## 3. Validation

- [ ] 3.1 Verify the decision tree produces the correct classification for all six examples in the table by walking through each one manually
- [ ] 3.2 Confirm both inline comments reference the CLAUDE.md section by name and accurately describe the reason for the layer assignment
- [ ] 3.3 Review the Hybrid ownership table for `df-input` to ensure every concern area has a row and no row has an ambiguous owner
