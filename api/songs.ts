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

  try {
    if (request.method === 'GET') {
      // Single song by ID (includes lyrics)
      const songId = request.query.id;
      if (songId) {
        const id = parseInt(songId as string);
        if (isNaN(id)) {
          return response.status(400).json({ success: false, error: 'Invalid song ID' });
        }
        const result = await sql`
          SELECT id, title, lyrics, music_description, album_art_url, audio_url, parent_id, version_number, created_at, updated_at
          FROM songs WHERE id = ${id}
        `;
        if (result.rows.length === 0) {
          return response.status(404).json({ success: false, error: 'Song not found' });
        }
        return response.status(200).json({ success: true, song: result.rows[0] });
      }

      // Pagination params
      const page = Math.max(1, parseInt(request.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(request.query.limit as string) || 20));
      const offset = (page - 1) * limit;

      // Get songs with pagination (exclude lyrics to reduce transfer)
      const result = await sql`
        SELECT id, title, music_description, album_art_url, audio_url, parent_id, version_number, created_at, updated_at
        FROM songs
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countResult = await sql`SELECT COUNT(*) as total FROM songs`;
      const total = parseInt(countResult.rows[0].total);

      return response.status(200).json({
        success: true,
        songs: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    if (request.method === 'POST') {
      const { title, lyrics, musicDescription, albumArtUrl, audioUrl, parentId } = request.body;

      if (!title || !lyrics || !musicDescription || !albumArtUrl) {
        return response.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      // Calculate version number
      let versionNumber = 1;
      const resolvedParentId = parentId || null;
      if (resolvedParentId) {
        const versionResult = await sql`
          SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
          FROM songs
          WHERE parent_id = ${resolvedParentId} OR id = ${resolvedParentId}
        `;
        versionNumber = parseInt(versionResult.rows[0].next_version) || 1;
      }

      const result = await sql`
        INSERT INTO songs (title, lyrics, music_description, album_art_url, audio_url, parent_id, version_number)
        VALUES (
          ${title},
          ${lyrics},
          ${JSON.stringify(musicDescription)},
          ${albumArtUrl},
          ${audioUrl || null},
          ${resolvedParentId},
          ${versionNumber}
        )
        RETURNING id
      `;

      return response.status(201).json({
        success: true,
        id: result.rows[0].id,
      });
    }

    if (request.method === 'DELETE') {
      const { id } = request.query;

      if (!id) {
        return response.status(400).json({
          success: false,
          error: 'Missing song ID',
        });
      }

      // Validate id is a number to prevent injection
      const songId = parseInt(id as string);
      if (isNaN(songId)) {
        return response.status(400).json({
          success: false,
          error: 'Invalid song ID',
        });
      }

      await sql`
        DELETE FROM songs
        WHERE id = ${songId}
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
    return response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
