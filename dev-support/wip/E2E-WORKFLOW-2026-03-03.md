# E2E Testing Workflow

Quick reference guide for testing deepfield plugin end-to-end in real-world scenarios.

---

## Pre-Testing Setup

### 1. Ensure Latest Version

```bash
# Pull latest changes
cd ~/dev/workspace/mine/deepfield
git pull

# Rebuild CLI
cd cli
npm install
npm run build

# Verify link
deepfield --version
df --version
```

### 2. Verify Plugin Link

```bash
# Check plugin is linked
ls -la ~/.claude/plugins/deepfield

# Should point to: ~/dev/workspace/mine/deepfield/plugin
```

### 3. Prepare Test Project

```bash
# Create or choose test project
cd ~/91dev
mkdir test-deepfield-$(date +%Y%m%d)
cd test-deepfield-$(date +%Y%m%d)

# Or use existing project
cd ~/91dev/existing-project
```

---

## Testing Process

### Phase 1: Initialization

```bash
# Test deepfield init
deepfield init

# Verify structure created
tree deepfield/

# Expected:
# deepfield/
#   ├── brief.md (template)
#   ├── project.config.json
#   ├── source/
#   ├── wip/
#   ├── drafts/
#   └── output/
```

**Document any issues:**
- Errors during init
- Missing files/directories
- Incorrect permissions
- Template content issues

### Phase 2: Project Setup

```bash
# Test deepfield start
deepfield start

# Or manually edit brief.md
vi deepfield/brief.md
```

**Fill in brief.md with:**
- Project overview
- Repository URLs
- Key domains (if known)
- Documentation sources

**Document any issues:**
- Interactive prompts not working
- Brief template unclear
- Validation errors

### Phase 3: Bootstrap (Run 0)

```bash
# Test bootstrap
deepfield bootstrap

# Monitor output for:
# - Repository cloning
# - Credential prompts (if private repos)
# - Structure scanning
# - Domain detection
# - File generation
```

**Check outputs:**
```bash
# Verify generated files
cat deepfield/wip/project-map.md
cat deepfield/wip/domain-index.md
cat deepfield/wip/learning-plan.md
cat deepfield/wip/run-0/run-0.config.json

# Check status
cat deepfield/wip/run-0/findings.md
```

**Document any issues:**
- Credential detection failures
- Cloning errors
- Domain detection accuracy
- Missing/incorrect files
- Performance issues

### Phase 4: Status Check

```bash
# Test status command
deepfield status

# Should show:
# - Current run
# - Completed runs
# - Domains discovered
# - Next steps
```

**Document any issues:**
- Status not updating
- Incorrect information
- Missing details

### Phase 5: Learning Iterations

```bash
# Test iterate command
/df-iterate

# Monitor:
# - File scanning
# - Learning progress
# - Findings generation
# - Feedback prompts
```

**Check outputs:**
```bash
# Verify run files
cat deepfield/wip/run-1/findings.md
cat deepfield/wip/run-1/feedback.md

# Check draft updates
cat deepfield/drafts/domains/*/

# Verify changelog
cat deepfield/drafts/_changelog.md
```

**Document any issues:**
- Scanning failures
- Learning agent errors
- Missing findings
- Feedback loop issues
- Draft generation problems

### Phase 6: Input Addition

```bash
# Test input command
/df-input

# Add new sources:
# - Additional repository
# - Documentation URL
# - Local files
```

**Document any issues:**
- Source classification errors
- File copying failures
- Invalid input handling

### Phase 7: Output Snapshot

```bash
# Test output command
/df-output

# Monitor:
# - Draft copying
# - Versioning
# - File organization
```

**Check outputs:**
```bash
# Verify versioned output
ls deepfield/output/
cat deepfield/output/v1.0.0/
```

**Document any issues:**
- Snapshot creation failures
- Missing files
- Incorrect versioning

### Phase 8: Project Upgrade (If Testing Old Project)

```bash
# Test upgrade command (if using old project)
deepfield upgrade

# Monitor:
# - Version detection
# - Backup creation
# - Structure migration
# - Validation
```

**Check outputs:**
```bash
# Verify backup
ls .deepfield-backups/

# Verify updated structure
cat deepfield/project.config.json  # Should have deepfieldVersion
ls deepfield/drafts/domains/
ls deepfield/drafts/cross-cutting/
```

**Document any issues:**
- Version detection failures
- Migration errors
- Missing structure
- Validation failures

---

## What to Test

### Core Functionality

- [ ] `deepfield init` - Create project structure
- [ ] `deepfield start` - Interactive setup
- [ ] `deepfield bootstrap` - Run 0 execution
- [ ] `deepfield status` - Current state display
- [ ] `/df-iterate` - Learning iterations
- [ ] `/df-input` - Add sources
- [ ] `/df-output` - Create snapshots
- [ ] `/df-continue` - Workflow continuation
- [ ] `deepfield upgrade` - Project migration (if applicable)

### Edge Cases

- [ ] Private repositories (credential handling)
- [ ] Monorepo detection (lerna, nx, yarn workspaces)
- [ ] Large repositories (performance)
- [ ] Multiple repositories (parallel processing)
- [ ] Missing/invalid brief.md
- [ ] Interrupted operations (Ctrl+C)
- [ ] Disk space issues
- [ ] Network failures

