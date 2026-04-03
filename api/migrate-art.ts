import { sql } from '@vercel/postgres';
import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_cors';

/**
 * One-time migration: move base64 album art from Postgres to Vercel Blob.
 * POST /api/migrate-art
 * 
 * This finds all songs where album_art_url starts with 'data:' (base64),
 * uploads each to Vercel Blob, and updates the row with the CDN URL.
 * Dramatically reduces Neon network transfer.
 */
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
    return response.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return response.status(500).json({ success: false, error: 'BLOB_READ_WRITE_TOKEN not configured' });
  }

  try {
    // Find songs with base64 album art
    const result = await sql`
      SELECT id, album_art_url FROM songs
      WHERE album_art_url LIKE 'data:%'
    `;

    let migrated = 0;
    let failed = 0;

    for (const row of result.rows) {
      try {
        const dataUrl = row.album_art_url as string;
        const parts = dataUrl.split(',');
        if (parts.length !== 2) { failed++; continue; }

        const base64 = parts[1];
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const ext = mime === 'image/jpeg' ? 'jpg' : 'png';
        const buffer = Buffer.from(base64, 'base64');

        const blob = await put(`songs/${row.id}-cover.${ext}`, buffer, {
          access: 'public',
          contentType: mime,
        });

        await sql`
          UPDATE songs SET album_art_url = ${blob.url} WHERE id = ${row.id}
        `;

        migrated++;
      } catch {
        failed++;
      }
    }

    return response.status(200).json({
      success: true,
      total: result.rows.length,
      migrated,
      failed,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed',
    });
  }
}
