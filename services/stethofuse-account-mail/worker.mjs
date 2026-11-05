import {accountMessage} from './mail.mjs';
import {configuredDelivery,deliverEmail,DeliveryError} from './delivery.mjs';

export const ORIGIN='https://stethofuse.ashraf-alsaloul.com';
export const PROJECT='stethofuse-c18cd-3cca0';
export const SERVICE_ACCOUNT=`stethofuse-account-mail@${PROJECT}.iam.gserviceaccount.com`;
const GOOGLE='https://identitytoolkit.googleapis.com',TOKEN_URL='https://oauth2.googleapis.com/token';
const MAX_BODY=1536,MAX_TOKEN=8192;
const json=(status,value,extra={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...extra}});
export class MailError extends Error{constructor(code){super(code);this.code=code;}}
const fail=code=>{throw new MailError(code);};
const base64url=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const encoded=value=>base64url(new TextEncoder().encode(JSON.stringify(value)));
const validEmail=value=>typeof value==='string'&&value.length<=254&&/^[^\s@<>\u0000-\u001f\u007f]+@[^\s@<>\u0000-\u001f\u007f]+\.[^\s@<>\u0000-\u001f\u007f]+$/.test(value);

export function credential(env){
 let value;try{value=JSON.parse(env.GOOGLE_MAIL_CREDENTIAL);}catch{fail('MAIL_NOT_CONFIGURED');}
 if(value.project_id!==PROJECT||value.client_email!==SERVICE_ACCOUNT||!/^-----BEGIN PRIVATE KEY-----\n[\s\S]+\n-----END PRIVATE KEY-----\n?$/.test(value.private_key||'')||! /^[a-zA-Z0-9]{20,80}$/.test(value.private_key_id||''))fail('MAIL_NOT_CONFIGURED');
 return value;
}
function configured(env){
 credential(env);
 configuredDelivery(env);
 if(!env.MAIL_IP_RATE?.limit||!env.MAIL_RECIPIENT_RATE?.limit||!env.MAIL_GLOBAL_RATE?.limit||typeof env.FIREBASE_API_KEY!=='string'||env.FIREBASE_API_KEY.length<20)fail('MAIL_NOT_CONFIGURED');
}
async function readBody(request){
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))fail('JSON_REQUIRED');
 const length=request.headers.get('content-length');if(length&&(!/^\d+$/.test(length)||Number(length)>MAX_BODY))fail('BODY_TOO_LARGE');
 const reader=request.body?.getReader();if(!reader)fail('INVALID_REQUEST');const chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BODY){await reader.cancel();fail('BODY_TOO_LARGE');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 let value;try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{fail('INVALID_REQUEST');}
 if(!value||typeof value!=='object'||Array.isArray(value))fail('INVALID_REQUEST');return value;
}
export function validateInput(value,kind){
 const allowed=kind==='reset'?['email','locale']:['locale'];
 if(Object.keys(value).some(key=>!allowed.includes(key))||!['en','ar'].includes(value.locale))fail('INVALID_REQUEST');
 if(kind==='reset'&&!validEmail(value.email))fail('INVALID_REQUEST');
 return {locale:value.locale,...(kind==='reset'?{email:value.email.toLowerCase()}:{})};
}
export function appActionLink(link,kind,locale,apiKey){
 let value;try{value=new URL(link);}catch{fail('INVALID_PROVIDER_LINK');}
 const mode=kind==='reset'?'resetPassword':'verifyEmail';
 if(value.origin!==`https://${PROJECT}.firebaseapp.com`||value.pathname!=='/__/auth/action'||value.username||value.password||value.hash||value.searchParams.getAll('mode').length!==1||value.searchParams.get('mode')!==mode||value.searchParams.getAll('oobCode').length!==1||value.searchParams.get('apiKey')!==apiKey||value.searchParams.getAll('apiKey').length!==1)fail('INVALID_PROVIDER_LINK');
 const code=value.searchParams.get('oobCode');if(!code||! /^[a-zA-Z0-9_-]{16,2048}$/.test(code))fail('INVALID_PROVIDER_LINK');
 const action=new URL('/auth/action',ORIGIN);action.searchParams.set('mode',mode);action.searchParams.set('oobCode',code);action.searchParams.set('lang',locale);return action.href;
}

