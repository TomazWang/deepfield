#!/usr/bin/env node
/**
 * update-json.js - Atomically update JSON files with write-to-temp-then-rename pattern
 * Usage: update-json.js <file_path> <json_updates>
 *
 * Example: update-json.js config.json '{"key": "value"}'
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
if (process.argv.length < 4) {
  console.error('Error: Missing required arguments');
  console.error('Usage: update-json.js <file_path> <json_updates>');
  process.exit(1);
}

const filePath = process.argv[2];
const updatesJson = process.argv[3];

try {
  // Parse updates
  const updates = JSON.parse(updatesJson);

  // Read existing file or start with empty object
  let data = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(content);
  }

  // Merge updates into existing data
  Object.assign(data, updates);

  // Add automatic lastModified timestamp if not already in updates
  if (!updates.lastModified) {
    data.lastModified = new Date().toISOString();
  }

  // Preserve version field if it exists
  if (data.version === undefined) {
    data.version = '1.0.0';
  }

  // Atomic write: write to temp file first
  const tempFile = `${filePath}.tmp`;
  const jsonString = JSON.stringify(data, null, 2);
  fs.writeFileSync(tempFile, jsonString, 'utf8');

  // Atomic rename (on POSIX systems)
  fs.renameSync(tempFile, filePath);

  console.log(`Successfully updated ${filePath}`);
  process.exit(0);

} catch (error) {
  console.error(`Error updating JSON file: ${error.message}`, { error: error.stack });
  process.exit(1);
}
