import { SavedSong, MusicDescription } from '../types';

const API_BASE_URL = '';

export interface VercelSong {
  id: number;
  title: string;
  lyrics: string;
  music_description: MusicDescription;
  album_art_url: string;
  audio_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Upload a file to Vercel Blob storage via the API route.
 * Returns the public URL, or null if blob storage isn't configured.
 */
const uploadToBlob = async (
  base64Data: string,
  filename: string,
  contentType: string
): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, filename, contentType }),
    });

    const data = await response.json();
    if (data.success) {
      return data.url;
    }
    // Blob storage not configured - fall back gracefully
    return null;
  } catch {
    return null;
  }
};

/**
 * Convert a blob to base64 (data portion only, no prefix)
 */
const blobToBase64Raw = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Initialize database tables via API
 */
export const initDatabase = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/init-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
};

/**
 * Add a new song to the database via API.
 * Uploads audio to blob storage if available, otherwise stores the audio URL from Replicate.
 */
export const addSong = async (songData: {
  title: string;
  lyrics: string;
  musicDescription: MusicDescription;
  albumArtUrl: string;
  audioUrl?: string;
  generatedSongBlob?: Blob;
  parentId?: number | null;
}): Promise<number | null> => {
  try {
    let audioUrl = songData.audioUrl || null;

    // Try to upload audio to blob storage
    if (songData.generatedSongBlob && songData.generatedSongBlob.size > 0) {
      const base64 = await blobToBase64Raw(songData.generatedSongBlob);
      const contentType = songData.generatedSongBlob.type || 'audio/mpeg';
      const blobUrl = await uploadToBlob(
        base64,
        `songs/${Date.now()}-audio.mp3`,
        contentType
      );
      if (blobUrl) {
        audioUrl = blobUrl;
      }
    }

    // Try to upload album art to blob storage (if it's a data URL)
    let albumArtUrl = songData.albumArtUrl;
    if (albumArtUrl.startsWith('data:image/')) {
      const parts = albumArtUrl.split(',');
      const base64 = parts[1];
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const blobUrl = await uploadToBlob(
        base64,
        `songs/${Date.now()}-cover.jpg`,
        mime
      );
      if (blobUrl) {
        albumArtUrl = blobUrl;
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: songData.title,
        lyrics: songData.lyrics,
        musicDescription: songData.musicDescription,
        albumArtUrl,
        audioUrl,
        parentId: songData.parentId || null,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to save song');
    }

    return data.id;
  } catch {
    return null;
  }
};

/**
 * Get all songs from the database via API (with pagination)
 */
export const getAllSongs = async (page: number = 1, limit: number = 20): Promise<{ songs: SavedSong[]; total: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/songs?page=${page}&limit=${limit}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch songs');
    }

    const songs: SavedSong[] = data.songs.map((row: any) => ({
      id: row.id,
      title: row.title,
      lyrics: row.lyrics,
      musicDescription: row.music_description,
      albumArtUrl: row.album_art_url,
      audioUrl: row.audio_url || undefined,
      createdAt: new Date(row.created_at),
      parentId: row.parent_id || null,
      versionNumber: row.version_number || 1,
    }));

    return { songs, total: data.pagination?.total || songs.length };
  } catch {
    return { songs: [], total: 0 };
  }
};

/**
 * Delete a song from the database via API
 */
export const deleteSong = async (id: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/songs?id=${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
};
