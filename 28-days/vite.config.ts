import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({base:'./',resolve:{alias:{three:fileURLToPath(new URL('../node_modules/three',import.meta.url))}},server:{fs:{allow:['..']}}});
