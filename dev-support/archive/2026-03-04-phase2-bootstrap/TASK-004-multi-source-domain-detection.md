# Task 004: Multi-Source Domain Detection

**Feature:** Generate domain-index from repos + brief, not just brief
**Priority:** 🟡 High
**Status:** Not Started
**Estimated Time:** 1 day
**OpenSpec Change:** `feat/multi-source-domain-detection`

---

## Objective

Improve domain detection by analyzing actual repository structure, build configurations, and README files, not just relying on brief.md.

---

## Problem

**Current:** domain-index.md is generated primarily from brief.md
**Issue:** Brief is user's initial understanding, which may be incomplete/wrong
**Expected:** Discover domains from code structure + brief hints

---

## What to Implement

### Multi-Source Domain Detection

**Sources (in priority order):**
1. **Repository structure** - folders, modules, packages
2. **Build configurations** - package.json, pom.xml, etc.
3. **README files** - module descriptions
4. **Import/dependency analysis** - what talks to what
5. **Brief hints** - user's initial understanding

---

## Implementation Strategy

### 1. Enhanced Structure Scanner

**File:** `plugin/scripts/analyze-domains.js`

Analyze multiple signals:

```javascript
/**
 * Analyze repository for domain signals
 */
function analyzeDomains(repoPath) {
  const signals = {
    folders: analyzeFolderStructure(repoPath),
    modules: analyzeModules(repoPath),
    dependencies: analyzeDependencies(repoPath),
    readmes: analyzeReadmes(repoPath),
    patterns: detectArchitecturalPatterns(repoPath)
  };

  return detectDomainsFromSignals(signals);
}

/**
 * Analyze folder structure for domain hints
 */
function analyzeFolderStructure(repoPath) {
  const topLevel = getTopLevelDirs(repoPath);

  const domains = [];

  // Common patterns
  const patterns = {
    frontend: /^(client|frontend|web|ui|app)$/i,
    backend: /^(server|backend|api|service)$/i,
    database: /^(db|database|migrations|schema)$/i,
    shared: /^(common|shared|core|lib|utils)$/i,
    auth: /^(auth|authentication|identity)$/i,
    admin: /^(admin|dashboard|backoffice)$/i,
    mobile: /^(mobile|android|ios)$/i
  };

  topLevel.forEach(dir => {
    for (const [domain, pattern] of Object.entries(patterns)) {
      if (pattern.test(dir)) {
        domains.push({
          name: dir,
          suggestedDomain: domain,
          source: 'folder-pattern',
          confidence: 'high'
        });
      }
    }
  });

  return domains;
}

/**
 * Analyze package.json, pom.xml, etc. for modules
 */
function analyzeModules(repoPath) {
  const modules = [];

  // Check for lerna/monorepo
  if (fs.existsSync(path.join(repoPath, 'lerna.json'))) {
    const lernaConfig = JSON.parse(fs.readFileSync(path.join(repoPath, 'lerna.json'), 'utf-8'));
    const packages = lernaConfig.packages || ['packages/*'];

    packages.forEach(pattern => {
      const packagesDir = path.join(repoPath, pattern.replace('/*', ''));
      if (fs.existsSync(packagesDir)) {
        const pkgs = fs.readdirSync(packagesDir, { withFileTypes: true })
          .filter(e => e.isDirectory())
          .map(e => ({
            name: e.name,
            source: 'lerna-package',
            confidence: 'high'
          }));
        modules.push(...pkgs);
      }
    });
  }

  // Check for nx/monorepo
  if (fs.existsSync(path.join(repoPath, 'nx.json'))) {
    // Parse nx.json and workspace.json
    // Extract projects
  }

  // Check for Maven multi-module
  if (fs.existsSync(path.join(repoPath, 'pom.xml'))) {
    // Parse pom.xml
    // Extract <modules>
  }

  // Check for Gradle multi-project
  if (fs.existsSync(path.join(repoPath, 'settings.gradle'))) {
    // Parse settings.gradle
    // Extract included projects
  }

  return modules;
}

/**
 * Analyze dependencies to detect domain boundaries
 */
function analyzeDependencies(repoPath) {
  const deps = [];

  // For JavaScript/TypeScript
  if (fs.existsSync(path.join(repoPath, 'package.json'))) {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoPath, 'package.json'), 'utf-8'));

    // Check for framework-specific patterns
    if (pkg.dependencies?.react || pkg.dependencies?.vue || pkg.dependencies?.angular) {
      deps.push({ domain: 'frontend', evidence: 'framework-dependency', confidence: 'high' });
    }

    if (pkg.dependencies?.express || pkg.dependencies?.fastify || pkg.dependencies?.nestjs) {
      deps.push({ domain: 'backend', evidence: 'framework-dependency', confidence: 'high' });
    }

    if (pkg.dependencies?.['react-native']) {
      deps.push({ domain: 'mobile', evidence: 'framework-dependency', confidence: 'high' });
    }
  }

  // For Python
  if (fs.existsSync(path.join(repoPath, 'requirements.txt'))) {
    const requirements = fs.readFileSync(path.join(repoPath, 'requirements.txt'), 'utf-8');

    if (requirements.includes('django') || requirements.includes('flask')) {
      deps.push({ domain: 'backend', evidence: 'framework-dependency', confidence: 'high' });
    }
  }

  // For Java
  if (fs.existsSync(path.join(repoPath, 'pom.xml'))) {
    const pom = fs.readFileSync(path.join(repoPath, 'pom.xml'), 'utf-8');

    if (pom.includes('spring-boot')) {
      deps.push({ domain: 'backend', evidence: 'framework-dependency', confidence: 'high' });
    }
  }

  return deps;
}

/**
 * Analyze README files for domain descriptions
 */
function analyzeReadmes(repoPath) {
  const readmes = [];

  // Find all README files
  const readmeFiles = findFiles(repoPath, /readme\.md$/i);

  readmeFiles.forEach(readmePath => {
    const content = fs.readFileSync(readmePath, 'utf-8');
    const dir = path.dirname(readmePath);

    // Extract heading and description
    const firstHeading = content.match(/^#\s+(.+)$/m);
    const firstPara = content.match(/^(?!#).+$/m);

    if (firstHeading) {
      readmes.push({
        path: dir,
        name: firstHeading[1],
        description: firstPara ? firstPara[0] : '',
        source: 'readme'
      });
    }
  });

  return readmes;
}

/**
 * Detect architectural patterns
 */
function detectArchitecturalPatterns(repoPath) {
  const patterns = [];

  // Check for microservices
  if (hasMultipleServices(repoPath)) {
    patterns.push({
      pattern: 'microservices',
      evidence: 'multiple-service-dirs',
      suggestion: 'per-service domains'
    });
  }

  // Check for monolith
  if (hasSingleServiceStructure(repoPath)) {
    patterns.push({
      pattern: 'monolith',
      evidence: 'single-service-structure',
      suggestion: 'layer-based domains'
    });
  }

  // Check for Clean Architecture / DDD
  if (hasCleanArchitectureFolders(repoPath)) {
    patterns.push({
      pattern: 'clean-architecture',
      evidence: 'entities-usecases-layers',
      suggestion: 'bounded-context domains'
    });
  }

  return patterns;
}

/**
 * Combine all signals to detect domains
 */
function detectDomainsFromSignals(signals) {
  const domains = new Map();

  // Weight signals by confidence
  const weights = {
    'folder-pattern': 0.7,
    'lerna-package': 0.9,
    'framework-dependency': 0.8,
    'readme': 0.6,
    'brief-hint': 0.5
  };

  // Aggregate signals
  signals.folders.forEach(f => {
    const key = f.suggestedDomain || f.name;
    const existing = domains.get(key) || { name: key, score: 0, sources: [] };
    existing.score += weights['folder-pattern'];
    existing.sources.push(f.source);
    domains.set(key, existing);
  });

  signals.modules.forEach(m => {
    const key = m.name;
    const existing = domains.get(key) || { name: key, score: 0, sources: [] };
    existing.score += weights[m.source];
    existing.sources.push(m.source);
    domains.set(key, existing);
  });

  // ... combine other signals ...

  // Sort by score
  return Array.from(domains.values())
    .sort((a, b) => b.score - a.score)
    .map((d, idx) => ({
      ...d,
      rank: idx + 1,
      confidence: d.score > 1.5 ? 'high' : d.score > 0.7 ? 'medium' : 'low'
    }));
}
```

