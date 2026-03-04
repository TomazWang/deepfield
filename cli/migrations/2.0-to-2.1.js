'use strict';

const fs = require('fs');
const path = require('path');

const DEEPFIELD_MD_TEMPLATE = `# DEEPFIELD.md — Project Preferences

<!-- Customize deepfield behaviour for this project -->

## Learning Preferences

- **max_runs**: 5          # Maximum autonomous learning cycles
- **confidence_threshold**: 0.8   # Stop when all topics reach this confidence
- **parallel**: false      # Enable parallel agent execution

## Domain Configuration

<!-- Override auto-detected domains -->
# domains:
#   - name: backend
#     paths: [src/server, src/api]
#   - name: frontend
#     paths: [src/client, src/ui]

## Output Preferences

- **format**: markdown
- **include_unknowns**: true
- **include_changelog**: true
`;

module.exports = {
  from: '2.0.0',
  to: '2.1.0',
  description: 'Add DEEPFIELD.md project preferences file',

  async check(projectPath) {
    const deepfieldMd = path.join(projectPath, 'deepfield', 'DEEPFIELD.md');
    return !fs.existsSync(deepfieldMd);
  },

  async migrate(projectPath) {
    const deepfieldMd = path.join(projectPath, 'deepfield', 'DEEPFIELD.md');
    const changes = [];

    if (!fs.existsSync(deepfieldMd)) {
      fs.writeFileSync(deepfieldMd, DEEPFIELD_MD_TEMPLATE);
      changes.push('Created DEEPFIELD.md template');
    }

    return { success: true, changes, filesCreated: changes.length, filesUpdated: 0 };
  },

  async rollback(projectPath) {
    const deepfieldMd = path.join(projectPath, 'deepfield', 'DEEPFIELD.md');
    if (fs.existsSync(deepfieldMd)) fs.unlinkSync(deepfieldMd);
    return { success: true };
  },
};
