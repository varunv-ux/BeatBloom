import { SavedSong } from '../types';

const DB_NAME = 'HummToSongDB';
const DB_VERSION = 1;
const STORE_NAME = 'songs';

let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(false);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

export const addSong = (songData: Omit<SavedSong, 'id' | 'createdAt'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const songToAdd: Omit<SavedSong, 'id'> = {
      ...songData,
      createdAt: new Date(),
    };
    const request = store.add(songToAdd);

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = () => {
      console.error('Error adding song:', request.error);
      reject(request.error);
    };
  });
};

export const getAllSongs = (): Promise<SavedSong[]> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('createdAt');
    // Get all songs and sort them descending (newest first)
    const request = index.getAll();
    
    request.onsuccess = () => {
       // The index gives us ascending order, so we reverse it.
      resolve(request.result.reverse());
    };

    request.onerror = () => {
      console.error('Error getting all songs:', request.error);
      reject(request.error);
    };
  });
};

export const deleteSong = (id: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = () => {
            console.error('Error deleting song:', request.error);
            reject(request.error);
        };
    });
};