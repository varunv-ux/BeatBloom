import { sql } from '@vercel/postgres';
import { SavedSong, GeneratedSong, MusicDescription } from '../types';

// Note: Vercel Postgres uses environment variables automatically
// POSTGRES_URL, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING, etc.

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
 * Initialize database tables
 */
export const initDatabase = async (): Promise<boolean> => {
  try {
    console.log('🔄 Initializing Vercel Postgres database...');
    
    // Create songs table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS songs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        lyrics TEXT NOT NULL,
        music_description JSONB NOT NULL,
        album_art_url TEXT NOT NULL,
        audio_data_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return false;
  }
};

/**
 * Add a new song to the database
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
    console.log('💾 Saving song to Vercel Postgres:', songData.title);
    
    // Convert audio blob to data URL if provided
    let audioDataUrl: string | null = null;
    if (songData.generatedSongBlob) {
      audioDataUrl = await blobToDataUrl(songData.generatedSongBlob);
    }

    const result = await sql`
      INSERT INTO songs (title, lyrics, music_description, album_art_url, audio_data_url)
      VALUES (
        ${songData.title},
        ${songData.lyrics},
        ${JSON.stringify(songData.musicDescription)},
        ${songData.albumArtUrl},
        ${audioDataUrl}
      )
      RETURNING id
    `;

    const id = result.rows[0]?.id;
    console.log('✅ Song saved with ID:', id);
    return id;
  } catch (error) {
    console.error('❌ Error adding song:', error);
    return null;
  }
};

/**
 * Get all songs from the database
 */
export const getAllSongs = async (): Promise<SavedSong[]> => {
  try {
    console.log('📂 Fetching songs from Vercel Postgres...');
    
    const result = await sql`
      SELECT * FROM songs
      ORDER BY created_at DESC
    `;

    const songs: SavedSong[] = result.rows.map((row: any) => {
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
 * Delete a song from the database
 */
export const deleteSong = async (id: number): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting song:', id);
    
    await sql`
      DELETE FROM songs
      WHERE id = ${id}
    `;

    console.log('✅ Song deleted');
    return true;
  } catch (error) {
    console.error('❌ Error deleting song:', error);
    return false;
  }
};

/**
 * Get a single song by ID
 */
export const getSongById = async (id: number): Promise<SavedSong | null> => {
  try {
    const result = await sql`
      SELECT * FROM songs
      WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
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

export { sql };
