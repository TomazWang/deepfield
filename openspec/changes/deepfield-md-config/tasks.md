## 1. Template

- [x] 1.1 Create `plugin/templates/DEEPFIELD.md` with all sections: Language & Format, Learning Priorities (High/Medium/Low/Exclude), Domain-Specific Instructions, Output Preferences, Trust Hierarchy
- [x] 1.2 Add instructional placeholder text and inline comments to each section in the template

## 2. Parser Script

- [x] 2.1 Create `plugin/scripts/parse-deepfield-config.js` as a CJS module
- [x] 2.2 Implement `extractLanguage(content)` to parse Documentation Language from Language & Format section
- [x] 2.3 Implement `extractCodeLanguage(content)` to parse Code Examples language preference
- [x] 2.4 Implement `extractDiagramFormat(content)` to parse Diagrams preference
- [x] 2.5 Implement `extractDetailLevel(content)` to parse Detail Level preference
- [x] 2.6 Implement `extractPriorities(content)` to parse High/Medium/Low/Exclude domain lists into `{ high, medium, low, exclude }` arrays
- [x] 2.7 Implement `extractDomainInstructions(content)` to parse Domain-Specific Instructions section into object keyed by domain name with raw markdown values
- [x] 2.8 Implement `extractOutputPrefs(content)` to extract the raw Output Preferences section text
- [x] 2.9 Implement `extractTrustHierarchy(content)` to parse ordered Trust Hierarchy list into a string array
- [x] 2.10 Implement `parseDeepfieldConfig(filePath)` main function returning structured object with `exists`, all parsed fields, and `raw` content; returns defaults when file is absent
- [x] 2.11 Add CLI entrypoint: when run directly, accept optional path arg and print JSON to stdout, exit 0 always
- [x] 2.12 Export `{ parseDeepfieldConfig }` as module.exports

## 3. Update df-init Command

- [x] 3.1 Update `plugin/commands/df-init.md` to add a step after successful init: check if `deepfield/DEEPFIELD.md` exists
- [x] 3.2 If file does not exist, prompt user whether they want to create DEEPFIELD.md, copy template if yes
- [x] 3.3 If file already exists, skip creation and note it exists

## 4. Update Learning Skills

- [x] 4.1 Update `plugin/skills/deepfield-bootstrap.md` to read DEEPFIELD.md config at run start using parse-deepfield-config.js
- [x] 4.2 Update `plugin/skills/deepfield-bootstrap.md` to skip files matching `priorities.exclude` patterns during scanning
- [x] 4.3 Update `plugin/skills/deepfield-bootstrap.md` to inject `domainInstructions` and `language` into domain agent prompts
- [x] 4.4 Update `plugin/skills/deepfield-iterate.md` to read DEEPFIELD.md config at run start
- [x] 4.5 Update `plugin/skills/deepfield-iterate.md` to respect exclusion patterns in scanning step
- [x] 4.6 Update `plugin/skills/deepfield-iterate.md` to use priority levels when selecting focus topics (high before medium before low; within high, sort by lowest confidence)
- [x] 4.7 Update `plugin/skills/deepfield-iterate.md` to inject domain instructions and language into domain agent prompts
