import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.REPLICATE_API_TOKEN': JSON.stringify(env.REPLICATE_API_TOKEN),
        // Postgres environment variables for @vercel/postgres
        // Support both VITE_ prefixed (for explicit client-side vars) and regular (for Vercel auto-injected vars)
        'process.env.POSTGRES_URL': JSON.stringify(env.VITE_POSTGRES_URL || env.POSTGRES_URL),
        'process.env.POSTGRES_PRISMA_URL': JSON.stringify(env.VITE_POSTGRES_PRISMA_URL || env.POSTGRES_PRISMA_URL),
        'process.env.POSTGRES_URL_NON_POOLING': JSON.stringify(env.VITE_POSTGRES_URL_NON_POOLING || env.POSTGRES_URL_NON_POOLING),
        'process.env.POSTGRES_USER': JSON.stringify(env.VITE_POSTGRES_USER || env.POSTGRES_USER),
        'process.env.POSTGRES_HOST': JSON.stringify(env.VITE_POSTGRES_HOST || env.POSTGRES_HOST),
        'process.env.POSTGRES_PASSWORD': JSON.stringify(env.VITE_POSTGRES_PASSWORD || env.POSTGRES_PASSWORD),
        'process.env.POSTGRES_DATABASE': JSON.stringify(env.VITE_POSTGRES_DATABASE || env.POSTGRES_DATABASE),
        'process.env.POSTGRES_URL_NO_SSL': JSON.stringify(env.VITE_POSTGRES_URL_NO_SSL || env.POSTGRES_URL_NO_SSL),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
