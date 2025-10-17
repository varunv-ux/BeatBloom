import { SavedSong, MusicDescription } from '../types';

// API base URL - automatically uses the correct domain in production
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5173' : '';

export interface VercelSong {
  id: number;
  title: string;
  lyrics: string;
  music_description: MusicDescription;
  album_art_url: string;
  audio_data_url?: string; // Store small audio files as data URLs
  created_at: string;
  updated_at: string;
}

/**
 * Initialize database tables via API
 */
export const initDatabase = async (): Promise<boolean> => {
  try {
    console.log('🔄 Initializing database via API...');
    
    const response = await fetch(`${API_BASE_URL}/api/init-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to initialize database');
    }

    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return false;
  }
};

/**
 * Add a new song to the database via API
 * Note: For audio, we'll store it as a data URL for now (works for smaller files)
 * For production, you'd want to use Vercel Blob storage
 */
export const addSong = async (songData: {
  title: string;
  lyrics: string;
  musicDescription: MusicDescription;
  albumArtUrl: string;
  generatedSongBlob?: Blob;
}): Promise<number | null> => {
  try {
    console.log('💾 Saving song via API:', songData.title);
    
    // Convert audio blob to data URL if provided
    let audioDataUrl: string | null = null;
    if (songData.generatedSongBlob) {
      audioDataUrl = await blobToDataUrl(songData.generatedSongBlob);
    }

    const response = await fetch(`${API_BASE_URL}/api/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: songData.title,
        lyrics: songData.lyrics,
        musicDescription: songData.musicDescription,
        albumArtUrl: songData.albumArtUrl,
        audioDataUrl,
      }),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to save song');
    }

    console.log('✅ Song saved with ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ Error adding song:', error);
    return null;
  }
};

/**
 * Get all songs from the database via API
 */
export const getAllSongs = async (): Promise<SavedSong[]> => {
  try {
    console.log('📂 Fetching songs via API...');
    
    const response = await fetch(`${API_BASE_URL}/api/songs`, {
      method: 'GET',
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch songs');
    }

    const songs: SavedSong[] = data.songs.map((row: any) => {
      // Convert data URL back to blob if present
      let audioBlob = new Blob();
      if (row.audio_data_url) {
        audioBlob = dataUrlToBlob(row.audio_data_url);
      }

      return {
        id: row.id,
        title: row.title,
        lyrics: row.lyrics,
        musicDescription: row.music_description,
        albumArtUrl: row.album_art_url,
        createdAt: new Date(row.created_at),
        audioBlob,
      };
    });

    console.log('✅ Fetched', songs.length, 'songs');
    return songs;
  } catch (error) {
    console.error('❌ Error fetching songs:', error);
    return [];
  }
};

/**
 * Delete a song from the database via API
 */
export const deleteSong = async (id: number): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting song via API:', id);
    
    const response = await fetch(`${API_BASE_URL}/api/songs?id=${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete song');
    }

    console.log('✅ Song deleted');
    return true;
  } catch (error) {
    console.error('❌ Error deleting song:', error);
    return false;
  }
};

/**
 * Get a single song by ID via API
 * Note: Currently we just filter from getAllSongs, but you could create a dedicated endpoint
 */
export const getSongById = async (id: number): Promise<SavedSong | null> => {
  try {
    const songs = await getAllSongs();
    return songs.find(song => song.id === id) || null;
  } catch (error) {
    console.error('❌ Error fetching song:', error);
    return null;
  }
};

/**
 * Helper: Convert Blob to Data URL
 */
const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Helper: Convert Data URL to Blob
 */
const dataUrlToBlob = (dataUrl: string): Blob => {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'audio/mpeg';
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
};
