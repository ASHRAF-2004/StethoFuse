// TEST ONLY: normal app entry, isolated optimizer cache and fictional API fixture.
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],cacheDir:'node_modules/.vite-readiness',server:{host:'127.0.0.1',port:4186,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:8008',changeOrigin:false}}}});
