import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  optimizeDeps: {
    include: ['three']
  },
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  define: {
    'process.env': {}
  }
});