---
name: df-translate
description: Translate draft documentation into a target language
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
arguments:
  - name: domain
    description: Translate only this domain (e.g., "auth", "payments"). Omit to translate all domains.
    required: false
  - name: --spec
    description: "Spec tier to translate: product-spec, tech-spec, or feature-spec. Omit to translate all tiers."
    required: false
  - name: --lang
    description: "Target language code (e.g., zh-tw, ja, ko). Defaults to zh-tw."
    required: false
  - name: --all
    description: "Translate all files that have a <!-- needs-translation --> stub, across all domains and tiers."
    required: false
  - name: --stub
    description: "Write needs-translation stubs instead of translating. Useful for marking files for later."
    required: false
---

# /df-translate - Translate Draft Documentation

<!-- Plugin Classification (see CLAUDE.md § "Plugin vs CLI Guidelines")
  This command belongs in the Plugin layer because:
  - Translation requires AI reasoning over natural-language content.
  - Determining which terms to keep in English vs translate requires judgment.
  The deterministic sub-step (updating domain-manifest.json) is delegated to
  the CLI script update-domain-manifest.js. Call direction: Plugin → CLI. Never CLI → Plugin.
-->

Translate draft documentation from English into a target language. Operates on files under `drafts/en/` and writes output to `drafts/{lang}/`. Contract files (`contract-*.md`) are always skipped — their content is universal code terminology.

## Prerequisites

1. **`deepfield/` directory exists** (from `/df-init`)
2. **Bootstrap (Run 0) is complete** — drafts must exist before translation
3. **`drafts/en/` contains at least one file** — nothing to translate otherwise

If prerequisites fail:
- No `deepfield/`: "Run `/df-init` first."
- No Run 0: "Run `/df-bootstrap` first to generate draft documentation."
- No `drafts/en/`: "No English drafts found. Run `/df-iterate` to generate documentation before translating."

## State Validation

```bash
if [ ! -d "./deepfield" ]; then
  echo "No deepfield/ directory found. Run /df-init first."
  exit 1
fi

if [ ! -f "./deepfield/wip/run-0/run-0.config.json" ]; then
  echo "Bootstrap not complete. Run /df-bootstrap first."
  exit 1
fi

if [ ! -d "./deepfield/drafts/en" ]; then
  echo "No English drafts found under deepfield/drafts/en/."
  echo "Run /df-iterate to generate documentation before translating."
  exit 1
fi
```

## Resolve Arguments

### Target Language

Use the value from `--lang` if provided. Otherwise default to `zh-tw`.

If a `DEEPFIELD.md` config exists, check for a `default_translation_language` key and use that as the fallback before the hard-coded default.

### Operation Mode

Determine the mode from the arguments provided:

| Arguments | Mode |
|-----------|------|
| `--all` flag present | **all-stubs** — translate every file containing `<!-- needs-translation -->` |
| `domain` provided | **single-domain** — translate all files in that domain (optionally scoped by `--spec`) |
| `--spec` provided without `domain` | **single-tier** — translate all domains within that spec tier |
| No positional arg and no `--all` | **full** — translate all domains across all tiers |

When `--stub` flag is present, any mode writes stubs instead of full translations.

## Execution

### Build the File List

#### Mode: all-stubs

```bash
# Find all files under drafts/en/ that contain the needs-translation marker
grep -rl '<!-- needs-translation -->' ./deepfield/drafts/en/
```

Translate each discovered file (unless it is a `contract-*.md`).

#### Mode: single-domain

```bash
# With --spec:
ls ./deepfield/drafts/en/${spec}/${domain}/

# Without --spec (all tiers):
ls ./deepfield/drafts/en/*/${domain}/
```

#### Mode: single-tier

```bash
ls ./deepfield/drafts/en/${spec}/*/
```

#### Mode: full

```bash
ls ./deepfield/drafts/en/*/
```

### Launch Translator Agent

After building the file list, launch the translator agent:

```
Launch: deepfield-translator
Input: {
  "target_language": "<resolved-lang>",
  "source_spec":     "<spec | null>",
  "source_domain":   "<domain | null>",
  "source_file":     "<file | null>",
  "stub_mode":       <true | false>,
  "workspace_root":  "./deepfield"
}
```

The agent handles per-file translation, skipping contract files, and updating the domain manifest.

## Display Report

After the agent completes, display the translation report produced by the agent, then append:

```
Next steps:
  - Review translated files under deepfield/drafts/{lang}/
  - Run /df-translate --all to process any remaining stubs
  - Run /df-output to snapshot all drafts (including translations)
```

## Error Handling

### Domain not found

```
Error: Domain '{domain}' not found under deepfield/drafts/en/.

Available domains:
  {list of directories found under drafts/en/}

Check the domain name and try again.
```

### Invalid --spec value

```
Error: Unknown spec tier '{value}'.

Valid values: product-spec, tech-spec, feature-spec
```

### No files matched

When the resolved file list is empty (e.g., all files are contract files or already translated):

```
Nothing to translate.

  Checked: deepfield/drafts/en/{scope}
  All files are either contract files or already translated.

  Use --stub to mark files for future translation.
```

### Translator agent failure

If the agent exits with an error:

```
Translation failed.

  The deepfield-translator agent reported an error:
  {agent error message}

  Partial results (if any) are written under deepfield/drafts/{lang}/.
  Re-run /df-translate to continue from where it stopped — already-translated files will be skipped.
```

## Tips for Claude

- Always read `deepfield/drafts/cross-cutting/terminology.md` before launching the agent — pass relevant terms as context so the agent knows which ones to keep in English
- When the user runs `/df-translate` with no arguments, confirm the scope before proceeding if there are many files: "This will translate N files across M domains. Proceed?"
- `--stub` is useful when a user wants to mark everything for translation but do the actual translation incrementally
- Contract files (`contract-*.md`) hold API/event contracts — their field names and types are code, not prose; skipping them is correct by design
- After a successful translation run, remind the user that `/df-output` will snapshot all language variants together
