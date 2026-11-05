import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import {owlDiagnostics} from './tools/owl_diagnostics.ts';
import {validatePublicFirebaseConfig} from './src/config/firebase-contract.ts';
export default defineConfig(({mode,command})=>{
 const env=loadEnv(mode,process.cwd(),'');
 // Refuse a release with unusable sign-in, instead of shipping a disabled form.
 if(command==='build')validatePublicFirebaseConfig(env);
 const target=env.STETHOFUSE_API_PROXY||'http://127.0.0.1:8000';
 if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(target))throw new Error('Development API proxy must be an explicit loopback HTTP port.');
 return {plugins:[react(),owlDiagnostics()],build:{chunkSizeWarningLimit:600,rolldownOptions:{input:{app:'index.html'},output:{codeSplitting:{groups:[{name:'identity-provider',test:/node_modules[\\/](?:@firebase|firebase)[\\/]/,priority:20},{name:'react-runtime',test:/node_modules[\\/](?:react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,priority:10}]}}}},server:{host:'127.0.0.1',port:4180,strictPort:true,proxy:{'/api':{target,changeOrigin:false}}}};
});
