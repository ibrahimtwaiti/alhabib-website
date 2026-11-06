/* V2 source/asset smoke checks; run with npm run test:v2 (after npm install). */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function compileTypeScript(file){const result=ts.transpileModule(read(file),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2017,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});assert.equal(result.diagnostics?.length||0,0,`${file} should parse`);return result.outputText}
const files=[];function collect(dir){for(const f of fs.readdirSync(path.join(root,dir))){const r=path.join(dir,f),s=fs.statSync(path.join(root,r));if(s.isDirectory())collect(r);else if(/\.(ts|tsx)$/.test(r)&&!r.endsWith('.d.ts'))files.push(r)}}collect('app');collect('components');collect('lib');
files.forEach(compileTypeScript);
const moduleExports={};vm.runInNewContext(compileTypeScript('lib/clinic-data.ts'),{exports:moduleExports});
const {profiles,specialties,whatsappNumber,phoneDisplay}=moduleExports;
assert.equal(profiles.length,10,'10 professionals from clinic PDF');
assert.equal(specialties.length,7,'seven service groups');
assert.equal(whatsappNumber,'966591009916');assert.equal(phoneDisplay,'0591009916');
assert.equal(new Set(profiles.map(p=>p.slug)).size,10,'unique professional IDs');
assert.ok(profiles.every(p=>p.nameAr&&p.nameEn&&p.qualifications.length&&p.services.length));
assert.ok(profiles.every(p=>fs.existsSync(path.join(root,'public',p.photo))),'all portraits present');
assert.ok(fs.existsSync(path.join(root,'public/assets/alhabib-logo.webp')),'official logo present');
assert.ok(!read('components/booking-form.tsx').includes('أوافق على استخدام البيانات المدخلة'),'no consent checkbox gate');
assert.ok(read('components/booking-form.tsx').includes('wa.me/'),'WhatsApp request integration');
assert.ok(read('app/globals.css').includes('#8d517a')&&read('app/globals.css').includes('#57585a'),'brand colors');
assert.ok(fs.existsSync(path.join(root,'app/privacy/page.tsx')),'privacy route present');
assert.ok(fs.existsSync(path.join(root,'app/terms/page.tsx')),'terms route present');
console.log(`V2 checks passed: ${files.length} TS/TSX files, ${profiles.length} professional profiles, ${specialties.length} specialties, assets, booking, routes, colors.`);
