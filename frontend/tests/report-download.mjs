// Actual client module, bounded transport fixtures; no provider/user/model data.
import {createServer} from 'vite';
import assert from 'node:assert/strict';
const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'}),checks=[],clients=[];
try{
 const {createApiClient,ApiError}=await server.ssrLoadModule('/src/data/api.ts');
 const make=transport=>{const c=createApiClient(async()=> 'fixture.signed.identity',()=>{},transport);clients.push(c);return c;};
 for(const locale of ['en','ar']){
  const client=make(async(url,init)=>{assert.equal(url,`/api/results/result_1/report?locale=${locale}`);assert.equal(init.headers.get('Authorization'),'Bearer fixture.signed.identity');assert.equal(init.headers.get('Accept'),'text/html');assert.equal(init.cache,'no-store');assert.equal(init.credentials,'omit');assert.equal(init.redirect,'error');return new Response(`<html lang="${locale}">fixture-private-report</html>`,{headers:{'Content-Type':'text/html; charset=utf-8'}});});
  assert.match(await(await client.report('result_1',locale)).text(),new RegExp(`lang="${locale}"`));checks.push('Authenticated '+locale+' report uses a bounded locale query and private HTML transport');
 }
 let calls=0;const restricted=make(async()=>{calls++;return new Response('Unexpected');});
 for(const locale of ['fr','ar&token=secret','https://foreign.invalid'])await assert.rejects(restricted.report('result_1',locale));
 for(const id of ['https://foreign.invalid/report','result_1?token=secret','../other','result/other'])await assert.rejects(restricted.report(id,'en'));
 await assert.rejects(restricted.json('/results/result_1/report?locale=ar&token=secret'));
 assert.equal(calls,0);checks.push('Arbitrary locale, query strings, URLs and path traversal remain rejected before transport');
 const revoked=make(async()=>Response.json({detail:{code:'forbidden'}},{status:403}));await assert.rejects(revoked.report('result_1','ar'),e=>e instanceof ApiError&&e.status===403);checks.push('Revoked report access stays an authorization failure');
 const wrong=make(async()=>Response.json({fixture:true}));await assert.rejects(wrong.report('result_1','en'),/could not be verified/);checks.push('A non-HTML response is never downloaded as a report');
 let finish;const gate=new Promise(r=>finish=r),slow=make(async()=>{await gate;return new Response('fixture-private-report',{headers:{'Content-Type':'text/html'}});});
 const pending=slow.report('result_1','en');await new Promise(r=>setTimeout(r,10));const denied=assert.rejects(pending,e=>e.name==='AbortError');slow.clearCache();finish();await denied;checks.push('A report from an exited account scope cannot complete');
}finally{clients.forEach(c=>c.clearCache());await server.close();}
console.log(JSON.stringify({status:'PASS_REPORT_DOWNLOAD_BOUNDARY',checks}));
