#!/usr/bin/env bash
# check-versions.sh — Verify that version fields across all four Deepfield
# package files are in sync. Exits non-zero if any version differs.
#
# Files checked:
#   package.json                  → .version  (monorepo root)
#   cli/package.json              → .version
#   plugin/package.json           → .version AND .peerDependencies.deepfield
#   plugin/.claude-plugin/plugin.json → .version
#
# Usage: ./scripts/check-versions.sh [--json]

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ROOT_PKG="$REPO_ROOT/package.json"
CLI_PKG="$REPO_ROOT/cli/package.json"
PLUGIN_PKG="$REPO_ROOT/plugin/package.json"
PLUGIN_JSON="$REPO_ROOT/plugin/.claude-plugin/plugin.json"

# ---------------------------------------------------------------------------
# Dependency check
# ---------------------------------------------------------------------------
if ! command -v jq &>/dev/null; then
  echo "ERROR: 'jq' is required but not found in PATH." >&2
  echo "Install it with: brew install jq  OR  apt-get install jq" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Read versions
# ---------------------------------------------------------------------------
read_field() {
  local file="$1"
  local field="$2"
  if [[ ! -f "$file" ]]; then
    echo "(not found)"
    return
  fi
  jq -r "$field // \"(missing)\"" "$file"
}

ROOT_VERSION=$(read_field "$ROOT_PKG" ".version")
CLI_VERSION=$(read_field "$CLI_PKG" ".version")
PLUGIN_VERSION=$(read_field "$PLUGIN_PKG" ".version")
PLUGIN_PEER=$(read_field "$PLUGIN_PKG" ".peerDependencies.deepfield")
PLUGIN_JSON_VERSION=$(read_field "$PLUGIN_JSON" ".version")

# Strip leading ^ from peer dependency for comparison
PLUGIN_PEER_CLEAN="${PLUGIN_PEER#^}"

# ---------------------------------------------------------------------------
# Print status table
# ---------------------------------------------------------------------------
echo "Deepfield version sync check"
echo "──────────────────────────────────────────────────────"
printf "  %-42s  %s\n" "package.json (.version)"                         "$ROOT_VERSION"
printf "  %-42s  %s\n" "cli/package.json (.version)"                     "$CLI_VERSION"
printf "  %-42s  %s\n" "plugin/package.json (.version)"                  "$PLUGIN_VERSION"
printf "  %-42s  %s\n" "plugin/package.json (.peerDependencies.deepfield)" "$PLUGIN_PEER"
printf "  %-42s  %s\n" "plugin/.claude-plugin/plugin.json (.version)"    "$PLUGIN_JSON_VERSION"
echo "──────────────────────────────────────────────────────"

# ---------------------------------------------------------------------------
# Compare
# ---------------------------------------------------------------------------
ERRORS=()

if [[ "$ROOT_VERSION" == "(not found)" || "$ROOT_VERSION" == "(missing)" ]]; then
  ERRORS+=("package.json (root) version is missing or file not found")
fi

if [[ "$CLI_VERSION" == "(not found)" || "$CLI_VERSION" == "(missing)" ]]; then
  ERRORS+=("cli/package.json version is missing or file not found")
fi

if [[ "$PLUGIN_VERSION" == "(not found)" || "$PLUGIN_VERSION" == "(missing)" ]]; then
  ERRORS+=("plugin/package.json version is missing or file not found")
fi

if [[ "$PLUGIN_JSON_VERSION" == "(not found)" || "$PLUGIN_JSON_VERSION" == "(missing)" ]]; then
  ERRORS+=("plugin/.claude-plugin/plugin.json version is missing or file not found")
fi

if [[ "$PLUGIN_PEER" == "(not found)" || "$PLUGIN_PEER" == "(missing)" ]]; then
  ERRORS+=("plugin/package.json peerDependencies.deepfield is missing")
fi

# Only compare values if all were found
if [[ ${#ERRORS[@]} -eq 0 ]]; then
  if [[ "$ROOT_VERSION" != "$CLI_VERSION" ]]; then
    ERRORS+=("package.json ($ROOT_VERSION) != cli/package.json ($CLI_VERSION)")
  fi

  if [[ "$CLI_VERSION" != "$PLUGIN_VERSION" ]]; then
    ERRORS+=("cli/package.json ($CLI_VERSION) != plugin/package.json ($PLUGIN_VERSION)")
  fi

  if [[ "$CLI_VERSION" != "$PLUGIN_PEER_CLEAN" ]]; then
    ERRORS+=("cli/package.json ($CLI_VERSION) != plugin/package.json peerDependencies.deepfield ($PLUGIN_PEER)")
  fi

  if [[ "$CLI_VERSION" != "$PLUGIN_JSON_VERSION" ]]; then
    ERRORS+=("cli/package.json ($CLI_VERSION) != plugin/.claude-plugin/plugin.json ($PLUGIN_JSON_VERSION)")
  fi
fi

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
if [[ ${#ERRORS[@]} -eq 0 ]]; then
  echo "  RESULT: All versions are in sync ($CLI_VERSION) ✓"
  exit 0
else
  echo "  RESULT: Versions are OUT OF SYNC ✗"
  echo ""
  echo "  Errors:"
  for err in "${ERRORS[@]}"; do
    echo "    - $err"
  done
  echo ""
  echo "  Run './scripts/bump-version.sh patch|minor|major' to sync all files."
  exit 1
fi
