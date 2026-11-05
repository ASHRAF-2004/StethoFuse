import worker from './worker.mjs';
const json=(status,value)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
/** Owner-only preview proves delivery before ordinary users leave the current sender. */
export function entrypoint(core){return {fetch(request,env){
 if(env.MAIL_ACTIVATION_MODE==='live')return core.fetch(request,env);
 if(env.MAIL_ACTIVATION_MODE!=='preview')return json(503,{ok:false,code:'mail_unavailable'});
 const prefix=env.MAIL_PREVIEW_PREFIX,key=env.MAIL_PREVIEW_TOKEN,url=new URL(request.url);
 if(!/^\/api\/account-mail-preview-[a-f0-9]{16}$/.test(prefix||'')||! /^[a-f0-9]{64}$/.test(key||'')||request.headers.get('X-StethoFuse-Preview')!==key||!url.pathname.startsWith(prefix+'/'))return json(404,{ok:false,code:'not_found'});
 const suffix=url.pathname.slice(prefix.length);if(!['/health','/reset','/verify'].includes(suffix))return json(404,{ok:false,code:'not_found'});
 url.pathname='/api/account-mail'+suffix;const forwarded=new Request(url,request);forwarded.headers.delete('X-StethoFuse-Preview');return core.fetch(forwarded,env);
}};}
export default entrypoint(worker);
