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
  parentId?: number | null;
}): Promise<number | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: songData.title,
        lyrics: songData.lyrics,
        musicDescription: songData.musicDescription,
        albumArtUrl: songData.albumArtUrl,
        audioUrl: songData.audioUrl || null,
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
 * Get a single song with full details (including lyrics)
 */
export const getSong = async (id: number): Promise<SavedSong | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/songs?id=${id}`);
    const data = await response.json();
    if (!data.success || !data.song) return null;
    const row = data.song;
    return {
      id: row.id,
      title: row.title,
      lyrics: row.lyrics,
      musicDescription: row.music_description,
      albumArtUrl: row.album_art_url,
      audioUrl: row.audio_url || undefined,
      createdAt: new Date(row.created_at),
      parentId: row.parent_id || null,
      versionNumber: row.version_number || 1,
    };
  } catch {
    return null;
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
