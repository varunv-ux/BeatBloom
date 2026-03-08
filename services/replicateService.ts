import { MusicModelId } from './musicModels';

interface MusicGenerationResult {
  audioUrl: string;
  audioBlob: Blob;
}

/**
 * Generates music from lyrics and tags via the server-side API route.
 * API keys are never exposed to the client.
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

  const audioUrl = data.audioUrl;

  // Fetch the generated audio file and return it as a blob
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Failed to fetch the generated audio file`);
  }
  const audioBlob = await audioResponse.blob();

  return { audioUrl, audioBlob };
};