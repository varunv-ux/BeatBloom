import path from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  define: {
    // No API keys exposed to the client - all API calls go through server-side routes
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
});
