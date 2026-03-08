import type { VercelResponse } from '@vercel/node';

/**
 * Sets CORS headers on the response.
 * Uses ALLOWED_ORIGIN env var in production, falls back to localhost for dev.
 */
export function setCorsHeaders(response: VercelResponse) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
