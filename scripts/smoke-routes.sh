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
for path in / /about /team /team/hisham-hendawy /specialties /specialties/nutrition /booking /contact /blog /achievements /privacy /terms; do
  curl --max-time 12 -fsS "http://127.0.0.1:$PORT$path" -o /dev/null
  echo "OK $path"
done

# Visitors must not reach administrative pages or mutation APIs by typing URLs.
for path in /admin /admin/login /admin/setup /admin/dashboard /api/admin/login /api/cms; do
  code=$(curl --max-time 12 -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT$path")
  if [[ "$code" != "404" ]]; then
    echo "ERROR public route $path returned $code instead of 404" >&2
    exit 1
  fi
  echo "OK public admin isolation $path (404)"
done

# The same server serves the administrative portal only on its dedicated host.
code=$(curl --max-time 12 -sS -o /dev/null -w '%{http_code}' \
  -H 'Host: alhabib-center-admin.vercel.app' "http://127.0.0.1:$PORT/admin/login")
if [[ "$code" != "200" ]]; then
  echo "ERROR dedicated admin host login returned $code instead of 200" >&2
  exit 1
fi
echo "OK dedicated admin login (200)"

# Assert rendered V3 booking HTML is deliberately minimal, not just HTTP 200.
curl --max-time 15 -fsS "http://127.0.0.1:$PORT/booking" -o /tmp/alhabib-v3-booking.html
node - <<'NODE'
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('/tmp/alhabib-v3-booking.html','utf8');
for(const id of ['booking-name','booking-phone','booking-dept','booking-specialist','booking-issue'])
 assert.ok(html.includes('id="'+id+'"'),'Booking contains '+id);
for(const id of ['booking-city','booking-email','booking-preview','معاينة رسالة واتساب قبل المتابعة'])
 assert.ok(!html.includes(id),'Booking removed '+id);
console.log('V3 public appointment HTML smoke checks passed');
NODE
