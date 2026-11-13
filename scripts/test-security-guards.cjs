/* API regression test with no database or network access. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');
const users=[{id:'admin-1',username:'admin',is_active:true,password_hash:'stub',failed_attempts:0,locked_until:0}];
let signed=0;
const store={users};
const auth={
 validateOrigin:async r=>r.headers.get('origin')==='https://clinic.test',
 verifyPassword:(pw)=>pw==='CorrectPassword#2026',
 setSession:async()=>{signed++},
 publicUser:u=>({id:u.id,username:u.username})
};
const cms={readCms:async()=>({store}),mutateCms:async fn=>fn(store)};
const source=fs.readFileSync('app/api/admin/login/route.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const routeExports={};
vm.runInNewContext(js,{exports:routeExports,require:name=>{
 if(name==='next/server')return {NextResponse:{json:(data,opts)=>Response.json(data,opts)}};
 if(name==='@/lib/cms-store')return cms;
 if(name==='@/lib/admin-auth')return auth;
 throw Error('Unexpected module '+name);
},Response,console,Date},{timeout:3000});
const request=(body,options={})=>new Request('https://clinic.test/api/admin/login',{
 method:'POST',headers:{origin:options.origin??'https://clinic.test','content-type':options.type??'application/json',...(options.length?{'content-length':String(options.length)}:{})},
 body:typeof body==='string'?body:JSON.stringify(body)});
(async()=>{
 assert.equal((await routeExports.POST(request({username:'admin',password:'CorrectPassword#2026'},{origin:'https://attacker.test'}))).status,403);
 assert.equal((await routeExports.POST(request({username:'admin',password:'CorrectPassword#2026'},{type:'text/plain'}))).status,415);
 assert.equal((await routeExports.POST(request({username:'admin',password:'CorrectPassword#2026'},{length:5000}))).status,413);
 assert.equal((await routeExports.POST(request('not-json'))).status,400);
 assert.equal((await routeExports.POST(request({username:'admin',password:'x'.repeat(4097)}))).status,413);
 for(let i=0;i<5;i++)assert.equal((await routeExports.POST(request({username:'admin',password:'incorrect'}))).status,401);
 assert.ok(users[0].locked_until>Date.now(),'5 incorrect logins lock the account');
 assert.equal((await routeExports.POST(request({username:'admin',password:'CorrectPassword#2026'}))).status,401,'locked user cannot log in');
 users[0].locked_until=0;
 assert.equal((await routeExports.POST(request({username:'admin',password:'CorrectPassword#2026'}))).status,200);
 assert.equal(signed,1);
 console.log('Login request validation, lockout and CSRF regression checks passed');
})().catch(e=>{console.error(e);process.exitCode=1});
