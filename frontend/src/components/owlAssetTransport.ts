import critical from '../studio/criticalAssets.json';

export type OwlRuntimeDescriptor={version:number;url:string;bytes:number;decodedBytes:number;sha256:string;sourceViews:number;entries:number};
type OwlBoot={promise?:Promise<ArrayBuffer>;parsed?:Promise<Map<string,Uint8Array>>;skipped?:boolean;verified?:boolean};
declare global {interface Window {
 __sfOwlBoot?:OwlBoot;
 __sfStartOwl?:(descriptor:OwlRuntimeDescriptor)=>Promise<ArrayBuffer>;
 __sfOwlFrameReady?:(verified:boolean)=>void;
 __sfOwlFailed?:(error:unknown)=>void;
 __sfOwlDecoding?:(complete:number,total:number)=>void;
 __sfApplicationReady?:()=>void;
}}

async function readPackage():Promise<Map<string,Uint8Array>>{
 const descriptor:OwlRuntimeDescriptor=critical.owl.runtime;
 const encoded=window.__sfStartOwl?await window.__sfStartOwl(descriptor):await(await fetch(descriptor.url,{cache:'force-cache',credentials:'omit'})).arrayBuffer();
 const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',encoded))].map(v=>v.toString(16).padStart(2,'0')).join('');
 if(digest!==descriptor.sha256)throw Error('Owl package integrity check failed.');
 window.__sfOwlBoot!.verified=true;
 const raw=await new Response(new Blob([encoded]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 if(raw.byteLength!==descriptor.decodedBytes||new TextDecoder().decode(raw.slice(0,8))!=='SFOWLPK1')throw Error('Invalid owl package.');
 const length=new DataView(raw).getUint32(8,true);if(length>65536||length<16||length+12>raw.byteLength)throw Error('Invalid owl package index.');
 const index=JSON.parse(new TextDecoder().decode(raw.slice(12,12+length)));if(index.version!==1||index.entries.length!==descriptor.entries)throw Error('Invalid owl package version.');
 const assets=new Map<string,Uint8Array>();let end=0;
 for(const item of index.entries){if(!/^[a-z0-9.-]+$/i.test(item.name)||!Number.isSafeInteger(item.offset)||item.offset!==end||!Number.isSafeInteger(item.length)||item.length<1||12+length+item.offset+item.length>raw.byteLength||assets.has(item.name))throw Error('Invalid owl asset range.');assets.set(item.name,new Uint8Array(raw,12+length+item.offset,item.length));end+=item.length;}
 if(12+length+end!==raw.byteLength)throw Error('Unexpected owl package content.');return assets;
}

/** Same Response contract as the native field; only the public transport changes. */
export async function owlAssetTransport(base:string,signal:AbortSignal){
 if(import.meta.env.DEV&&(new URLSearchParams(location.search).has('owlUnpacked')||base!=='/assets/owl/neck-candidate/'))return async(url:string)=>{const response=await fetch(url,{signal});if(!response.ok)throw Error('Owl asset unavailable: '+response.status);return response;};
 const boot=window.__sfOwlBoot??(window.__sfOwlBoot={});boot.parsed??=readPackage();const assets=await boot.parsed;
 return async(url:string)=>{if(signal.aborted||boot.skipped)throw new DOMException('Aborted','AbortError');const name=url.slice(url.lastIndexOf('/')+1),bytes=assets.get(name);if(!bytes)throw Error('Missing approved owl asset.');return new Response(new Blob([new Uint8Array(bytes)]),{headers:{'Content-Type':name.endsWith('.webp')?'image/webp':name.endsWith('.json')?'application/json':'application/octet-stream'}});};
}
