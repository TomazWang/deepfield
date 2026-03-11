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
 * Schema for a single migration history entry
 */
export const MigrationHistoryEntrySchema = z.object({
  from: z.string(),
  to: z.string(),
  date: z.string(),
  changes: z.string(),
});

export type MigrationHistoryEntry = z.infer<typeof MigrationHistoryEntrySchema>;

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
  // Version tracking fields (added in v1.0 upgrade system)
  deepfieldVersion: z.string().optional(),
  createdWith: z.string().optional(),
  lastUpgraded: z.string().optional(),
  migrationHistory: z.array(MigrationHistoryEntrySchema).default([]),
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
 * Schema for a single domain entry in domain-manifest.json
 *
 * Maps a product/tech domain slug to its tier paths and language variants.
 * Written by AI agents (deepfield-document-generator, deepfield-bootstrap),
 * read by plugin scripts (generate-domain-links.js, generate-drafts-index.js).
 *
 * CJS scripts: use inline validation (see plugin/scripts/update-domain-manifest.js).
 * This Zod schema is the canonical source of truth for the shape.
 *
 * Stored in: deepfield/wip/domain-manifest.json
 */
export const DomainEntrySchema = z.object({
  /** Domain slug, e.g. "auth-and-authorization" */
  slug: z.string().min(1),

  /**
   * Path to the product-spec folder for this domain.
   * Relative to the workspace root (deepfield/).
   * e.g. "drafts/en/product-spec/auth-and-authorization"
   */
  productSpec: z.string().optional(),

  /**
   * Path to the tech-spec folder for this domain.
   * Relative to the workspace root (deepfield/).
   * e.g. "drafts/en/tech-spec/auth-and-authorization"
   */
  techSpec: z.string().optional(),

  /**
   * Path(s) to feature-spec folder(s) related to this domain.
   * Relative to the workspace root (deepfield/).
   */
  featureSpecs: z.array(z.string()).default([]),

  /**
   * Languages for which documents have been generated.
   * ISO 639-1 + optional region: "en", "zh-tw", etc.
   */
  languages: z.array(z.string()).default(['en']),

  /** Free-form notes about this domain for AI context. */
  notes: z.string().optional(),
});

export type DomainEntry = z.infer<typeof DomainEntrySchema>;

/**
 * Schema for domain-manifest.json
 *
 * Top-level manifest tracking all known domains and their tier paths.
 * Written incrementally as agents generate documents.
 *
 * Stored in: deepfield/wip/domain-manifest.json
 */
export const DomainManifestSchema = z.object({
  /** Schema version for forward compatibility. */
  version: z.string().default('1.0'),

  /** ISO 8601 timestamp of last update. */
  lastModified: z.string().datetime().optional(),

  /** All known domains. */
  domains: z.array(DomainEntrySchema).default([]),
});

export type DomainManifest = z.infer<typeof DomainManifestSchema>;

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
