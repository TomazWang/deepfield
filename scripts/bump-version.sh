#!/usr/bin/env bash
# bump-version.sh — Atomically update the version in all four Deepfield
# package files and rebuild the CLI.
#
# Files updated:
#   package.json                  → .version  (monorepo root)
#   cli/package.json              → .version
#   doc-site/package.json         → .version
#   plugin/package.json           → .version AND .peerDependencies.deepfield
#   plugin/.claude-plugin/plugin.json → .version
#
# Usage: ./scripts/bump-version.sh <patch|minor|major|X.Y.Z>
#
# Requires: jq, node (for version arithmetic)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ROOT_PKG="$REPO_ROOT/package.json"
CLI_PKG="$REPO_ROOT/cli/package.json"
DOC_SITE_PKG="$REPO_ROOT/doc-site/package.json"
PLUGIN_PKG="$REPO_ROOT/plugin/package.json"
PLUGIN_JSON="$REPO_ROOT/plugin/.claude-plugin/plugin.json"

# ---------------------------------------------------------------------------
# Usage / argument validation
# ---------------------------------------------------------------------------
usage() {
  echo "Usage: $0 <patch|minor|major|X.Y.Z>"
  echo ""
  echo "  patch  — increment the patch digit  (0.2.0 → 0.2.1)"
  echo "  minor  — increment the minor digit  (0.2.0 → 0.3.0)"
  echo "  major  — increment the major digit  (0.2.0 → 1.0.0)"
  echo "  X.Y.Z  — set an explicit version     (0.2.0 → 0.8.1)"
  echo ""
  echo "Example: $0 patch"
  echo "Example: $0 0.8.1"
}

if [[ $# -ne 1 ]]; then
  echo "ERROR: Expected exactly one argument." >&2
  echo "" >&2
  usage >&2
  exit 1
fi

BUMP_TYPE="$1"
EXPLICIT_VERSION=""
case "$BUMP_TYPE" in
  patch|minor|major) ;;
  [0-9]*.[0-9]*.[0-9]*)
    # Direct semver input — validate format
    if [[ ! "$BUMP_TYPE" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "ERROR: '$BUMP_TYPE' is not a valid semver (expected X.Y.Z)." >&2
      echo "" >&2
      usage >&2
      exit 1
    fi
    EXPLICIT_VERSION="$BUMP_TYPE"
    ;;
  *)
    echo "ERROR: Invalid argument '$BUMP_TYPE'. Must be patch, minor, major, or X.Y.Z." >&2
    echo "" >&2
    usage >&2
    exit 1
    ;;
esac

# ---------------------------------------------------------------------------
# Dependency check
# ---------------------------------------------------------------------------
if ! command -v jq &>/dev/null; then
  echo "ERROR: 'jq' is required but not found in PATH." >&2
  echo "Install it with: brew install jq  OR  apt-get install jq" >&2
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "ERROR: 'node' is required but not found in PATH." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Read current version from cli/package.json (source of truth)
# ---------------------------------------------------------------------------
if [[ ! -f "$CLI_PKG" ]]; then
  echo "ERROR: $CLI_PKG not found." >&2
  exit 1
fi

CURRENT_VERSION=$(jq -r '.version' "$CLI_PKG")
if [[ -z "$CURRENT_VERSION" || "$CURRENT_VERSION" == "null" ]]; then
  echo "ERROR: Could not read .version from $CLI_PKG" >&2
  exit 1
fi

echo "Current version: $CURRENT_VERSION"

# ---------------------------------------------------------------------------
# Compute new version
# ---------------------------------------------------------------------------
if [[ -n "$EXPLICIT_VERSION" ]]; then
  # Guard: explicit version must be strictly greater than current
  if [[ "$EXPLICIT_VERSION" == "$CURRENT_VERSION" ]]; then
    echo "ERROR: Version '$EXPLICIT_VERSION' is the same as current ($CURRENT_VERSION)." >&2
    exit 1
  fi
  IFS='.' read -r EX_MAJOR EX_MINOR EX_PATCH <<< "$EXPLICIT_VERSION"
  IFS='.' read -r CUR_MAJOR CUR_MINOR CUR_PATCH <<< "$CURRENT_VERSION"
  if (( EX_MAJOR < CUR_MAJOR )) || \
     (( EX_MAJOR == CUR_MAJOR && EX_MINOR < CUR_MINOR )) || \
     (( EX_MAJOR == CUR_MAJOR && EX_MINOR == CUR_MINOR && EX_PATCH < CUR_PATCH )); then
    echo "ERROR: Version '$EXPLICIT_VERSION' is lower than current ($CURRENT_VERSION). Versions can only go up." >&2
    exit 1
  fi
  NEW_VERSION="$EXPLICIT_VERSION"
else
  IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

  if ! [[ "$MAJOR" =~ ^[0-9]+$ && "$MINOR" =~ ^[0-9]+$ && "$PATCH" =~ ^[0-9]+$ ]]; then
    echo "ERROR: Current version '$CURRENT_VERSION' is not a valid semver (MAJOR.MINOR.PATCH)." >&2
    exit 1
  fi

  case "$BUMP_TYPE" in
    patch)
      PATCH=$((PATCH + 1))
      ;;
    minor)
      MINOR=$((MINOR + 1))
      PATCH=0
      ;;
    major)
      MAJOR=$((MAJOR + 1))
      MINOR=0
      PATCH=0
      ;;
  esac

  NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
fi
echo "New version:     $NEW_VERSION"
echo ""

# ---------------------------------------------------------------------------
# Helper: atomic JSON update
# ---------------------------------------------------------------------------
# Usage: atomic_json_update <file> <jq_filter>
atomic_json_update() {
  local file="$1"
  local filter="$2"
  local tmp="${file}.tmp"

  if [[ ! -f "$file" ]]; then
    echo "ERROR: File not found: $file" >&2
    exit 1
  fi

  jq "$filter" "$file" > "$tmp"

  # Validate the written JSON before replacing the original
  if ! jq empty "$tmp" 2>/dev/null; then
    echo "ERROR: jq produced invalid JSON for $file — aborting." >&2
    rm -f "$tmp"
    exit 1
  fi

  mv "$tmp" "$file"
}

# ---------------------------------------------------------------------------
# Update files
# ---------------------------------------------------------------------------
echo "Updating package.json (root) ..."
atomic_json_update "$ROOT_PKG" ".version = \"$NEW_VERSION\""

echo "Updating cli/package.json ..."
atomic_json_update "$CLI_PKG" ".version = \"$NEW_VERSION\""

echo "Updating doc-site/package.json ..."
atomic_json_update "$DOC_SITE_PKG" ".version = \"$NEW_VERSION\""

echo "Updating plugin/package.json ..."
atomic_json_update "$PLUGIN_PKG" ".version = \"$NEW_VERSION\" | .peerDependencies.deepfield = \"^$NEW_VERSION\""

echo "Updating plugin/.claude-plugin/plugin.json ..."
atomic_json_update "$PLUGIN_JSON" ".version = \"$NEW_VERSION\""

echo ""
echo "All version files updated to $NEW_VERSION."
echo ""

# ---------------------------------------------------------------------------
# Rebuild CLI
# ---------------------------------------------------------------------------
echo "Rebuilding CLI (cd cli && npm run build) ..."
cd "$REPO_ROOT/cli"
npm run build
cd "$REPO_ROOT"

echo ""
echo "Done! Version bumped: $CURRENT_VERSION → $NEW_VERSION"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git diff"
echo "  2. Commit: git add -A && git commit -m \"chore: bump version to $NEW_VERSION\""
echo "  3. Push and open a PR"
