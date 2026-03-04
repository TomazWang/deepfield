#!/usr/bin/env node
/**
 * parse-brief.js - Parse deepfield/source/baseline/brief.md into structured JSON
 *
 * Usage: node parse-brief.js [brief-path]
 *
 * Output format:
 * {
 *   "projectName": "My Project",
 *   "repositories": [
 *     { "url": "https://github.com/org/repo", "branch": "main", "name": "repo" }
 *   ],
 *   "documents": [],
 *   "focusAreas": ["authentication", "billing"],
 *   "topics": ["How does auth work?"]
 * }
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_BRIEF_PATH = './deepfield/source/baseline/brief.md';

/**
 * Extract project name from brief content.
 * Looks for "# Project: Name" or "# Name" at the top.
 */
function extractProjectName(content) {
  // Try "# Project: Name" format
  let match = content.match(/^#\s*Project:\s*(.+)$/m);
  if (match) return match[1].trim();

  // Try "**Project Name:** Name" format
  match = content.match(/\*\*Project(?:\s+Name)?:\*\*\s*(.+)$/m);
  if (match) return match[1].trim();

  // Try first H1 heading
  match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();

  return 'Unknown Project';
}

/**
 * Extract branch hint from content near a URL.
 * Looks for "branch: X" or "(branch X)" patterns.
 */
function extractBranchForUrl(content, url) {
  // Find the line containing this URL and look nearby for branch info
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(url)) {
      // Check the same line and next 2 lines for branch info
      const nearby = lines.slice(i, i + 3).join(' ');
      const branchMatch = nearby.match(/branch[:\s]+([^\s,)]+)/i);
      if (branchMatch) return branchMatch[1].trim();
      const tagMatch = nearby.match(/tag[:\s]+([^\s,)]+)/i);
      if (tagMatch) return tagMatch[1].trim();
    }
  }
  return null;
}

/**
 * Extract repository definitions from brief content.
 * Looks inside a "## Repositories" section for URLs.
 */
function extractRepositories(content) {
  // Find the Repositories section
  const repoSection = content.match(/##\s*Repositories?\s*\n([\s\S]+?)(?=\n##\s|\n---|\n#\s|$)/i);
  const searchContent = repoSection ? repoSection[1] : content;

  // Match git URLs: https:// or git@
  const urlPattern = /(?:https?:\/\/[^\s)\]"'`]+|git@[^\s)\]"'`]+\.git)/g;
  const urls = [...new Set(searchContent.match(urlPattern) || [])];

  return urls.map(url => {
    const branch = extractBranchForUrl(searchContent, url) || 'main';
    // Derive repo name from URL
    const name = url
      .replace(/\.git$/, '')
      .split('/')
      .pop() || 'repo';
    return { url, branch, name };
  });
}

/**
 * Extract document URLs or file paths from brief content.
 */
function extractDocuments(content) {
  const docSection = content.match(/##\s*Documents?\s*\n([\s\S]+?)(?=\n##\s|\n---|\n#\s|$)/i);
  if (!docSection) return [];

  const sectionContent = docSection[1];

  // Match markdown links: [title](url)
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const docs = [];
  let match;
  while ((match = linkPattern.exec(sectionContent)) !== null) {
    docs.push({ title: match[1], url: match[2] });
  }

  // Also match bare URLs
  const bareUrls = sectionContent.match(/https?:\/\/[^\s)\]"'`]+/g) || [];
  bareUrls.forEach(url => {
    if (!docs.find(d => d.url === url)) {
      docs.push({ title: url.split('/').pop() || url, url });
    }
  });

  return docs;
}

/**
 * Extract focus areas from brief content.
 * Looks inside "## Focus Areas" section for bullet points.
 */
function extractFocusAreas(content) {
  const focusSection = content.match(/##\s*(?:Focus Areas?|Areas? of (?:Concern|Focus)|Key Areas?)\s*\n([\s\S]+?)(?=\n##\s|\n---|\n#\s|$)/i);
  if (!focusSection) return [];

  const lines = focusSection[1].split('\n');
  const areas = [];
  for (const line of lines) {
    const match = line.match(/^[-*+]\s+(.+)$/);
    if (match) {
      areas.push(match[1].trim());
    }
  }
  return areas;
}

/**
 * Extract topics of interest from brief content.
 * Looks for checked checkboxes [x] or a "Topics" section with bullets.
 */
function extractTopics(content) {
  const topics = [];

  // Checked checkboxes: - [x] Topic
  const checkedPattern = /^[-*]\s+\[x\]\s+(.+)$/gim;
  let match;
  while ((match = checkedPattern.exec(content)) !== null) {
    topics.push(match[1].trim());
  }

  // Topics section bullets
  const topicsSection = content.match(/##\s*Topics?\s*(?:of Interest)?\s*\n([\s\S]+?)(?=\n##\s|\n---|\n#\s|$)/i);
  if (topicsSection) {
    const lines = topicsSection[1].split('\n');
    for (const line of lines) {
      const bulletMatch = line.match(/^[-*+]\s+(.+)$/);
      if (bulletMatch) {
        const topic = bulletMatch[1].trim();
        if (!topics.includes(topic)) topics.push(topic);
      }
    }
  }

  return topics;
}

/**
 * Parse a brief.md file and return structured data.
 */
function parseBrief(briefPath) {
  const resolvedPath = path.resolve(briefPath || DEFAULT_BRIEF_PATH);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Brief not found at ${resolvedPath}\n\nPlease run /df-start to generate the brief template, then fill it out.`);
  }

  const content = fs.readFileSync(resolvedPath, 'utf-8');

  if (!content.trim()) {
    throw new Error(`Brief is empty at ${resolvedPath}\n\nPlease fill out the brief with your project information.`);
  }

  return {
    projectName: extractProjectName(content),
    repositories: extractRepositories(content),
    documents: extractDocuments(content),
    focusAreas: extractFocusAreas(content),
    topics: extractTopics(content),
  };
}

// CLI entrypoint
if (require.main === module) {
  const briefPath = process.argv[2] || DEFAULT_BRIEF_PATH;
  try {
    const data = parseBrief(briefPath);
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { parseBrief, extractProjectName, extractRepositories, extractDocuments, extractFocusAreas, extractTopics };
