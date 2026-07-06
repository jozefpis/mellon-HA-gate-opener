import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // local dev: `npm run dev:client` proxies /api to the Node server
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
