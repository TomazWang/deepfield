#!/usr/bin/env bash
# clone-repos.sh - Clone git repositories with branch/tag support
#
# Usage: clone-repos.sh <repo-url> <destination> [branch|tag]
#
# Examples:
#   clone-repos.sh https://github.com/org/repo ./deepfield/source/baseline/repos/repo
#   clone-repos.sh https://github.com/org/repo ./deepfield/source/baseline/repos/repo main
#   clone-repos.sh https://github.com/org/repo ./deepfield/source/baseline/repos/repo v1.0.0

set -euo pipefail

# Check arguments
if [ $# -lt 2 ]; then
  echo "Error: Missing required arguments" >&2
  echo "Usage: $0 <repo-url> <destination> [branch|tag]" >&2
  exit 1
fi

REPO_URL="$1"
DEST_DIR="$2"
REF="${3:-}"  # Optional branch/tag

# Validate repo URL format
if [[ ! "$REPO_URL" =~ ^(https?://|git@) ]]; then
  echo "Error: Invalid repository URL format: $REPO_URL" >&2
  echo "Expected: https://... or git@..." >&2
  exit 1
fi

# Check if destination already exists
if [ -d "$DEST_DIR" ]; then
  echo "Warning: Destination already exists: $DEST_DIR" >&2
  echo "Skipping clone (repository already present)" >&2
  exit 0
fi

# Create parent directory if needed
PARENT_DIR=$(dirname "$DEST_DIR")
if [ ! -d "$PARENT_DIR" ]; then
  mkdir -p "$PARENT_DIR" || {
    echo "Error: Failed to create parent directory: $PARENT_DIR" >&2
    exit 1
  }
fi

# Clone repository
echo "Cloning $REPO_URL to $DEST_DIR..."

if [ -n "$REF" ]; then
  # Clone with specific branch/tag
  if git clone --branch "$REF" --depth 1 "$REPO_URL" "$DEST_DIR" 2>/dev/null; then
    echo "✓ Successfully cloned at $REF"
  else
    # If --branch fails, try cloning and checking out
    echo "Attempting full clone and checkout..."
    if git clone "$REPO_URL" "$DEST_DIR" 2>/dev/null; then
      cd "$DEST_DIR"
      if git checkout "$REF" 2>/dev/null; then
        echo "✓ Successfully cloned and checked out $REF"
      else
        echo "Error: Failed to checkout $REF" >&2
        cd - > /dev/null
        rm -rf "$DEST_DIR"
        exit 1
      fi
      cd - > /dev/null
    else
      echo "Error: Failed to clone repository" >&2
      exit 1
    fi
  fi
else
  # Clone default branch
  if git clone --depth 1 "$REPO_URL" "$DEST_DIR" 2>/dev/null; then
    echo "✓ Successfully cloned (default branch)"
  else
    echo "Error: Failed to clone repository" >&2
    exit 1
  fi
fi

# Get current commit hash for tracking
cd "$DEST_DIR"
COMMIT_HASH=$(git rev-parse HEAD)
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
echo ""
echo "Repository cloned:"
echo "  Commit: $COMMIT_HASH"
echo "  Branch: $BRANCH_NAME"
cd - > /dev/null

exit 0
