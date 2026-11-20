// LOCAL acceptance for the patient board: REAL API (tests/m1/ml_fixture.py, fictional identities), REAL Vite proxy.
// Only identity is substituted (existing Firebase SDK stand-ins). No worker, inference or production data.
//   STETHOFUSE_TEST_API=http://127.0.0.1:8765 CHROME_PATH=<chrome> node tests/patient-board.mjs
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const api=process.env.STETHOFUSE_TEST_API;
if(!api||!/^http:\/\/127\.0\.0\.1:\d+$/.test(api))throw new Error('Set STETHOFUSE_TEST_API to the loopback URL of tests/m1/ml_fixture.py.');
const chrome=process.env.CHROME_PATH||'/usr/bin/google-chrome';
const output=path.resolve(process.env.EVIDENCE_ROOT||'output/playwright/patient-board');
const base='http://127.0.0.1:4195',here=path.dirname(fileURLToPath(import.meta.url));
const headers=uid=>({Authorization:`Bearer M1-MOCK:${uid}`});
const checks=[],errors=[],shots=[];

function wav(seconds=3,rate=4000){
  const n=seconds*rate,buffer=Buffer.alloc(44+2*n);
  buffer.write('RIFF',0);buffer.writeUInt32LE(36+2*n,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);
  buffer.writeUInt32LE(rate,24);buffer.writeUInt32LE(rate*2,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(2*n,40);
  for(let i=0;i<n;i++)buffer.writeInt16LE(Math.round(6000*Math.sin(2*Math.PI*120*i/rate)),44+2*i);
  return buffer;
}
async function waitFor(url){for(let i=0;i<120;i++){try{if((await fetch(url)).status<500)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw new Error(`${url} did not start`);}
async function check(name,fn){try{await fn();checks.push({name,pass:true});console.log('PASS',name);}catch(e){checks.push({name,pass:false,error:String(e)});console.log('FAIL',name,e);}}

await mkdir(output,{recursive:true});
await waitFor(api+'/health');
const vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4195','--strictPort'],{env:{...process.env,STETHOFUSE_API_PROXY:api},stdio:'ignore'});
let browser;
try{
  await waitFor(base);
  const form=new FormData();form.set('file',new Blob([wav()],{type:'audio/wav'}),'board.wav');form.set('title','Patient board fictional sample');
  const recording=await (await fetch(api+'/api/recordings',{method:'POST',headers:headers('alice'),body:form})).json();
  const status=await (await fetch(api+'/api/clinical-targets',{headers:headers('alice')})).json();
  browser=await chromium.launch({executablePath:chrome,headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  await context.route('**/node_modules/.vite/deps/firebase_app.js*',r=>r.fulfill({contentType:'application/javascript',path:path.join(here,'m1/mock-firebase-app.mjs')}));
  await context.route('**/node_modules/.vite/deps/firebase_auth.js*',r=>r.fulfill({contentType:'application/javascript',path:path.join(here,'m1/mock-firebase-auth.mjs')}));
  await context.route('**/src/config/runtime.ts*',r=>r.fulfill({contentType:'application/javascript',body:"export const FIREBASE_PROJECT='stethofuse-c18cd-3cca0';export const PUBLIC_ORIGIN='https://stethofuse.ashraf-alsaloul.com';export const DEMO_ENABLED=false;export const firebaseConfigurationError='';export const firebaseConfiguration=()=>({projectId:FIREBASE_PROJECT});"}));
  await context.route(url=>['http:','https:'].includes(url.protocol)&&url.origin!==base,r=>{errors.push('external request '+r.request().url());return r.abort();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const shot=async name=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(output,name),fullPage:false});shots.push(name);};
  await page.goto(base+'/login');await page.getByRole('textbox',{name:'Email address',exact:true}).fill('alice@example.invalid');
  await page.getByLabel('Password',{exact:true}).fill('Fictional-local-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.locator('[data-live-workspace=true]').waitFor();

  await check('Board lists every published condition with its real state',async()=>{
    await page.goto(`${base}/app/recordings/${recording.id}`);
    const board=page.getByRole('region',{name:'Patient board'});await board.waitFor();
    await board.locator('.sf-tile').first().waitFor();
    assert.equal(await board.locator('.sf-tile').count(),status.targets.length);
    const unlocked=status.targets.filter(t=>t.status==='activated').length;
    assert.equal(unlocked,0,'no target is activated in the published status');
    assert.equal(await board.locator('.sf-tile[data-state=validated]').count(),0);
    const gate=await board.locator('.sf-gate-line').innerText();
    if(status.gate.status==='passed')assert.match(gate,/passed testing.*not switched on/);
    else if(status.gate.status!=='activated')assert.match(gate,/not active yet/);
    await page.waitForTimeout(1500);await board.scrollIntoViewIfNeeded();await shot('01-board-desktop.png');
  });
  await check('Owner adds pseudonymous case details from the server spec',async()=>{
    const board=page.getByRole('region',{name:'Patient board'});
    await board.getByRole('button',{name:'Add case details'}).click();
    await board.getByLabel('Age group').selectOption('child');
    await board.getByText('Cough',{exact:true}).click();await board.getByText('Fever',{exact:true}).click();
    await board.getByLabel('Case reference code').fill('CASE-7');
    await shot('02-case-form.png');
    await board.getByRole('button',{name:'Save case details'}).click();
    await board.getByText('Child (1–11)').waitFor();
    assert.match(await board.locator('.sf-case-list').innerText(),/Cough, Fever/);
    const saved=await (await fetch(`${api}/api/recordings/${recording.id}/context`,{headers:headers('alice')})).json();
    assert.deepEqual(saved.context,{age_group:'child',case_reference:'CASE-7',symptoms:['cough','fever']});
  });
  await check('Free-text identifiers are refused with a readable error',async()=>{
    const board=page.getByRole('region',{name:'Patient board'});
    await board.getByRole('button',{name:'Edit case details'}).click();
    await board.getByLabel('Case reference code').fill('Jane Doe');
    await board.getByRole('button',{name:'Save case details'}).click();
    await board.getByRole('alert').waitFor();
    await board.getByRole('button',{name:'Cancel'}).click();
  });
  await check('A locked tile explains what is still needed to unlock it',async()=>{
    const tile=page.locator('.sf-tile[data-state=locked]').first();
    await tile.locator('.sf-tile-face').click();
    await tile.locator('.sf-tile-detail').getByText('Still needed to unlock:').waitFor();
    assert.equal(await tile.locator('.sf-tile-face').getAttribute('aria-expanded'),'true');
    await tile.scrollIntoViewIfNeeded();await shot('03-tile-expanded.png');
  });
  await check('Phone width has no horizontal overflow',async()=>{
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('region',{name:'Patient board'}).scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await shot('04-board-phone.png');
  });
  await check('Arabic renders right-to-left with Arabic labels',async()=>{
    await page.setViewportSize({width:1440,height:900});
    await page.evaluate(()=>localStorage.setItem('sf-language','ar'));await page.reload();
    const board=page.getByRole('region',{name:'لوحة المريض'});await board.waitFor();
    await board.getByText('طفل (١–١١)').waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.dir),'rtl');
    await board.scrollIntoViewIfNeeded();await page.waitForTimeout(1200);await shot('05-board-arabic.png');
  });
  await check('No page errors or external requests',async()=>assert.deepEqual(errors,[]));
}finally{
  await browser?.close();vite.kill();
  await writeFile(path.join(output,'results.json'),JSON.stringify({scope:'LOCAL fictional identities and synthetic WAV; real API and Vite proxy',checks,errors,shots},null,2));
}
if(checks.some(c=>!c.pass))process.exit(1);
