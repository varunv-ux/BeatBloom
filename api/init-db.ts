import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Create songs table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS songs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        lyrics TEXT NOT NULL,
        music_description JSONB NOT NULL,
        album_art_url TEXT NOT NULL,
        audio_data_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return response.status(200).json({
      success: true,
      message: 'Database initialized successfully',
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize database',
    });
  }
}
