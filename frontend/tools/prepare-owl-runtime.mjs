import fs from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';

// Repackage the approved field losslessly: original WebP bitstreams, exact float
// correspondences and triangle indices. No resampling, quantizing or new poses.
const base='public/assets/owl/neck-candidate/',hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const source=await fs.readFile(base+'manifest.json'),manifest=JSON.parse(source),files=new Map([['manifest.json',source]]);
for(const view of manifest.views)files.set(view.texture,await fs.readFile(base+view.texture));
for(const edge of manifest.edges)files.set(edge.file,gunzipSync(await fs.readFile(base+edge.file)));
for(const mesh of manifest.meshes)for(const kind of ['positions','indices'])files.set(mesh[kind].file,gunzipSync(await fs.readFile(base+mesh[kind].file)));
files.set('body.webp',await fs.readFile(base+'body.webp'));
let offset=0;const entries=[];
for(const [name,bytes] of files){entries.push({name,offset,length:bytes.length,sha256:hash(bytes)});offset+=bytes.length;}
const header=Buffer.from(JSON.stringify({version:1,entries})),prefix=Buffer.alloc(12);prefix.write('SFOWLPK1');prefix.writeUInt32LE(header.length,8);
const raw=Buffer.concat([prefix,header,...files.values()]),pack=gzipSync(raw,{level:9,mtime:0});pack[9]=255;
const sha256=hash(pack);
const url=`/assets/owl/runtime/approved-${sha256.slice(0,16)}.bin`,descriptor={version:1,url,bytes:pack.length,decodedBytes:12+header.length+offset,sha256,sourceViews:manifest.views.length,entries:entries.length};
const assets=JSON.parse(await fs.readFile('src/studio/criticalAssets.json','utf8'));
if(process.argv.includes('--verify')){
 const saved=assets.owl.runtime,stored=await fs.readFile('public'+saved.url);
 if(hash(stored)!==saved.sha256||stored.length!==saved.bytes||saved.decodedBytes!==raw.length||saved.entries!==entries.length||saved.sourceViews!==manifest.views.length||!gunzipSync(stored).equals(raw))throw Error('Approved owl bundle differs from original assets. Run the preparation tool and review it.');
 console.log('Approved owl package verified: exact native images and geometry, '+entries.length+' resources in one request.');
}else{
 await fs.mkdir('public/assets/owl/runtime',{recursive:true});await fs.writeFile('public'+url,pack);assets.owl.runtime=descriptor;await fs.writeFile('src/studio/criticalAssets.json',JSON.stringify(assets,null,2)+'\n');
 console.log(JSON.stringify(descriptor));
}
