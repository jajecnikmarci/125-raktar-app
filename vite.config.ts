import { defineConfig } from 'vite';

export default defineConfig({
  base: '/125-raktar-app/', // Replace with your GitHub repo name
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
  },
});
