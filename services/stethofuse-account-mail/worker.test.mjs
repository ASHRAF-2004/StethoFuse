import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,verify as verifySignature} from 'node:crypto';
import {createWorker,appActionLink,credential,validateInput,ORIGIN,PROJECT,SERVICE_ACCOUNT} from './worker.mjs';
import {accountMessage} from './mail.mjs';

const keys=generateKeyPairSync('rsa',{modulusLength:2048}),privateKey=keys.privateKey.export({type:'pkcs8',format:'pem'});
const KEY='a'.repeat(40),API_KEY='fixture-public-configuration-key-12345',CODE='fixture_one_use_action_code_0001';
const mailCredential={project_id:PROJECT,client_email:SERVICE_ACCOUNT,private_key_id:KEY,private_key:privateKey};
const providerLink=(kind='reset')=>`https://${PROJECT}.firebaseapp.com/__/auth/action?apiKey=${API_KEY}&mode=${kind==='reset'?'resetPassword':'verifyEmail'}&oobCode=${CODE}&continueUrl=https%3A%2F%2Funtrusted.example`;
const response=(value,status=200)=>Response.json(value,{status});
function fixture(options={}){
 const calls=[],messages=[],logs=[],sleeps=[],rateKeys=[];
 const env={GOOGLE_MAIL_CREDENTIAL:JSON.stringify(mailCredential),FIREBASE_API_KEY:API_KEY,MAIL_DELIVERY_MODE:'resend-free',RESEND_FREE_TIER_CONFIRMED:'true',RESEND_API_KEY:'re_fixture_private_send_only_key_20261105',
  MAIL_IP_RATE:{limit:async()=>{if(options.rateError)throw Error('private rate failure');return {success:!options.ipBlocked};}},
  MAIL_GLOBAL_RATE:{limit:async()=>({success:!options.globalBlocked})},
  MAIL_RECIPIENT_RATE:{limit:async value=>{rateKeys.push(value.key);return {success:!options.recipientBlocked};}}
 };
 const network=async(url,init)=>{
  calls.push({url,init});
  if(url==='https://api.resend.com/emails'){
   assert.equal(init.headers.Authorization,'Bearer '+env.RESEND_API_KEY);assert.equal(init.redirect,'error');assert(init.headers['Idempotency-Key'].startsWith('stethofuse-account/'));
   if(options.mailFailure)throw Error('private downstream message');messages.push(JSON.parse(init.body));return response(options.noAcceptance?{}:{id:'00000000-0000-4000-8000-000000000001'});
  }
  if(url==='https://oauth2.googleapis.com/token'){
   const params=new URLSearchParams(init.body),jwt=params.get('assertion');assert.equal(params.get('grant_type'),'urn:ietf:params:oauth:grant-type:jwt-bearer');
   const [header,payload,signature]=jwt.split('.'),h=JSON.parse(Buffer.from(header,'base64url')),p=JSON.parse(Buffer.from(payload,'base64url'));
   assert.deepEqual(h,{alg:'RS256',typ:'JWT',kid:KEY});assert.equal(p.iss,SERVICE_ACCOUNT);assert.equal(p.scope,'https://www.googleapis.com/auth/identitytoolkit');assert.equal(p.aud,url);assert.equal(p.exp-p.iat,600);assert(verifySignature('RSA-SHA256',Buffer.from(header+'.'+payload),keys.publicKey,Buffer.from(signature,'base64url')));
   if(options.oauthFailure)return response({error:{message:'secret upstream failure'}},403);
   return response({access_token:'fixture-short-lived-google-token',expires_in:3600,token_type:'Bearer'});
  }
  if(url.includes('accounts:lookup?')){
   assert.equal(new URL(url).searchParams.get('key'),API_KEY);assert.equal(JSON.parse(init.body).idToken,'fixture.signed.identity');
   if(options.invalidUser)return response({error:{message:'INVALID_ID_TOKEN'}},400);
   return response({users:[{localId:'fixture-only-user',email:'verified-token-recipient@example.invalid',emailVerified:!!options.verified,disabled:!!options.disabled}]});
  }
  assert.equal(url,`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:sendOobCode`);assert.equal(init.headers.Authorization,'Bearer fixture-short-lived-google-token');
  const body=JSON.parse(init.body);assert.equal(body.returnOobLink,true);assert.equal(body.continueUrl,ORIGIN+'/login');assert.deepEqual(Object.keys(body).sort(),['continueUrl','email','requestType','returnOobLink']);
  if(options.absent)return response({error:{message:'EMAIL_NOT_FOUND'}},400);
  if(options.googleFailure)return response({error:{message:'secret provider debug details'}},503);
  return response({oobLink:options.badLink||providerLink(body.requestType==='PASSWORD_RESET'?'reset':'verify')});
 };
 const worker=createWorker({fetch:network,sleep:async ms=>sleeps.push(ms),now:()=>1800000000000,log:{log:value=>logs.push(value),error:value=>logs.push(value)}});
 const request=(kind='reset',body=kind==='reset'?{email:'owner-fixture@example.invalid',locale:'en'}:{locale:'en'},headers={})=>new Request(ORIGIN+'/api/account-mail/'+kind,{method:'POST',headers:{Origin:ORIGIN,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.42',...(kind==='verify'?{Authorization:'Bearer fixture.signed.identity'}:{}),...headers},body:JSON.stringify(body)});
 return {worker,env,calls,messages,logs,sleeps,rateKeys,request};
}
test('reset uses a signed, narrowly scoped server token and only emails an app-owned link',async()=>{
 const f=fixture(),r=await f.worker.fetch(f.request(),f.env);assert.equal(r.status,202);assert.equal(r.headers.get('cache-control'),'no-store');assert.deepEqual(Object.keys(await r.json()).sort(),['ok','reference']);assert.equal(f.messages.length,1);
 const mail=f.messages[0];assert.deepEqual(mail.to,['owner-fixture@example.invalid']);assert.equal(mail.from,'StethoFuse <stethofuse@notify.stethofuse.ashraf-alsaloul.com>');assert(mail.html.includes('&amp;oobCode='+CODE));assert(mail.text.includes(ORIGIN+'/auth/action?'));assert(!mail.html.includes('untrusted.example'));assert(!mail.html.includes(API_KEY));
 assert.equal(f.calls.length,3);assert.deepEqual(f.sleeps,[750]);
});
test('verification binds recipient to provider-validated identity, never request email',async()=>{
 const f=fixture(),r=await f.worker.fetch(f.request('verify'),f.env);assert.equal(r.status,202);assert.deepEqual(f.messages[0].to,['verified-token-recipient@example.invalid']);assert.equal(JSON.parse(f.calls.find(c=>c.url.endsWith('accounts:sendOobCode')).init.body).requestType,'VERIFY_EMAIL');
});
test('Arabic email is HTML and plain text, RTL, escaped and app-linked',()=>{
 const mail=accountMessage({kind:'verify',locale:'ar',email:'fixture@example.invalid',link:ORIGIN+'/auth/action?mode=verifyEmail&oobCode='+CODE,reference:'fixture<reference>'});assert(mail.html.includes('lang="ar" dir="rtl"'));assert(mail.subject.includes('تأكيد'));assert(mail.text.includes('تأكيد'));assert(mail.html.includes('fixture&lt;reference&gt;'));assert(!mail.html.includes('fixture<reference>'));assert(mail.html.includes('Ashraf Ali Hussain Al-Saloul'));
});
for(const [name,options]of Object.entries({absent:{absent:true},mailFailure:{mailFailure:true},googleFailure:{googleFailure:true},oauthFailure:{oauthFailure:true},recipientBlocked:{recipientBlocked:true},noAcceptance:{noAcceptance:true}}))test('reset never enumerates recipient on '+name,async()=>{
 const f=fixture(options),r=await f.worker.fetch(f.request(),f.env);assert.equal(r.status,202);const body=await r.json();assert.equal(body.ok,true);assert.deepEqual(Object.keys(body).sort(),['ok','reference']);assert.equal(body.email,undefined);assert(!JSON.stringify(body).includes(CODE));assert.equal(f.sleeps[0],750);
});
for(const [name,options]of Object.entries({ip:{ipBlocked:true},global:{globalBlocked:true}}))test(name+' rate limit precedes Google or mail access',async()=>{
 const f=fixture(options),r=await f.worker.fetch(f.request(),f.env);assert.equal(r.status,429);assert.equal(r.headers.get('Retry-After'),'60');assert.equal(f.calls.length,0);assert.equal(f.messages.length,0);
});
test('rate control errors fail closed without raw downstream details',async()=>{const f=fixture({rateError:true}),r=await f.worker.fetch(f.request(),f.env);assert.equal(r.status,503);assert(!JSON.stringify(f.logs).includes('private rate failure'));assert.equal(f.calls.length,0);});
test('recipient limits use normalized hashes rather than raw email',async()=>{const f=fixture({recipientBlocked:true});await f.worker.fetch(f.request('reset',{email:'Owner-Fixture@example.invalid',locale:'en'}),f.env);assert.equal(f.rateKeys.length,1);assert(!f.rateKeys[0].includes('@'));assert.equal(f.calls.length,0);});
for(const [name,body]of Object.entries({emailInjection:{email:'evil@example.invalid\r\nBcc: other@example.invalid',locale:'en'},locale:{email:'fixture@example.invalid',locale:'xx'},redirect:{email:'fixture@example.invalid',locale:'en',continueUrl:'https://attacker.invalid'},recipientSpoof:{locale:'en',email:'other@example.invalid'}}))test('rejects invalid '+name+' before provider access',async()=>{
 const f=fixture(),r=await f.worker.fetch(f.request(name==='recipientSpoof'?'verify':'reset',body),f.env);assert.equal(r.status,400);assert.equal(f.calls.length,0);
});
test('rejects oversized body including streamed requests without Content-Length',async()=>{const f=fixture(),r=await f.worker.fetch(f.request('reset',{email:'a'.repeat(1800),locale:'en'}),f.env);assert.equal(r.status,413);assert.equal(f.calls.length,0);});
test('rejects non-JSON content type',async()=>{const f=fixture(),r=await f.worker.fetch(f.request('reset',undefined,{'Content-Type':'application/json-attacker'}),f.env);assert.equal(r.status,415);});
for(const [name,headers]of Object.entries({origin:{Origin:'https://attacker.invalid'},crossSite:{'Sec-Fetch-Site':'cross-site'},missingOrigin:{Origin:''}}))test('rejects '+name,async()=>{const f=fixture(),r=await f.worker.fetch(f.request('reset',undefined,headers),f.env);assert.equal(r.status,403);assert.equal(f.calls.length,0);});
test('no open relay on other hosts, paths or methods',async()=>{
 const f=fixture();for(const [url,status]of [[ORIGIN+'/api/account-mail/send',404],['https://other.example/api/account-mail/reset',404],[ORIGIN+'/api/account-mail/reset',405]])assert.equal((await f.worker.fetch(new Request(url),f.env)).status,status);assert.equal(f.calls.length,0);
});
test('missing credentials cannot report configured or use a provider',async()=>{const f=fixture();delete f.env.GOOGLE_MAIL_CREDENTIAL;assert.equal((await f.worker.fetch(new Request(ORIGIN+'/api/account-mail/health'),f.env)).status,503);assert.equal((await f.worker.fetch(f.request(),f.env)).status,503);assert.equal(f.calls.length,0);});
test('health reports configuration, not an unproven inbox-delivery claim',async()=>{const f=fixture(),r=await f.worker.fetch(new Request(ORIGIN+'/api/account-mail/health'),f.env);assert.equal(r.status,200);assert.deepEqual(await r.json(),{service:'stethofuse-account-mail',status:'configured',version:'1'});assert.equal(f.calls.length,0);});
for(const options of [{invalidUser:true},{disabled:true}])test('rejects invalid/restricted verification identity',async()=>{const f=fixture(options),r=await f.worker.fetch(f.request('verify'),f.env);assert.equal(r.status,401);assert.equal(f.messages.length,0);assert.equal(f.calls.length,1);});
test('missing bearer is rejected without Google access',async()=>{const f=fixture(),r=await f.worker.fetch(f.request('verify',undefined,{Authorization:''}),f.env);assert.equal(r.status,401);assert.equal(f.calls.length,0);});
test('already-verified identity generates no mail',async()=>{const f=fixture({verified:true}),r=await f.worker.fetch(f.request('verify'),f.env);assert.equal(r.status,202);assert.equal(f.messages.length,0);assert.equal(f.calls.length,1);});
test('verification delivery failure is honest and safe',async()=>{const f=fixture({mailFailure:true}),r=await f.worker.fetch(f.request('verify'),f.env);assert.equal(r.status,503);assert(!JSON.stringify(await r.json()).includes('private downstream'));});
test('token reuse and concurrent minting do not repeatedly import/sign credentials',async()=>{
 const f=fixture();await Promise.all([f.worker.fetch(f.request('reset',{email:'one@example.invalid',locale:'en'}),f.env),f.worker.fetch(f.request('reset',{email:'two@example.invalid',locale:'en'}),f.env)]);assert.equal(f.calls.filter(c=>c.url==='https://oauth2.googleapis.com/token').length,1);assert.equal(f.messages.length,2);
});
test('logs contain no email, identity token, credential, access token or action code',async()=>{
 const f=fixture();await f.worker.fetch(f.request('verify'),f.env);const logs=f.logs.join('\n');for(const secret of ['@example.invalid','fixture.signed.identity',privateKey,'fixture-short-lived-google-token',CODE,API_KEY])assert(!logs.includes(secret));assert(logs.includes('account_mail_accepted'));
});
test('a foreign service credential is rejected rather than broadening Google access',()=>{assert.throws(()=>credential({GOOGLE_MAIL_CREDENTIAL:JSON.stringify({...mailCredential,client_email:'owner@example.invalid'})}),/MAIL_NOT_CONFIGURED/);assert.throws(()=>credential({GOOGLE_MAIL_CREDENTIAL:JSON.stringify({...mailCredential,project_id:'other'})}),/MAIL_NOT_CONFIGURED/);});
test('wrong project, operation, duplicate code, foreign key and redirect links are rejected',()=>{
 for(const link of [providerLink().replace(PROJECT,'other-project'),providerLink('verify'),providerLink()+'&oobCode=duplicate',providerLink().replace(API_KEY,'other-key'),providerLink().replace('https://','https://attacker.invalid/'),providerLink()+'#fragment'])assert.throws(()=>appActionLink(link,'reset','en',API_KEY),/INVALID_PROVIDER_LINK/);
 const action=new URL(appActionLink(providerLink(),'reset','ar',API_KEY));assert.equal(action.origin,ORIGIN);assert.equal(action.searchParams.get('lang'),'ar');assert.deepEqual([...action.searchParams.keys()],['mode','oobCode','lang']);
});
test('invalid provider link never reaches the mail sender',async()=>{const f=fixture({badLink:'https://attacker.invalid/action'}),r=await f.worker.fetch(f.request(),f.env);assert.equal(r.status,202);assert.equal(f.messages.length,0);assert(f.logs.join('').includes('INVALID_PROVIDER_LINK'));});
test('verification input has no user-selectable recipient or action',()=>{assert.throws(()=>validateInput({locale:'en',email:'other@example.invalid'},'verify'),/INVALID_REQUEST/);assert.throws(()=>validateInput({locale:'en',requestType:'EMAIL_SIGNIN'},'verify'),/INVALID_REQUEST/);});
