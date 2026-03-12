export interface BuildOptions {
  /** Path to the deepfield snapshot directory (e.g. deepfield/output/run-3/) */
  snapshotPath: string;
  /** Where to write the Docusaurus site. Defaults to {snapshotPath}/docusaurus/ */
  outputPath?: string;
  /** Project name — used in site title and config. Read from project.config.json if omitted. */
  projectName?: string;
  /** Giscus repo (e.g. "owner/repo") for section feedback. Omit to disable feedback. */
  giscusRepo?: string;
  /** Giscus repo ID (from giscus.app) */
  giscusRepoId?: string;
  /** Giscus discussion category ID */
  giscusCategoryId?: string;
}

export interface ServeOptions {
  /** Path to the Docusaurus site (must contain package.json). */
  sitePath: string;
  port?: number;
}

export interface TransformResult {
  docsCount: number;
  sidebarCategories: string[];
  structureType: '3-tier' | 'domains' | 'flat';
}

export interface ProjectConfig {
  projectName?: string;
  deepfieldVersion?: string;
  [key: string]: unknown;
}
