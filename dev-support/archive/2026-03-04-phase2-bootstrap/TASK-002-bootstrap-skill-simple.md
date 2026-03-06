# Task 002: Bootstrap Skill Implementation (Simple Version)

**Feature:** Implement working bootstrap skill without AI agents
**Priority:** 🔴 Critical
**Status:** Not Started
**Estimated Time:** 1-2 days
**OpenSpec Change:** `feat/bootstrap-skill-implementation`

---

## Objective

Implement the bootstrap skill to make Run 0 actually work. This is the **simple version** without AI agents - using scripts and templates only.

---

## Current State

- `plugin/skills/deepfield-bootstrap.md` exists as orchestration document
- No actual implementation - just design
- User runs bootstrap, nothing happens or errors

---

## What to Implement

### Phase 2A: Simple Bootstrap (No Agents)

Implement bootstrap using scripts and templates only. No AI classification or analysis yet.

**Workflow:**
1. Read `deepfield/source/baseline/brief.md`
2. Parse sources (repos, docs) from brief
3. Clone repositories (if URLs provided)
4. Scan repository structure
5. Generate `project-map.md` from folder structure
6. Generate `domain-index.md` from folders + brief hints
7. Create `learning-plan.md` template
8. Create `run-0.config.json` with status "completed"

---

## Files to Create/Modify

### New Scripts

**1. `plugin/scripts/bootstrap-runner.js`**
Main bootstrap orchestrator

```javascript
#!/usr/bin/env node
// Orchestrates the entire bootstrap process
// - Reads brief
// - Validates sources
// - Clones repos
// - Generates initial docs
// - Creates Run 0 state
```

**2. `plugin/scripts/parse-brief.js`**
Parse brief.md and extract structured data

```javascript
// Reads deepfield/source/baseline/brief.md
// Extracts:
// - Project name
// - Repositories (URLs, branches)
// - Documents
// - Focus areas
// - Topics of interest
// Returns JSON
```

**3. `plugin/scripts/clone-repos.sh`**
Clone git repositories

```bash
#!/bin/bash
# Clones repos to deepfield/source/baseline/repos/
# Handles:
# - GitHub, GitLab, Azure DevOps
// - Branch/tag selection
# - Shallow clones for speed
# - Error handling
```

**4. `plugin/scripts/scan-structure.js`**
Scan repository structure

```javascript
// Walks repo directories
// Identifies:
// - Top-level folders
// - Module structure (packages/, services/, etc.)
// - Build files (package.json, pom.xml, etc.)
// - README locations
// Returns structured data
```

**5. `plugin/scripts/generate-project-map.js`**
Generate project-map.md

```javascript
// Creates deepfield/wip/project-map.md
// Includes:
// - Repository structure
// - Key directories
// - Module organization
// - Entry points
// Uses template: plugin/templates/project-map.md
```

**6. `plugin/scripts/generate-domain-index.js`**
Generate domain-index.md

```javascript
// Creates deepfield/wip/domain-index.md
// Combines:
// - Folder structure analysis
// - Brief hints
// - Common patterns (api/, frontend/, backend/, etc.)
// Uses template: plugin/templates/domain-index.md
```

**7. `plugin/scripts/generate-learning-plan.js`**
Generate learning-plan.md

```javascript
// Creates deepfield/wip/learning-plan.md
// Based on:
// - Detected domains
// - Brief focus areas
// - Repository size/complexity
// Uses template: plugin/templates/learning-plan.md
```

**8. `plugin/scripts/create-run-state.js`**
Create run-0.config.json

```javascript
// Creates deepfield/wip/run-0/run-0.config.json
// Schema:
// {
//   runNumber: 0,
//   status: 'completed',
//   startedAt: ISO datetime,
//   completedAt: ISO datetime,
//   sourceSnapshot: { file: hash },
//   changesDetected: false,
//   learningGenerated: true
// }
```

### Modified Files

**`plugin/skills/deepfield-bootstrap.md`**
Update from orchestration doc to executable skill

