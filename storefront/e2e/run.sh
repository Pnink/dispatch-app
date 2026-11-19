#!/usr/bin/env bash
# Runs every e2e suite against fresh, empty data folders, then restarts the server to prove data survives.
# Needs a production build first (npm run build). Usage: npm run e2e
set -euo pipefail
cd "$(dirname "$0")/.."

SHOTS=replica/clone-screens
WORK="$(mktemp -d)"
export DATA_DIR="$WORK/data"
PW_DATA="$WORK/data-pw"
export OWNER_PASSWORD="correct horse battery staple $RANDOM"
export NEXT_TELEMETRY_DISABLED=1
export NODE_PATH="${NODE_PATH:-$(npm root -g)}" # Playwright may be installed globally
mkdir -p "$SHOTS"

PIDS=()
cleanup() { for p in "${PIDS[@]}"; do kill "$p" 2>/dev/null || true; done; }
trap cleanup EXIT

start() { # port, data dir, password
  DATA_DIR="$2" OWNER_PASSWORD="$3" node node_modules/next/dist/bin/next start -p "$1" >"$WORK/server-$1.log" 2>&1 &
  PIDS+=($!)
  for _ in $(seq 1 60); do curl -s -o /dev/null "http://localhost:$1" && return 0; sleep 0.5; done
  echo "server on $1 did not start"; cat "$WORK/server-$1.log"; exit 1
}

start 3100 "$DATA_DIR" ""
start 3101 "$PW_DATA" "$OWNER_PASSWORD"

for suite in walkthrough experiments owner-tools security; do
  echo "== $suite"
  BASE_URL=http://localhost:3100 BASE_URL_PW=http://localhost:3101 node "e2e/$suite.cjs" "$SHOTS"
done

echo "== persistence across restart"
BEFORE="$(curl -s http://localhost:3100/api/admin/db | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.stores.length+" stores, rev "+j.rev)})')"
kill "${PIDS[0]}"; sleep 1
start 3100 "$DATA_DIR" ""
AFTER="$(curl -s http://localhost:3100/api/admin/db | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.stores.length+" stores, rev "+j.rev)})')"
echo "before restart: $BEFORE | after restart: $AFTER"
[ "$BEFORE" = "$AFTER" ] && echo "✓ everything survived a restart" || { echo "FAIL data changed across restart"; exit 1; }
ls "$DATA_DIR" "$DATA_DIR/backups" | sed 's/^/  /'
