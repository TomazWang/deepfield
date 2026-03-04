'use strict';

const fs = require('fs');
const path = require('path');

const TERMINOLOGY_TEMPLATE = `# Terminology

<!-- Auto-maintained glossary of domain-specific terms discovered during learning runs -->

| Term | Definition | First Seen |
|------|------------|------------|
| <!-- term --> | <!-- definition --> | <!-- run-0 --> |
`;

const NEW_TERMS_TEMPLATE = `# New Terms (Working Notes)

<!-- Deepfield uses this file to collect terms discovered in the current run.
     Terms are promoted to terminology.md after review. -->

## Pending Terms

<!-- Format: **term**: definition (source: file:line) -->

`;

module.exports = {
  from: '2.1.0',
  to: '2.2.0',
  description: 'Add terminology tracking infrastructure',

  async check(projectPath) {
    const terminologyPath = path.join(projectPath, 'deepfield', 'drafts', 'cross-cutting', 'terminology.md');
    return !fs.existsSync(terminologyPath);
  },

  async migrate(projectPath) {
    const deepfieldDir = path.join(projectPath, 'deepfield');
    const changes = [];

    // 1. Create drafts/cross-cutting/terminology.md
    const crossCuttingDir = path.join(deepfieldDir, 'drafts', 'cross-cutting');
    fs.mkdirSync(crossCuttingDir, { recursive: true });

    const terminologyPath = path.join(crossCuttingDir, 'terminology.md');
    if (!fs.existsSync(terminologyPath)) {
      fs.writeFileSync(terminologyPath, TERMINOLOGY_TEMPLATE);
      changes.push('Created drafts/cross-cutting/terminology.md');
    }

    // 2. Create wip/new-terms.md
    const newTermsPath = path.join(deepfieldDir, 'wip', 'new-terms.md');
    fs.mkdirSync(path.dirname(newTermsPath), { recursive: true });
    if (!fs.existsSync(newTermsPath)) {
      fs.writeFileSync(newTermsPath, NEW_TERMS_TEMPLATE);
      changes.push('Created wip/new-terms.md');
    }

    return { success: true, changes, filesCreated: changes.length, filesUpdated: 0 };
  },

  async rollback(projectPath) {
    const deepfieldDir = path.join(projectPath, 'deepfield');

    const terminologyPath = path.join(deepfieldDir, 'drafts', 'cross-cutting', 'terminology.md');
    if (fs.existsSync(terminologyPath)) fs.unlinkSync(terminologyPath);

    const newTermsPath = path.join(deepfieldDir, 'wip', 'new-terms.md');
    if (fs.existsSync(newTermsPath)) fs.unlinkSync(newTermsPath);

    return { success: true };
  },
};
