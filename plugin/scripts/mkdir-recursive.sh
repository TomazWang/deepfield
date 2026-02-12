#!/usr/bin/env bash
# mkdir-recursive.sh - Create nested directories recursively and idempotently
# Usage: mkdir-recursive.sh <directory_path>

set -e

if [ $# -eq 0 ]; then
  echo "Error: No directory path provided" >&2
  echo "Usage: mkdir-recursive.sh <directory_path>" >&2
  exit 1
fi

TARGET_DIR="$1"

# Check if parent directory is writable (or if we can create it)
PARENT_DIR=$(dirname "$TARGET_DIR")

# If parent doesn't exist, check recursively up the tree
while [ ! -e "$PARENT_DIR" ] && [ "$PARENT_DIR" != "/" ] && [ "$PARENT_DIR" != "." ]; do
  PARENT_DIR=$(dirname "$PARENT_DIR")
done

# Check write permission
if [ ! -w "$PARENT_DIR" ]; then
  echo "Error: No write permission for '$PARENT_DIR'" >&2
  echo "Suggested fix: Check directory permissions with 'ls -ld $PARENT_DIR'" >&2
  exit 2
fi

# Create directory (idempotent - succeeds if already exists)
mkdir -p "$TARGET_DIR"

exit 0