---

## Implementation Details

### 1. Parse Brief Script

**File:** `plugin/scripts/parse-brief.js`

```javascript
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const briefPath = './deepfield/source/baseline/brief.md';

function parseBrief() {
  const content = fs.readFileSync(briefPath, 'utf-8');

  const result = {
    projectName: extractProjectName(content),
    repositories: extractRepositories(content),
    documents: extractDocuments(content),
    focusAreas: extractFocusAreas(content),
    topics: extractTopics(content)
  };

  return result;
}

function extractProjectName(content) {
  // Look for "# Project: XYZ" or similar
  const match = content.match(/^#\s*Project:\s*(.+)$/m);
  return match ? match[1].trim() : 'Unknown Project';
}

function extractRepositories(content) {
  // Look for URLs in repositories section
  const repoSection = content.match(/##\s*Repositories(.+?)(?=##|$)/s);
  if (!repoSection) return [];

  const urls = repoSection[1].match(/https?:\/\/[^\s)]+/g) || [];
  return urls.map(url => ({
    url,
    branch: extractBranch(content, url) || 'main',
    name: url.split('/').pop().replace('.git', '')
  }));
}

function extractDocuments(content) {
  // Extract document URLs/paths
  const docSection = content.match(/##\s*Documents(.+?)(?=##|$)/s);
  if (!docSection) return [];

  // Parse document links
  return [];
}

function extractFocusAreas(content) {
  // Look for focus areas section
  const focusSection = content.match(/##\s*Focus Areas(.+?)(?=##|$)/s);
  if (!focusSection) return [];

  // Extract bullet points
  const areas = focusSection[1].match(/^[-*]\s*(.+)$/gm) || [];
  return areas.map(a => a.replace(/^[-*]\s*/, '').trim());
}

function extractTopics(content) {
  // Look for checked checkboxes
  const checks = content.match(/^- \[x\]\s*(.+)$/gm) || [];
  return checks.map(c => c.replace(/^- \[x\]\s*/, '').trim());
}

// Main
if (process.argv[1] === import.meta.url) {
  const data = parseBrief();
  console.log(JSON.stringify(data, null, 2));
}

export { parseBrief };
```

### 2. Clone Repos Script

**File:** `plugin/scripts/clone-repos.sh`

```bash
#!/bin/bash
set -e

REPOS_DIR="./deepfield/source/baseline/repos"
mkdir -p "$REPOS_DIR"

# Read repos from JSON stdin
while IFS= read -r line; do
  URL=$(echo "$line" | jq -r '.url')
  BRANCH=$(echo "$line" | jq -r '.branch // "main"')
  NAME=$(echo "$line" | jq -r '.name')

  DEST="$REPOS_DIR/$NAME"

  if [ -d "$DEST" ]; then
    echo "⏭️  Skipping $NAME (already exists)"
    continue
  fi

  echo "📥 Cloning $NAME from $URL (branch: $BRANCH)..."

  git clone --depth 1 --branch "$BRANCH" "$URL" "$DEST" 2>&1 || {
    echo "⚠️  Warning: Failed to clone $NAME" >&2
    continue
  }

  echo "✅ Cloned $NAME"
done

echo "✅ All repositories cloned"
```

### 3. Scan Structure Script

**File:** `plugin/scripts/scan-structure.js`

