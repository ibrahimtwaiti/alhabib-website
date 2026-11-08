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
