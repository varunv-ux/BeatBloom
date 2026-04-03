import { SavedSong } from '../types';

const DB_NAME = 'beatbloom-cache';
const DB_VERSION = 1;
const SONGS_STORE = 'songs';
const AUDIO_STORE = 'audio';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SONGS_STORE)) {
        db.createObjectStore(SONGS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// --- Song metadata cache ---

export async function getCachedSongs(): Promise<SavedSong[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SONGS_STORE, 'readonly');
      const store = tx.objectStore(SONGS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const songs = (req.result || []).map((row: any) => ({
          ...row,
          createdAt: new Date(row.createdAt),
        }));
        songs.sort((a: SavedSong, b: SavedSong) => b.createdAt.getTime() - a.createdAt.getTime());
        resolve(songs);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function setCachedSongs(songs: SavedSong[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(SONGS_STORE, 'readwrite');
    const store = tx.objectStore(SONGS_STORE);
    store.clear();
    for (const song of songs) {
      store.put({ ...song, createdAt: song.createdAt.toISOString() });
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Cache write failed silently
  }
}

export async function removeCachedSong(id: number): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([SONGS_STORE, AUDIO_STORE], 'readwrite');
    tx.objectStore(SONGS_STORE).delete(id);
    tx.objectStore(AUDIO_STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silent
  }
}

// --- Audio blob cache (for offline playback) ---

export async function cacheAudioBlob(songId: number, audioUrl: string): Promise<void> {
  try {
    // Skip ephemeral URLs (Replicate delivery URLs expire) — only cache persistent storage
    if (audioUrl.includes('replicate.delivery')) return;

    const response = await fetch(audioUrl);
    if (!response.ok) return;
    const blob = await response.blob();
    const db = await openDB();
    const tx = db.transaction(AUDIO_STORE, 'readwrite');
    tx.objectStore(AUDIO_STORE).put({ id: songId, blob, url: audioUrl });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Failed to cache audio - not critical
  }
}

export async function getCachedAudioUrl(songId: number): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, 'readonly');
      const req = tx.objectStore(AUDIO_STORE).get(songId);
      req.onsuccess = () => {
        if (req.result?.blob) {
          resolve(URL.createObjectURL(req.result.blob));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function isAudioCached(songId: number): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(AUDIO_STORE, 'readonly');
      const req = tx.objectStore(AUDIO_STORE).get(songId);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Cache audio for all songs that aren't already cached.
 * Runs in background, non-blocking.
 */
export async function cacheAllSongAudio(songs: SavedSong[]): Promise<void> {
  for (const song of songs) {
    if (song.audioUrl) {
      const cached = await isAudioCached(song.id);
      if (!cached) {
        await cacheAudioBlob(song.id, song.audioUrl);
      }
    }
  }
}
