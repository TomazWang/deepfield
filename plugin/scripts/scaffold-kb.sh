#!/usr/bin/env bash
# scaffold-kb.sh - Create complete deepfield/ directory structure with four-space architecture
# Usage: scaffold-kb.sh [target_dir]
# Default target_dir: ./deepfield

set -e

# Use first argument as target, default to ./deepfield
TARGET_DIR="${1:-./deepfield}"

# Get script directory for accessing template files
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATES_DIR="$PLUGIN_ROOT/templates"

echo "Initializing knowledge base at: $TARGET_DIR"

# Check if target already exists
if [ -d "$TARGET_DIR" ]; then
  echo "Warning: Directory $TARGET_DIR already exists" >&2
  echo "Existing files will be preserved (idempotent operation)" >&2
fi

# Verify write permissions for parent directory
PARENT_DIR=$(dirname "$TARGET_DIR")
if [ ! -w "$PARENT_DIR" ]; then
  echo "Error: No write permission for '$PARENT_DIR'" >&2
  echo "Suggested fix: Check directory permissions with 'ls -ld $PARENT_DIR'" >&2
  exit 2
fi

# Create four-space directory structure
echo "Creating directory structure..."

# Main deepfield/ directory
mkdir -p "$TARGET_DIR"

# source/ - Raw inputs
mkdir -p "$TARGET_DIR/source/baseline/repos"
mkdir -p "$TARGET_DIR/source/baseline/trusted-docs"
mkdir -p "$TARGET_DIR/source/run-0"

# wip/ - AI's private workspace
mkdir -p "$TARGET_DIR/wip/run-0/domains"

# drafts/ - Living documents
mkdir -p "$TARGET_DIR/drafts/domains"
mkdir -p "$TARGET_DIR/drafts/cross-cutting"

# output/ - Frozen snapshots
mkdir -p "$TARGET_DIR/output"

echo "✓ Directory structure created"

# Copy template files (only if they don't exist - idempotent)
echo "Copying template files..."

# Copy templates if they don't exist
copy_if_not_exists() {
  local src="$1"
  local dest="$2"

  if [ ! -f "$dest" ]; then
    cp "$src" "$dest"
    echo "  ✓ Created $(basename "$dest")"
  else
    echo "  - Skipped $(basename "$dest") (already exists)"
  fi
}

# Root level templates
copy_if_not_exists "$TEMPLATES_DIR/project.config.json" "$TARGET_DIR/project.config.json"

# wip/ templates
copy_if_not_exists "$TEMPLATES_DIR/project-map.md" "$TARGET_DIR/wip/project-map.md"
copy_if_not_exists "$TEMPLATES_DIR/domain-index.md" "$TARGET_DIR/wip/domain-index.md"
copy_if_not_exists "$TEMPLATES_DIR/learning-plan.md" "$TARGET_DIR/wip/learning-plan.md"

# drafts/ templates
copy_if_not_exists "$TEMPLATES_DIR/_changelog.md" "$TARGET_DIR/drafts/_changelog.md"
copy_if_not_exists "$TEMPLATES_DIR/unknowns.md" "$TARGET_DIR/drafts/cross-cutting/unknowns.md"

echo "✓ Template files copied"
echo ""
echo "Initialization complete! Directory structure:"
echo "  $TARGET_DIR/"
echo "  ├── source/        (raw inputs: baseline + per-run)"
echo "  ├── wip/           (AI's private workspace)"
echo "  ├── drafts/        (living documents)"
echo "  └── output/        (frozen snapshots)"
echo ""
echo "Next steps:"
echo "  1. Run /df-start to begin interactive setup"
echo "  2. Fill out the generated brief.md"
echo "  3. Run /df-bootstrap to begin learning (Phase 2)"

exit 0
