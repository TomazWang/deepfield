#!/usr/bin/env node
/**
 * analyze-domains.js - Multi-signal domain detection from a repository path
 *
 * Usage: analyze-domains.js <repoPath> [--output <file>]
 *
 * Analyzes:
 *   - Folder structure (top-level dirs matched against known patterns)
 *   - Monorepo manifests (lerna.json, nx.json, settings.gradle, pom.xml)
 *   - Framework dependencies (package.json, requirements.txt, pom.xml)
 *   - README files (first H1 heading per directory)
 *   - Architectural patterns (microservices, monolith, clean-architecture)
 *
 * Output format:
 * {
 *   "domains": [
 *     {
 *       "name": "frontend",
 *       "score": 1.5,
 *       "confidence": "high",
 *       "sources": ["folder-pattern", "framework-dependency"],
 *       "rank": 1
 *     }
 *   ],
 *   "patterns": [
 *     { "pattern": "microservices", "evidence": "multiple-service-dirs", "suggestion": "per-service domains" }
 *   ]
 * }
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Signal source weights
// ---------------------------------------------------------------------------
const WEIGHTS = {
  'lerna-package':        0.9,
  'nx-project':           0.9,
  'gradle-module':        0.85,
  'maven-module':         0.85,
  'framework-dependency': 0.8,
  'folder-pattern':       0.7,
  'readme':               0.6,
  'brief-hint':           0.5,
};

// ---------------------------------------------------------------------------
// 1.2 Folder structure analysis
// ---------------------------------------------------------------------------

const FOLDER_PATTERNS = {
  frontend:  /^(client|frontend|web|ui|app)$/i,
  backend:   /^(server|backend|api|service|services)$/i,
  database:  /^(db|database|migrations|schema|data)$/i,
  shared:    /^(common|shared|core|lib|libs|utils)$/i,
  auth:      /^(auth|authentication|identity|iam)$/i,
  admin:     /^(admin|dashboard|backoffice|back-office)$/i,
  mobile:    /^(mobile|android|ios|app-mobile)$/i,
};

function analyzeFolderStructure(repoPath) {
  const results = [];

  let entries;
  try {
    entries = fs.readdirSync(repoPath, { withFileTypes: true });
  } catch (_) {
    return results;
  }

  const topLevelDirs = entries.filter(e => e.isDirectory()).map(e => e.name);

  for (const dir of topLevelDirs) {
    for (const [domain, pattern] of Object.entries(FOLDER_PATTERNS)) {
      if (pattern.test(dir)) {
        results.push({
          name: dir,
          suggestedDomain: domain,
          source: 'folder-pattern',
          confidence: 'high',
        });
        break; // only one match per dir
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// 1.3 Monorepo manifest analysis
// ---------------------------------------------------------------------------

/**
 * Expand a lerna-style glob pattern like "packages/*" to actual dir names.
 * Only supports simple "dir/*" patterns (no deep globs).
 */
function expandGlobPattern(repoPath, globPattern) {
  const segments = globPattern.split('/');
  if (segments.length < 2) return [];
  const base = segments.slice(0, segments.length - 1).join('/');
  const baseDir = path.join(repoPath, base);
  if (!fs.existsSync(baseDir)) return [];
  try {
    return fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => ({ name: e.name, dir: path.join(base, e.name) }));
  } catch (_) {
    return [];
  }
}

function analyzeLerna(repoPath) {
  const lernaPath = path.join(repoPath, 'lerna.json');
  if (!fs.existsSync(lernaPath)) return [];

  let config;
  try {
    config = JSON.parse(fs.readFileSync(lernaPath, 'utf-8'));
  } catch (_) {
    return [];
  }

  const patterns = config.packages || ['packages/*'];
  const modules = [];
  for (const pattern of patterns) {
    for (const pkg of expandGlobPattern(repoPath, pattern)) {
      modules.push({ name: pkg.name, source: 'lerna-package', confidence: 'high' });
    }
  }
  return modules;
}

