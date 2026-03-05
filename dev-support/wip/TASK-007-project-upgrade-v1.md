# Task 007: Project Upgrade Path (v1.0 → v2.0)

**Feature:** Upgrade pre-domain-detection projects to current structure
**Priority:** 🟡 High (Backward Compatibility)
**Status:** Ready for Implementation
**Estimated Time:** 1-2 days
**OpenSpec Change:** `feat/project-upgrade-v1`

---

## Objective

Add `deepfield upgrade` command to migrate old deepfield projects (initialized before domain detection) to the current structure with domain-based organization.

---

## Problem

**Current Situation:**
- Some users have deepfield projects initialized before domain detection was added (Run 0 without domains)
- These old projects are incompatible with current plugin version
- Missing: domain-specific drafts, cross-cutting docs, changelog, staging areas, feedback templates

**Example of Missing Structure:**
```
❌ What's Missing:
- ❌ Domain-specific draft organization (deepfield/drafts/domains/)
- ❌ Cross-cutting documentation (deepfield/drafts/cross-cutting/unknowns.md)
- ❌ Changelog tracking (deepfield/drafts/_changelog.md)
- ❌ Staging area for Run 2 (deepfield/source/run-2-staging/)
- ❌ Feedback mechanism (feedback.md templates)
```

**User Impact:**
- Cannot use newer `/df-*` commands on old projects
- Learning from previous runs is incompatible with new features
- Must recreate projects from scratch (loses work)

**Desired:**
- Detect old project structure
- Migrate to new structure automatically
- Preserve existing work and learning
- Allow continued use with new plugin

---

## Scope

### Version Detection

**Add to project.config.json:**
```json
{
  "version": "1.0.0",
  "deepfieldVersion": "1.0.0",  // NEW
  "createdAt": "...",
  "lastUpgraded": null,         // NEW
  "projectName": "...",
  ...
}
```

**Detection logic:**
```javascript
function detectProjectVersion(projectPath) {
  const configPath = path.join(projectPath, 'deepfield/project.config.json');

  if (!fs.existsSync(configPath)) {
    return { version: null, needsUpgrade: false, reason: 'no-project' };
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Old projects don't have deepfieldVersion field
  if (!config.deepfieldVersion) {
    return {
      version: '0.x',
      needsUpgrade: true,
      reason: 'pre-versioning',
      missingStructure: detectMissingStructure(projectPath)
    };
  }

  const current = '2.0.0'; // Current version with domain detection

  if (semver.lt(config.deepfieldVersion, current)) {
    return {
      version: config.deepfieldVersion,
      needsUpgrade: true,
      reason: 'version-mismatch',
      from: config.deepfieldVersion,
      to: current
    };
  }

  return { version: config.deepfieldVersion, needsUpgrade: false };
}

function detectMissingStructure(projectPath) {
  const missing = [];

  // Check for domain-based drafts
  if (!fs.existsSync(path.join(projectPath, 'deepfield/drafts/domains'))) {
    missing.push('domain-drafts');
  }

  // Check for cross-cutting
  if (!fs.existsSync(path.join(projectPath, 'deepfield/drafts/cross-cutting'))) {
    missing.push('cross-cutting');
  }

  // Check for changelog
  if (!fs.existsSync(path.join(projectPath, 'deepfield/drafts/_changelog.md'))) {
    missing.push('changelog');
  }

  // Check for domain-index
  if (!fs.existsSync(path.join(projectPath, 'deepfield/wip/domain-index.md'))) {
    missing.push('domain-index');
  }

  return missing;
}
```

---

### CLI Command: `deepfield upgrade`

**Implementation:**