### User Experience

- [ ] Error messages (clear and helpful)
- [ ] Progress indicators (accurate)
- [ ] Confirmation prompts (appropriate)
- [ ] Help text (comprehensive)
- [ ] Default values (sensible)
- [ ] Feedback collection (intuitive)

### Output Quality

- [ ] Domain detection (accurate)
- [ ] Project mapping (complete)
- [ ] Learning plan (relevant)
- [ ] Findings (useful)
- [ ] Drafts (well-organized)
- [ ] Terminology (comprehensive)
- [ ] Changelog (clear)

---

## Documentation to Check

### README.md
- [ ] Installation instructions accurate
- [ ] Command examples correct
- [ ] Phase status up-to-date
- [ ] Links working
- [ ] Screenshots current

### Command Help
```bash
deepfield --help
deepfield init --help
deepfield bootstrap --help
# etc.
```

- [ ] Descriptions clear
- [ ] Options documented
- [ ] Examples provided

### Plugin Documentation
- [ ] Skills documented
- [ ] Agents documented
- [ ] Scripts documented
- [ ] Templates documented

---

## Issue Reporting

### For Each Issue Found

1. **Document immediately** in `ISSUES-E2E-TESTING.md`
2. **Assign severity** (Critical/High/Medium/Low)
3. **Categorize** (Bug/Enhancement/UX/Documentation/Performance)
4. **Include reproduction steps**
5. **Note environment details**
6. **Identify workaround** (if found)

### Issue Template

```markdown
### Issue #N: [Brief Description]

**Severity:** 🔴 Critical
**Category:** Bug

**Command/Feature:** `deepfield bootstrap`

**What I Did:**
- Step 1
- Step 2

**What Happened:**
[Actual behavior]

**What I Expected:**
[Expected behavior]

**Error:**
```
[Error output]
```

**Workaround:**
[If found]
```

---

## After Testing

### 1. Review Issues

```bash
# Review collected issues
cat dev-support/wip/ISSUES-E2E-TESTING.md

# Count by severity
# - Critical: [count]
# - High: [count]
# - Medium: [count]
# - Low: [count]
```

### 2. Prioritize

- Critical/High issues → Immediate fixes
- Medium issues → Next sprint
- Low issues → Backlog
- Feature requests → Separate planning

### 3. Create Task Breakdown

For each issue/feature:
- Create detailed task document
- Estimate effort
- Identify dependencies
- Plan implementation approach

### 4. Archive When Resolved

```bash
# After fixing all issues
mv dev-support/wip/ISSUES-E2E-TESTING.md \
   dev-support/archive/$(date +%Y-%m-%d)-e2e-testing/

# Create archive README summarizing work
```

---

## Testing Checklist

### Environment Setup
- [ ] Latest code pulled
- [ ] CLI rebuilt and linked
- [ ] Plugin linked correctly
- [ ] Test project prepared

### Core Commands
- [ ] `deepfield init`
- [ ] `deepfield start`
- [ ] `deepfield bootstrap`
- [ ] `deepfield status`
- [ ] `deepfield upgrade`

### Plugin Commands
- [ ] `/df-iterate`
- [ ] `/df-input`
- [ ] `/df-output`
- [ ] `/df-continue`

### Real-World Scenarios
- [ ] Public repositories
- [ ] Private repositories
- [ ] Monorepos
- [ ] Multi-repo projects
- [ ] Large codebases

### Documentation
- [ ] README accuracy
- [ ] Command help text
- [ ] Error messages
- [ ] Examples

### Issue Documentation
- [ ] All issues recorded
- [ ] Severity assigned
- [ ] Steps to reproduce
- [ ] Environment details
- [ ] Workarounds noted

---

## Quick Reference

### Common Paths

```bash
# Plugin source
~/dev/workspace/mine/deepfield/plugin/

# CLI source
~/dev/workspace/mine/deepfield/cli/

# Linked plugin
~/.claude/plugins/deepfield

# Testing directory
~/91dev/test-deepfield-*

# Issue tracking
~/dev/workspace/mine/deepfield/dev-support/wip/ISSUES-E2E-TESTING.md
```

### Common Commands

```bash
# Rebuild CLI
cd ~/dev/workspace/mine/deepfield/cli && npm run build

# Check versions
deepfield --version
df --version

# View plugin
ls -la ~/.claude/plugins/deepfield

# Fresh test project
cd ~/91dev && mkdir test-df-$(date +%Y%m%d) && cd $_

# View issues
cat ~/dev/workspace/mine/deepfield/dev-support/wip/ISSUES-E2E-TESTING.md
```

---

## Tips

### Capture Everything

- Screenshots of errors
- Full error stack traces
- Console output
- File states before/after
- Network requests (if relevant)

### Test Incrementally

- One command at a time
- Document immediately
- Don't skip steps
- Verify outputs before continuing

### Think Like a User

- Follow documentation exactly
- Don't assume knowledge
- Note confusing parts
- Identify unclear messaging

### Test Edge Cases

- Invalid inputs
- Missing files
- Network failures
- Interrupted operations
- Permission issues

### Performance Notes

- Time long operations
- Note memory usage
- Check disk space
- Monitor network usage

---

**Ready to test!** 🧪
