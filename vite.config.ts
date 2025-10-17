import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        // Only expose API keys that are safe for client-side use
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.REPLICATE_API_TOKEN': JSON.stringify(env.REPLICATE_API_TOKEN),
        // Database credentials are NO LONGER exposed to client
        // They're now only used in API routes (server-side)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Note: API routes are handled by Vercel Dev CLI, no proxy needed
    };
});
