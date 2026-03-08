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

  if (request.method !== 'GET') {
    return response.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { id } = request.query;

    if (!id) {
      return response.status(400).json({ success: false, error: 'Missing song ID' });
    }

    const songId = parseInt(id as string);
    if (isNaN(songId)) {
      return response.status(400).json({ success: false, error: 'Invalid song ID' });
    }

    const result = await sql`
      SELECT id, title, lyrics, music_description, album_art_url, audio_url, created_at
      FROM songs
      WHERE id = ${songId}
    `;

    if (result.rows.length === 0) {
      return response.status(404).json({ success: false, error: 'Song not found' });
    }

    return response.status(200).json({
      success: true,
      song: result.rows[0],
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
