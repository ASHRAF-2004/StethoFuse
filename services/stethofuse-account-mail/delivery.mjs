// Paid native Email Sending is deliberately not a fallback for this service.
export class DeliveryError extends Error{constructor(code){super(code);this.code=code;}}
export function configuredDelivery(env){
 if(env.MAIL_DELIVERY_MODE!=='resend-free'||env.RESEND_FREE_TIER_CONFIRMED!=='true'||!/^re_[a-zA-Z0-9_-]{20,150}$/.test(env.RESEND_API_KEY||''))throw new DeliveryError('FREE_MAIL_NOT_CONFIGURED');
}
export async function deliverEmail(message,reference,env,network=globalThis.fetch){
 configuredDelivery(env);
 const payload={from:`${message.from.name} <${message.from.email}>`,to:[message.to],subject:message.subject,text:message.text,html:message.html};
 let response;
 try{response=await network('https://api.resend.com/emails',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(8000),headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'stethofuse-account/'+reference},body:JSON.stringify(payload)});}catch{throw new DeliveryError('DELIVERY_UNCONFIRMED');}
 // Never enable overages, switch plans, retry through a paid provider, or log bodies.
 if(response.status===429)throw new DeliveryError('FREE_MAIL_RATE_OR_QUOTA_LIMIT');
 if(response.status===401||response.status===403)throw new DeliveryError('FREE_MAIL_NOT_AUTHORIZED');
 if(!response.ok)throw new DeliveryError('DELIVERY_UNCONFIRMED');
 let value;try{value=await response.json();}catch{throw new DeliveryError('DELIVERY_UNCONFIRMED');}
 if(typeof value.id!=='string'||!/^[a-f0-9-]{36}$/.test(value.id))throw new DeliveryError('DELIVERY_UNCONFIRMED');
 return {messageId:value.id};
}
