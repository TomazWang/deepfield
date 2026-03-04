## ADDED Requirements

### Requirement: One-way dependency rule is a hard architectural invariant
CLAUDE.md SHALL state, as a clearly labelled constraint separate from the decision tree, that the Plugin MAY invoke the CLI but the CLI SHALL NEVER invoke or depend on the Plugin.

The constraint SHALL use "SHALL NEVER" language (not "should avoid" or "is discouraged") to signal that it is non-negotiable.

#### Scenario: Hybrid feature always routes CLI helpers → Plugin, never Plugin → CLI
- **WHEN** a contributor designs a Hybrid feature that requires both AI reasoning and deterministic file operations
- **THEN** the implementation pattern SHALL be: Plugin skill calls CLI script/command; the CLI component SHALL NOT call back into any plugin skill, agent, or command

#### Scenario: CLI code that depends on plugin is rejected in review
- **WHEN** a code reviewer encounters CLI code that imports, shells out to, or references any plugin-layer artifact
- **THEN** the reviewer SHALL reject the change as a violation of the one-way dependency rule, citing the CLAUDE.md constraint

### Requirement: Decision tree classifies any feature into Plugin, CLI, or Hybrid
CLAUDE.md SHALL contain a decision tree section titled "Plugin vs CLI Guidelines" that allows a contributor to classify any proposed feature by answering at most four yes/no questions in order.

The questions SHALL be:

1. Does the feature require AI reasoning, interpretation, or generation? → **Yes** = Plugin. Continue to Q2 only if No.
2. Must the feature run outside of Claude Code (CI, scripts, headless environments)? → **Yes** = CLI. Continue to Q3 only if No.
3. Is the operation deterministic and safe to re-run without side effects? → **Yes** = CLI. Continue to Q4 only if No.
4. Does the operation produce or transform files atomically? → **Yes** = CLI (delegate to a script). **No** = Hybrid (CLI owns scaffolding, Plugin owns AI interpretation).

#### Scenario: AI-required feature routes to Plugin immediately
- **WHEN** a contributor evaluates a feature that requires AI to interpret or generate content
- **THEN** the decision tree SHALL direct them to Plugin at question 1 without further questions

#### Scenario: Headless-required feature routes to CLI immediately
- **WHEN** a contributor evaluates a feature that must run in CI or without Claude Code present
- **THEN** the decision tree SHALL direct them to CLI at question 2

#### Scenario: Deterministic file operation routes to CLI
- **WHEN** a contributor evaluates a feature that creates or modifies files deterministically and repeatably
- **THEN** the decision tree SHALL direct them to CLI (or a CLI-backed script) at question 3 or 4

#### Scenario: Non-deterministic non-AI feature is flagged as Hybrid
- **WHEN** a contributor evaluates a feature that is neither AI-required nor cleanly deterministic
- **THEN** the decision tree SHALL classify it as Hybrid and require an explicit ownership boundary table

#### Scenario: Hybrid pattern direction is always Plugin calls CLI, never CLI calls Plugin
- **WHEN** a contributor reads the Hybrid section of the decision tree
- **THEN** the hybrid implementation pattern SHALL be described as "Plugin skill invokes CLI helper", and the reverse direction (CLI invoking Plugin) SHALL be explicitly prohibited

### Requirement: CLAUDE.md includes concrete classification examples
CLAUDE.md SHALL include a table with at least six examples — two Plugin-only, two CLI-only, and two Hybrid — each showing the feature name, its classification, and the deciding criterion.

#### Scenario: Plugin-only examples are recognisably AI-driven
- **WHEN** a contributor reads the examples table
- **THEN** Plugin-only entries SHALL include features such as "source classification" and "autonomous learning cycle" where the AI reasoning is the core value

#### Scenario: CLI-only examples are recognisably deterministic
- **WHEN** a contributor reads the examples table
- **THEN** CLI-only entries SHALL include features such as "folder scaffolding" and "config file initialisation" where no AI involvement is required

#### Scenario: Hybrid examples show explicit ownership split
- **WHEN** a contributor reads a Hybrid example
- **THEN** the example SHALL identify which sub-tasks belong to the CLI layer and which belong to the Plugin layer

### Requirement: Inline rationale comments mark ambiguous existing cases
At least two existing source files (one in `plugin/` and one in `cli/`) SHALL have an inline comment referencing the CLAUDE.md "Plugin vs CLI Guidelines" section and explaining why that file's responsibility belongs to its current layer.

#### Scenario: Plugin file comment explains AI dependency
- **WHEN** a developer reads an annotated plugin source file
- **THEN** the comment SHALL state that the file belongs in the plugin because it requires AI reasoning and SHALL reference the CLAUDE.md section by name

#### Scenario: CLI file comment explains determinism requirement
- **WHEN** a developer reads an annotated CLI source file
- **THEN** the comment SHALL state that the file belongs in the CLI because its operation is deterministic and must be repeatable outside Claude Code, and SHALL reference the CLAUDE.md section by name

### Requirement: Hybrid ownership boundary is expressed as a table
When a feature is classified as Hybrid, CLAUDE.md SHALL specify ownership using a two-column table with columns "CLI owns" and "Plugin owns" and at least one row per concern area.

#### Scenario: Hybrid table prevents vague splits
- **WHEN** a contributor documents a new Hybrid feature
- **THEN** they SHALL produce a boundary table; a description without the table SHALL be considered incomplete

#### Scenario: Hybrid table covers df-input as a worked example
- **WHEN** a contributor reads the Hybrid section
- **THEN** `df-input` (source addition command) SHALL be used as the primary worked example showing the CLI/Plugin split