/** Dependencies are injectable for contract tests; production only calls fixed Google URLs. */
export function createWorker({fetch:network=globalThis.fetch,now=Date.now,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),log=console}={}){
 let cachedToken,tokenPending;
 async function googleJSON(url,options){
  // Workers supports manual/follow only. Manual keeps credentials on fixed URLs;
  // redirects remain non-success responses and are never followed.
  let response;try{response=await network(url,{...options,redirect:'manual',signal:AbortSignal.timeout(8000)});}catch{fail('IDENTITY_UNAVAILABLE');}
  let value;try{value=await response.json();}catch{fail('IDENTITY_UNAVAILABLE');}
  if(!response.ok){const code=value.error?.message?.split(' : ')[0];if(code==='EMAIL_NOT_FOUND')fail('ACCOUNT_ABSENT');if(['INVALID_ID_TOKEN','TOKEN_EXPIRED','USER_DISABLED','USER_NOT_FOUND','INVALID_REFRESH_TOKEN'].includes(code))fail('INVALID_IDENTITY');fail('IDENTITY_UNAVAILABLE');}
  return value;
 }
 async function accessToken(env){
  const account=credential(env),keyId=account.private_key_id;
  if(cachedToken?.keyId===keyId&&cachedToken.until>now())return cachedToken.value;
  if(tokenPending?.keyId===keyId)return tokenPending.promise;
  const promise=(async()=>{
   const pem=account.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');
   let key;try{key=await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(pem),c=>c.charCodeAt(0)),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);}catch{fail('MAIL_NOT_CONFIGURED');}
   const issued=Math.floor(now()/1000),unsigned=encoded({alg:'RS256',typ:'JWT',kid:keyId})+'.'+encoded({iss:SERVICE_ACCOUNT,scope:'https://www.googleapis.com/auth/identitytoolkit',aud:TOKEN_URL,iat:issued,exp:issued+600});
   const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(unsigned));
   const result=await googleJSON(TOKEN_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:unsigned+'.'+base64url(signature)})});
   if(typeof result.access_token!=='string'||result.token_type!=='Bearer'||!Number.isFinite(result.expires_in)||result.expires_in<120)fail('IDENTITY_UNAVAILABLE');
   cachedToken={value:result.access_token,keyId,until:now()+(Math.min(result.expires_in,3600)-60)*1000};return result.access_token;
  })();tokenPending={keyId,promise};try{return await promise;}finally{if(tokenPending?.promise===promise)tokenPending=undefined;}
 }
 async function recipientLimit(email,env){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('stethofuse-account-mail:'+email.toLowerCase()));
  return (await env.MAIL_RECIPIENT_RATE.limit({key:base64url(digest)})).success;
 }
 async function identity(request,env){
  const header=request.headers.get('Authorization')||'';if(header.length>MAX_TOKEN||!/^Bearer [a-zA-Z0-9_.-]+$/.test(header))fail('INVALID_IDENTITY');
  // Provider lookup validates the ID token; an unverified decoded JWT is never trusted.
  const result=await googleJSON(`${GOOGLE}/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_API_KEY)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:header.slice(7)})});
  if(result.users?.length!==1)fail('INVALID_IDENTITY');const user=result.users[0];
  if(user.disabled||!user.localId||!validEmail(user.email))fail('INVALID_IDENTITY');return user;
 }
 async function deliver(kind,email,locale,reference,env){
  const token=await accessToken(env),result=await googleJSON(`${GOOGLE}/v1/projects/${PROJECT}/accounts:sendOobCode`,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({requestType:kind==='reset'?'PASSWORD_RESET':'VERIFY_EMAIL',email,returnOobLink:true,continueUrl:ORIGIN+'/login'})});
  const link=appActionLink(result.oobLink,kind,locale,env.FIREBASE_API_KEY);
  const delivery=await deliverEmail(accountMessage({kind,locale,email,link,reference}),reference,env,network);
  if(!delivery||typeof delivery.messageId!=='string'||!delivery.messageId)fail('DELIVERY_UNCONFIRMED');
  log.log(JSON.stringify({event:'account_mail_accepted',kind,locale,reference,messageId:delivery.messageId}));
 }
 function failure(error,reference,kind){log.error(JSON.stringify({event:'account_mail_unavailable',reference,kind,code:error instanceof MailError||error instanceof DeliveryError?error.code:'DELIVERY_UNCONFIRMED'}));}
 return {async fetch(request,env){
  const url=new URL(request.url),reference=crypto.randomUUID(),started=now();
  if(url.origin!==ORIGIN)return json(404,{ok:false,code:'not_found'});
  if(url.pathname==='/api/account-mail/health'&&request.method==='GET'){try{configured(env);return json(200,{service:'stethofuse-account-mail',status:'configured',version:'1'});}catch{return json(503,{service:'stethofuse-account-mail',status:'unavailable',version:'1'});}}
  const kind=url.pathname==='/api/account-mail/reset'?'reset':url.pathname==='/api/account-mail/verify'?'verify':null;
  if(!kind)return json(404,{ok:false,code:'not_found'});
  if(request.method!=='POST')return json(405,{ok:false,code:'method_not_allowed'},{Allow:'POST'});
  if(request.headers.get('Origin')!==ORIGIN||request.headers.get('Sec-Fetch-Site')==='cross-site')return json(403,{ok:false,code:'origin_not_allowed'});
  let value;
  try{value=validateInput(await readBody(request),kind);}catch(error){return json(error.code==='BODY_TOO_LARGE'?413:error.code==='JSON_REQUIRED'?415:400,{ok:false,code:'invalid_request'});}
  try{configured(env);}catch{return json(503,{ok:false,code:'mail_unavailable'});}
  const ip=request.headers.get('CF-Connecting-IP');if(!ip)return json(503,{ok:false,code:'mail_unavailable'});
  try{if(!(await env.MAIL_IP_RATE.limit({key:ip})).success||!(await env.MAIL_GLOBAL_RATE.limit({key:'stethofuse-account-mail'})).success)return json(429,{ok:false,code:'too_many_requests'},{'Retry-After':'60'});}catch{failure(new MailError('RATE_CONTROL_UNAVAILABLE'),reference,kind);return json(503,{ok:false,code:'mail_unavailable'});}
  if(kind==='reset'){
   try{if(await recipientLimit(value.email,env))await deliver(kind,value.email,value.locale,reference,env);}catch(error){if(error.code!=='ACCOUNT_ABSENT')failure(error,reference,kind);}
   // Identical acknowledgement for absent, throttled, delivered or failed recipients.
   // This confirms receipt of the request, never promises that an email was delivered.
   await sleep(Math.max(0,750-(now()-started)));return json(202,{ok:true,reference});
  }
  try{
   const user=await identity(request,env);
   if(!user.emailVerified){if(!(await recipientLimit(user.email,env)))return json(429,{ok:false,code:'too_many_requests'},{'Retry-After':'60'});await deliver(kind,user.email,value.locale,reference,env);}
   return json(202,{ok:true,reference});
  }catch(error){failure(error,reference,kind);return json(error.code==='INVALID_IDENTITY'?401:503,{ok:false,code:error.code==='INVALID_IDENTITY'?'sign_in_required':'mail_unavailable'});}
 }};
}
export default createWorker();
