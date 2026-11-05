// Actual compiled public UI only. No private identities, recordings or mutations.
import {chromium} from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
const base=process.argv[2]||'http://127.0.0.1:4196';
const out=path.resolve('../assets/readme');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--enable-unsafe-swiftshader']});
try{for(const theme of ['day','night']){
 const c=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:theme==='night'?'dark':'light'});
 await c.addInitScript(theme=>{localStorage.setItem('sf-language','en');localStorage.setItem('sf-public-theme',theme==='night'?'midnight':'frost');},theme);
 const p=await c.newPage();await p.goto(base);await p.waitForFunction(()=>document.documentElement.dataset.experience==='ready'&&document.querySelector('.listening-owl')?.dataset.preparation==='complete');await p.evaluate(()=>document.fonts.ready);await p.mouse.move(720,400);await p.waitForTimeout(600);
 await p.screenshot({path:path.join(out,'studio-'+theme+'.png')});
 await p.goto(base+'/login');await p.locator('h1').waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(700);await p.screenshot({path:path.resolve('../../../OwnerRelease/finish-20261105/login-'+theme+'.png')});
 await c.close();
}}finally{await browser.close();}
console.log('Captured real compiled day/night product previews and settled account screens.');
