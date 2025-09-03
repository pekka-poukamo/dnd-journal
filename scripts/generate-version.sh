#!/usr/bin/env bash
set -euo pipefail

print_help() {
  cat <<'EOS'
Usage: bash scripts/generate-version.sh [--output FILE]

Outputs JSON with fields: commit, shortCommit, runNumber, timestamp, ref.

If --output is given, writes a JavaScript ES module file like:
  export const VERSION_INFO = { ... };
EOS
}

OUTPUT_FILE=""
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  print_help
  exit 0
fi

if [[ "${1:-}" == "--output" ]]; then
  OUTPUT_FILE="${2:-}"
  if [[ -z "$OUTPUT_FILE" ]]; then
    echo "--output requires a file path" 1>&2
    exit 1
  fi
fi

commit_sha="$(git rev-parse HEAD 2>/dev/null || echo dev)"
short_commit="$(git rev-parse --short HEAD 2>/dev/null || echo dev)"
default_run_number="$(git rev-list --count HEAD 2>/dev/null || echo local)"
run_number="${RUN_NUMBER:-$default_run_number}"
timestamp_utc="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
ref_name="$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --abbrev-ref HEAD 2>/dev/null || echo local)"

json_output=$(cat <<JSON
{
  "commit": "$commit_sha",
  "shortCommit": "$short_commit",
  "runNumber": "$run_number",
  "timestamp": "$timestamp_utc",
  "ref": "$ref_name"
}
JSON
)

if [[ -n "$OUTPUT_FILE" ]]; then
  {
    echo "// Version info - Auto-generated during deployment"
    echo "export const VERSION_INFO = $json_output;"
  } > "$OUTPUT_FILE"
  echo "Wrote version info to $OUTPUT_FILE"
else
  printf "%s\n" "$json_output"
fi