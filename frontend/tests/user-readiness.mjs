// REAL temporary SQLite/files/API; fixed fictional provider only. No live accounts.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const base='http://127.0.0.1:4186';
const out=path.resolve('output/playwright/user-readiness');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',headless:true});
const report={scope:'Real isolated API3 and SQLite/private files, fixed fictional SDK/verifier, no live provider or inference',checks:[],errors:[]};
async function check(name,fn){await fn();report.checks.push({name,status:'PASS'});console.log('PASS '+name);}
async function context(uid){
 const c=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'});
 await c.route('**/node_modules/.vite-readiness/deps/firebase_app.js*',r=>r.fulfill({contentType:'application/javascript',path:path.resolve('tests/m1/mock-firebase-app.mjs')}));
 await c.route('**/node_modules/.vite-readiness/deps/firebase_auth.js*',r=>r.fulfill({contentType:'application/javascript',path:path.resolve('tests/m1/mock-firebase-auth.mjs')}));
 await c.route('**/src/config/runtime.ts*',r=>r.fulfill({contentType:'application/javascript',body:"export const FIREBASE_PROJECT='stethofuse-c18cd-3cca0';export const PUBLIC_ORIGIN='https://stethofuse.ashraf-alsaloul.com';export const DEMO_ENABLED=false;export const firebaseConfigurationError='';export const firebaseConfiguration=()=>({projectId:FIREBASE_PROJECT});"}));
 await c.addInitScript(({uid,origin})=>{if(location.origin===origin)sessionStorage.setItem('__m1_test_identity',JSON.stringify({uid,verified:true}));},{uid,origin:base});
 await c.route(url=>['http:','https:'].includes(url.protocol)&&url.origin!==base,r=>r.abort());
 c.on('page',p=>p.on('pageerror',e=>report.errors.push(e.message)));return c;
}
try{
 const a=await context('alice'),p=await a.newPage();await p.goto(base+'/app/profile');await p.getByRole('heading',{name:'Your profile',exact:true}).waitFor();
 await check('Private profile photo uses approved crop and persists through reload',async()=>{
  const bytes=await p.evaluate(async()=>{const c=document.createElement('canvas');c.width=256;c.height=256;const g=c.getContext('2d');g.fillStyle='#245d4c';g.fillRect(0,0,256,256);g.fillStyle='#eef2ed';g.fillRect(60,60,140,140);return [...new Uint8Array(await(await new Promise(resolve=>c.toBlob(resolve,'image/png'))).arrayBuffer())];});
  await p.getByLabel('Choose profile photo').setInputFiles({name:'fictional-avatar.png',mimeType:'image/png',buffer:Buffer.from(bytes)});
  const modal=p.getByRole('dialog',{name:'Choose your crop'});await modal.waitFor();await modal.getByLabel('Avatar zoom').press('ArrowRight');await modal.getByRole('button',{name:'Save photo',exact:true}).click();await modal.waitFor({state:'hidden'});
  await p.waitForFunction(()=>document.querySelector('.sf-profile-summary img')?.src.startsWith('data:image/png;base64,'));
  await p.reload();await p.getByRole('heading',{name:'Your profile',exact:true}).waitFor();await p.waitForFunction(()=>document.querySelector('.sf-header-avatar img')?.src.startsWith('data:image/png;base64,'));
  assert.equal(await p.locator('.sf-sidebar-account img').count(),1);await p.screenshot({path:path.join(out,'profile-photo-persisted.png')});
 });
 const b=await context('bob'),other=await b.newPage();
 await check('Another account receives no saved photo or metadata from the owner',async()=>{
  await other.goto(base+'/app/profile');await other.getByRole('heading',{name:'Your profile',exact:true}).waitFor();assert.equal(await other.locator('.sf-profile-summary img,.sf-header-avatar img').count(),0);
  const json=await other.evaluate(async()=>{const r=await fetch('/api/auth/me/avatar',{headers:{Authorization:'Bearer M1-MOCK:bob'}});return r.json();});assert.deepEqual(json,{avatar:null});
 });
 await check('Frost/Midnight preference carries from workspace to home without identity data',async()=>{
  await p.getByRole('button',{name:'Switch to Midnight theme'}).click();await p.goto(base+'/');await p.waitForFunction(()=>document.querySelector('.sf-public')?.dataset.theme==='midnight');
  assert.equal(await p.evaluate(()=>localStorage.getItem('sf-public-theme')),'midnight');
  await p.getByRole('button',{name:'Switch to Frost theme'}).click();await p.goto(base+'/app/profile');await p.getByRole('heading',{name:'Your profile',exact:true}).waitFor();
 });
 await check('Account metadata export is an actual private JSON download',async()=>{
  await p.goto(base+'/app/settings?section=privacy');const pending=p.waitForEvent('download');await p.getByRole('button',{name:'Export metadata',exact:true}).click();const download=await pending;const location=await download.path();const data=JSON.parse(await fs.readFile(location,'utf8'));assert.equal(data.account.uid,'alice');assert.equal(data.audio_included,false);assert.equal(data.format,'stethofuse-account-metadata-v1');
 });
 await check('Removing the photo clears every profile and shell view',async()=>{
  await p.goto(base+'/app/profile');await p.getByRole('button',{name:'Remove photo'}).click();await p.waitForFunction(()=>!document.querySelector('.sf-profile-summary img'));assert.equal(await p.locator('.sf-header-avatar img,.sf-sidebar-account img').count(),0);
 });
 let recording,sharing;
 await check('Real saved jobs and sharing produce scoped in-app updates and persisted read state',async()=>{
  ({recording,sharing}=await p.evaluate(async()=>{
   const headers={Authorization:'Bearer M1-MOCK:alice'},bytes=new Uint8Array(844),view=new DataView(bytes.buffer);
   const word=(at,text)=>[...text].forEach((letter,i)=>bytes[at+i]=letter.charCodeAt(0));
   word(0,'RIFF');view.setUint32(4,836,true);word(8,'WAVE');word(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,4000,true);view.setUint32(28,8000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);word(36,'data');view.setUint32(40,800,true);
   const form=new FormData();form.append('file',new Blob([bytes],{type:'audio/wav'}),'fictional-notification.wav');form.append('title','Private fictional notification fixture');
   const recording=await(await fetch('/api/recordings',{method:'POST',headers,body:form})).json();
   const job=await fetch('/api/recordings/'+recording.id+'/jobs',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:'{}'});if(!job.ok)throw new Error('Isolated queue admission failed');
   const bob=await(await fetch('/api/auth/me',{headers:{Authorization:'Bearer M1-MOCK:bob'}})).json();
   const sharing=await(await fetch('/api/recordings/'+recording.id+'/grants',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({recipient_id:bob.user.id,resource_id:recording.original_resource_id,permission:'read'})})).json();return {recording,sharing};
  }));
  await p.goto(base+'/app/notifications');await p.getByRole('link',{name:'Your recording is queued',exact:true}).waitFor();
  assert.equal(await p.locator('.sf-notification-list li[data-unread="true"]').count(),1);
  await p.getByRole('button',{name:'Mark displayed as read'}).click();await p.waitForFunction(()=>!document.querySelector('.sf-notification-list li[data-unread="true"]'));
  await p.reload();await p.getByRole('link',{name:'Your recording is queued',exact:true}).waitFor();assert.equal(await p.locator('.sf-notification-count').count(),0);
  await other.goto(base+'/app/notifications');await other.getByRole('link',{name:'A recording was shared with you',exact:true}).waitFor();assert.equal(await other.getByRole('link',{name:'Your recording is queued',exact:true}).count(),0);
  await p.setViewportSize({width:320,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.setViewportSize({width:1440,height:960});await p.screenshot({path:path.join(out,'notifications-real-state.png')});
 });
 await check('In-app preferences filter saved updates and revoked sharing stays generic',async()=>{
  await p.goto(base+'/app/settings?section=notifications');await p.getByRole('checkbox',{name:/Processing updates/}).uncheck();await p.getByRole('link',{name:'View your updates'}).click();await p.getByRole('heading',{name:'You’re up to date.'}).waitFor();
  await p.goto(base+'/app/settings?section=notifications');await p.getByRole('checkbox',{name:/Processing updates/}).check();await p.getByRole('link',{name:'View your updates'}).click();await p.getByRole('link',{name:'Your recording is queued',exact:true}).waitFor();
  await p.evaluate(async id=>{const response=await fetch('/api/grants/'+id,{method:'DELETE',headers:{Authorization:'Bearer M1-MOCK:alice'}});if(!response.ok)throw new Error('Temporary grant revocation failed');},sharing.id);
  await other.getByRole('button',{name:'Refresh',exact:true}).click();await other.getByRole('link',{name:'Shared access has closed',exact:true}).waitFor();assert.equal(await other.getByText('Private fictional notification fixture').count(),0);
  await other.goto(base+'/app/profile');await other.getByRole('heading',{name:'Your profile',exact:true}).waitFor();
 });
 await check('Deletion requires a typed confirmation, then closes the real temporary account',async()=>{
  await p.goto(base+'/app/settings?section=privacy');await p.getByRole('button',{name:'Delete account',exact:true}).click();const modal=p.getByRole('dialog',{name:'Permanently delete your account?'});await modal.waitFor();assert.equal(await modal.getByRole('button',{name:'Permanently delete',exact:true}).isDisabled(),true);await modal.getByLabel('Type DELETE to confirm').fill('DELETE');await modal.getByRole('button',{name:'Permanently delete',exact:true}).click();await p.waitForURL(base+'/login');await p.getByRole('status').filter({hasText:'have been deleted'}).waitFor();
  await other.reload();await other.getByRole('heading',{name:'Your profile',exact:true}).waitFor();assert.equal(await other.locator('.sf-profile-summary img').count(),0);
 });
 assert.deepEqual(report.errors,[]);await a.close();await b.close();
}finally{
 report.pages=[];for(const c of browser.contexts())for(const p of c.pages()){report.pages.push({url:p.url(),details:await p.evaluate(()=>({history:history.state,text:document.body.innerText.slice(0,2200)})).catch(()=>null)});await p.screenshot({path:path.join(out,'account-last-'+report.pages.length+'.png')}).catch(()=>{});}
 await fs.writeFile(path.join(out,'account-results.json'),JSON.stringify(report,null,2));await browser.close();
}
