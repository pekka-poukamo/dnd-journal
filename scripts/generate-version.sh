#!/usr/bin/env bash
set -euo pipefail

# Generate version info based on current Git state.
# By default, this script prints JSON to stdout and does not modify files.
# Use --write-js to update js/version.js with the current version info.

print_help() {
  cat <<'EOS'
Usage: bash scripts/generate-version.sh [--output FILE] [--write-js]

Outputs JSON with fields: commit, shortCommit, runNumber, timestamp, ref.

Environment variables:
  RUN_NUMBER   Optional. If set, used as the run number. Otherwise falls back
               to `git rev-list --count HEAD` or "local" if unavailable.

This script is side-effect free by default. Use --write-js to modify js/version.js.
EOS
}

OUTPUT_FILE=""
WRITE_JS="false"
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  print_help
  exit 0
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)
      OUTPUT_FILE="${2:-}"
      if [[ -z "$OUTPUT_FILE" ]]; then
        echo "--output requires a file path" 1>&2
        exit 1
      fi
      shift 2
      ;;
    --write-js)
      WRITE_JS="true"
      shift 1
      ;;
    -h|--help)
      print_help
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" 1>&2
      print_help
      exit 1
      ;;
  esac
done

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
  printf "%s\n" "$json_output" > "$OUTPUT_FILE"
  echo "Wrote version info to $OUTPUT_FILE"
else
  printf "%s\n" "$json_output"
fi

if [[ "$WRITE_JS" == "true" ]]; then
  js_file="js/version.js"
  tmp_file="${js_file}.tmp"
  mkdir -p "$(dirname "$js_file")"
  cat >"$tmp_file" <<'JS'
// Version info - Auto-generated during deployment
export const VERSION_INFO = {
  commit: '__COMMIT__',
  shortCommit: '__SHORT__',
  runNumber: '__RUN__',
  timestamp: '__TIME__',
  ref: '__REF__'
};
JS
  commit_val=$(printf "%s" "$json_output" | sed -n 's/.*"commit": "\([^"]*\)".*/\1/p')
  short_val=$(printf "%s" "$json_output" | sed -n 's/.*"shortCommit": "\([^"]*\)".*/\1/p')
  run_val=$(printf "%s" "$json_output" | sed -n 's/.*"runNumber": "\([^"]*\)".*/\1/p')
  time_val=$(printf "%s" "$json_output" | sed -n 's/.*"timestamp": "\([^"]*\)".*/\1/p')
  ref_val=$(printf "%s" "$json_output" | sed -n 's/.*"ref": "\([^"]*\)".*/\1/p')
  sed -i "s/__COMMIT__/$commit_val/; s/__SHORT__/$short_val/; s/__RUN__/$run_val/; s/__TIME__/$time_val/; s/__REF__/$ref_val/" "$tmp_file"
  mv "$tmp_file" "$js_file"
  echo "Updated $js_file"
fi