```javascript
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function scanRepository(repoPath) {
  const structure = {
    name: path.basename(repoPath),
    topLevelDirs: [],
    modules: [],
    buildFiles: [],
    readmes: []
  };

  // Get top-level directories
  const entries = fs.readdirSync(repoPath, { withFileTypes: true });
  structure.topLevelDirs = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => e.name);

  // Find build files
  const buildFilePatterns = [
    'package.json',
    'pom.xml',
    'build.gradle',
    'Cargo.toml',
    'go.mod',
    'requirements.txt'
  ];

  buildFilePatterns.forEach(pattern => {
    if (fs.existsSync(path.join(repoPath, pattern))) {
      structure.buildFiles.push(pattern);
    }
  });

  // Find README files
  const readmePatterns = ['README.md', 'README.txt', 'README'];
  readmePatterns.forEach(pattern => {
    if (fs.existsSync(path.join(repoPath, pattern))) {
      structure.readmes.push(pattern);
    }
  });

  // Detect modules (if monorepo)
  const commonMonorepoDirs = ['packages', 'services', 'apps', 'libs'];
  commonMonorepoDirs.forEach(dir => {
    const fullPath = path.join(repoPath, dir);
    if (fs.existsSync(fullPath)) {
      const modules = fs.readdirSync(fullPath, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => ({ parent: dir, name: e.name }));
      structure.modules.push(...modules);
    }
  });

  return structure;
}

// Scan all repos
function scanAllRepos() {
  const reposDir = './deepfield/source/baseline/repos';
  if (!fs.existsSync(reposDir)) return [];

  const repos = fs.readdirSync(reposDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => scanRepository(path.join(reposDir, e.name)));

  return repos;
}

// Main
if (process.argv[1] === import.meta.url) {
  const data = scanAllRepos();
  console.log(JSON.stringify(data, null, 2));
}

export { scanRepository, scanAllRepos };
```

### 4. Bootstrap Runner

**File:** `plugin/scripts/bootstrap-runner.js`

```javascript
#!/usr/bin/env node
import { parseBrief } from './parse-brief.js';
import { scanAllRepos } from './scan-structure.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function runBootstrap() {
  console.log('🚀 Starting Bootstrap (Run 0)...\n');

  // 1. Parse brief
  console.log('📖 Reading brief.md...');
  const briefData = parseBrief();
  console.log(`✅ Found project: ${briefData.projectName}`);
  console.log(`✅ Found ${briefData.repositories.length} repositories`);

  // 2. Clone repos
  if (briefData.repositories.length > 0) {
    console.log('\n📥 Cloning repositories...');
    const reposJson = JSON.stringify(briefData.repositories);
    execSync(`echo '${reposJson}' | jq -c '.[]' | ${__dirname}/clone-repos.sh`, {
      stdio: 'inherit'
    });
  }

  // 3. Scan structure
  console.log('\n🔍 Scanning project structure...');
  const repoStructures = scanAllRepos();
  console.log(`✅ Scanned ${repoStructures.length} repositories`);

  // 4. Generate project-map
  console.log('\n📝 Generating project-map.md...');
  generateProjectMap(briefData, repoStructures);

  // 5. Generate domain-index
  console.log('📝 Generating domain-index.md...');
  generateDomainIndex(briefData, repoStructures);

  // 6. Generate learning-plan
  console.log('📝 Generating learning-plan.md...');
  generateLearningPlan(briefData, repoStructures);

  // 7. Create Run 0 state
  console.log('📝 Creating run-0.config.json...');
  createRunState();

  console.log('\n✅ Bootstrap (Run 0) completed!');
  console.log('📂 Review findings: ./deepfield/wip/run-0/');
}

function generateProjectMap(brief, repos) {
  // Generate from template
  const template = fs.readFileSync('./plugin/templates/project-map.md', 'utf-8');

  let content = template;
  content = content.replace('{{PROJECT_NAME}}', brief.projectName);
  content = content.replace('{{REPO_COUNT}}', repos.length);

  // Add repo structure
  let repoSection = '';
  repos.forEach(repo => {
    repoSection += `\n### ${repo.name}\n\n`;
    repoSection += `**Top-level directories:**\n`;
    repo.topLevelDirs.forEach(dir => {
      repoSection += `- ${dir}/\n`;
    });
    if (repo.modules.length > 0) {
      repoSection += `\n**Modules:**\n`;
      repo.modules.forEach(mod => {
        repoSection += `- ${mod.parent}/${mod.name}\n`;
      });
    }
  });

  content = content.replace('{{REPOSITORIES}}', repoSection);

  fs.writeFileSync('./deepfield/wip/project-map.md', content);
}

