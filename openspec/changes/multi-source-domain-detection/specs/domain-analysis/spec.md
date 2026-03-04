## ADDED Requirements

### Requirement: Folder structure analysis
`analyze-domains.js` SHALL scan the top-level directories of a given repository path and match them against known domain patterns (frontend, backend, database, shared, auth, admin, mobile) using case-insensitive regular expressions, returning a list of detected domains with `source: 'folder-pattern'` and `confidence: 'high'`.

#### Scenario: Common frontend folder detected
- **WHEN** the repository contains a top-level directory named `client`
- **THEN** the analyzer returns a domain entry with `suggestedDomain: 'frontend'` and `source: 'folder-pattern'`

#### Scenario: Unknown folder ignored
- **WHEN** the repository contains a top-level directory that matches no known pattern (e.g., `migrations`)
- **THEN** no domain entry is produced for that directory from folder-pattern analysis

### Requirement: Monorepo manifest analysis
`analyze-domains.js` SHALL parse `lerna.json`, `nx.json` (with `workspace.json`), `settings.gradle`, and root `pom.xml` to enumerate declared sub-packages or modules, returning each as a domain entry with the appropriate `source` tag and `confidence: 'high'`.

#### Scenario: Lerna packages enumerated
- **WHEN** the repository root contains `lerna.json` with a `packages` array
- **THEN** each directory matched by the package globs is returned as a domain with `source: 'lerna-package'`

#### Scenario: Gradle sub-projects enumerated
- **WHEN** the repository root contains `settings.gradle` with `include` directives
- **THEN** each included project name is returned as a domain with `source: 'gradle-module'`

#### Scenario: Maven modules enumerated
- **WHEN** the repository root contains `pom.xml` with a `<modules>` section
- **THEN** each `<module>` element value is returned as a domain with `source: 'maven-module'`

### Requirement: Framework dependency analysis
`analyze-domains.js` SHALL read `package.json` (JS/TS), `requirements.txt` (Python), and `pom.xml` (Java) and infer domain hints from the presence of known framework dependencies (React/Vue/Angular → frontend; Express/Fastify/NestJS → backend; react-native → mobile; Django/Flask → backend; spring-boot → backend).

#### Scenario: React dependency implies frontend domain
- **WHEN** `package.json` lists `react` in `dependencies` or `devDependencies`
- **THEN** the analyzer returns a domain entry with `domain: 'frontend'`, `source: 'framework-dependency'`, `confidence: 'high'`

#### Scenario: No framework dependencies present
- **WHEN** `package.json` exists but contains no recognized framework dependencies
- **THEN** no framework-dependency domain entries are produced

### Requirement: README heading extraction
`analyze-domains.js` SHALL recursively find all `README.md` files (case-insensitive) within the repository, extract the first H1 heading and first non-heading paragraph, and return each as a domain hint with `source: 'readme'` and the directory path as the domain's location.

#### Scenario: Sub-module README found
- **WHEN** a `README.md` exists at `services/payments/README.md` with `# Payments Service`
- **THEN** the analyzer returns a domain with `name: 'Payments Service'`, `path: 'services/payments'`, `source: 'readme'`

#### Scenario: README without H1 ignored
- **WHEN** a `README.md` exists but contains no H1 heading
- **THEN** no domain entry is produced for that README

### Requirement: Architectural pattern detection
`analyze-domains.js` SHALL detect whether the repository follows a microservices pattern (multiple service-like directories), a monolith pattern (single service with layered folders), or a Clean Architecture pattern (presence of `entities/`, `usecases/`, or `domain/` directories), and return a `patterns` array describing detected patterns with evidence and domain-naming suggestions.

#### Scenario: Microservices detected
- **WHEN** the repository contains 3 or more directories matching service-like patterns (e.g., `*-service`, `services/*`)
- **THEN** the patterns array contains `{ pattern: 'microservices', suggestion: 'per-service domains' }`

#### Scenario: Clean architecture detected
- **WHEN** the repository contains directories named `entities`, `usecases`, or `domain`
- **THEN** the patterns array contains `{ pattern: 'clean-architecture', suggestion: 'bounded-context domains' }`

### Requirement: Signal aggregation and scoring
`analyze-domains.js` SHALL aggregate all signals into a unified domain map, sum confidence weights per domain key (folder-pattern: 0.7, lerna-package: 0.9, nx-project: 0.9, gradle-module: 0.85, maven-module: 0.85, framework-dependency: 0.8, readme: 0.6), and return a sorted array where each entry includes `name`, `score`, `sources[]`, and `confidence` tier (high ≥ 1.5, medium ≥ 0.7, low < 0.7).

#### Scenario: Multiple signals corroborate a domain
- **WHEN** a `frontend` domain is detected from both folder-pattern (0.7) and framework-dependency (0.8)
- **THEN** the returned entry has `score: 1.5` and `confidence: 'high'`

#### Scenario: Single weak signal yields low confidence
- **WHEN** only a README hint is found for a domain with no other signals
- **THEN** the returned entry has `confidence: 'low'`
