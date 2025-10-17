import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Origin', '*');

  // Check which environment variables are available
  const envCheck = {
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
    POSTGRES_HOST: !!process.env.POSTGRES_HOST,
    POSTGRES_USER: !!process.env.POSTGRES_USER,
    POSTGRES_DATABASE: !!process.env.POSTGRES_DATABASE,
    // Check for other possible variable names
    POSTGRES_POSTGRES_URL: !!process.env.POSTGRES_POSTGRES_URL,
    DATABASE_URL: !!process.env.DATABASE_URL,
    // Show first 20 chars of POSTGRES_URL if it exists
    POSTGRES_URL_preview: process.env.POSTGRES_URL ? process.env.POSTGRES_URL.substring(0, 20) + '...' : 'not found',
  };

  return response.status(200).json({
    success: true,
    environment: process.env.VERCEL_ENV || 'development',
    envVars: envCheck,
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('POSTGRES') || key.includes('DATABASE')
    ),
  });
}
