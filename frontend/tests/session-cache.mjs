import {createServer} from 'vite';
import assert from 'node:assert/strict';
const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
const checks=[];
try{
 const {createApiClient,ApiError}=await server.ssrLoadModule('/src/data/api.ts');
 const clients=[];const make=(id,transport)=>{const client=createApiClient(async()=>id,()=>{},transport);clients.push(client);return client;};
 const ok=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
 try{
  let calls=0,release;const gate=new Promise(resolve=>release=resolve);
  const client=make('identity-a',async(url,init)=>{calls++;assert.equal(init.cache,'no-store');assert.equal(init.credentials,'omit');assert.equal(init.headers.get('Authorization'),'Bearer identity-a');await gate;return ok({items:['a']});});
  const requests=[client.json('/recordings'),client.json('/recordings'),client.json('/recordings')];await new Promise(resolve=>setTimeout(resolve,20));assert.equal(calls,1);release();await Promise.all(requests);await client.json('/recordings');assert.equal(calls,2);checks.push('Concurrent metadata deduplicated; later permission-bearing reads revalidate');
  let prefsCalls=0;const preferences=make('identity-a',async(url,init)=>{prefsCalls++;return ok({preferences:{appearance:{reducedMotion:false}},method:init.method||'GET'});});
  await preferences.json('/preferences');await preferences.json('/preferences');assert.equal(prefsCalls,1);await preferences.json('/preferences',{method:'PATCH',body:'{}'});await preferences.json('/preferences');assert.equal(prefsCalls,3);checks.push('Own preferences cached; a successful mutation invalidates them');
  let aCalls=0,bCalls=0;const a=make('a',async()=>{aCalls++;return ok({owner:'a'});}),b=make('b',async()=>{bCalls++;return ok({owner:'b'});});assert.equal((await a.json('/preferences')).owner,'a');assert.equal((await b.json('/preferences')).owner,'b');a.clearCache();await a.json('/preferences');assert.equal(aCalls,2);assert.equal(bCalls,1);checks.push('Account clients isolated; clearing one never returns its old cache');
  let finish;const slow=make('old',async()=>{await new Promise(resolve=>finish=resolve);return ok({secret:'old-scope'});});const pending=slow.json('/recordings');await new Promise(resolve=>setTimeout(resolve,10));const rejection=assert.rejects(pending,error=>error.name==='AbortError');slow.clearCache();finish();await rejection;checks.push('In-flight old-scope response rejected even if transport ignores cancellation');
  let sharedRelease;const sharedGate=new Promise(resolve=>sharedRelease=resolve);let sharedCalls=0;const shared=make('same',async()=>{sharedCalls++;await sharedGate;return ok({items:[]});});const abort=new AbortController();const cancelled=shared.json('/recordings',{signal:abort.signal}),remaining=shared.json('/recordings');const cancelledCheck=assert.rejects(cancelled,error=>error.name==='AbortError');abort.abort();sharedRelease();await cancelledCheck;await remaining;assert.equal(sharedCalls,1);checks.push('One consumer abort cannot cancel another consumer sharing the request');
  let deny=false;const revoked=make('same',async()=>deny?new Response(JSON.stringify({detail:{code:'forbidden'}}),{status:403}):ok({items:['authorized']}));await revoked.json('/recordings');deny=true;await assert.rejects(revoked.json('/recordings'),error=>error instanceof ApiError&&error.status===403);await assert.rejects(revoked.json('/recordings'),error=>error instanceof ApiError&&error.status===403);checks.push('Revoked access never falls back to cached private data');
  let authCalls=0;const auth=make('id',async()=>{authCalls++;return ok({});});await auth.json('/auth/me');await auth.json('/auth/me');assert.equal(authCalls,2);let mediaCalls=0;const media=make('id',async()=>{mediaCalls++;return new Response(new Uint8Array([1]),{headers:{'Content-Type':'audio/wav'}});});await media.media('audio');await media.media('audio');assert.equal(mediaCalls,2);checks.push('Identity and protected audio always reach the authorized server');
  let offlineCalls=0;const offline=make('id',async()=>{offlineCalls++;throw new TypeError('Offline');});await assert.rejects(offline.json('/recordings'),error=>error instanceof ApiError&&error.status===0);assert.equal(offlineCalls,1);checks.push('Offline/error reads fail promptly without hidden retries or stale success');
 }finally{clients.forEach(client=>client.clearCache());}
}finally{await server.close();}
console.log(JSON.stringify({status:'PASS_SESSION_MEMORY_CACHE',checks}));
