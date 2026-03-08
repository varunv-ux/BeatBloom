import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return response.status(404).json({ error: 'Not found' });
  }

  try {
    const result = await sql`SELECT NOW()`;

    return response.status(200).json({
      success: true,
      message: 'Database connection successful',
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
