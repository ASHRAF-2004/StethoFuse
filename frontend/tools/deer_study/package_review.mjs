/** Static review export. No app/auth bundle, source artwork edits or production writes. */
import fs from 'node:fs';
import path from 'node:path';
const [input,output]=process.argv.slice(2);
if(!input||!output||fs.existsSync(output))throw Error('Usage: package_review.mjs <forest-build> <fresh-output>');
fs.mkdirSync(path.join(output,'assets/owl/neck-candidate'),{recursive:true});
const copy=(relative)=>fs.copyFileSync(path.join(input,relative),path.join(output,relative));
for(const file of fs.readdirSync(path.join(input,'assets'))){
 if(/^(forest-prototype-|owlCanvasSurface-|owl-poster-1163\.)/.test(file))copy('assets/'+file);
}
fs.cpSync(path.join(input,'assets/forest-world'),path.join(output,'assets/forest-world'),{recursive:true});
const neck='assets/owl/neck-candidate/';
const manifest=JSON.parse(fs.readFileSync(path.join(input,neck+'manifest.json'),'utf8'));
const files=new Set(['manifest.json',path.basename(manifest.bodyTexture),...manifest.views.map(v=>v.texture),...manifest.edges.map(e=>e.file),...manifest.meshes.flatMap(m=>[m.positions.file,m.indices.file])]);
for(const file of files){if(file!==path.basename(file))throw Error('Unexpected owl asset path');copy(neck+file);}
// The review service rewrites HTML/CSS absolute assets, but not JS/JSON. Resolve
// those relative to a tiny deployment base, without modifying application sources.
const bootstrap=`<script>(()=>{const p=location.pathname.match(/^\\/d\\/[^/]+/);const b=document.createElement('base');b.href=p?location.origin+p[0]+'/':new URL('./',location.href).href;document.head.prepend(b)})()</script>`;
const html=fs.readFileSync(path.join(input,'forest-prototype.html'),'utf8').replace('<head>','<head>'+bootstrap);
for(const file of ['index.html','forest-prototype.html'])fs.writeFileSync(path.join(output,file),html);
let count=0,bytes=0;
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 const file=path.join(dir,entry.name);if(entry.isDirectory()){walk(file);continue;}
 if(/\.(js|json)$/.test(file)){
  const text=fs.readFileSync(file,'utf8').replace(/(["'`])\/assets\//g,'$1assets/').replaceAll('"/forest-prototype.html"','"forest-prototype.html"');
  fs.writeFileSync(file,text);
 }
 count++;bytes+=fs.statSync(file).size;
}}
walk(output);if(count>300)throw Error('Static review host file cap exceeded');
console.log(JSON.stringify({output,files:count,bytes,scope:'standalone forest preview only; original media bytes retained'}));
