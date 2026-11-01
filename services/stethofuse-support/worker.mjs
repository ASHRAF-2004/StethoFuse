import {htmlEmail,escapeHTML} from './email-theme.mjs';

const ORIGIN='https://stethofuse.ashraf-alsaloul.com';
const BODY_LIMIT=12288;
const json=(status,value,extra={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...extra}});
class InvalidRequest extends Error{constructor(status,code){super(code);this.status=status;this.code=code;}}

async function readJSON(request){
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw new InvalidRequest(415,'json_required');
 if(Number(request.headers.get('content-length'))>BODY_LIMIT)throw new InvalidRequest(413,'message_too_large');
 const reader=request.body?.getReader();if(!reader)throw new InvalidRequest(400,'invalid_message');
 const chunks=[];let size=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>BODY_LIMIT){await reader.cancel();throw new InvalidRequest(413,'message_too_large');}chunks.push(value);}}
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.byteLength;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new InvalidRequest(400,'invalid_message');}
}

export function validateMessage(value){
 if(!value||Array.isArray(value)||typeof value!=='object')throw new InvalidRequest(400,'invalid_message');
 if(Object.keys(value).some(key=>!['name','email','subject','message','website','locale'].includes(key)))throw new InvalidRequest(400,'invalid_message');
 const valid=(text,min,max)=>typeof text==='string'&&text.trim().length>=min&&text.trim().length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text);
 if(!valid(value.name,2,100)||/[\r\n]/.test(value.name)||!valid(value.subject,3,140)||/[\r\n]/.test(value.subject)||!valid(value.message,10,4000))throw new InvalidRequest(400,'invalid_message');
 if(typeof value.email!=='string'||value.email.length>254||! /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value.email))throw new InvalidRequest(400,'invalid_email');
 if(value.website!==undefined&&value.website!=='')throw new InvalidRequest(400,'invalid_message');
 if(!['en','ar'].includes(value.locale))throw new InvalidRequest(400,'invalid_message');
 return {name:value.name.trim(),email:value.email.trim(),subject:value.subject.trim(),message:value.message.trim(),locale:value.locale};
}

export function makeEmail(value,reference,env){
 const ar=value.locale==='ar',fields=[[ar?'الاسم':'Name',value.name],[ar?'البريد الإلكتروني':'Email',value.email],[ar?'الموضوع':'Subject',value.subject],[ar?'رقم الرسالة':'Reference',reference]];
 const body=`<table role="presentation" style="border-spacing:0;width:100%;font-size:14px">${fields.map(([label,text])=>`<tr><td class="email-muted" style="color:#53615a;padding:6px 16px 6px 0;vertical-align:top;width:100px">${label}</td><td style="padding:6px 0;word-break:break-word">${escapeHTML(text)}</td></tr>`).join('')}</table><div class="email-rule" style="border-top:1px solid #d3dcd6;margin:22px 0"></div><p style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHTML(value.message)}</p><p class="email-muted" style="color:#53615a;font-size:12px">${ar?'يمكن الردّ على هذه الرسالة للتواصل مباشرةً مع المرسل.':'Reply to this email to contact the visitor directly.'}</p>`;
 return {from:{email:env.SUPPORT_FROM,name:'StethoFuse Support'},to:env.SUPPORT_TO,replyTo:{email:value.email,name:value.name},subject:'[StethoFuse support] '+value.subject,text:fields.map(([label,text])=>label+': '+text).join('\n')+'\n\n'+value.message,html:htmlEmail({eyebrow:ar?'رسالة دعم جديدة':'NEW SUPPORT MESSAGE',title:ar?'كيف يمكننا المساعدة؟':'A message from your workspace.',body,locale:value.locale})};
}

export default {
 async fetch(request,env){
  const url=new URL(request.url),reference=crypto.randomUUID();
  if(url.hostname!=='stethofuse.ashraf-alsaloul.com')return json(404,{ok:false,code:'not_found'});
  if(url.pathname==='/api/support/health'&&request.method==='GET')return json(env.SUPPORT_MAIL&&env.SUPPORT_TO&&env.SUPPORT_FROM?200:503,{status:env.SUPPORT_MAIL&&env.SUPPORT_TO&&env.SUPPORT_FROM?'ready':'unavailable',service:'stethofuse-support',version:'1'});
  if(url.pathname!=='/api/support')return json(404,{ok:false,code:'not_found'});
  if(request.method!=='POST')return json(405,{ok:false,code:'method_not_allowed'},{Allow:'POST'});
  if(request.headers.get('Origin')!==ORIGIN||request.headers.get('Sec-Fetch-Site')==='cross-site')return json(403,{ok:false,code:'origin_not_allowed'});
  try{
   const value=validateMessage(await readJSON(request));
   if(!env.SUPPORT_MAIL||!env.SUPPORT_FROM||!env.SUPPORT_TO||!env.SUPPORT_RATE||!env.SUPPORT_GLOBAL_RATE)throw new Error('mail_not_configured');
   const ip=request.headers.get('CF-Connecting-IP');if(!ip)throw new Error('request_origin_unavailable');
   if(!(await env.SUPPORT_RATE.limit({key:'support:'+ip})).success||!(await env.SUPPORT_GLOBAL_RATE.limit({key:'stethofuse-support'})).success)return json(429,{ok:false,code:'too_many_requests'},{'Retry-After':'60'});
   const delivery=await env.SUPPORT_MAIL.send(makeEmail(value,reference,env));
   if(!delivery||typeof delivery.messageId!=='string'||!delivery.messageId)throw new Error('mail_acceptance_not_confirmed');
   console.log(JSON.stringify({event:'support_accepted',reference,messageId:delivery.messageId}));
   return json(202,{ok:true,reference});
  }catch(error){
   if(error instanceof InvalidRequest)return json(error.status,{ok:false,code:error.code});
   const providerCode=typeof error?.code==='string'&&/^[A-Z0-9_]{1,80}$/.test(error.code)?error.code:'UNCONFIRMED_MAIL_DELIVERY';
   console.error(JSON.stringify({event:'support_unavailable',reference,providerCode}));
   return json(503,{ok:false,code:'support_unavailable',reference});
  }
 }
};