```typescript
// cli/src/commands/upgrade.ts

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export function registerUpgradeCommand(program: Command) {
  program
    .command('upgrade')
    .description('Upgrade deepfield project to latest version')
    .option('--dry-run', 'Show what would change without applying')
    .option('--no-backup', 'Skip backup creation (not recommended)')
    .option('--force', 'Skip confirmation prompts')
    .action(async (options) => {
      try {
        await upgradeProject(options);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}

async function upgradeProject(options: any) {
  const projectPath = process.cwd();
  const deepfieldPath = path.join(projectPath, 'deepfield');

  // 1. Check if deepfield project exists
  if (!fs.existsSync(deepfieldPath)) {
    console.error(chalk.red('Error: Not a deepfield project'));
    console.log('Run deepfield init first');
    process.exit(1);
  }

  // 2. Detect version and missing structure
  const versionInfo = detectProjectVersion(projectPath);

  if (!versionInfo.needsUpgrade) {
    console.log(chalk.green('✓ Project is already up to date'));
    console.log(`Version: ${versionInfo.version}`);
    return;
  }

  // 3. Show what's missing
  console.log(chalk.yellow('\n⚠️  Project Upgrade Needed\n'));

  if (versionInfo.version === '0.x') {
    console.log('Your project was created before domain detection was added.');
  } else {
    console.log(`Your project: v${versionInfo.from}`);
    console.log(`Current version: v${versionInfo.to}`);
  }

  console.log('\nMissing structure:');
  versionInfo.missingStructure.forEach((item: string) => {
    console.log(chalk.red(`  ❌ ${item}`));
  });

  // 4. Dry run mode
  if (options.dryRun) {
    console.log(chalk.cyan('\n[DRY RUN] Would perform:'));
    console.log('  1. Create backup');
    console.log('  2. Add deepfieldVersion to project.config.json');
    console.log('  3. Create missing directory structure');
    console.log('  4. Generate domain-index from existing runs');
    console.log('  5. Migrate drafts to domain-based structure');
    console.log('  6. Add feedback templates to runs');
    console.log('  7. Create changelog.md');
    return;
  }

  // 5. Confirm upgrade
  if (!options.force) {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'Proceed with upgrade?',
      default: true
    }]);

    if (!confirm) {
      console.log('Upgrade cancelled');
      return;
    }
  }

  // 6. Create backup
  if (options.backup !== false) {
    console.log(chalk.cyan('\n📦 Creating backup...'));
    const backupPath = createBackup(projectPath);
    console.log(chalk.green(`✓ Backup created: ${backupPath}`));
  }

  // 7. Run upgrade via plugin skill
  console.log(chalk.cyan('\n🔧 Running upgrade...'));

  // Call upgrade skill via Claude Code
  // The skill will handle the actual migration logic
  const result = execSync(
    'claude skill run deepfield:upgrade-project',
    {
      cwd: projectPath,
      encoding: 'utf8',
      stdio: 'inherit'
    }
  );

  console.log(chalk.green('\n✓ Upgrade complete!'));
  console.log('\nYou can now use all deepfield commands with this project.');
}

function createBackup(projectPath: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const backupDir = path.join(projectPath, '.deepfield-backups');
  const backupPath = path.join(backupDir, `backup-${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Copy deepfield/ directory to backup
  const deepfieldPath = path.join(projectPath, 'deepfield');
  fs.cpSync(deepfieldPath, backupPath, { recursive: true });

  return backupPath;
}
```

---

### Plugin Skill: `deepfield-upgrade-project`

**File:** `plugin/skills/deepfield-upgrade-project.md`

```markdown
---
name: deepfield:upgrade-project
description: Upgrades pre-domain-detection deepfield projects to current structure
triggerPatterns: []
userInvocable: false
---

# Upgrade Project Skill

## Objective

Migrate old deepfield project (pre-domain-detection) to current v2.0 structure.

## Process

### 1. Analyze Current Structure

Read existing project structure and identify what's present:
- Check `deepfield/project.config.json`
- List all existing runs in `deepfield/wip/run-*/`
- Check existing drafts in `deepfield/drafts/`
- Read source files in `deepfield/source/`

### 2. Update project.config.json

Add version tracking:
```json
{
  "deepfieldVersion": "2.0.0",
  "lastUpgraded": "2026-03-04T10:30:00Z",
  ...existing fields...
}
```

### 3. Create Missing Directory Structure

```bash
mkdir -p deepfield/drafts/domains
mkdir -p deepfield/drafts/cross-cutting
mkdir -p deepfield/source/run-2-staging
```

### 4. Generate domain-index.md

Analyze existing runs and sources to extract domains:
- Read run findings
- Check repository structure (if repos were cloned)
- Look for domain hints in existing notes

Create `deepfield/wip/domain-index.md`:
```markdown
# Domain Index

*Generated during v2.0 upgrade from existing project data*

## Detected Domains

Based on analysis of previous runs:

### [Domain Name]
- **Confidence:** [high/medium/low]
- **Source:** [upgrade-analysis]
- **Found in:** [list of runs where this domain appeared]
```

### 5. Migrate Drafts to Domain Structure

For each existing draft in `deepfield/drafts/*.md`:
- Determine which domain it belongs to (or mark as cross-cutting)
- Move to appropriate location:
  - Domain-specific → `deepfield/drafts/domains/{domain}/{topic}.md`
  - Cross-cutting → `deepfield/drafts/cross-cutting/{topic}.md`

