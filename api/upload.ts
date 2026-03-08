import { put } from '@vercel/blob';
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
    return response.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { base64Data, filename, contentType } = request.body;

    if (!base64Data || !filename || !contentType) {
      return response.status(400).json({
        success: false,
        error: 'Missing base64Data, filename, or contentType',
      });
    }

    const buffer = Buffer.from(base64Data, 'base64');

    const blob = await put(filename, buffer, {
      access: 'public',
      contentType,
    });

    return response.status(200).json({
      success: true,
      url: blob.url,
    });
  } catch (error) {
    // If Vercel Blob is not configured, return a helpful error
    if (error instanceof Error && error.message.includes('BLOB_READ_WRITE_TOKEN')) {
      return response.status(200).json({
        success: false,
        error: 'Vercel Blob not configured. Set BLOB_READ_WRITE_TOKEN env var.',
        fallback: true,
      });
    }

    return response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    });
  }
}
