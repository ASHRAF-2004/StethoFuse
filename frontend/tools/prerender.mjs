import {build,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

// Public static generation only. Private routes always start as a client shell.
const directory=path.resolve('node_modules/.cache/stethofuse-prerender');
const env=loadEnv('production',process.cwd(),'VITE_');
await build({configFile:false,plugins:[react()],mode:'production',define:Object.fromEntries(Object.entries(env).map(([key,value])=>['import.meta.env.'+key,JSON.stringify(value)])),build:{ssr:'src/prerender.tsx',outDir:directory,emptyOutDir:true,copyPublicDir:false,minify:false,rolldownOptions:{output:{entryFileNames:'entry.mjs'}}},logLevel:'warn'});
const {renderHomepage}=await import(pathToFileURL(path.join(directory,'entry.mjs')).href);
const variants={};
for(const locale of ['en','ar'])for(const appearance of ['frost','midnight']){
 const html=renderHomepage({locale,appearance}).replace(/<link\b[^>]*rel="preload"[^>]*\/?\s*>/g,'');
 if(!html.includes('studio-heading')||!html.includes('sound-desk')||html.includes('workspace-loading'))throw Error('Invalid public prerender');
 variants[locale+'-'+appearance]=html;
}
const criticalAssets=JSON.parse(await fs.readFile('src/studio/criticalAssets.json','utf8'));
const initSource=(await fs.readFile('dist/theme-init.js','utf8')).replace("preload.href = '/assets/owl-poster-1163.webp';",`preload.href = ${JSON.stringify(criticalAssets.owl.src)}; preload.imageSrcset = ${JSON.stringify(criticalAssets.owl.srcSet)}; preload.imageSizes = ${JSON.stringify(criticalAssets.owl.sizes)};`);
await fs.writeFile('dist/theme-init.js',initSource);
const entranceSource=(await fs.readFile('dist/entrance.js','utf8')).replace('/* SF_OWL_RUNTIME */ null',JSON.stringify(criticalAssets.owl.runtime));
if(/<\/script/i.test(entranceSource))throw Error('Unexpected entrance bootstrap terminator');
await fs.writeFile('dist/entrance.js',entranceSource);
const init=Buffer.from(initSource),version=createHash('sha256').update(init).digest('hex').slice(0,16);
let index=await fs.readFile('dist/index.html','utf8');
// The public page must paint without waiting behind the JS dependency graph.
// Keep the existing compiled styles verbatim, delivered in the HTML response.
for(const match of [...index.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]){
 const css=await fs.readFile(path.join('dist',match[1]),'utf8');
 if(/<\/style/i.test(css))throw Error('Unexpected stylesheet terminator');
 index=index.replace(match[0],`<style data-compiled-styles>${css}</style>`);
}
const modules=[...index.matchAll(/<script\b[^>]*type="module"[^>]*><\/script>|<link\b[^>]*rel="modulepreload"[^>]*>/g)].map(match=>match[0]);
for(const module of modules)index=index.replace(module,'');
const moduleTemplate=`<template id="application-modules">${modules.join('')}</template>`;
const critical=`<style id="startup-css">html,body{margin:0;background:#fff;color:#232b28}html[data-studio-theme=dark],html[data-studio-theme=dark] body{background:#181a1c;color:#e2e3df}html[data-static-preparing] #root{visibility:hidden}#root[inert] .studio-site :is(button,input){opacity:.6}html[data-public-hero-pending] .studio-site .listening-owl>img{visibility:hidden}.workspace-loading{display:flex;align-items:center;justify-content:center;gap:12px;min-height:120px;font:500 14px/1.5 system-ui,sans-serif}.workspace-loading>svg,.startup-controls>svg{flex:0 0 24px;width:24px;height:24px;max-width:24px;animation:studio-loading-spin .9s linear infinite;transform-origin:center}.startup-controls{position:fixed;inset:auto auto 16px 50%;transform:translateX(-50%);z-index:1000;display:flex;align-items:center;gap:10px;max-width:calc(100vw - 32px);padding:12px 16px;border:1px solid #bac8bf;border-radius:8px;background:#e2e3df;color:#232b28;font:500 13px/1.5 system-ui,sans-serif}.startup-controls button,.workspace-loading button{font:inherit;color:inherit;background:transparent;border:1px solid currentColor;border-radius:5px;padding:7px;cursor:pointer}html[data-studio-theme=dark] .startup-controls{background:#232d27;color:#e2e3df}.app-route-loading{min-height:100svh;display:grid;place-items:center}@keyframes studio-loading-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.workspace-loading>svg,.startup-controls>svg{animation:none}}</style>`;
index=index.replace('</head>',critical+'</head>').replace('/theme-init.js',`/theme-init.js?v=${version}`);
const templates=Object.entries(variants).filter(([key])=>key!=='en-frost').map(([key,html])=>`<template id="public-${key}">${html}</template>`).join('');
const shell=`<div id="root" data-prerender="en-frost" inert>${variants['en-frost']}</div>${templates}${moduleTemplate}`;
if(!index.includes('<div id="root"></div>'))throw Error('Expected root placeholder missing');
index=index.replace('<div id="root"></div>',shell);
if(/<\/script/i.test(initSource))throw Error('Unexpected bootstrap terminator');
// Bootstrap is tiny and critical: avoid an additional blocking network trip.
index=index.replace(/<script src="\/theme-init\.js\?v=[^"]+"[^>]*><\/script>/g,`<script data-theme-init="${version}">${initSource}</script>`);
index=index.replace(/<script src="\/theme-init\.js"[^>]*><\/script>/g,`<script data-theme-init="${version}">${initSource}</script>`);
index=index.replace('<script src="/entrance.js"></script>',`<script data-entrance-bootstrap>${entranceSource}</script>`);
await fs.writeFile('dist/index.html',index);
await fs.writeFile('dist/public-prerender.json',JSON.stringify({schema:1,variants:Object.keys(variants),privateContent:false,templateSHA256:createHash('sha256').update(index).digest('hex')}));
console.log('Public homepage prerendered in English/Arabic and both appearances; private routes remain client-rendered.');
