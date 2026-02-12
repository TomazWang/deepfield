import { z } from 'zod';

/**
 * Schema for repository configuration
 */
export const RepositorySchema = z.object({
  name: z.string(),
  path: z.string(),
  isGit: z.boolean(),
});

export type Repository = z.infer<typeof RepositorySchema>;

/**
 * Schema for project configuration
 * Stored in: deepfield/project.config.json
 */
export const ProjectConfigSchema = z.object({
  version: z.string(),
  projectName: z.string(),
  goal: z.string(),
  projectType: z.string().optional(),
  focusAreas: z.array(z.string()).default([]),
  repositories: z.array(RepositorySchema).default([]),
  createdAt: z.string().datetime(),
  lastModified: z.string().datetime(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

/**
 * Schema for run configuration
 * Stored in: deepfield/wip/run-N/run-N.config.json
 */
export const RunConfigSchema = z.object({
  runNumber: z.number().int().nonnegative(),
  status: z.enum(['initialized', 'scanning', 'analyzing', 'learning', 'completed', 'paused', 'failed']),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  sourceSnapshot: z.record(z.string()).default({}),
  changesDetected: z.boolean().default(false),
  learningGenerated: z.boolean().default(false),
});

export type RunConfig = z.infer<typeof RunConfigSchema>;

/**
 * Schema for non-interactive start command answers
 * Used with --answers-json flag
 */
export const StartAnswersSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  projectType: z.enum([
    'legacy-brownfield',
    'team-onboarding',
    'documentation',
    'modernization',
    'integration',
    'other'
  ]).default('other'),
  goal: z.string().min(1, 'Goal is required'),
  focusAreas: z.array(z.enum([
    'architecture',
    'data-models',
    'business-logic',
    'apis',
    'security',
    'performance',
    'testing',
    'deployment'
  ])).default([]),
  maxRuns: z.number().int().min(1).max(999).default(5).optional(),
});

export type StartAnswers = z.infer<typeof StartAnswersSchema>;

/**
 * Workflow states for status command
 */
export enum WorkflowState {
  EMPTY = 'EMPTY',                     // No deepfield/ directory
  INITIALIZED = 'INITIALIZED',         // deepfield/ exists but no config
  CONFIGURED = 'CONFIGURED',           // project.config.json exists
  READY = 'READY',                     // Brief filled out, ready for runs
  IN_PROGRESS = 'IN_PROGRESS',         // Active run in progress
  COMPLETED = 'COMPLETED',             // Runs completed
}
