import test from 'node:test';
import assert from 'node:assert/strict';
import {configuredDelivery,deliverEmail} from './delivery.mjs';
import {accountMessage} from './mail.mjs';
const reference='00000000-0000-4000-8000-000000000001';
const env={MAIL_DELIVERY_MODE:'resend-free',RESEND_FREE_TIER_CONFIRMED:'true',RESEND_API_KEY:'re_fixture_sending_key_only_for_tests_20261105'};
const message=accountMessage({kind:'reset',locale:'en',email:'fixture@example.invalid',link:'https://stethofuse.ashraf-alsaloul.com/auth/action?mode=resetPassword&oobCode=fixture-code',reference});
test('the only permitted transport is the explicitly confirmed free provider',()=>{
 assert.doesNotThrow(()=>configuredDelivery(env));
 for(const patch of [{MAIL_DELIVERY_MODE:'cloudflare-native'},{MAIL_DELIVERY_MODE:'resend-paid'},{RESEND_FREE_TIER_CONFIRMED:'false'},{RESEND_FREE_TIER_CONFIRMED:undefined},{RESEND_API_KEY:'invalid'}])assert.throws(()=>configuredDelivery({...env,...patch}),/FREE_MAIL_NOT_CONFIGURED/);
});
test('uses only the fixed HTTPS email endpoint, scoped secret and minimal payload',async()=>{
 const result=await deliverEmail(message,reference,env,async(url,request)=>{
  assert.equal(url,'https://api.resend.com/emails');assert.equal(request.method,'POST');assert.equal(request.redirect,'error');assert.equal(request.headers.Authorization,'Bearer '+env.RESEND_API_KEY);assert.equal(request.headers['Idempotency-Key'],'stethofuse-account/'+reference);
  const body=JSON.parse(request.body);assert.deepEqual(Object.keys(body).sort(),['from','html','subject','text','to']);assert.deepEqual(body.to,['fixture@example.invalid']);assert.equal(body.from,'StethoFuse <stethofuse@notify.stethofuse.ashraf-alsaloul.com>');assert(body.html.includes('StethoFuse'));assert(body.text.includes('Reset password'));assert(!request.body.includes(env.RESEND_API_KEY));
  return Response.json({id:reference});
 });assert.deepEqual(result,{messageId:reference});
});
for(const [status,code]of [[429,'FREE_MAIL_RATE_OR_QUOTA_LIMIT'],[401,'FREE_MAIL_NOT_AUTHORIZED'],[403,'FREE_MAIL_NOT_AUTHORIZED'],[500,'DELIVERY_UNCONFIRMED'],[409,'DELIVERY_UNCONFIRMED']])test('HTTP '+status+' stops without retry, upgrade, paid fallback or leaked provider body',async()=>{
 let calls=0;await assert.rejects(deliverEmail(message,reference,env,async()=>{calls++;return Response.json({message:'private provider details and action codes'},{status});}),e=>e.code===code&&!e.message.includes('private'));assert.equal(calls,1);
});
test('network uncertainty never triggers another provider or a false accepted ID',async()=>{let calls=0;await assert.rejects(deliverEmail(message,reference,env,async()=>{calls++;throw Error('private DNS details');}),{code:'DELIVERY_UNCONFIRMED'});assert.equal(calls,1);});
for(const body of [{},{id:''},{id:'unsafe email@example.invalid'},{ok:true}])test('partial provider acceptance is rejected '+JSON.stringify(body),async()=>{await assert.rejects(deliverEmail(message,reference,env,async()=>Response.json(body)),{code:'DELIVERY_UNCONFIRMED'});});
test('invalid free configuration performs no network request',async()=>{let calls=0;await assert.rejects(deliverEmail(message,reference,{},async()=>{calls++;return Response.json({id:reference});}),{code:'FREE_MAIL_NOT_CONFIGURED'});assert.equal(calls,0);});