function generateDomainIndex(brief, repos) {
  // Detect domains from structure + brief
  const domains = new Set();

  // From repos
  repos.forEach(repo => {
    repo.topLevelDirs.forEach(dir => {
      if (['api', 'frontend', 'backend', 'services', 'core'].includes(dir.toLowerCase())) {
        domains.add(dir);
      }
    });
    repo.modules.forEach(mod => {
      domains.add(mod.name);
    });
  });

  // From brief focus areas
  brief.focusAreas.forEach(area => {
    domains.add(area.toLowerCase().replace(/\s+/g, '-'));
  });

  const template = fs.readFileSync('./plugin/templates/domain-index.md', 'utf-8');
  let content = template;

  let domainSection = '';
  Array.from(domains).forEach(domain => {
    domainSection += `\n### ${domain}\n\n`;
    domainSection += `**Status:** Detected\n`;
    domainSection += `**Source:** Repository structure\n\n`;
  });

  content = content.replace('{{DOMAINS}}', domainSection);

  fs.writeFileSync('./deepfield/wip/domain-index.md', content);
}

function generateLearningPlan(brief, repos) {
  const template = fs.readFileSync('./plugin/templates/learning-plan.md', 'utf-8');

  let content = template;
  content = content.replace('{{FOCUS_AREAS}}', brief.focusAreas.join(', '));

  fs.writeFileSync('./deepfield/wip/learning-plan.md', content);
}

function createRunState() {
  const runDir = './deepfield/wip/run-0';
  fs.mkdirSync(runDir, { recursive: true });

  const state = {
    runNumber: 0,
    status: 'completed',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    sourceSnapshot: {},
    changesDetected: false,
    learningGenerated: true
  };

  fs.writeFileSync(
    path.join(runDir, 'run-0.config.json'),
    JSON.stringify(state, null, 2)
  );
}

// Main
runBootstrap().catch(error => {
  console.error('❌ Bootstrap failed:', error.message);
  process.exit(1);
});
```

---

## Acceptance Criteria

- [ ] Can run bootstrap after init + start
- [ ] Reads brief.md successfully
- [ ] Extracts project name, repos, focus areas
- [ ] Clones repositories (if provided)
- [ ] Scans repository structure
- [ ] Generates project-map.md with actual repo data
- [ ] Generates domain-index.md from repos + brief
- [ ] Generates learning-plan.md
- [ ] Creates run-0.config.json with status "completed"
- [ ] All generated files are readable and useful
- [ ] Handles errors gracefully
- [ ] Reports progress clearly

---

## Testing Checklist

1. **With single repo:**
   ```bash
   # In brief.md, add: https://github.com/user/repo
   deepfield bootstrap
   # Should clone repo and generate docs
   ```

2. **With multiple repos:**
   ```bash
   # Add 2-3 repos to brief
   deepfield bootstrap
   # Should clone all and combine structure
   ```

3. **Without repos:**
   ```bash
   # No repo URLs in brief
   deepfield bootstrap
   # Should still generate docs (from brief only)
   ```

4. **With focus areas:**
   ```bash
   # Add focus areas in brief
   deepfield bootstrap
   # Should include in learning plan
   ```

5. **Error cases:**
   - Invalid repo URL
   - Private repo without credentials
   - Large repo (slow clone)
   - Network errors

---

## Dependencies

- **Depends on:** Task 001 (CLI command)
- **Blocks:** Task 003-005 (enhancements)

---

## Phase 2B: Add Intelligence (Future)

Later enhancements:
- Use AI for classification (not regex)
- Use AI for domain detection (not folder names)
- Use AI for deeper analysis

---

## Notes

- Keep it simple - no AI for now
- Use templates and scripts only
- Focus on making it work end-to-end
- Can enhance with AI later

---

## References

- Design: `plugin/skills/deepfield-bootstrap.md`
- Templates: `plugin/templates/*.md`
- Existing scripts: None yet (this is first)
