import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  try {
    if (request.method === 'GET') {
      // Get all songs
      const result = await sql`
        SELECT * FROM songs
        ORDER BY created_at DESC
      `;

      return response.status(200).json({
        success: true,
        songs: result.rows,
      });
    }

    if (request.method === 'POST') {
      // Add a new song
      const { title, lyrics, musicDescription, albumArtUrl, audioDataUrl } = request.body;

      if (!title || !lyrics || !musicDescription || !albumArtUrl) {
        return response.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      const result = await sql`
        INSERT INTO songs (title, lyrics, music_description, album_art_url, audio_data_url)
        VALUES (
          ${title},
          ${lyrics},
          ${JSON.stringify(musicDescription)},
          ${albumArtUrl},
          ${audioDataUrl || null}
        )
        RETURNING id
      `;

      return response.status(201).json({
        success: true,
        id: result.rows[0].id,
      });
    }

    if (request.method === 'DELETE') {
      // Delete a song
      const { id } = request.query;

      if (!id) {
        return response.status(400).json({
          success: false,
          error: 'Missing song ID',
        });
      }

      await sql`
        DELETE FROM songs
        WHERE id = ${id as string}
      `;

      return response.status(200).json({
        success: true,
      });
    }

    return response.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  } catch (error) {
    console.error('API Error:', error);
    return response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
