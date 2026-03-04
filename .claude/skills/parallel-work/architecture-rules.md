# Architecture Rules — Deepfield Plugin Development

Reference this file during spec review (Phase 3) and implementation review (Phase 5).

## Plugin scripts — CJS only

All files in `plugin/scripts/` MUST use CommonJS:

```js
// ✅ Correct
'use strict';
const fs = require('fs');
const path = require('path');
module.exports = { myFunction };

// ❌ Wrong
import fs from 'fs';
export function myFunction() {}
```

- No `"type": "module"` in `plugin/package.json`
- No `.mjs` extensions
- Lazy-require optional/heavy deps inside functions (e.g. `pdf-parse`, `mammoth`)

## Plugin commands, skills, agents — Markdown files

- Commands: `plugin/commands/df-*.md` — thin entry points, parse args, delegate to skills
- Skills: `plugin/skills/deepfield-*.md` — orchestrate workflows, call scripts, launch agents
- Agents: `plugin/agents/deepfield-*.md` — focused AI workers with narrow scope

## Atomic writes

All scripts that write files must use temp-then-rename:

```js
const tmp = outputPath + '.tmp';
fs.writeFileSync(tmp, content, 'utf8');
fs.renameSync(tmp, outputPath);
```

## CLI — TypeScript

- CLI commands: `cli/src/commands/*.ts` — TypeScript, Commander.js, factory pattern `createXCommand()`
- Must register in `cli/src/cli.ts`
- Must compile: `npm run build --prefix cli` — zero errors

## Review checklist

### Spec review (Phase 3)
- [ ] Proposal: why is clear, scope matches the issue exactly (no over-engineering)
- [ ] Design: decisions are justified, non-goals listed, risks called out
- [ ] Specs: each requirement has SHALL statement + at least one scenario (WHEN/THEN)
- [ ] Tasks: all items are `- [ ]` checkbox format, granular, implementable in one session

### Implementation review (Phase 5)
- [ ] All `tasks.md` checkboxes are `[x]`
- [ ] Plugin scripts use CJS (`require`/`module.exports`)
- [ ] No `"type": "module"` added to `plugin/package.json`
- [ ] CLI changes compile: `npm run build --prefix cli`
- [ ] PR is mergeable (no conflicts): `gh pr view <N> --json mergeable -q .mergeable` → `MERGEABLE`
- [ ] No unnecessary files created beyond what tasks specified
