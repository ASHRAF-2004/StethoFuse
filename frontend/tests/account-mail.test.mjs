import test,{mock} from 'node:test';
import assert from 'node:assert/strict';
import {requestAccountMail} from '../src/auth/account-mail.ts';

const reference='00000000-0000-4000-8000-000000000001';
const capability=()=>Response.json({service:'stethofuse-account-mail',status:'configured',version:'1'});
function setup(replies,lang='en'){
 const calls=[];globalThis.document={documentElement:{lang}};
 mock.method(globalThis,'fetch',async(url,options)=>{calls.push({url,options});const next=replies.shift();if(next instanceof Error)throw next;assert(next,'Unexpected network call');return next;});return calls;
}
test.afterEach(()=>{mock.restoreAll();delete globalThis.document;});
for(const status of [404,410])test('missing dedicated service preserves existing provider ('+status+')',async()=>{const calls=setup([new Response('',{status})]);assert.equal(await requestAccountMail('reset','fixture@example.invalid'),false);assert.equal(calls.length,1);});
test('native recovery sends bounded input and no identity credentials or selected action URL',async()=>{
 const calls=setup([capability(),Response.json({ok:true,reference},{status:202})],'ar');assert.equal(await requestAccountMail('reset','fixture@example.invalid'),true);
 assert.deepEqual(JSON.parse(calls[1].options.body),{locale:'ar',email:'fixture@example.invalid'});assert.deepEqual(calls[1].options.headers,{'Content-Type':'application/json'});assert.equal(calls[1].url,'/api/account-mail/reset');assert.equal(calls[1].options.credentials,'omit');assert.equal(calls[1].options.cache,'no-store');
});
test('native verification sends only locale and the signed-in ID token in a header',async()=>{
 const calls=setup([capability(),Response.json({ok:true,reference},{status:202})]);await requestAccountMail('verify',undefined,'fixture.identity.token');assert.deepEqual(JSON.parse(calls[1].options.body),{locale:'en'});assert.equal(calls[1].options.headers.Authorization,'Bearer fixture.identity.token');assert(!calls[1].options.body.includes('fixture.identity.token'));
});
for(const [name,replies]of Object.entries({healthFailure:[new Response('',{status:503})],healthNetwork:[new Error('private network details')],unrecognizedHealth:[Response.json({status:'configured'})],sendNetwork:[capability(),new Error('private send error')],partialAcknowledgement:[capability(),Response.json({ok:true},{status:202})],falseSuccess:[capability(),Response.json({ok:false,reference},{status:202})],wrongHTTP:[capability(),Response.json({ok:true,reference})]}))test('fails safely without silently falling back after '+name,async()=>{
 setup(replies);await assert.rejects(requestAccountMail('reset','fixture@example.invalid'),error=>error.code==='auth/network-request-failed'&&!error.message.includes('private'));
});
for(const [status,code]of [[429,'auth/too-many-requests'],[401,'auth/user-token-expired']])test('maps safe mail status '+status,async()=>{setup([capability(),new Response('',{status})]);await assert.rejects(requestAccountMail('verify',undefined,'fixture.identity.token'),{code});});
test('capability checks are not cached across account or service changes',async()=>{
 const calls=setup([capability(),Response.json({ok:true,reference},{status:202}),new Response('',{status:404})]);assert.equal(await requestAccountMail('reset','one@example.invalid'),true);assert.equal(await requestAccountMail('reset','two@example.invalid'),false);assert.equal(calls.filter(c=>c.url.endsWith('/health')).length,2);
});
