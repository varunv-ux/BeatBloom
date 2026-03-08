import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // CORS headers
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

  if (!GEMINI_API_KEY) {
    return response.status(500).json({ success: false, error: 'Gemini API key not configured' });
  }

  try {
    const { audioBase64, mimeType } = request.body;

    if (!audioBase64 || !mimeType) {
      return response.status(400).json({ success: false, error: 'Missing audioBase64 or mimeType' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const textPart = {
      text: `You are an AI songwriter with three tasks. You will process the user's audio input by following these steps in order:

**Step 1: Transcribe and Analyze.**
First, listen to the audio carefully.
- Transcribe any spoken words you hear. If no words are spoken, note that you will base the theme on the melody alone.
- Analyze the non-vocal parts of the audio (the humming) to determine its core emotional tone, tempo, and melodic style (e.g., "upbeat and simple," "slow and melancholic," "complex and rhythmic").

**Step 2: Write Lyrics.**
Now, write a full set of song lyrics.
- If words were transcribed in Step 1, use them as the central theme or a starting line for the lyrics. The new lyrics should feel like a natural and creative extension of the user's original idea.
- If no words were spoken, write lyrics that perfectly match the emotional tone and style you analyzed in Step 1.
- Structure the lyrics logically (e.g., verse, chorus, bridge).

**Step 3: Classify and Create.**
Finally, based on the original audio and the lyrics you wrote, provide the following:
1.  **Title:** A short, catchy title for the song (e.g., "Neon Dreams", "Rainy Window", "First Glance").
2.  **Music Style:** An object with four string properties: "genre", "mood", "arrangement", and "vocals". You MUST choose one option for each property from the provided lists below.
    - "genre" MUST be one of: ["Pop", "Rock", "Hip Hop", "Electronic", "Folk / Country", "R&B / Soul", "Jazz", "Orchestral"].
    - "mood" MUST be one of: ["Happy", "Sad", "Energetic", "Relaxing", "Romantic", "Epic", "Nostalgic", "Sentimental"].
    - "arrangement" MUST be one of: ["Full Band", "Acoustic", "Electronic", "Orchestral", "Simple Acoustic", "Synth & Drums"].
    - "vocals" MUST be one of: ["Male", "Female"]. For the "vocals" property, analyze the pitch of the user's voice in the audio and classify it as 'Male' or 'Female'. If it's ambiguous or just humming without clear words, choose the vocal style that you feel best fits the melody.
3.  **Image Prompt:** A concise, descriptive prompt for an AI to generate album art that captures the essence of the song.

Your final output must be a single, valid JSON object with four keys: "title", "lyrics", "musicDescription", and "imagePrompt".
- The value for "lyrics" must be a single multi-line string with proper JSON escaping (use \\n for line breaks).
- The value for "musicDescription" must be an object with "genre", "mood", "arrangement", and "vocals" strings, strictly following the options provided above.
- CRITICAL: Ensure all strings in the JSON are properly escaped. Replace all actual newlines with \\n, escape all quotes properly, and ensure valid JSON syntax.
- Do not wrap the JSON in markdown code blocks or any other formatting.
- Example format: {"title": "Song Title", "lyrics": "[Verse 1]\\nLyric line 1\\nLyric line 2\\n\\n[Chorus]\\nChorus line", "musicDescription": {"genre": "Pop", "mood": "Happy", "arrangement": "Full Band", "vocals": "Male"}, "imagePrompt": "Description for album art"}`,
    };

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: audioBase64,
      },
    };

    // Step 1: Generate Lyrics, Description, and Image Prompt
    const lyricsResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [textPart, audioPart] },
      config: {
        responseMimeType: "application/json",
      }
    });

    const responseText = lyricsResponse.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini AI");
    }

    let jsonStr = responseText.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (parseError) {
      let fixedJsonStr = jsonStr
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');

      try {
        parsedData = JSON.parse(fixedJsonStr);
      } catch {
        throw new Error(`Failed to parse AI response as JSON.`);
      }
    }

    const { title, lyrics, musicDescription, imagePrompt } = parsedData;

    if (!title || !lyrics || !musicDescription || !imagePrompt) {
      throw new Error("AI response was missing required fields.");
    }

    if (!musicDescription.genre || !musicDescription.mood || !musicDescription.arrangement || !musicDescription.vocals) {
      throw new Error("AI response for musicDescription was missing required fields.");
    }

    if (!['Male', 'Female'].includes(musicDescription.vocals)) {
      throw new Error(`AI returned an invalid vocal style: ${musicDescription.vocals}`);
    }

    // Process lyrics
    let formattedLyrics: string;
    if (typeof lyrics === 'string') {
      formattedLyrics = lyrics;
    } else if (typeof lyrics === 'object' && lyrics !== null) {
      formattedLyrics = Object.entries(lyrics)
        .map(([section, text]) => `[${section}]\n${text}`)
        .join('\n\n');
    } else {
      throw new Error('Received invalid format for lyrics from the AI.');
    }

    // Step 2: Generate Album Art using Gemini native image generation
    const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: `Album art for a song titled "${title}". Cinematic, high-resolution, photorealistic. Style: ${musicDescription.genre}. Mood: ${musicDescription.mood}. ${imagePrompt}. Do not include any text in the image.`,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
        },
      },
    });

    let albumArtBase64 = '';
    let albumArtMimeType = 'image/png';
    if (imageResponse.candidates && imageResponse.candidates[0]) {
      const parts = imageResponse.candidates[0].content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          albumArtBase64 = part.inlineData.data || '';
          albumArtMimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
    }

    if (!albumArtBase64) {
      throw new Error("Failed to generate album art.");
    }

    return response.status(200).json({
      success: true,
      song: {
        title,
        lyrics: formattedLyrics,
        musicDescription,
        albumArtBase64,
        albumArtMimeType,
      },
    });
  } catch (error) {
    console.error("Error in generate-song API:", error);
    return response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate song',
    });
  }
}
