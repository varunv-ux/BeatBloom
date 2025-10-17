import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GeneratedSong, VocalStyle } from '../types';

// Get API key from environment variable
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('⚠️ GEMINI_API_KEY not found in environment variables');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error("Failed to read blob as string."));
      }
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
};

export const generateSongFromHum = async (audioBlob: Blob): Promise<GeneratedSong> => {
  try {
    const audioBase64 = await blobToBase64(audioBlob);

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
        mimeType: audioBlob.type || 'audio/webm',
        data: audioBase64,
      },
    };

    // Step 1: Generate Lyrics, Description, and Image Prompt
    const lyricsResponse: GenerateContentResponse = await ai.models.generateContent({
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
    // Gemini can sometimes still wrap the response in markdown, so we strip it.
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    // Try to parse JSON with better error handling
    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw response:", jsonStr);
      
      // Try to fix common JSON issues
      let fixedJsonStr = jsonStr
        .replace(/\\'/g, "'")  // Fix escaped single quotes
        .replace(/\\"/g, '"')  // Fix escaped double quotes
        .replace(/\n/g, '\\n') // Escape actual newlines
        .replace(/\r/g, '\\r') // Escape carriage returns
        .replace(/\t/g, '\\t'); // Escape tabs
      
      try {
        parsedData = JSON.parse(fixedJsonStr);
      } catch (secondError) {
        throw new Error(`Failed to parse AI response as JSON. Original error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. Raw response: ${jsonStr.substring(0, 200)}...`);
      }
    }
    const { title, lyrics, musicDescription, imagePrompt } = parsedData;

    if (!title || !lyrics || !musicDescription || !imagePrompt) {
      throw new Error("AI response was missing required fields (title, lyrics, musicDescription, imagePrompt).");
    }

    if (!musicDescription.genre || !musicDescription.mood || !musicDescription.arrangement || !musicDescription.vocals) {
      throw new Error("AI response for musicDescription was missing required fields.");
    }

    if (!['Male', 'Female'].includes(musicDescription.vocals)) {
      throw new Error(`AI returned an invalid vocal style: ${musicDescription.vocals}`);
    }

    // Process lyrics, which could be a string or a structured object
    let formattedLyrics: string;
    if (typeof lyrics === 'string') {
      formattedLyrics = lyrics;
    } else if (typeof lyrics === 'object' && lyrics !== null) {
      // Format the object into a string with headers like [Verse 1], [Chorus]
      formattedLyrics = Object.entries(lyrics)
        .map(([section, text]) => `[${section}]\n${text}`)
        .join('\n\n');
    } else {
      throw new Error('Received invalid format for lyrics from the AI.');
    }

    // Step 2: Generate Album Art
    const imageResponse = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: `Album art for a song titled "${title}". Cinematic, high-resolution, photorealistic. Style: ${musicDescription.genre}. Mood: ${musicDescription.mood}. ${imagePrompt}`,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });
    
    if (!imageResponse.generatedImages || imageResponse.generatedImages.length === 0) {
        throw new Error("Failed to generate album art.");
    }
    const firstImage = imageResponse.generatedImages[0];
    if (!firstImage || !firstImage.image) {
        throw new Error("Invalid image structure received from Imagen API.");
    }
    const imageBytes = firstImage.image.imageBytes;
    if (!imageBytes) {
        throw new Error("Empty image data received from Imagen API.");
    }
    const base64ImageBytes: string = imageBytes;
    const albumArtUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

    return {
      title,
      lyrics: formattedLyrics,
      musicDescription: {
        ...musicDescription,
        vocals: musicDescription.vocals as VocalStyle
      },
      albumArtUrl,
    };
  } catch (error) {
    console.error("Error in Gemini Service:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate song: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the song.");
  }
};