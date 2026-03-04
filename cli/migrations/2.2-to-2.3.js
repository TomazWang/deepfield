'use strict';

const fs = require('fs');
const path = require('path');

const PARALLEL_PLAN_TEMPLATE = `# Parallel Learning Plan

<!-- Deepfield uses this file to coordinate parallel agent execution.
     Edit manually only if you want to override the auto-generated plan. -->

## Current Plan

**Status**: not started
**Domains**: (auto-detected)
**Agents**: (auto-assigned)

## Agent Assignments

<!-- Format:
agent-1:
  domain: <domain-name>
  focus: [file1, file2]
  status: pending | running | done | failed
-->
`;

module.exports = {
  from: '2.2.0',
  to: '2.3.0',
  description: 'Add parallel learning support (parallel-plan.md)',

  async check(projectPath) {
    const parallelPlan = path.join(projectPath, 'deepfield', 'wip', 'parallel-plan.md');
    return !fs.existsSync(parallelPlan);
  },

  async migrate(projectPath) {
    const wipDir = path.join(projectPath, 'deepfield', 'wip');
    fs.mkdirSync(wipDir, { recursive: true });
    const changes = [];

    const parallelPlanPath = path.join(wipDir, 'parallel-plan.md');
    if (!fs.existsSync(parallelPlanPath)) {
      fs.writeFileSync(parallelPlanPath, PARALLEL_PLAN_TEMPLATE);
      changes.push('Created wip/parallel-plan.md');
    }

    return { success: true, changes, filesCreated: changes.length, filesUpdated: 0 };
  },

  async rollback(projectPath) {
    const parallelPlanPath = path.join(projectPath, 'deepfield', 'wip', 'parallel-plan.md');
    if (fs.existsSync(parallelPlanPath)) fs.unlinkSync(parallelPlanPath);
    return { success: true };
  },
};
