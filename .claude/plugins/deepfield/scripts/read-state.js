#!/usr/bin/env node
/**
 * read-state.js - Read and validate JSON state files with default value support
 * Usage: read-state.js <file_path> [default_json] [--validate]
 *
 * Example: read-state.js config.json '{}' --validate
 */

const fs = require('fs');

// Parse command line arguments
if (process.argv.length < 3) {
  console.error('Error: Missing required arguments');
  console.error('Usage: read-state.js <file_path> [default_json] [--validate]');
  process.exit(1);
}

const filePath = process.argv[2];
const defaultJson = process.argv[3] || '{}';
const shouldValidate = process.argv.includes('--validate');

try {
  let data;

  // If file doesn't exist, return default
  if (!fs.existsSync(filePath)) {
    data = JSON.parse(defaultJson);
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
  }

  // Read and parse file
  const content = fs.readFileSync(filePath, 'utf8');

  try {
    data = JSON.parse(content);
  } catch (parseError) {
    console.error(`Error: Malformed JSON in ${filePath}`, { error: parseError.message });
    process.exit(2);
  }

  // Validate schema if requested
  if (shouldValidate) {
    validateSchema(filePath, data);
  }

  // Output parsed data
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);

} catch (error) {
  console.error(`Error reading state file: ${error.message}`, { error: error.stack });
  process.exit(1);
}

/**
 * Validate JSON schema based on file type
 */
function validateSchema(filePath, data) {
  const fileName = filePath.split('/').pop();

  // Define required fields for each state file type
  const schemas = {
    'project.config.json': ['version', 'projectName', 'goal', 'createdAt', 'lastModified'],
    'run-': ['runNumber', 'startedAt', 'status', 'fileHashes'] // Matches run-N.config.json
  };

  // Find matching schema
  let requiredFields = null;
  for (const [pattern, fields] of Object.entries(schemas)) {
    if (fileName.includes(pattern)) {
      requiredFields = fields;
      break;
    }
  }

  // Validate if schema found
  if (requiredFields) {
    const missingFields = requiredFields.filter(field => !(field in data));
    if (missingFields.length > 0) {
      console.error(`Error: Missing required fields in ${fileName}: ${missingFields.join(', ')}`);
      process.exit(3);
    }
  }
}
