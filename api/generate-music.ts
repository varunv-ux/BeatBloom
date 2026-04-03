import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";
const POLLING_INTERVAL = 2000;
const TIMEOUT = 300000; // 5 minutes

interface MusicModel {
  id: string;
  versionId: string;
  supports: { lyrics: boolean; tags: boolean; duration: boolean };
}

const MUSIC_MODELS: Record<string, MusicModel> = {
  'ace-step': {
    id: 'ace-step',
    versionId: '280fc4f9ee507577f880a167f639c02622421d8fecf492454320311217b688f1',
    supports: { lyrics: true, tags: true, duration: true },
  },
  'minimax-music-1.5': {
    id: 'minimax-music-1.5',
    versionId: 'latest',
    supports: { lyrics: true, tags: true, duration: false },
  },
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'http://localhost:3000');
  response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const replicateApiToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateApiToken) {
    return response.status(500).json({ success: false, error: 'Replicate API token not configured' });
  }

  try {
    const { lyrics, tags, duration = 60, modelId = 'minimax-music-1.5' } = request.body;

    if (!lyrics || !tags) {
      return response.status(400).json({ success: false, error: 'Missing lyrics or tags' });
    }

    const model = MUSIC_MODELS[modelId];
    if (!model) {
      return response.status(400).json({ success: false, error: 'Invalid model ID' });
    }

    let inputPayload: any;
    let requestBody: any;

    if (modelId === 'minimax-music-1.5') {
      let truncatedLyrics = lyrics;
      const paragraphs = lyrics.split('\n\n');

      if (paragraphs.length > 4) {
        truncatedLyrics = paragraphs.slice(0, 4).join('\n\n');
      }

      if (truncatedLyrics.length > 580) {
        truncatedLyrics = truncatedLyrics.substring(0, 577) + '...';
      }

      inputPayload = {
        lyrics: truncatedLyrics,
        prompt: tags,
      };
      requestBody = {
        input: inputPayload,
      };
    } else {
      inputPayload = {
        lyrics,
        tags,
        duration,
        tag_guidance_scale: 7,
        lyric_guidance_scale: 5,
        guidance_scale: 15,
        number_of_steps: 60,
      };
      requestBody = {
        version: model.versionId,
        input: inputPayload,
      };
    }

    const apiUrl = modelId === 'minimax-music-1.5'
      ? `https://api.replicate.com/v1/models/minimax/music-1.5/predictions`
      : REPLICATE_API_URL;

    // Step 1: Create the prediction (server-side, no CORS proxy needed)
    const createResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!createResponse.ok) {
      const errorBody = await createResponse.json();
      throw new Error(`Failed to create prediction: ${errorBody.detail || createResponse.statusText}`);
    }

    let prediction = await createResponse.json();
    const predictionUrl = prediction.urls.get;

    // Step 2: Poll for the result (server-side, no CORS proxy needed)
    const startTime = Date.now();
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
      if (Date.now() - startTime > TIMEOUT) {
        throw new Error("Music generation timed out.");
      }

      await sleep(POLLING_INTERVAL);

      const pollResponse = await fetch(predictionUrl, {
        headers: {
          'Authorization': `Token ${replicateApiToken}`,
        },
      });

      if (!pollResponse.ok) {
        throw new Error(`Failed to poll prediction status: ${pollResponse.statusText}`);
      }

      prediction = await pollResponse.json();
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(`Music generation failed: ${prediction.error}`);
    }

    if (!prediction.output) {
      throw new Error("Prediction succeeded but no output URL was provided.");
    }

    const replicateAudioUrl = prediction.output;

    // Upload audio to Vercel Blob for persistent storage (Replicate URLs expire)
    let persistentAudioUrl = replicateAudioUrl;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const audioResponse = await fetch(replicateAudioUrl);
        if (audioResponse.ok) {
          const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
          const blob = await put(`songs/${Date.now()}-audio.mp3`, audioBuffer, {
            access: 'public',
            contentType: 'audio/mpeg',
          });
          persistentAudioUrl = blob.url;
        }
      } catch {
        // Fall back to Replicate URL if blob upload fails
      }
    }

    return response.status(200).json({
      success: true,
      audioUrl: persistentAudioUrl,
    });
  } catch (error) {
    console.error("Error in generate-music API:", error);
    return response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate music',
    });
  }
}
