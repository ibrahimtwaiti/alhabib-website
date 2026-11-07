'use client';
/** Compatibility adapter: previously Supabase; now routed to secure Vercel CMS endpoints.
 * The browser never receives Blob tokens, password hashes or privileged storage credentials. */
class Query {
 private filters:{key:string;value:unknown}[]=[];
 private sorting?:{key:string;ascending:boolean};private max?:number;private selection='*';private only=false;private head=false;private count?:string;private onConflict?:string;
 private action:'select'|'insert'|'update'|'delete'|'upsert'='select';private payload:unknown;
 constructor(private table:string){}
 select(fields='*',options?:{count?:string;head?:boolean}){this.selection=fields;this.head=!!options?.head;this.count=options?.count;return this}
 eq(key:string,value:unknown){this.filters.push({key,value});return this}
 order(key:string,opt?:{ascending?:boolean}){this.sorting={key,ascending:opt?.ascending!==false};return this}
 limit(n:number){this.max=n;return this}
 maybeSingle(){this.only=true;return this.execute()}
 single(){this.only=true;return this.execute()}
 insert(value:unknown){this.action='insert';this.payload=value;return this}
 update(value:unknown){this.action='update';this.payload=value;return this}
 delete(){this.action='delete';return this}
 upsert(value:unknown,opt?:{onConflict?:string}){this.action='upsert';this.payload=value;this.onConflict=opt?.onConflict||'id';return this}
 async execute():Promise<{data:any;error:any;count?:number}>{try{const r=await fetch('/api/cms',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({table:this.table,action:this.action,filters:this.filters,order:this.sorting,limit:this.max,selection:this.selection,payload:this.payload,head:this.head,count:this.count,onConflict:this.onConflict}),cache:'no-store'});const d=await r.json();if(!r.ok)return {data:null,error:new Error(d.error||'تعذر حفظ التغييرات')};return {data:this.only?(d.data?.[0]||null):d.data,error:null,count:d.count}}catch(e){return {data:null,error:e}}}
 then<TResult1 = {data:any;error:any;count?:number},TResult2=never>(resolve?:((value:{data:any;error:any;count?:number})=>TResult1|PromiseLike<TResult1>)|null,reject?:((reason:any)=>TResult2|PromiseLike<TResult2>)|null){return this.execute().then(resolve,reject)}
 }
export function createClient(){return {
 from:(name:string)=>new Query(name),
 auth:{
  getUser:async()=>{const r=await fetch('/api/admin/session',{cache:'no-store'});const d=await r.json();return {data:{user:d.user?{id:d.user.id}:null},error:null}},
  getSession:async()=>{const r=await fetch('/api/admin/session',{cache:'no-store'});const d=await r.json();return {data:{session:d.user?{user:d.user,access_token:'http-only-cookie'}:null},error:null}},
  signOut:async()=>{await fetch('/api/admin/logout',{method:'POST'});return {error:null}},
  signInWithPassword:async()=>({error:new Error('استخدم شاشة دخول اسم المستخدم الجديدة')}),
  resetPasswordForEmail:async()=>({error:new Error('إدارة كلمات المرور من حساب المدير الرئيسي')}),
  onAuthStateChange:()=>({data:{subscription:{unsubscribe:()=>{}}}}),
  updateUser:async()=>({error:new Error('غير متاح')})
 },
 storage:{from:(_bucket:string)=>({
  upload:async(path:string,file:File,opt?:{contentType?:string})=>{const form=new FormData();form.append('file',file);form.append('path',path);try{const r=await fetch('/api/admin/upload',{method:'POST',body:form});const d=await r.json();return r.ok?{error:null,data:{path:d.path}}:{error:new Error(d.error)}}catch(e){return {error:e}}},
  getPublicUrl:(path:string)=>({data:{publicUrl:`/api/media/${path.replace(/^\/+/, '')}`}})
 })}
 }}
export function isSupabaseConfigured(){return true}
