#!/usr/bin/env bash
#
# Quick demo of the `appmap query` verbs against a fixture set.
#
# Usage:
#   ./scripts/demo-query.sh                       # uses appmap-apm fixtures if present,
#                                                 #   else bundled ruby fixtures
#   ./scripts/demo-query.sh /path/to/your/appmaps # any directory of *.appmap.json files
#
# Side effects: copies the fixture set to a temp dir, builds and imports a
# query.db there, leaves the originals untouched. Cleans up on exit.

set -euo pipefail

cd "$(dirname "$0")/.."   # → packages/cli

# Pick the richest fixture set available.
DEFAULT="$HOME/source/appland/appmap-apm/tests/fixtures/tmp/appmap"
[ -d "$DEFAULT" ] || DEFAULT="$(pwd)/tests/unit/fixtures/ruby"
SRC="${1:-$DEFAULT}"
[ -d "$SRC" ] || { echo "fixture dir not found: $SRC" >&2; exit 2; }

# Temp work area: copy the fixtures so `appmap index` can write fingerprint
# sidecars without touching the originals.
TMP="$(mktemp -d -t appmap-demo)"
DATA="$TMP/data"
DB="$TMP/query.db"
mkdir -p "$DATA"
cp -r "$SRC"/. "$DATA"/
export NODE_NO_WARNINGS=1
trap 'rm -rf "$TMP"' EXIT

CLI=( node "$(pwd)/built/cli.js" )

echo "Building CLI…" >&2
npx tsc 2>&1 | grep -v 'navie-local' >&2 || true

# Filter out diagnostic noise from @appland/models that the verbs themselves
# don't emit (kept loose so we don't suppress real errors).
NOISE='\[DEBUG '

banner() {
  echo
  echo "── \$ appmap $*"
}
run() {
  banner "$@"
  "${CLI[@]}" "$@" 2>&1 | grep -vE "$NOISE" || true
}
run_quiet() {
  banner "$@"
  "${CLI[@]}" "$@" 2>&1 | grep -vE "$NOISE" | tail -5 || true
}

cat <<HEAD
Source : $SRC
Query DB : $DB
HEAD

# Build the query DB. The index command itself is noisy (one line per file
# plus diagnostics from @appland/models) — the demo cares about the verbs,
# not the indexer, so we silence index output and report a row count.
echo
echo "── \$ appmap index --appmap-dir <DATA> --query-db <QUERY_DB>"
"${CLI[@]}" index --appmap-dir "$DATA" --query-db "$DB" >/dev/null 2>&1
COUNT=$(node -e "
  const db = require('better-sqlite3')('$DB', { readonly: true });
  process.stdout.write(String(db.prepare('SELECT COUNT(*) AS n FROM appmaps').get().n));
")
echo "indexed $COUNT recordings"

run query endpoints --query-db "$DB" --sort p95 --limit 5
run query find queries --query-db "$DB" --table users --limit 3 || true
run query find exceptions --query-db "$DB" --limit 5 || true
run query hotspots --query-db "$DB" --limit 5
run query hotspots --query-db "$DB" --type=sql --limit 3

# Pick the recording with the most events for the tree demos.
APPMAP="$(node -e "
  const db = require('better-sqlite3')('$DB', { readonly: true });
  const r = db.prepare(
    'SELECT name FROM appmaps WHERE event_count > 0 ORDER BY event_count DESC LIMIT 1'
  ).get();
  process.stdout.write(r ? r.name : '');
")"

if [ -n "$APPMAP" ]; then
  run query tree "$APPMAP" --query-db "$DB" --format=summary
  run query tree "$APPMAP" --query-db "$DB" --filter=sql
fi

echo
echo "Done."
