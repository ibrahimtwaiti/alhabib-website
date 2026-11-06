const fs=require('node:fs');const assert=require('node:assert/strict');
const msg=fs.readFileSync('lib/booking-message.ts','utf8');
const booking=fs.readFileSync('components/booking-form.tsx','utf8');
const admin=fs.readFileSync('components/admin-content.tsx','utf8');
const visuals=fs.readFileSync('components/visual-settings-admin.tsx','utf8');
assert.match(msg,/Intl\.DateTimeFormat/);assert.match(msg,/day:'numeric',month:'long',year:'numeric'/);assert.match(msg,/هذا الإشعار يمثل طلباً مبدئياً/);
assert.match(booking,/buildBookingMessage/);assert.match(booking,/dir="ltr"/);assert.doesNotMatch(booking,/setConsent|consent&&/);
assert.match(admin,/uploadImage/);assert.match(admin,/VisualSettingsAdmin/);assert.match(visuals,/specialty_visuals/);
console.log('V2.1 booking, calendar and visual-management source checks passed');