function analyzeNx(repoPath) {
  // Try nx.json + workspace.json
  const nxPath = path.join(repoPath, 'nx.json');
  if (!fs.existsSync(nxPath)) return [];

  const results = [];

  // workspace.json lists projects
  const workspacePath = path.join(repoPath, 'workspace.json');
  if (fs.existsSync(workspacePath)) {
    try {
      const ws = JSON.parse(fs.readFileSync(workspacePath, 'utf-8'));
      const projects = ws.projects || {};
      for (const name of Object.keys(projects)) {
        results.push({ name, source: 'nx-project', confidence: 'high' });
      }
      return results;
    } catch (_) { /* fall through */ }
  }

  // nx.json itself may list projects in newer versions
  try {
    const nxConfig = JSON.parse(fs.readFileSync(nxPath, 'utf-8'));
    const projects = nxConfig.projects || nxConfig.defaultProject ? null : null;
    if (nxConfig.projects && typeof nxConfig.projects === 'object') {
      for (const name of Object.keys(nxConfig.projects)) {
        results.push({ name, source: 'nx-project', confidence: 'high' });
      }
    }
  } catch (_) { /* ignore */ }

  return results;
}

function analyzeGradle(repoPath) {
  const settingsPath = path.join(repoPath, 'settings.gradle');
  const settingsKtsPath = path.join(repoPath, 'settings.gradle.kts');
  const filePath = fs.existsSync(settingsPath) ? settingsPath
                 : fs.existsSync(settingsKtsPath) ? settingsKtsPath
                 : null;
  if (!filePath) return [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Match: include ':module-name' or include("module-name")
    const results = [];
    const re = /include\s*[(:'"]+([^'":)\s]+)/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      const name = m[1].replace(/^:/, '');
      results.push({ name, source: 'gradle-module', confidence: 'high' });
    }
    return results;
  } catch (_) {
    return [];
  }
}

function analyzeMaven(repoPath) {
  const pomPath = path.join(repoPath, 'pom.xml');
  if (!fs.existsSync(pomPath)) return [];

  try {
    const content = fs.readFileSync(pomPath, 'utf-8');
    const results = [];
    const re = /<module>([^<]+)<\/module>/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      results.push({ name: m[1].trim(), source: 'maven-module', confidence: 'high' });
    }
    return results;
  } catch (_) {
    return [];
  }
}

function analyzeModules(repoPath) {
  return [
    ...analyzeLerna(repoPath),
    ...analyzeNx(repoPath),
    ...analyzeGradle(repoPath),
    ...analyzeMaven(repoPath),
  ];
}

// ---------------------------------------------------------------------------
// 1.4 Framework dependency analysis
// ---------------------------------------------------------------------------

const JS_FRONTEND_FRAMEWORKS  = ['react', 'vue', 'angular', '@angular/core', 'svelte', 'solid-js', 'preact'];
const JS_BACKEND_FRAMEWORKS   = ['express', 'fastify', 'koa', 'hapi', '@hapi/hapi', 'nestjs', '@nestjs/core', 'restify', 'feathers', '@feathersjs/feathers'];
const JS_MOBILE_FRAMEWORKS    = ['react-native', 'expo', 'ionic'];

function analyzeDependencies(repoPath) {
  const results = [];

  // --- JavaScript / TypeScript ---
  const pkgPath = path.join(repoPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
        ...pkg.peerDependencies,
      };
      const depNames = Object.keys(allDeps);

      if (depNames.some(d => JS_FRONTEND_FRAMEWORKS.includes(d))) {
        results.push({ domain: 'frontend', source: 'framework-dependency', confidence: 'high' });
      }
      if (depNames.some(d => JS_BACKEND_FRAMEWORKS.includes(d))) {
        results.push({ domain: 'backend', source: 'framework-dependency', confidence: 'high' });
      }
      if (depNames.some(d => JS_MOBILE_FRAMEWORKS.includes(d))) {
        results.push({ domain: 'mobile', source: 'framework-dependency', confidence: 'high' });
      }
    } catch (_) { /* ignore parse errors */ }
  }

  // --- Python ---
  const reqPath = path.join(repoPath, 'requirements.txt');
  if (fs.existsSync(reqPath)) {
    try {
      const content = fs.readFileSync(reqPath, 'utf-8').toLowerCase();
      if (/^(django|flask|fastapi|tornado|starlette|sanic)/m.test(content)) {
        results.push({ domain: 'backend', source: 'framework-dependency', confidence: 'high' });
      }
    } catch (_) { /* ignore */ }
  }

  // --- Java (pom.xml) ---
  const pomPath = path.join(repoPath, 'pom.xml');
  if (fs.existsSync(pomPath)) {
    try {
      const content = fs.readFileSync(pomPath, 'utf-8');
      if (content.includes('spring-boot') || content.includes('spring-web')) {
        results.push({ domain: 'backend', source: 'framework-dependency', confidence: 'high' });
      }
      if (content.includes('android')) {
        results.push({ domain: 'mobile', source: 'framework-dependency', confidence: 'high' });
      }
    } catch (_) { /* ignore */ }
  }

  return results;
}

