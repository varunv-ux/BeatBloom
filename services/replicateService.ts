import { MusicModelId } from './musicModels';

interface MusicGenerationResult {
  audioUrl: string;
}

/**
 * Generates music from lyrics and tags via the server-side API route.
 * The server uploads audio to Vercel Blob for persistent storage.
 */
export const generateMusic = async (
  lyrics: string,
  tags: string,
  duration: number = 60,
  modelId: MusicModelId = 'minimax-music-1.5',
  signal?: AbortSignal
): Promise<MusicGenerationResult> => {
  const response = await fetch('/api/generate-music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lyrics, tags, duration, modelId }),
    signal,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to generate music');
  }

  return { audioUrl: data.audioUrl };
};