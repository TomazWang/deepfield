# Task 006: Chrome-Assisted Web Access (FUTURE)

**Feature:** Optional Chrome integration for accessing private docs
**Priority:** 🟢 Low (Future)
**Status:** DEFERRED
**Estimated Time:** TBD (depends on Claude-for-Chrome availability)
**OpenSpec Change:** `feat/chrome-integration` (future)

---

## Objective

Integrate with Claude-for-Chrome to access private/authenticated web documentation (Google Docs, Confluence, internal wikis, etc.).

---

## Problem

**Current:** Can only access public URLs
**Issue:** Much project knowledge lives in private docs (Google Drive, Confluence, Notion, etc.)
**Desired:** Use browser session to access authenticated content

---

## Current Status

**DEFERRED** - Waiting for:
- Claude-for-Chrome stable release
- API/integration documentation
- Use case validation

---

## Proposed Approach

### Integration Points

1. **Detect Claude-for-Chrome availability**
   ```javascript
   function isChromeAvailable() {
     // Check if Claude-for-Chrome extension is installed
     // Check if integration API is available
     return false; // Not available yet
   }
   ```

2. **Offer Chrome-assisted fetch**
   ```
   Found private documentation URL: https://docs.google.com/...

   This appears to be a private document.

   Options:
   - [ ] Use Claude-for-Chrome to access (requires browser extension)
   - [ ] Skip this document
   - [ ] Provide alternative URL/export
   ```

3. **Fetch via Chrome**
   ```javascript
   async function fetchViaChrome(url) {
     // Use Claude-for-Chrome API
     // Open URL in browser tab
     // Extract content
     // Return as markdown
   }
   ```

4. **Store locally**
   ```
   deepfield/source/baseline/web-docs/
     ├── google-docs-<id>.md
     ├── confluence-<page>.md
     └── notion-<page>.md
   ```

---

## Use Cases

### 1. Google Docs/Drive

**Scenario:** Team documentation in Google Drive
**Current:** Cannot access (requires auth)
**With Chrome:** Use browser session to read docs

### 2. Confluence

**Scenario:** Internal wiki on Confluence
**Current:** Cannot access (requires login)
**With Chrome:** Use existing session to fetch pages

### 3. Notion

**Scenario:** Project docs in Notion
**Current:** Cannot access (private workspace)
**With Chrome:** Use logged-in session

### 4. Internal Wikis

**Scenario:** Company intranet documentation
**Current:** Cannot access (internal network)
**With Chrome:** Use browser with VPN/auth

---

## Implementation Sketch

### 1. Brief Integration

**In brief.md template:**

```markdown
## Private Documentation

Do you have private documentation? (Google Docs, Confluence, etc.)

- [ ] Yes, I want to use Claude-for-Chrome to access them
- [ ] No, all documentation is public

If yes, list URLs:
- https://docs.google.com/document/d/...
- https://confluence.company.com/wiki/...
```

### 2. Detection & Prompt

**In bootstrap:**

```javascript
function detectPrivateUrls(brief) {
  const urls = extractUrls(brief);

  const privateUrls = urls.filter(url =>
    url.includes('docs.google.com') ||
    url.includes('drive.google.com') ||
    url.includes('confluence') ||
    url.includes('notion.so') ||
    isInternalDomain(url)
  );

  return privateUrls;
}

async function handlePrivateUrls(urls) {
  if (urls.length === 0) return;

  console.log(`\\n🔒 Found ${urls.length} private documentation URLs\\n`);

  if (!isChromeAvailable()) {
    console.log('⚠️  Claude-for-Chrome not available');
    console.log('These documents will be skipped');
    console.log('\\nTo access them:');
    console.log('1. Install Claude-for-Chrome extension');
    console.log('2. Re-run bootstrap\\n');
    return;
  }

  const { useCh rome } = await inquirer.prompt([{
    type: 'confirm',
    name: 'useChrome',
    message: 'Use Claude-for-Chrome to access private docs?',
    default: true
  }]);

  if (useChrome) {
    for (const url of urls) {
      await fetchViaChrome(url);
    }
  }
}
```

### 3. Chrome Fetch

**Placeholder implementation:**

```javascript
async function fetchViaChrome(url) {
  // TODO: Implement when Claude-for-Chrome API is available

  console.log(`📄 Fetching: ${url}`);

  // 1. Open URL in Chrome tab via extension API
  // 2. Wait for page to load
  // 3. Extract content (using extension API)
  // 4. Convert to markdown
  // 5. Save locally
  // 6. Return success/failure

  throw new Error('Claude-for-Chrome integration not yet available');
}
```

---

## Security Considerations

- **User consent:** Always ask before accessing private docs
- **Session isolation:** Don't store browser cookies/tokens
- **Data privacy:** Respect document permissions
- **Audit trail:** Log what was accessed and when
- **Opt-in only:** Never auto-access without explicit permission

---

## Alternative Approaches

### Export-Based

Instead of Chrome integration:

1. **User exports docs manually**
   ```
   Please export these documents as PDF/Markdown:
   - Google Doc → File → Download → Markdown
   - Confluence → ... → Export → PDF
   ```

2. **User provides exports**
   ```
   Place exported files in:
   deepfield/source/baseline/exported-docs/
   ```

3. **Bootstrap reads exports**
   ```
   Found exported documents:
   - project-overview.md
   - architecture-guide.pdf
   ```

This works TODAY without Chrome integration.

---

## Dependencies

- **Blocks:** None (optional feature)
- **Depends on:** Claude-for-Chrome availability

---

## Decision Point

**Before implementing:**

1. **Validate need**
   - How many users need private doc access?
   - Is manual export acceptable?
   - Is this a blocker for adoption?

2. **Evaluate alternatives**
   - Manual export (works today)
   - Share links (Google Docs can be made accessible)
   - Copy-paste into brief (simple workaround)

3. **Wait for Chrome integration**
   - Is API available?
   - Is it stable?
   - Is it documented?

**Recommendation:** DEFER until clear user need and Chrome API is ready

---

## Future Work

When Claude-for-Chrome is available:

1. Prototype integration
2. Test with common platforms (Google, Confluence, Notion)
3. Gather user feedback
4. Refine UX
5. Implement full feature

---

## References

- Claude-for-Chrome: TBD (not released yet)
- Manual export workarounds: Document in README