// ---------------------------------------------------------------------------
// 1.5 README file analysis
// ---------------------------------------------------------------------------

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'out',
  'target', 'vendor', '__pycache__', '.venv', 'coverage',
]);

function findReadmeFiles(dir, baseDir = dir, depth = 0, maxDepth = 4) {
  if (depth > maxDepth) return [];
  const results = [];

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    return results;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      results.push(...findReadmeFiles(path.join(dir, entry.name), baseDir, depth + 1, maxDepth));
    } else if (entry.isFile() && /^readme\.md$/i.test(entry.name)) {
      results.push(path.join(dir, entry.name));
    }
  }

  return results;
}

function analyzeReadmes(repoPath) {
  const readmeFiles = findReadmeFiles(repoPath);
  const results = [];

  for (const readmePath of readmeFiles) {
    try {
      const content = fs.readFileSync(readmePath, 'utf-8');
      const headingMatch = content.match(/^#\s+(.+)$/m);
      if (!headingMatch) continue;

      const name = headingMatch[1].trim();
      const paraMatch = content.match(/^(?!#)(?!\s*$)(.+)$/m);
      const description = paraMatch ? paraMatch[1].trim() : '';
      const dir = path.relative(repoPath, path.dirname(readmePath)) || '.';

      results.push({
        name,
        description,
        path: dir,
        source: 'readme',
        confidence: 'medium',
      });
    } catch (_) { /* skip unreadable */ }
  }

  return results;
}

// ---------------------------------------------------------------------------
// 1.6 Architectural pattern detection
// ---------------------------------------------------------------------------

function getTopLevelDirs(repoPath) {
  try {
    return fs.readdirSync(repoPath, { withFileTypes: true })
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && !IGNORE_DIRS.has(e.name))
      .map(e => e.name);
  } catch (_) {
    return [];
  }
}

const SERVICE_PATTERN = /^.*([-_]service|[-_]svc|[-_]api|[-_]worker)$|^services$/i;
const CLEAN_ARCH_DIRS = new Set(['entities', 'usecases', 'use-cases', 'domain', 'adapters', 'infrastructure']);
const MONOLITH_LAYERS = new Set(['controllers', 'models', 'views', 'routes', 'middleware', 'handlers']);

function detectArchitecturalPatterns(repoPath) {
  const patterns = [];
  const topDirs = getTopLevelDirs(repoPath);

  // Microservices: 3+ service-like dirs OR a services/ directory with sub-dirs
  const serviceDirs = topDirs.filter(d => SERVICE_PATTERN.test(d));
  if (serviceDirs.length >= 3) {
    patterns.push({
      pattern: 'microservices',
      evidence: 'multiple-service-dirs',
      suggestion: 'per-service domains',
    });
  } else if (topDirs.includes('services')) {
    // Check if services/ has sub-directories
    const serviceSubDirs = getTopLevelDirs(path.join(repoPath, 'services'));
    if (serviceSubDirs.length >= 2) {
      patterns.push({
        pattern: 'microservices',
        evidence: 'services-directory-with-sub-services',
        suggestion: 'per-service domains',
      });
    }
  }

  // Clean architecture
  const cleanDirMatches = topDirs.filter(d => CLEAN_ARCH_DIRS.has(d.toLowerCase()));
  if (cleanDirMatches.length >= 2) {
    patterns.push({
      pattern: 'clean-architecture',
      evidence: 'entities-usecases-layers',
      suggestion: 'bounded-context domains',
    });
  }

  // Monolith with layers (only if not already microservices)
  if (!patterns.some(p => p.pattern === 'microservices')) {
    const layerMatches = topDirs.filter(d => MONOLITH_LAYERS.has(d.toLowerCase()));
    if (layerMatches.length >= 2) {
      patterns.push({
        pattern: 'monolith',
        evidence: 'layer-based-structure',
        suggestion: 'layer-based domains',
      });
    }
  }

  return patterns;
}

// ---------------------------------------------------------------------------
// 1.7 Signal aggregation and scoring
// ---------------------------------------------------------------------------

function normalizeKey(name) {
  return name.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function detectDomainsFromSignals(signals) {
  const domainMap = new Map();

  function addEntry(key, name, source) {
    const weight = WEIGHTS[source] || 0.5;
    if (!domainMap.has(key)) {
      domainMap.set(key, { name, score: 0, sources: [] });
    }
    const entry = domainMap.get(key);
    entry.score += weight;
    if (!entry.sources.includes(source)) {
      entry.sources.push(source);
    }
  }

  // Folder signals
  for (const f of signals.folders) {
    const key = normalizeKey(f.suggestedDomain || f.name);
    addEntry(key, f.suggestedDomain || f.name, f.source);
  }

  // Module signals (lerna, nx, gradle, maven) — use actual name as domain
  for (const m of signals.modules) {
    const key = normalizeKey(m.name);
    addEntry(key, m.name, m.source);
  }

  // Dependency signals — domain field is the key
  for (const d of signals.dependencies) {
    const key = normalizeKey(d.domain);
    addEntry(key, d.domain, d.source);
  }

  // README signals — use directory path as secondary context, name as label
  for (const r of signals.readmes) {
    // Skip root README (path '.')
    if (r.path === '.') continue;
    const key = normalizeKey(r.path.split('/').pop() || r.name);
    addEntry(key, r.name, r.source);
  }

  // Sort by score descending
  return Array.from(domainMap.values())
    .sort((a, b) => b.score - a.score)
    .map((d, idx) => ({
      ...d,
      score: Math.round(d.score * 100) / 100,
      rank: idx + 1,
      confidence: d.score >= 1.5 ? 'high' : d.score >= 0.7 ? 'medium' : 'low',
    }));
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

/**
 * Analyze a repository path and return detected domains + architectural patterns.
 *
 * @param {string} repoPath - Absolute or relative path to the repository root
 * @returns {{ domains: Array, patterns: Array }}
 */
function analyzeDomains(repoPath) {
  const resolvedPath = path.resolve(repoPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Repository path not found: ${resolvedPath}`);
  }

  const signals = {
    folders:      analyzeFolderStructure(resolvedPath),
    modules:      analyzeModules(resolvedPath),
    dependencies: analyzeDependencies(resolvedPath),
    readmes:      analyzeReadmes(resolvedPath),
  };

  const domains  = detectDomainsFromSignals(signals);
  const patterns = detectArchitecturalPatterns(resolvedPath);

  return { domains, patterns };
}

module.exports = { analyzeDomains };

// ---------------------------------------------------------------------------
// 1.8 CLI interface
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.error('Usage: analyze-domains.js <repoPath> [--output <file>]');
    console.error('');
    console.error('Options:');
    console.error('  --output <file>   Write JSON to file instead of stdout');
    process.exit(args[0] === '--help' || args[0] === '-h' ? 0 : 1);
  }

  let repoPath = null;
  let outputFile = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && i + 1 < args.length) {
      outputFile = args[++i];
    } else if (!args[i].startsWith('--')) {
      repoPath = args[i];
    }
  }

  if (!repoPath) {
    console.error('Error: <repoPath> is required');
    process.exit(1);
  }

  try {
    const result = analyzeDomains(repoPath);
    const json = JSON.stringify(result, null, 2);

    if (outputFile) {
      const tmp = outputFile + '.tmp';
      fs.writeFileSync(tmp, json, 'utf-8');
      fs.renameSync(tmp, outputFile);
    } else {
      console.log(json);
    }

    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
