#!/usr/bin/env bash
set -euo pipefail

# Generate js/version.js based on current Git state
# Usage: bash scripts/generate-version.sh

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
OUT_FILE="$REPO_ROOT/js/version.js"

COMMIT="$(git rev-parse HEAD 2>/dev/null || echo dev)"
SHORT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo dev)"
RUN_NUMBER_DEFAULT="$(git rev-list --count HEAD 2>/dev/null || echo local)"
RUN_NUMBER="${RUN_NUMBER:-$RUN_NUMBER_DEFAULT}"
TIMESTAMP="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
REF_NAME="$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --abbrev-ref HEAD 2>/dev/null || echo local)"

{
  echo "// Auto-generated version info - DO NOT EDIT"
  echo "export const VERSION_INFO = {"
  echo "  commit: '$COMMIT',"
  echo "  shortCommit: '$SHORT_COMMIT',"
  echo "  runNumber: '$RUN_NUMBER',"
  echo "  timestamp: '$TIMESTAMP',"
  echo "  ref: '$REF_NAME'"
  echo "};"
} > "$OUT_FILE"

echo "Wrote version info to $OUT_FILE"

