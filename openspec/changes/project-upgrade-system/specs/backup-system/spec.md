## ADDED Requirements

### Requirement: Backup creates timestamped snapshot
The backup system SHALL copy the entire `deepfield/` directory to `.deepfield-backups/backup-<ISO-timestamp>/` where the timestamp uses the format `YYYY-MM-DDTHH-MM-SS` (colons replaced with hyphens for filesystem compatibility).

#### Scenario: Backup directory created
- **WHEN** a backup is created
- **THEN** `.deepfield-backups/backup-<timestamp>/` is created containing a full recursive copy of `deepfield/` at that point in time

#### Scenario: Backup metadata file written
- **WHEN** a backup is created
- **THEN** `.backup-meta.json` is written inside the backup directory with `timestamp`, `version` (the `deepfieldVersion` from config at backup time), and `size` (approximate bytes of backed-up content)

### Requirement: Backup directory excluded from project operations
`.deepfield-backups/` SHALL be a sibling of `deepfield/` (not inside it) so backup content is never scanned or processed by deepfield learning operations.

#### Scenario: Backups not inside deepfield
- **WHEN** a backup is created
- **THEN** the backup path is `<projectRoot>/.deepfield-backups/`, not inside `<projectRoot>/deepfield/`

### Requirement: Backup listing shows size and version
The CLI SHALL be able to enumerate all backups in `.deepfield-backups/`, reading `.backup-meta.json` from each, and return a sorted list (newest first) with `id`, `timestamp`, `version`, and `size`.

#### Scenario: Listing returns newest first
- **WHEN** multiple backups exist
- **THEN** `listBackups()` returns them sorted by timestamp descending
