import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright-core';

const base=process.env.FRONTEND_URL||'http://127.0.0.1:4184';
const out=path.resolve('output/playwright/user-readiness');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',headless:true});
const errors=[],checks=[];
const luminance=rgb=>rgb.map(value=>value/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
try{
 const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/');await page.locator('.sf-public').waitFor();await page.evaluate(()=>document.fonts.ready);
 for(const theme of ['frost','midnight']){
  await page.evaluate(theme=>{localStorage.setItem('sf-public-theme',theme);dispatchEvent(new StorageEvent('storage',{key:'sf-public-theme',newValue:theme}));},theme);
  await page.reload();await page.waitForFunction(theme=>document.querySelector('.sf-public')?.dataset.theme===theme,theme);
  const styles=await page.evaluate(()=>{
   const root=getComputedStyle(document.querySelector('.sf-public')),primary=getComputedStyle(document.querySelector('.hero-actions .button-primary')),faq=getComputedStyle(document.querySelector('.welcome-help details'));
   const rgb=value=>value.match(/[\d.]+/g).slice(0,3).map(Number);
   return {font:root.fontFamily,accent:root.getPropertyValue('--accent').trim(),button:rgb(primary.backgroundColor),buttonInk:rgb(primary.color),faq:rgb(faq.backgroundColor),faqInk:rgb(faq.color)};
  });
  assert.equal(styles.accent,theme==='frost'?'#245d4c':'#9bd5ba');assert.ok(styles.font.includes('SF UI'));
  assert.deepEqual(styles.button,theme==='frost'?[36,93,76]:[155,213,186]);
  assert.ok(contrast(styles.button,styles.buttonInk)>=4.5,'Primary action contrast');assert.ok(contrast(styles.faq,styles.faqInk)>=4.5,'FAQ contrast');
  await page.screenshot({path:path.join(out,'home-'+theme+'-desktop.png'),fullPage:true});
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow at '+width);
   await page.screenshot({path:path.join(out,`home-${theme}-${width}.png`),fullPage:true});
  }
  await page.setViewportSize({width:1440,height:960});checks.push({theme,status:'PASS',styles});
 }
 assert.deepEqual(errors,[]);console.log('PASS Frost/Midnight actual controls, contrast, persistence and 320/390/1440 layouts');
}finally{await fs.writeFile(path.join(out,'home-results.json'),JSON.stringify({checks,errors},null,2));await browser.close();}
