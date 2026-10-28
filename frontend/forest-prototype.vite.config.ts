import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],server:{host:'127.0.0.1',port:4192,strictPort:true,watch:{ignored:['**/evidence/**','**/output/**','**/assets/forest-world/source/**']}},build:{outDir:'output/forest-world-build',rollupOptions:{input:'forest-prototype.html'}}});
