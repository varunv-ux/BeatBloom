import { MusicModelId, MUSIC_MODELS } from './musicModels';

// A utility function to delay execution
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A CORS proxy to bypass browser restrictions on cross-origin requests.
// Using corsproxy.io which is more reliable than cors.eu.org
const CORS_PROXY = "https://corsproxy.io/?";

const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";
const POLLING_INTERVAL = 2000; // 2 seconds
const TIMEOUT = 300000; // 5 minutes

interface MusicGenerationResult {
  audioUrl: string;
  audioBlob: Blob;
}

/**
 * Generates music from lyrics and tags using the Replicate API.
 * 
 * IMPORTANT: This function is intended for a client-side application and uses a
 * hardcoded API token. In a production environment, this is insecure as it exposes
 * the API token to the browser. This should be moved to a secure backend or serverless
 * function that can store the token securely and make the API call on behalf of the client.
 * 
 * @param lyrics The lyrics for the song.
 * @param tags A string of comma-separated tags describing the music style.
 * @param duration The duration of the song in seconds (30, 60, or 120).
 * @param modelId The music model to use ('ace-step' or 'minimax-music-1.5')
 * @returns A promise that resolves to an object containing the audio URL and the audio Blob.
 */
export const generateMusic = async (
  lyrics: string, 
  tags: string, 
  duration: number = 60,
  modelId: MusicModelId = 'minimax-music-1.5'
): Promise<MusicGenerationResult> => {
  // Get API token from environment variable
  const replicateApiToken = import.meta.env.VITE_REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN;
  
  if (!replicateApiToken) {
    throw new Error('REPLICATE_API_TOKEN not found in environment variables');
  }

  const model = MUSIC_MODELS[modelId];
  console.log('🎵 ReplicateService - Using model:', model.name);
  console.log('🎵 ReplicateService - Generating music with:', { lyrics: lyrics.substring(0, 50) + '...', tags, duration });

  // Prepare input based on model type
  let inputPayload: any;
  let requestBody: any;

  if (modelId === 'minimax-music-1.5') {
    // MiniMax Music 1.5 uses prompt instead of tags and doesn't have duration control
    // Uses model name format instead of version
    // MiniMax has a 10-600 character limit for lyrics
    
    // Truncate lyrics to first 4 paragraphs or 580 characters (leaving buffer for safety)
    let truncatedLyrics = lyrics;
    const paragraphs = lyrics.split('\n\n');
    
    if (paragraphs.length > 4) {
      // Take first 4 paragraphs
      truncatedLyrics = paragraphs.slice(0, 4).join('\n\n');
    }
    
    // Ensure it's within character limit
    if (truncatedLyrics.length > 580) {
      truncatedLyrics = truncatedLyrics.substring(0, 577) + '...';
    }
    
    console.log('📝 Original lyrics length:', lyrics.length, 'characters');
    console.log('📝 Truncated lyrics length:', truncatedLyrics.length, 'characters');
    
    inputPayload = {
      lyrics: truncatedLyrics,
      prompt: tags, // MiniMax uses 'prompt' instead of 'tags'
    };
    requestBody = {
      input: inputPayload,
      // For MiniMax, we need to specify the model in a different format
      // The API will use the latest version automatically
    };
  } else {
    // ACE-Step model (original)
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

  // Step 1: Create the prediction, routing through a CORS proxy
  const apiUrl = modelId === 'minimax-music-1.5'
    ? `https://api.replicate.com/v1/models/minimax/music-1.5/predictions`
    : REPLICATE_API_URL;

  const createResponse = await fetch(`${CORS_PROXY}${encodeURIComponent(apiUrl)}`, {
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

  // Step 2: Poll for the result, also routing through the CORS proxy
  const startTime = Date.now();
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
    if (Date.now() - startTime > TIMEOUT) {
      throw new Error("Music generation timed out.");
    }

    await sleep(POLLING_INTERVAL);

    const pollResponse = await fetch(`${CORS_PROXY}${encodeURIComponent(predictionUrl)}`, {
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

  const audioUrl = prediction.output;

  // Step 3: Fetch the generated audio file and return it as a blob
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Failed to fetch the generated audio file from ${audioUrl}`);
  }
  const audioBlob = await audioResponse.blob();

  return { audioUrl, audioBlob };
};