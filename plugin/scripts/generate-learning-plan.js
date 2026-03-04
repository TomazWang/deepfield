#!/usr/bin/env node
/**
 * generate-learning-plan.js - Generate deepfield/wip/learning-plan.md
 *
 * Usage: node generate-learning-plan.js <brief-json-file> <repos-json-file> [output-path]
 *
 * Generates a learning plan with topics derived from:
 * - Brief focus areas (HIGH priority)
 * - Detected domains from repo structure (MEDIUM priority)
 * - Standard questions for any codebase (LOW priority)
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_OUTPUT_PATH = './deepfield/wip/learning-plan.md';

// Standard questions for any codebase
const STANDARD_HIGH_QUESTIONS = [
  'What is the primary purpose and user-facing functionality of this system?',
  'What are the main entry points (API, CLI, UI)?',
  'How do the major components interact with each other?',
];

const STANDARD_MEDIUM_QUESTIONS = [
  'What is the data model / key entities?',
  'How is authentication and authorization handled?',
  'What external services or APIs does this depend on?',
];

const STANDARD_LOW_QUESTIONS = [
  'What are the deployment and infrastructure patterns?',
  'What is the testing strategy?',
  'What is the release and CI/CD process?',
];

/**
 * Generate learning-plan.md content from brief and repo scan data.
 */
