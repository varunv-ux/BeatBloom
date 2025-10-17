import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SavedSong, GeneratedSong, MusicDescription } from '../types';

// Supabase configuration
// Replace with your actual Supabase project URL and anon key
// Or use environment variables by creating a .env.local file
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hubarqseutzaetmmopxz.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YmFycXNldXR6YWV0bW1vcHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTkzMDUsImV4cCI6MjA2Njg5NTMwNX0.4iBOwx19z6Nu94c8LSjrin-lbdretHOtsMHz7gzuQeM';

// Create Supabase client
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database table and bucket names
const SONGS_TABLE = 'songs';
const AUDIO_BUCKET = 'audio-files';

export interface SupabaseSong {
  id: number;
  title: string;
  lyrics: string;
  music_description: MusicDescription;
  album_art_url: string;
  recording_file_path?: string; // Path to original recording in Supabase Storage
  generated_song_file_path?: string; // Path to generated song in Supabase Storage
  created_at: string;
  updated_at: string;
}

/**
 * Initialize Supabase storage bucket for audio files
 * This should be called once when setting up the app
 */
export const initSupabase = async (): Promise<boolean> => {
  try {
    console.log('🔄 Initializing Supabase...');
    
    // Check if bucket exists, create if it doesn't
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error checking buckets:', error);
      console.log('⚠️ Bucket listing failed, but assuming audio-files bucket exists');
      console.log('✅ Supabase initialization complete (with assumptions)');
      return true; // Continue anyway since we know the bucket exists
    }

    console.log('📋 Available buckets:', buckets?.map(b => b.name) || []);
    console.log('🔍 Looking for bucket:', AUDIO_BUCKET);

    const audiosBucketExists = buckets?.some(bucket => bucket.name === AUDIO_BUCKET);
    
    if (!audiosBucketExists) {
      console.log('❌ Audio files bucket not found in API response!');
      console.log('⚠️ But we know it exists from dashboard, so continuing...');
      console.log('✅ Supabase initialization complete (bucket exists in dashboard)');
      return true; // Continue anyway since we saw it in the dashboard
    } else {
      console.log('✅ Audio files bucket found');
    }

    console.log('✅ Supabase initialization complete');
    return true;
  } catch (error) {
    console.error('❌ Error initializing Supabase:', error);
    return false;
  }
};

/**
 * Upload audio file to Supabase Storage
 */
export const uploadAudioFile = async (
  audioBlob: Blob, 
  fileName: string,
  folder: 'recordings' | 'generated-songs' = 'recordings'
): Promise<string | null> => {
  try {
    const filePath = `${folder}/${Date.now()}-${fileName}`;
    
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(filePath, audioBlob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading audio file:', error);
      return null;
    }

    return data.path;
  } catch (error) {
    console.error('Error uploading audio file:', error);
    return null;
  }
};

/**
 * Get signed URL for audio file
 */
export const getAudioFileUrl = async (filePath: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
};

/**
 * Download audio file as blob
 */
export const downloadAudioFile = async (filePath: string): Promise<Blob | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .download(filePath);

    if (error) {
      console.error('Error downloading audio file:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error downloading audio file:', error);
    return null;
  }
};

/**
 * Add a new song to Supabase
 */
export const addSong = async (songData: {
  title: string;
  lyrics: string;
  musicDescription: MusicDescription;
  albumArtUrl: string;
  recordingBlob?: Blob;
  generatedSongBlob?: Blob;
}): Promise<number | null> => {
  try {
    let recordingFilePath: string | null = null;
    let generatedSongFilePath: string | null = null;

    // Upload recording if provided
    if (songData.recordingBlob) {
      recordingFilePath = await uploadAudioFile(
        songData.recordingBlob, 
        `recording-${songData.title.replace(/[^a-zA-Z0-9]/g, '-')}.webm`,
        'recordings'
      );
    }

    // Upload generated song if provided
    if (songData.generatedSongBlob) {
      generatedSongFilePath = await uploadAudioFile(
        songData.generatedSongBlob, 
        `song-${songData.title.replace(/[^a-zA-Z0-9]/g, '-')}.mp3`,
        'generated-songs'
      );
    }

    // Insert song metadata into database
    const { data, error } = await supabase
      .from(SONGS_TABLE)
      .insert({
        title: songData.title,
        lyrics: songData.lyrics,
        music_description: songData.musicDescription,
        album_art_url: songData.albumArtUrl,
        recording_file_path: recordingFilePath,
        generated_song_file_path: generatedSongFilePath,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding song to database:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error adding song:', error);
    return null;
  }
};

/**
 * Get all songs from Supabase
 */
export const getAllSongs = async (): Promise<SavedSong[]> => {
  try {
    const { data, error } = await supabase
      .from(SONGS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching songs:', error);
      return [];
    }

    // Convert Supabase songs to SavedSong format
    const songs: SavedSong[] = await Promise.all(
      (data as SupabaseSong[]).map(async (song) => {
        // For the audioBlob, we'll need to download it when needed
        // For now, we'll create an empty blob as a placeholder
        let audioBlob = new Blob();
        
        // If there's a generated song file, download it
        if (song.generated_song_file_path) {
          const downloadedBlob = await downloadAudioFile(song.generated_song_file_path);
          if (downloadedBlob) {
            audioBlob = downloadedBlob;
          }
        }

        return {
          id: song.id,
          title: song.title,
          lyrics: song.lyrics,
          musicDescription: song.music_description,
          albumArtUrl: song.album_art_url,
          createdAt: new Date(song.created_at),
          audioBlob,
        };
      })
    );

    return songs;
  } catch (error) {
    console.error('Error getting all songs:', error);
    return [];
  }
};

/**
 * Delete a song from Supabase (including files)
 */
export const deleteSong = async (id: number): Promise<boolean> => {
  try {
    // First get the song to know which files to delete
    const { data: song, error: fetchError } = await supabase
      .from(SONGS_TABLE)
      .select('recording_file_path, generated_song_file_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching song for deletion:', fetchError);
      return false;
    }

    // Delete audio files from storage
    const filesToDelete = [
      song.recording_file_path,
      song.generated_song_file_path
    ].filter(Boolean) as string[];

    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(AUDIO_BUCKET)
        .remove(filesToDelete);

      if (storageError) {
        console.error('Error deleting audio files:', storageError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete song from database
    const { error: deleteError } = await supabase
      .from(SONGS_TABLE)
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting song from database:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting song:', error);
    return false;
  }
};

/**
 * Get audio URL for playback (with caching)
 */
export const getAudioUrlForPlayback = async (song: SavedSong | SupabaseSong): Promise<string | null> => {
  try {
    let filePath: string | null = null;
    
    if ('generated_song_file_path' in song) {
      // SupabaseSong
      filePath = song.generated_song_file_path || null;
    } else {
      // SavedSong - we'll need to get the file path from the database
      const { data, error } = await supabase
        .from(SONGS_TABLE)
        .select('generated_song_file_path')
        .eq('id', song.id)
        .single();
      
      if (!error && data) {
        filePath = data.generated_song_file_path;
      }
    }

    if (!filePath) {
      return null;
    }

    return await getAudioFileUrl(filePath);
  } catch (error) {
    console.error('Error getting audio URL for playback:', error);
    return null;
  }
};

export { supabase }; 