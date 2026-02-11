/**
 * Custom error classes for Deepfield CLI
 */

/**
 * Base error class for Deepfield errors
 */
export class DeepfieldError extends Error {
  constructor(message: string, public readonly exitCode: number = 1) {
    super(message);
    this.name = 'DeepfieldError';
  }
}

/**
 * Permission-related errors (exit code 4)
 */
export class PermissionError extends DeepfieldError {
  constructor(message: string, public readonly path: string) {
    super(message, 4);
    this.name = 'PermissionError';
  }
}

/**
 * State file errors (exit code 3)
 */
export class StateError extends DeepfieldError {
  constructor(
    message: string,
    public readonly code: 'MISSING' | 'CORRUPTED' | 'INVALID' = 'INVALID'
  ) {
    super(message, 3);
    this.name = 'StateError';
  }
}

/**
 * Invalid arguments errors (exit code 2)
 */
export class ArgumentError extends DeepfieldError {
  constructor(message: string) {
    super(message, 2);
    this.name = 'ArgumentError';
  }
}

/**
 * File operation errors (exit code 1)
 */
export class FileOperationError extends DeepfieldError {
  constructor(message: string, public readonly operation: string) {
    super(message, 1);
    this.name = 'FileOperationError';
  }
}

/**
 * Get user-friendly error message
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof DeepfieldError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/**
 * Get suggested fix for common errors
 */
export function getSuggestedFix(error: unknown): string | null {
  if (error instanceof PermissionError) {
    return 'Try running with sudo or check directory permissions';
  }

  if (error instanceof StateError) {
    if (error.code === 'MISSING') {
      return 'Run "deepfield init" first to create the directory structure';
    }
    if (error.code === 'CORRUPTED') {
      return 'Check the file for syntax errors or restore from backup';
    }
    if (error.code === 'INVALID') {
      return 'Verify the configuration matches the expected schema';
    }
  }

  if (error instanceof ArgumentError) {
    return 'Check "deepfield --help" for correct usage';
  }

  return null;
}
