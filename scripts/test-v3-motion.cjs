const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=relative=>fs.readFileSync(path.join(__dirname,'..',relative),'utf8');
const form=read('components/booking-form.tsx');
const message=read('lib/booking-message.ts');
const page=read('components/public-site-client.tsx');
const motion=read('components/public-motion.tsx');
const css=read('app/globals.css');
const stripped=['booking-city','booking-email','booking-preview','setCity(','setEmail(','emailValid','معاينة رسالة واتساب قبل المتابعة'];
for(const token of stripped)assert.equal(form.includes(token),false,'Removed appointment UI must not contain '+token);
for(const token of ['data.city','data.email','*City:*','*Email:*','*المدينة:*','*البريد الإلكتروني:*'])
 assert.equal(message.includes(token),false,'Removed booking fields must not appear in WhatsApp message: '+token);
assert.ok(form.includes('window.open(')&&form.includes('wa.me/'),'Direct WhatsApp booking still works');
for(const token of ['booking-name','booking-phone','booking-dept','booking-specialty','booking-specialist','booking-date','booking-time','booking-issue'])
 assert.ok(form.includes(token),'Required booking input remains '+token);
assert.ok(form.includes('aria-invalid')&&form.includes('attempted'),'Booking validation remains');
assert.ok(page.includes('<PublicMotion/>'),'Motion controller is active on the public website');
assert.ok(motion.includes('IntersectionObserver'),'Scroll reveal is intersection-driven');
assert.ok(motion.includes('MutationObserver'),'Dynamically filtered team cards are animated');
assert.ok(motion.includes("prefers-reduced-motion: reduce"),'OS reduced-motion setting is respected');
assert.ok(motion.includes("root.querySelectorAll('.reveal-pending')"),'Pending elements are restored during cleanup');
assert.ok(css.includes('v3-reveal-up')&&css.includes('v3-soft-float'),'Reveal and gentle motion keyframes exist');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'Reduced-motion fallback present');
assert.ok(css.includes('filter:none!important')&&css.includes('mix-blend-mode:normal!important'),'Natural image colors preserved');
assert.ok(!motion.includes('parallax'),'No heavy scroll-linked parallax');
console.log('V3 animation, accessibility, removed-fields and WhatsApp source assertions passed');
