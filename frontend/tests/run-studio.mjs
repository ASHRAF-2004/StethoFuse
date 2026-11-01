import {preview} from 'vite';
import {spawn} from 'node:child_process';
// A disposable loopback server tests exactly the compiled production files.
const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
try{const address=server.httpServer.address();if(!address||typeof address==='string')throw Error('No isolated preview listener');const child=spawn(process.execPath,['tests/studio-public.mjs',`http://127.0.0.1:${address.port}`,'automated'],{stdio:'inherit',windowsHide:true});const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});if(code)process.exitCode=Number(code);}finally{await new Promise(resolve=>server.httpServer.close(resolve));}