### 6. Create Cross-Cutting Templates

Create missing cross-cutting documents:

**deepfield/drafts/cross-cutting/unknowns.md:**
```markdown
# Unknown Areas

*This file tracks what we don't know yet.*

## Knowledge Gaps

[To be populated in next run]

## Conflicting Information

[To be populated in next run]
```

### 7. Create Changelog

**deepfield/drafts/_changelog.md:**
```markdown
# Knowledge Base Changelog

## v2.0 Upgrade (2026-03-04)

- ✅ Upgraded project structure to v2.0
- ✅ Added domain-based organization
- ✅ Migrated existing drafts to domain structure
- ✅ Added cross-cutting documentation templates

## Previous Runs

[Existing run history preserved below]
```

### 8. Add Feedback Templates to Runs

For each run directory without feedback.md:
```bash
cp plugin/templates/feedback-template.md deepfield/wip/run-{N}/feedback.md
```

### 9. Validate Upgrade

Check that all required files exist:
- ✅ project.config.json has deepfieldVersion
- ✅ domain-index.md exists
- ✅ drafts/domains/ structure created
- ✅ drafts/cross-cutting/ exists with unknowns.md
- ✅ _changelog.md exists
- ✅ All runs have feedback.md

### 10. Summary Report

Show what was done:
```
✅ Upgrade Complete

Changes made:
- Added deepfieldVersion: 2.0.0
- Created domain-based draft structure
- Migrated 3 drafts to domain folders
- Generated domain-index from existing runs
- Added cross-cutting documentation
- Created changelog
- Added feedback templates to 2 runs

Next steps:
- Review domain-index.md and adjust if needed
- Run /df-iterate to continue learning with domain awareness
```

## Error Handling

If upgrade fails:
- Show clear error message
- User can restore from backup in `.deepfield-backups/`
- Don't leave project in half-migrated state
```

---

### Upgrade Script: `plugin/scripts/upgrade-project.js`

**File:** `plugin/scripts/upgrade-project.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function upgradeProject(projectPath) {
  console.log('Starting project upgrade...\n');

  const deepfieldPath = path.join(projectPath, 'deepfield');
  const configPath = path.join(deepfieldPath, 'project.config.json');

  // 1. Update config
  console.log('1. Updating project.config.json...');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.deepfieldVersion = '2.0.0';
  config.lastUpgraded = new Date().toISOString();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('   ✓ Added version tracking\n');

  // 2. Create directory structure
  console.log('2. Creating missing directories...');
  const dirs = [
    'drafts/domains',
    'drafts/cross-cutting',
    'source/run-2-staging'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(deepfieldPath, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`   ✓ Created ${dir}`);
    }
  });
  console.log();

  // 3. Generate domain-index if missing
  console.log('3. Generating domain-index.md...');
  const domainIndexPath = path.join(deepfieldPath, 'wip/domain-index.md');
  if (!fs.existsSync(domainIndexPath)) {
    const domains = analyzeDomains(deepfieldPath);
    const content = generateDomainIndex(domains);
    fs.writeFileSync(domainIndexPath, content);
    console.log(`   ✓ Generated from existing runs (${domains.length} domains found)\n`);
  } else {
    console.log('   - Already exists, skipping\n');
  }

  // 4. Create cross-cutting unknowns.md
  console.log('4. Creating cross-cutting templates...');
  const unknownsPath = path.join(deepfieldPath, 'drafts/cross-cutting/unknowns.md');
  if (!fs.existsSync(unknownsPath)) {
    fs.writeFileSync(unknownsPath, UNKNOWNS_TEMPLATE);
    console.log('   ✓ Created unknowns.md');
  }
  console.log();

  // 5. Create changelog
  console.log('5. Creating changelog...');
  const changelogPath = path.join(deepfieldPath, 'drafts/_changelog.md');
  if (!fs.existsSync(changelogPath)) {
    fs.writeFileSync(changelogPath, CHANGELOG_TEMPLATE);
    console.log('   ✓ Created _changelog.md\n');
  } else {
    console.log('   - Already exists, skipping\n');
  }

  // 6. Add feedback templates to runs
  console.log('6. Adding feedback templates to runs...');
  const wipPath = path.join(deepfieldPath, 'wip');
  const runs = fs.readdirSync(wipPath).filter(f => f.startsWith('run-'));

  let added = 0;
  runs.forEach(run => {
    const feedbackPath = path.join(wipPath, run, 'feedback.md');
    if (!fs.existsSync(feedbackPath)) {
      fs.writeFileSync(feedbackPath, FEEDBACK_TEMPLATE);
      added++;
    }
  });

  console.log(`   ✓ Added feedback.md to ${added} runs\n`);

  console.log('✅ Upgrade complete!\n');

  return {
    success: true,
    changes: {
      versionAdded: true,
      directoriesCreated: dirs.length,
      domainIndexGenerated: !fs.existsSync(domainIndexPath),
      crossCuttingCreated: true,
      changelogCreated: true,
      feedbackTemplatesAdded: added
    }
  };
}

