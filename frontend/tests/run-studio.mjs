import {preview} from 'vite';
import {spawn} from 'node:child_process';
// A disposable loopback server tests exactly the compiled production files.
const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
try{const address=server.httpServer.address();if(!address||typeof address==='string')throw Error('No isolated preview listener');const available=['tests/studio-public.mjs','tests/support-followup.mjs'],requested=process.argv.slice(2),scripts=requested.length?requested:available;if(scripts.some(script=>!available.includes(script)))throw Error('Unknown focused test script');for(const script of scripts){const child=spawn(process.execPath,[script,`http://127.0.0.1:${address.port}`,'automated'],{stdio:'inherit',windowsHide:true});const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});if(code){process.exitCode=Number(code);break;}}}finally{await new Promise(resolve=>server.httpServer.close(resolve));}
