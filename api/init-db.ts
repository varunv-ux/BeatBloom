import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_cors';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  setCorsHeaders(response);

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
    // Uses IF NOT EXISTS so it's safe to call multiple times
    await sql`
      CREATE TABLE IF NOT EXISTS songs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        lyrics TEXT NOT NULL,
        music_description JSONB NOT NULL,
        album_art_url TEXT NOT NULL,
        audio_url TEXT,
        audio_data_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add audio_url column if it doesn't exist (migration for existing DBs)
    await sql`
      DO $$ BEGIN
        ALTER TABLE songs ADD COLUMN IF NOT EXISTS audio_url TEXT;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `;

    // Add versioning columns
    await sql`
      DO $$ BEGIN
        ALTER TABLE songs ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES songs(id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `;
    await sql`
      DO $$ BEGIN
        ALTER TABLE songs ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `;

    return response.status(200).json({
      success: true,
      message: 'Database initialized successfully',
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize database',
    });
  }
}
