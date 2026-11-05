import {chromium} from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.FRONTEND_URL||'http://127.0.0.1:4184';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw new Error('Local-only motion checks.');
const out=path.resolve('output/playwright/user-readiness');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',headless:true});
const report={scope:'Real headless Brave; desktop and touch viewport emulation',checks:[],errors:[]};
async function check(name,fn){await fn();report.checks.push({name,status:'PASS'});console.log('PASS '+name);}
async function context(options={}){
 const c=await browser.newContext({viewport:{width:1440,height:960},...options});
 c.on('page',p=>p.on('pageerror',e=>report.errors.push(e.message)));
 await c.addInitScript(()=>{
  window.__arrival=[];
  addEventListener('DOMContentLoaded',()=>new MutationObserver(()=>{
   const owl=document.querySelector('.owl-art');if(!owl)return;
   const key=owl.dataset.arrivalStage+'/'+owl.dataset.arrivalPose;
   if(window.__arrival.at(-1)?.key!==key)window.__arrival.push({key,time:performance.now()});
  }).observe(document.body,{subtree:true,attributes:true,attributeFilter:['data-arrival-stage','data-arrival-pose']}));
 });return c;
}
try{
 await check('Real winged approach, landing, settling and approved gaze handoff',async()=>{
  const c=await context(),p=await c.newPage();await p.goto(base+'/',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>document.querySelector('.owl-art')?.dataset.arrivalStage==='approach'&&Number(document.querySelector('.owl-art')?.dataset.arrivalProgress)>.3);
  await p.screenshot({path:path.join(out,'owl-winged-approach.png')});
  await p.waitForFunction(()=>document.querySelector('.owl-art')?.dataset.arrivalStage==='landed');
  const stages=await p.evaluate(()=>window.__arrival);report.arrival=stages;
  assert.ok(stages.some(x=>x.key.includes('flight-00')));assert.ok(stages.some(x=>x.key.includes('flight-07')));assert.ok(stages.some(x=>x.key.startsWith('landing/')));assert.ok(stages.some(x=>x.key.startsWith('settling/')));
  assert.equal(await p.locator('canvas.owl-arrival').evaluate(e=>e.width*e.height),1);
  await p.waitForFunction(()=>document.querySelector('.owl-art')?.dataset.renderer==='continuous-surface');
  await p.mouse.move(300,270);await p.waitForFunction(()=>Number(document.querySelector('.owl-art').dataset.yaw)<-1);
  await p.screenshot({path:path.join(out,'owl-landed-gaze.png')});
  await p.getByRole('link',{name:'Sign in',exact:true}).first().click();await p.getByRole('link',{name:'StethoFuse home'}).click();await p.locator('.owl-art').waitFor();await p.waitForTimeout(300);
  assert.notEqual(await p.locator('.owl-art').getAttribute('data-arrival-stage'),'approach');await c.close();
 });
 await check('Offscreen arrival pauses, resumes and finishes without a permanent hidden owl',async()=>{
  const c=await context(),p=await c.newPage();await p.goto(base+'/',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.querySelector('.owl-art')?.dataset.arrivalStage==='approach');await p.evaluate(()=>scrollTo(0,1400));await p.waitForTimeout(160);const progress=await p.locator('.owl-art').getAttribute('data-arrival-progress');await p.waitForTimeout(220);assert.equal(await p.locator('.owl-art').getAttribute('data-arrival-progress'),progress);await p.evaluate(()=>scrollTo(0,0));await p.waitForFunction(()=>document.querySelector('.owl-art')?.dataset.arrivalStage==='landed');await c.close();
 });
 await check('Motion preference changed during flight restores the approved static fallback',async()=>{
  const c=await context(),p=await c.newPage();await p.goto(base+'/',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.querySelector('.owl-art')?.dataset.arrivalStage==='approach');await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>document.querySelector('.owl-art')?.dataset.arrivalStage==='skipped');assert.equal(await p.locator('canvas.owl-arrival').isVisible(),false);assert.equal(await p.locator('.owl-art>img').evaluate(e=>getComputedStyle(e).opacity),'1');await c.close();
 });
 await check('Reduced motion skips arrival while touch receives the complete flight',async()=>{
  const reduced=await context({reducedMotion:'reduce'}),reducedPage=await reduced.newPage(),reducedRequests=[];reducedPage.on('request',r=>{if(r.url().includes('/arrival-v'))reducedRequests.push(r.url());});await reducedPage.goto(base+'/');await reducedPage.locator('.owl-art').waitFor();await reducedPage.waitForTimeout(200);assert.deepEqual(reducedRequests,[]);assert.equal(await reducedPage.locator('canvas.owl-arrival').isVisible(),false);await reduced.close();
  const c=await context({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await c.newPage(),requests=[];p.on('request',r=>{if(r.url().includes('/arrival-v'))requests.push(r.url());});await p.goto(base+'/');await p.waitForFunction(()=>document.querySelector('.owl-art')?.dataset.arrivalStage==='approach'&&Number(document.querySelector('.owl-art')?.dataset.arrivalProgress)>.25);await p.waitForFunction(()=>document.querySelector('.owl-art')?.dataset.arrivalStage==='landed');assert.ok(requests.some(url=>url.endsWith('/arrival-v2/manifest.json')));assert.equal(await p.locator('canvas.owl-arrival').evaluate(e=>e.width*e.height),1);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await c.close();
 });
 await check('Missing flight assets fail to the approved owl without blocking the page',async()=>{
  const c=await context();await c.route('**/assets/owl/arrival-v2/**',r=>r.abort());const p=await c.newPage();await p.goto(base+'/');await p.waitForFunction(()=>document.querySelector('.owl-art')?.dataset.arrivalStage==='fallback');assert.equal(await p.locator('canvas.owl-arrival').isVisible(),false);await p.getByRole('link',{name:'Get started'}).click();assert.ok(p.url().includes('/register'));await c.close();
 });
 assert.deepEqual(report.errors,[]);
}finally{report.pages=[];for(const c of browser.contexts())for(const p of c.pages())report.pages.push({url:p.url(),state:await p.locator('.owl-art').evaluate(e=>({...e.dataset,canvas:{width:e.querySelector('.owl-arrival').width,hidden:e.querySelector('.owl-arrival').hidden}})).catch(()=>null)});await fs.writeFile(path.join(out,'owl-arrival-results.json'),JSON.stringify(report,null,2));await browser.close();}
