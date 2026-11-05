import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.argv[2];assert(base);const browser=await chromium.launch(),report={scope:'Compiled recovery UI with intercepted native mail and official SDK endpoints; no real account or email',states:[],errors:[]};
try{
 for(const locale of ['en','ar'])for(const status of [202,429,503]){
  const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await c.addInitScript(locale=>localStorage.setItem('sf-language',locale),locale);let health=0,sends=0,providerSends=0;
  await c.route('**/api/account-mail/health',async route=>{health++;await route.fulfill({contentType:'application/json',body:JSON.stringify({service:'stethofuse-account-mail',status:'configured',version:'1'})});});
  await c.route('**/api/account-mail/reset',async route=>{sends++;assert.deepEqual(route.request().postDataJSON(),{locale,email:'fixture@example.invalid'});assert.equal(route.request().method(),'POST');assert.equal(route.request().headers().authorization,undefined);await route.fulfill({status,contentType:'application/json',body:JSON.stringify(status===202?{ok:true,reference:'00000000-0000-4000-8000-000000000001'}:{ok:false,code:status===429?'too_many_requests':'mail_unavailable'})});});
  await c.route('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode*',async route=>{providerSends++;await route.abort();});
  const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(base+'/forgot-password');await p.locator('input[type=email]').fill('fixture@example.invalid');await p.locator('form button[type=submit]').click();
  await p.locator(status===202?'form [role=status]':'form [role=alert]').waitFor();assert.equal(health,1);assert.equal(sends,1);assert.equal(providerSends,0);assert.equal(await p.locator('input[type=email]').inputValue(),'fixture@example.invalid');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(status!==202)assert.equal(await p.locator('form button[type=submit]').isEnabled(),true);report.states.push({locale,status,health,sends,providerSends,requestPreserved:true});await c.close();
 }
 // An Arabic email opens the Arabic action page even in a fresh English browser.
 const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await c.addInitScript(()=>localStorage.setItem('sf-language','en'));
 await c.route('https://identitytoolkit.googleapis.com/v1/accounts:resetPassword*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({email:'fixture@example.invalid',requestType:'PASSWORD_RESET'})}));
 const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(base+'/auth/action?mode=resetPassword&oobCode=fixture-one-use-code&lang=ar');await p.locator('#new-password').waitFor();assert.equal(await p.locator('html').getAttribute('lang'),'ar');assert.equal(await p.locator('html').getAttribute('dir'),'rtl');assert(!p.url().includes('oobCode'));report.states.push({locale:'ar',actionLanguageHonoured:true,codeRemoved:true});await c.close();
 assert.deepEqual(report.errors,[]);report.status='PASS_COMPILED_ACCOUNT_MAIL_JOURNEYS';
}finally{await browser.close();await fs.mkdir('evidence/account-mail',{recursive:true});await fs.writeFile('evidence/account-mail/browser.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify({status:report.status,states:report.states.length,errors:report.errors}));
