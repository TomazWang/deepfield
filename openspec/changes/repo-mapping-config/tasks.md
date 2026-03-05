## 1. Git Ignore and Templates

- [ ] 1.1a Create `cli/templates/.gitignore` template file with `deepfield/source/baseline/repos/` as an entry
- [ ] 1.1b Wire the `.gitignore` template into `scaffold.ts` template mappings so `deepfield init` copies it to the workspace root on initialization
- [ ] 1.2 Confirm `deepfield/source/baseline/repos/` is not tracked by the project's own git after running `deepfield init` (acceptance: `git status` in a freshly-initialized workspace shows no files under that path)

## 2. repos.config.json Schema and Helpers

- [ ] 2.1 Define `RepoEntry` TypeScript interface in `cli/src/types/` (or co-located) with fields: `name`, `url`, `branch`, `commit?`, `path`, `cloneMethod`, `depth?`
- [ ] 2.2 Implement `readReposConfig(deepfieldDir: string): Promise<RepoEntry[]>` helper that reads and parses `source/baseline/repos.config.json`, returning `[]` if missing
- [ ] 2.3 Implement `writeReposConfig(deepfieldDir: string, entries: RepoEntry[]): Promise<void>` helper that writes atomically (`.tmp` then `renameSync`)

## 3. Backup Exclusion

- [ ] 3.1 Update `createBackup()` in `cli/src/utils/backup.ts` to pass a `filter` function to `fs-extra`'s `copy()` that excludes paths under `deepfield/source/baseline/repos/`
- [ ] 3.2 Ensure the filter does NOT exclude `repos.config.json` (only the repos directory contents)
- [ ] 3.3 Manually verify (or add a test) that a backup with repos present does not contain repo files but does contain `repos.config.json`

## 4. Auto-Detection Logic

- [ ] 4.1 Implement `detectRepos(reposDir: string): Promise<RepoEntry[]>` in a shared utility that walks `repos/` subdirectories, runs `git remote get-url origin`, `git rev-parse HEAD`, and `git rev-parse --abbrev-ref HEAD` for each
- [ ] 4.2 Handle the case where a subdirectory is not a git repo: print a warning and skip
- [ ] 4.3 Handle the case where a git repo has no `origin` remote: print a warning and skip
- [ ] 4.4 Infer `cloneMethod` from the URL (starts with `git@` → `ssh`, else → `https`)

## 5. clone-repos Command Implementation

- [ ] 5.1 Create `cli/src/commands/clone-repos.ts` using the `createXCommand()` factory pattern
- [ ] 5.2 Implement `--detect` flag: call `detectRepos()`, prompt for confirmation if config exists, write config atomically
- [ ] 5.3 Implement default (no flags) behavior: read `repos.config.json`, error if missing, clone each entry
- [ ] 5.4 Implement `--force` flag: remove existing repo directories before cloning
- [ ] 5.5 Implement shallow clone logic: if `entry.depth > 0`, add `--depth <n>` to git clone args
- [ ] 5.6 Collect per-repo results (cloned / skipped / failed) and print summary with counts
- [ ] 5.7 Exit with non-zero code if any repo failed
- [ ] 5.8 Continue processing remaining repos if one fails (do not abort early)

## 6. Command Registration

- [ ] 6.1 Import and register `clone-repos` command in the CLI entry point (`cli/src/index.ts` or equivalent)
- [ ] 6.2 Verify `deepfield --help` lists `clone-repos` with a description

## 7. Verification

- [ ] 7.1 Run `deepfield clone-repos --detect` in a test workspace with existing repos and confirm config is generated correctly
- [ ] 7.2 Run `deepfield clone-repos` after deleting repos and confirm they are restored
- [ ] 7.3 Run `deepfield backup` (or equivalent) and confirm backup size does not include repo contents
- [ ] 7.4 Confirm `repos.config.json` is present in the backup
- [ ] 7.5 Confirm TypeScript compiles without errors (`tsc --noEmit`)
