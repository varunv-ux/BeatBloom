import { GeneratedSong, VocalStyle } from '../types';

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

    const response = await fetch('/api/generate-song', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64,
        mimeType: audioBlob.type || 'audio/webm',
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate song');
    }

    const { title, lyrics, musicDescription, albumArtUrl } = data.song;

    return {
      title,
      lyrics,
      musicDescription: {
        ...musicDescription,
        vocals: musicDescription.vocals as VocalStyle,
      },
      albumArtUrl,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate song: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the song.");
  }
};