function generateLearningPlanContent(brief, repos) {
  const now = new Date().toISOString().split('T')[0];

  const focusAreas = brief.focusAreas || [];
  const topics = brief.topics || [];

  // Determine domains from repos
  const detectedDomains = [];
  repos.forEach(repo => {
    if (repo.modules && repo.modules.length > 0) {
      repo.modules.forEach(mod => {
        if (!detectedDomains.includes(mod.name)) {
          detectedDomains.push(mod.name);
        }
      });
    }
  });

  let content = `# Learning Plan\n\n`;
  content += `This file tracks topics to explore, confidence levels, priorities, and open questions. It is updated after each run as understanding deepens.\n\n`;
  content += `*Generated: Run 0 (Bootstrap) — ${now}*\n\n`;

  // Topics section
  content += `## Topics\n\n`;

  // HIGH priority: user-specified focus areas
  if (focusAreas.length > 0) {
    focusAreas.forEach((area, i) => {
      content += `### ${area} (Priority: HIGH)\n\n`;
      content += `- **Confidence:** 20%\n`;
      content += `- **Status:** Not Started\n`;
      content += `- **Questions:**\n`;
      content += `  - How is ${area} implemented in this codebase?\n`;
      content += `  - What are the key files and entry points for ${area}?\n`;
      if (i === 0 && topics.length > 0) {
        topics.slice(0, 3).forEach(topic => { content += `  - ${topic}\n`; });
      }
      content += `- **Needed Sources:**\n`;
      content += `  - Source code files related to ${area}\n`;
      content += `  - Documentation or ADRs about ${area}\n`;
      content += `- **Last Updated:** Run 0\n\n`;
    });
  } else {
    // Generic high priority topic
    content += `### Core Architecture (Priority: HIGH)\n\n`;
    content += `- **Confidence:** 20%\n`;
    content += `- **Status:** Not Started\n`;
    content += `- **Questions:**\n`;
    STANDARD_HIGH_QUESTIONS.forEach(q => { content += `  - ${q}\n`; });
    content += `- **Needed Sources:**\n`;
    content += `  - README files\n`;
    content += `  - Main entry point files\n`;
    content += `  - Architecture documentation\n`;
    content += `- **Last Updated:** Run 0\n\n`;
  }

  // MEDIUM priority: detected domains from monorepo
  if (detectedDomains.length > 0) {
    detectedDomains.slice(0, 5).forEach(domain => {
      content += `### ${domain} (Priority: MEDIUM)\n\n`;
      content += `- **Confidence:** 15%\n`;
      content += `- **Status:** Not Started\n`;
      content += `- **Questions:**\n`;
      content += `  - What does the ${domain} module/service do?\n`;
      content += `  - What are its boundaries and interfaces?\n`;
      content += `- **Needed Sources:**\n`;
      content += `  - Source code in the ${domain} directory\n`;
      content += `- **Last Updated:** Run 0\n\n`;
    });
  }

  // Confidence tracking table
  content += `---\n\n`;
  content += `## Confidence Tracking\n\n`;
  content += `| Topic | Run 0 | Run 1 | Run 2 | Run 3 | Target |\n`;
  content += `|-------|-------|-------|-------|-------|--------|\n`;

  const allTopics = focusAreas.length > 0 ? focusAreas : ['Core Architecture'];
  allTopics.forEach(topic => {
    content += `| ${topic} | 20% | — | — | — | 80% |\n`;
  });
  detectedDomains.slice(0, 5).forEach(domain => {
    content += `| ${domain} | 15% | — | — | — | 70% |\n`;
  });
  content += `\n`;

  // Priorities
  content += `---\n\n`;
  content += `## Priorities\n\n`;

  content += `### HIGH Priority\n`;
  content += `Topics critical to understanding the project. Must reach >80% confidence.\n\n`;
  (focusAreas.length > 0 ? focusAreas : ['Core Architecture']).forEach(area => {
    content += `- [ ] ${area}\n`;
  });
  content += `\n`;

  content += `### MEDIUM Priority\n`;
  content += `Important topics that enhance understanding but aren't blocking.\n\n`;
  if (detectedDomains.length > 0) {
    detectedDomains.slice(0, 5).forEach(domain => { content += `- [ ] ${domain}\n`; });
  } else {
    STANDARD_MEDIUM_QUESTIONS.forEach(q => { content += `- [ ] ${q}\n`; });
  }
  content += `\n`;

  content += `### LOW Priority\n`;
  content += `Nice-to-have topics. Acceptable to have gaps here.\n\n`;
  STANDARD_LOW_QUESTIONS.forEach(q => { content += `- [ ] ${q}\n`; });
  content += `\n`;

  // Open Questions
  content += `---\n\n`;
  content += `## Open Questions\n\n`;
  content += `### High Priority Questions\n`;
  content += `Questions blocking progress on HIGH priority topics.\n\n`;

  if (topics.length > 0) {
    topics.forEach((topic, i) => {
      content += `${i + 1}. ${topic}\n`;
      content += `   - **Topic:** ${focusAreas[0] || 'Core Architecture'}\n`;
      content += `   - **Needed:** Source code and documentation\n\n`;
    });
  } else {
    STANDARD_HIGH_QUESTIONS.forEach((q, i) => {
      content += `${i + 1}. ${q}\n`;
      content += `   - **Topic:** Core Architecture\n`;
      content += `   - **Needed:** README, entry point files\n\n`;
    });
  }

  content += `### General Questions\n`;
  content += `Questions about MEDIUM/LOW priority topics.\n\n`;
  STANDARD_MEDIUM_QUESTIONS.forEach((q, i) => {
    content += `${i + 1}. ${q}\n`;
    content += `   - **Topic:** General\n`;
    content += `   - **Needed:** Source code exploration\n\n`;
  });

  // Completion criteria
  content += `---\n\n`;
  content += `## Completion Criteria\n\n`;
  content += `Learning plan is considered complete when:\n`;
  content += `- All HIGH priority topics reach >80% confidence\n`;
  content += `- All high priority questions are answered\n`;
  content += `- Remaining unknowns are documented in \`drafts/cross-cutting/unknowns.md\`\n\n`;
  content += `**Current Status:** Not Started\n`;
  content += `**Last Updated:** Run 0\n`;

  return content;
}

/**
 * Write learning-plan.md atomically.
 */
function generateLearningPlan(brief, repos, outputPath) {
  const outPath = path.resolve(outputPath || DEFAULT_OUTPUT_PATH);
  const outDir = path.dirname(outPath);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const content = generateLearningPlanContent(brief, repos);

  const tmpPath = outPath + '.tmp';
  fs.writeFileSync(tmpPath, content, 'utf-8');
  fs.renameSync(tmpPath, outPath);

  return outPath;
}

// CLI entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: generate-learning-plan.js <brief-json-file> <repos-json-file> [output-path]');
    process.exit(1);
  }

  try {
    const brief = JSON.parse(fs.readFileSync(args[0], 'utf-8'));
    const repos = JSON.parse(fs.readFileSync(args[1], 'utf-8'));
    const outputPath = args[2] || DEFAULT_OUTPUT_PATH;
    const written = generateLearningPlan(brief, repos, outputPath);
    console.log(`Written: ${written}`);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { generateLearningPlan, generateLearningPlanContent };
