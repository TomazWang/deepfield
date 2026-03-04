'use strict';

const fs = require('fs');
const path = require('path');
const semver = require('semver');

// Registry of all migration modules in order
const ALL_MIGRATIONS = [
  require('./1.0-to-2.0.js'),
  require('./2.0-to-2.1.js'),
  require('./2.1-to-2.2.js'),
  require('./2.2-to-2.3.js'),
  require('./2.3-to-2.5.js'),
];

/**
 * Return the ordered array of migration modules needed to go from
 * fromVersion to toVersion. Throws if a gap exists in the migration chain.
 *
 * @param {string} fromVersion - semver string of current project version
 * @param {string} toVersion   - semver string of target version
 * @returns {Array} ordered array of migration modules
 */
function getRequiredMigrations(fromVersion, toVersion) {
  // Normalise inputs
  const from = semver.coerce(fromVersion);
  const to = semver.coerce(toVersion);

  if (!from || !to) {
    throw new Error(`Invalid version strings: ${fromVersion} -> ${toVersion}`);
  }

  if (semver.gte(from.version, to.version)) {
    return [];
  }

  const chain = [];
  let current = from.version;

  while (semver.lt(current, to.version)) {
    const next = ALL_MIGRATIONS.find(m => {
      const mFrom = semver.coerce(m.from);
      return mFrom && semver.eq(mFrom.version, current);
    });

    if (!next) {
      throw new Error(
        `No migration found from v${current}. ` +
        `Cannot upgrade from v${fromVersion} to v${toVersion}.`
      );
    }

    chain.push(next);
    const mTo = semver.coerce(next.to);
    if (!mTo) {
      throw new Error(`Migration has invalid 'to' version: ${next.to}`);
    }
    current = mTo.version;
  }

  return chain;
}

/**
 * Run a sequence of migrations in order, rolling back all applied
 * migrations in the batch if any single one throws.
 *
 * @param {string} projectPath - Root of the user's project
 * @param {Array}  migrations  - Ordered array of migration modules
 * @param {object} options     - { dryRun?: boolean }
 * @returns {Array} results array — one entry per migration
 */
async function runMigrations(projectPath, migrations, options = {}) {
  const results = [];
  const applied = [];

  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    const label = `${migration.from} -> ${migration.to}`;

    try {
      if (options.dryRun) {
        results.push({ migration, success: true, dryRun: true, changes: [] });
        continue;
      }

      const result = await migration.migrate(projectPath, options);
      applied.push(migration);
      results.push({ migration, success: true, ...result });

      // Update config after each successful migration
      await updateConfigAfterMigration(projectPath, migration, result);

    } catch (err) {
      console.error(`  Migration failed at ${label}: ${err.message}`);

      // Rollback this migration first (it may have partially applied)
      try { await migration.rollback(projectPath); } catch { /* ignore rollback errors */ }

      // Rollback all previously applied migrations in reverse
      for (let j = applied.length - 1; j >= 0; j--) {
        const prev = applied[j];
        console.error(`  Rolling back ${prev.from} -> ${prev.to}...`);
        try {
          await prev.rollback(projectPath);
        } catch (rollbackErr) {
          console.error(`  Rollback failed for ${prev.from} -> ${prev.to}: ${rollbackErr.message}`);
        }
      }

      throw new Error(`Upgrade failed at migration ${label}: ${err.message}`);
    }
  }

  return results;
}

/**
 * After a successful migration, append an entry to migrationHistory and
 * update deepfieldVersion + lastUpgraded in project.config.json.
 *
 * @param {string} projectPath - Root of the user's project
 * @param {object} migration   - Migration module ({ from, to, description })
 * @param {object} result      - Result from migration.migrate()
 */
async function updateConfigAfterMigration(projectPath, migration, result) {
  const configPath = path.join(projectPath, 'deepfield', 'project.config.json');

  if (!fs.existsSync(configPath)) return;

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return; // Can't update config — non-fatal
  }

  const now = new Date().toISOString();
  config.deepfieldVersion = migration.to;
  config.lastUpgraded = now;

  if (!Array.isArray(config.migrationHistory)) {
    config.migrationHistory = [];
  }

  config.migrationHistory.push({
    from: migration.from,
    to: migration.to,
    date: now,
    changes: (result.changes || []).join('; ') || migration.description,
  });

  // Atomic write: write to temp then rename
  const tmpPath = configPath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2));
  fs.renameSync(tmpPath, configPath);
}

module.exports = {
  ALL_MIGRATIONS,
  getRequiredMigrations,
  runMigrations,
  updateConfigAfterMigration,
};
