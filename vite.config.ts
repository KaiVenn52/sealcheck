import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
const proxy={'/lcd':{target:'https://api-testnet.qore.host',changeOrigin:true,headers:{'User-Agent':'Mozilla/5.0 SealCheck/0.1'},rewrite:(p:string)=>p.replace(/^\/lcd/,'')}};
export default defineConfig({base:'./',plugins:[react()],server:{host:'127.0.0.1',port:5181,strictPort:true,proxy},preview:{host:'127.0.0.1',port:5181,strictPort:true,proxy}});
