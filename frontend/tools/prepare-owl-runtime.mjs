import fs from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
// Original WebP bitstreams and exact geometry; only delivery is staged.
const base='public/assets/owl/neck-candidate/',hash=b=>createHash('sha256').update(b).digest('hex');
const source=await fs.readFile(base+'manifest.json'),manifest=JSON.parse(source),files=new Map([['manifest.json',source]]);
for(const v of manifest.views)files.set(v.texture,await fs.readFile(base+v.texture));
for(const e of manifest.edges)files.set(e.file,gunzipSync(await fs.readFile(base+e.file)));
for(const m of manifest.meshes)for(const k of ['positions','indices'])files.set(m[k].file,gunzipSync(await fs.readFile(base+m[k].file)));
files.set('body.webp',await fs.readFile(base+'body.webp'));
const initialViews=[0,1,2,3,7,9,14,16,17],ids=new Set(initialViews),names=new Set(['manifest.json','body.webp']);
for(const v of manifest.views)if(ids.has(v.id))names.add(v.texture);
for(const e of manifest.edges)if(ids.has(e.from)&&ids.has(e.to))names.add(e.file);
for(const m of manifest.meshes)if(ids.has(m.id))for(const k of ['positions','indices'])names.add(m[k].file);
const groups=[new Map([...files].filter(([n])=>names.has(n))),new Map([...files].filter(([n])=>!names.has(n)))];
function encode(group,sourceViews){let offset=0;const entries=[];for(const [name,b] of group){entries.push({name,offset,length:b.length,sha256:hash(b)});offset+=b.length;}const header=Buffer.from(JSON.stringify({version:1,entries})),prefix=Buffer.alloc(12);prefix.write('SFOWLPK1');prefix.writeUInt32LE(header.length,8);const raw=Buffer.concat([prefix,header,...group.values()]),pack=gzipSync(raw,{level:9,mtime:0});pack[9]=255;const sha256=hash(pack);return {raw,pack,descriptor:{version:1,url:'/assets/owl/runtime/approved-'+sha256.slice(0,16)+'.bin',bytes:pack.length,decodedBytes:raw.length,sha256,sourceViews,entries:entries.length}};}
const packed=groups.map((g,i)=>encode(g,i?manifest.views.length-initialViews.length:initialViews.length));
const assets=JSON.parse(await fs.readFile('src/studio/criticalAssets.json','utf8'));
if(process.argv.includes('--verify')){
 for(const [i,saved] of [assets.owl.runtime,assets.owl.runtime.detail].entries()){const bytes=await fs.readFile('public'+saved.url);if(hash(bytes)!==saved.sha256||bytes.length!==saved.bytes||saved.decodedBytes!==packed[i].raw.length||!gunzipSync(bytes).equals(packed[i].raw))throw Error('Native owl package differs from its approved source');}
 if(JSON.stringify(assets.owl.runtime.initialViews)!==JSON.stringify(initialViews)||assets.owl.runtime.initialReach!==.32)throw Error('Unreviewed initial owl field');
 console.log('Verified all '+files.size+' native owl assets: exact bitstreams/geometry, nine initial views and eighteen complete views.');
}else{
 await fs.mkdir('public/assets/owl/runtime',{recursive:true});for(const p of packed)await fs.writeFile('public'+p.descriptor.url,p.pack);
 assets.owl.runtime={...packed[0].descriptor,initialViews,initialReach:.32,fullSourceViews:manifest.views.length,detail:packed[1].descriptor};
 await fs.writeFile('src/studio/criticalAssets.json',JSON.stringify(assets,null,2)+'\n');console.log(JSON.stringify(assets.owl.runtime));
}