function analyzeDomains(deepfieldPath) {
  // Analyze existing runs to extract domain hints
  const domains = new Set();

  // TODO: Read run findings, look for domain patterns
  // For now, create a placeholder entry
  domains.add({
    name: 'core',
    confidence: 'medium',
    source: 'upgrade-placeholder',
    description: 'Domains will be detected in next run'
  });

  return Array.from(domains);
}

function generateDomainIndex(domains) {
  return `# Domain Index

*Generated during v2.0 upgrade*

## Detected Domains

${domains.map(d => `### ${d.name}
- **Confidence:** ${d.confidence}
- **Source:** ${d.source}
- **Description:** ${d.description}
`).join('\n')}

**Note:** Run \`/df-iterate\` to refine domain detection with current analysis capabilities.
`;
}

const UNKNOWNS_TEMPLATE = `# Unknown Areas

*This file tracks what we don't know yet.*

## Knowledge Gaps

[To be populated in next run]

## Conflicting Information

[To be populated in next run]

## Needed Sources

[To be populated in next run]
`;

const CHANGELOG_TEMPLATE = `# Knowledge Base Changelog

## v2.0 Upgrade (${new Date().toISOString().split('T')[0]})

- ✅ Upgraded project structure to v2.0
- ✅ Added domain-based organization
- ✅ Added cross-cutting documentation templates
- ✅ Added version tracking

## Previous Activity

[Previous run history preserved]
`;

const FEEDBACK_TEMPLATE = `# Run Feedback

*Feedback template added during v2.0 upgrade*

## Domain Accuracy

[User feedback goes here]

## Missing Context

[User feedback goes here]

## Priorities

[User feedback goes here]
`;

// Run if called directly
if (require.main === module) {
  const projectPath = process.cwd();
  upgradeProject(projectPath)
    .then(result => {
      console.log('Upgrade result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Upgrade failed:', error);
      process.exit(1);
    });
}

module.exports = { upgradeProject };
```

---

## Implementation Checklist

- [ ] Add `detectProjectVersion()` utility function
- [ ] Create `deepfield upgrade` CLI command
- [ ] Implement backup functionality
- [ ] Create `deepfield:upgrade-project` skill
- [ ] Create `plugin/scripts/upgrade-project.js`
- [ ] Add templates (unknowns.md, changelog.md, feedback.md)
- [ ] Test upgrade on old project
- [ ] Verify upgraded project works with all commands
- [ ] Update README with upgrade instructions

---

## Testing

### Test with Old Project

1. Create old-style project (no domains):
   ```bash
   mkdir test-old-project
   cd test-old-project
   # Create old structure manually
   ```

2. Run upgrade:
   ```bash
   deepfield upgrade
   ```

3. Verify structure:
   ```bash
   tree deepfield/
   # Should show all new directories
   ```

4. Test commands:
   ```bash
   deepfield status  # Should work
   # /df-iterate     # Should work
   ```

---

## Acceptance Criteria

- [ ] Detects old projects (missing deepfieldVersion)
- [ ] Shows clear upgrade prompt
- [ ] Creates backup before upgrade
- [ ] Adds deepfieldVersion to config
- [ ] Creates all missing directories
- [ ] Generates domain-index from existing runs
- [ ] Creates cross-cutting templates
- [ ] Creates changelog
- [ ] Adds feedback templates to runs
- [ ] Upgraded project works with all `/df-*` commands
- [ ] Can rollback from backup if needed

---

## OpenSpec Integration

Create change with:
```bash
/opsx:new feat/project-upgrade-v1
```

Implement in phases:
1. **Phase 1:** CLI command + backup
2. **Phase 2:** Upgrade script (structure creation)
3. **Phase 3:** Domain analysis and migration
4. **Phase 4:** Testing and validation

---

## Related Files

- **Original deferred task:** `dev-support/archive/2026-03-04-phase2-bootstrap/TASK-007-project-upgrade.md`
- **User feedback:** Real-world issue with old projects

---

**Status:** Ready for implementation
**Priority:** High (affects existing users)
**Estimate:** 1-2 days
