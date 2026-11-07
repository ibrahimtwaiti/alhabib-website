#!/usr/bin/env bash
set -euo pipefail
export PORT=3123
npm run start -- --port "$PORT" >/tmp/alhabib-v2-next.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true' EXIT
for i in {1..40}; do
  if curl --max-time 2 -fsS "http://127.0.0.1:$PORT/" -o /dev/null; then break; fi
  sleep 1
done
for path in / /about /team /team/hisham-hendawy /specialties /specialties/nutrition /booking /contact /blog /achievements /privacy /terms /admin/login; do
  curl --max-time 12 -fsS "http://127.0.0.1:$PORT$path" -o /dev/null
  echo "OK $path"
done
