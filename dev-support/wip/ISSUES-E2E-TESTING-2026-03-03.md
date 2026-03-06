# E2E Testing Issues

**Testing Date:** [Date when testing was performed]
**Plugin Version:** [Version being tested]
**Tester:** [Your name]

---

## Testing Status

**Environment:**
- [ ] Fresh installation
- [x] Existing project upgrade
- [ ] Development environment (npm link)

**Commands Tested:**
- [ ] `deepfield init`
- [ ] `deepfield start`
- [ ] `deepfield bootstrap`
- [ ] `deepfield status`
- [ ] `deepfield upgrade` (if applicable)
- [ ] `/df-input`
- [x] `/df-iterate`
- [ ] `/df-output`
- [x] `/df-continue`

---

## Issues Found

### Issue #1: findings should have evidence.

**What Happened:**
```
some of the findings in findings.md are not supported by evidence, making it hard to verify their accuracy and reliability.
```
---

### Issue #2: Deepfield ignore source in source/ provdied by user. 


**What I Did:**
```
I put lots of source files in source/source-doc, mostly pptx and pdf files, in the starting phase (before run 0)
```

**What Happened:**
```
deepfield seems to ignore the source files. some of the question it ask are in those files.
```

---

### Issue #3: [Brief Description]

**Severity:** 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low
**Category:** Bug | Enhancement | UX | Documentation | Performance

**Command/Feature:** `[command or feature name]`

**What I Did:**
```bash
[Steps to reproduce]
```

**What Happened:**
```
[Actual behavior]
```

**What I Expected:**
```
[Expected behavior]
```

**Impact:**
- [How this affects users]

**Error Messages (if any):**
```
[Error output]
```

**Workaround (if found):**
```
[Temporary solution]
```

**Environment:**
- OS: [macOS/Linux/Windows]
- Node version: [version]
- deepfield version: [version]

---

## Feature Requests

### Feature Request #1: [Brief Description]

**Priority:** 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low
**Category:** New Feature | Enhancement | UX Improvement

**Description:**
[What feature would you like to see?]

**Use Case:**
[Why is this useful? When would you use it?]

**Proposed Solution:**
[How could this be implemented?]

**Alternatives Considered:**
[Other ways to solve this problem]

**Related Issues:**
[Link to any related issues or discussions]

---

### Feature Request #2: [Brief Description]

**Priority:** 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low
**Category:** New Feature | Enhancement | UX Improvement

**Description:**
[What feature would you like to see?]

**Use Case:**
[Why is this useful? When would you use it?]

**Proposed Solution:**
[How could this be implemented?]

**Alternatives Considered:**
[Other ways to solve this problem]

**Related Issues:**
[Link to any related issues or discussions]

---

## Positive Feedback

### What Worked Well

- [Feature or aspect that worked well]
- [Feature or aspect that worked well]
- [Feature or aspect that worked well]

### Smooth Experience

- [What was easy to use]
- [What was intuitive]
- [What exceeded expectations]

---

## Testing Environment

### Project Tested

**Project Type:** [e.g., E-commerce, SaaS, Internal tool]
**Project Size:** [Number of repos, LOC, domains]
**Complexity:** [Simple/Medium/Complex]

**Repositories:**
- [List of repositories used for testing]

**Documentation Sources:**
- [List of documentation used]

### Testing Scenario

**Goal:** [What were you trying to achieve?]

**Workflow:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Outcome:** [What was the result?]

---

## Summary

### Issues by Severity

- 🔴 Critical: [count]
- 🟡 High: [count]
- 🟢 Medium: [count]
- ⚪ Low: [count]

**Total Issues:** [count]

### Issues by Category

- Bug: [count]
- Enhancement: [count]
- UX: [count]
- Documentation: [count]
- Performance: [count]

### Feature Requests

- Critical: [count]
- High: [count]
- Medium: [count]
- Low: [count]

**Total Feature Requests:** [count]

---

## Next Steps

**For Critical/High Issues:**
1. [Action item 1]
2. [Action item 2]

**For Feature Requests:**
1. [Action item 1]
2. [Action item 2]

**For Documentation:**
1. [Action item 1]
2. [Action item 2]

---

## Notes

[Any additional observations, thoughts, or context]

---

## Severity Guide

**🔴 Critical**
- Blocks core functionality
- Data loss or corruption
- Security vulnerability
- Cannot proceed with workflow

**🟡 High**
- Major functionality broken
- Poor user experience
- No reasonable workaround
- Affects most users

**🟢 Medium**
- Minor functionality issue
- Workaround available
- Affects some users
- UX improvement needed

**⚪ Low**
- Cosmetic issue
- Edge case
- Nice to have
- Minimal impact

---

## Category Guide

**Bug**
- Something is broken
- Error or unexpected behavior
- Functionality doesn't work as designed

**Enhancement**
- Improve existing feature
- Make something better
- Optimize performance

**UX**
- User experience issue
- Confusing workflow
- Unclear messaging
- Usability improvement

**Documentation**
- Missing documentation
- Incorrect documentation
- Unclear instructions
- Need more examples

**Performance**
- Slow execution
- High resource usage
- Optimization opportunity