### 2. Updated Domain Index Generator

**File:** `plugin/scripts/generate-domain-index.js`

Update to use multi-source analysis:

```javascript
import { analyzeDomains } from './analyze-domains.js';

function generateDomainIndex(brief, repos) {
  const allDomains = new Map();

  // Analyze each repository
  repos.forEach(repo => {
    const repoPath = `./deepfield/source/baseline/repos/${repo.name}`;
    const domains = analyzeDomains(repoPath);

    domains.forEach(domain => {
      const key = domain.name;
      if (allDomains.has(key)) {
        // Merge
        const existing = allDomains.get(key);
        existing.score += domain.score;
        existing.sources.push(...domain.sources);
        existing.repos.push(repo.name);
      } else {
        allDomains.set(key, {
          ...domain,
          repos: [repo.name]
        });
      }
    });
  });

  // Add brief hints (lower weight)
  brief.focusAreas.forEach(area => {
    const key = area.toLowerCase().replace(/\s+/g, '-');
    const existing = allDomains.get(key) || { name: area, score: 0, sources: [], repos: [] };
    existing.score += 0.5; // Lower weight for brief
    existing.sources.push('brief-hint');
    allDomains.set(key, existing);
  });

  // Generate markdown
  const template = fs.readFileSync('./plugin/templates/domain-index.md', 'utf-8');

  let domainSection = '';

  Array.from(allDomains.values())
    .sort((a, b) => b.score - a.score)
    .forEach((domain, idx) => {
      domainSection += `\n### ${idx + 1}. ${domain.name}\n\n`;
      domainSection += `**Confidence:** ${domain.confidence}\n`;
      domainSection += `**Sources:** ${[...new Set(domain.sources)].join(', ')}\n`;
      domainSection += `**Repositories:** ${domain.repos.join(', ')}\n`;
      domainSection += `**Score:** ${domain.score.toFixed(2)}\n\n`;
    });

  const content = template.replace('{{DOMAINS}}', domainSection);

  fs.writeFileSync('./deepfield/wip/domain-index.md', content);
}
```

---

## Acceptance Criteria

- [ ] Analyzes folder structure for domain hints
- [ ] Parses build configurations (package.json, pom.xml, etc.)
- [ ] Extracts modules from monorepo configs (lerna, nx, etc.)
- [ ] Analyzes dependencies for framework/domain clues
- [ ] Reads README files for module descriptions
- [ ] Detects architectural patterns (microservices, monolith, etc.)
- [ ] Combines brief hints with discovered domains
- [ ] Weights sources by confidence
- [ ] Generates domain-index.md with sources cited
- [ ] More accurate than brief-only approach
- [ ] Handles multiple repositories
- [ ] Handles monorepos vs multi-repos

---

## Testing

**Test cases:**

1. **Monorepo with packages/**
   - Should detect all packages as domains
   - Should cite "lerna-package" or "folder-structure"

2. **Microservices repo**
   - Should detect services/ as domains
   - Should cite "folder-pattern"

3. **Monolith with layers**
   - Should detect functional domains
   - Should use dependency analysis

4. **Brief + repo mismatch**
   - Brief says "auth, api, frontend"
   - Repo has "authentication/, backend/, client/"
   - Should map correctly and show both

5. **No repos (brief only)**
   - Should fall back to brief hints
   - Should mark as low confidence

---

## Dependencies

- **Depends on:** Task 002 (bootstrap implementation)
- **Enhances:** Domain detection accuracy

---

## Future Enhancements

- Use AI to analyze code structure (not just files/folders)
- Detect domain boundaries from import graphs
- Analyze git commit history for team/module boundaries
- Use documentation to refine domain names

---

## References

- Lerna: https://lerna.js.org/
- Nx: https://nx.dev/
- Maven multi-module: https://maven.apache.org/guides/mini/guide-multiple-modules.html
