import { readFile, writeFile, pathExists } from 'fs-extra';
import { join } from 'path';
import { z } from 'zod';
import { ProjectConfigSchema, RunConfigSchema, ProjectConfig, RunConfig } from './schemas.js';
import { atomicWrite } from './file-ops.js';

/**
 * Custom error for state-related issues
 */
export class StateError extends Error {
  constructor(message: string, public readonly code: 'MISSING' | 'CORRUPTED' | 'INVALID' = 'INVALID') {
    super(message);
    this.name = 'StateError';
  }
}

/**
 * Read and validate project configuration
 * @param deepfieldDir Path to deepfield/ directory
 * @returns Validated ProjectConfig
 * @throws StateError if file is missing or invalid
 */
export async function readProjectConfig(deepfieldDir: string): Promise<ProjectConfig> {
  const configPath = join(deepfieldDir, 'project.config.json');

  try {
    // Check if file exists
    if (!(await pathExists(configPath))) {
      throw new StateError(
        `Project configuration not found: ${configPath}`,
        'MISSING'
      );
    }

    // Read and parse file
    const content = await readFile(configPath, 'utf-8');
    const data = JSON.parse(content);

    // Validate with Zod
    const result = ProjectConfigSchema.safeParse(data);
    if (!result.success) {
      throw new StateError(
        `Invalid project configuration: ${result.error.message}`,
        'INVALID'
      );
    }

    return result.data;
  } catch (error) {
    if (error instanceof StateError) {
      throw error;
    }
    if (error instanceof SyntaxError) {
      throw new StateError(
        `Corrupted project configuration: ${error.message}`,
        'CORRUPTED'
      );
    }
    throw new StateError(
      `Failed to read project configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Write project configuration with atomic write
 * @param deepfieldDir Path to deepfield/ directory
 * @param config ProjectConfig to write
 * @throws StateError if write fails
 */
export async function writeProjectConfig(
  deepfieldDir: string,
  config: Partial<ProjectConfig>
): Promise<void> {
  const configPath = join(deepfieldDir, 'project.config.json');

  try {
    // Validate config
    const validatedConfig = ProjectConfigSchema.parse(config);

    // Update lastModified timestamp
    validatedConfig.lastModified = new Date().toISOString();

    // Write atomically
    await atomicWrite(configPath, JSON.stringify(validatedConfig, null, 2));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new StateError(
        `Invalid project configuration: ${error.message}`,
        'INVALID'
      );
    }
    throw new StateError(
      `Failed to write project configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Read and validate run configuration
 * @param runDir Path to run directory (e.g., deepfield/wip/run-1/)
 * @returns Validated RunConfig
 * @throws StateError if file is missing or invalid
 */
export async function readRunConfig(runDir: string): Promise<RunConfig> {
  const configPath = join(runDir, `run-${runDir.split('-').pop()}.config.json`);

  try {
    // Check if file exists
    if (!(await pathExists(configPath))) {
      throw new StateError(
        `Run configuration not found: ${configPath}`,
        'MISSING'
      );
    }

    // Read and parse file
    const content = await readFile(configPath, 'utf-8');
    const data = JSON.parse(content);

    // Validate with Zod
    const result = RunConfigSchema.safeParse(data);
    if (!result.success) {
      throw new StateError(
        `Invalid run configuration: ${result.error.message}`,
        'INVALID'
      );
    }

    return result.data;
  } catch (error) {
    if (error instanceof StateError) {
      throw error;
    }
    if (error instanceof SyntaxError) {
      throw new StateError(
        `Corrupted run configuration: ${error.message}`,
        'CORRUPTED'
      );
    }
    throw new StateError(
      `Failed to read run configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Write run configuration with atomic write
 * @param runDir Path to run directory
 * @param config RunConfig to write
 * @throws StateError if write fails
 */
export async function writeRunConfig(
  runDir: string,
  config: Partial<RunConfig>
): Promise<void> {
  const runNumber = config.runNumber ?? parseInt(runDir.split('-').pop() || '0');
  const configPath = join(runDir, `run-${runNumber}.config.json`);

  try {
    // Validate config
    const validatedConfig = RunConfigSchema.parse(config);

    // Write atomically
    await atomicWrite(configPath, JSON.stringify(validatedConfig, null, 2));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new StateError(
        `Invalid run configuration: ${error.message}`,
        'INVALID'
      );
    }
    throw new StateError(
      `Failed to write run configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
