-- =============================================
-- BeatBloom Supabase Database Schema
-- =============================================

-- Enable the uuid extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create songs table
CREATE TABLE songs (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    lyrics TEXT NOT NULL,
    music_description JSONB NOT NULL,
    album_art_url TEXT NOT NULL,
    recording_file_path TEXT, -- Path to original recording in Supabase Storage
    generated_song_file_path TEXT, -- Path to generated song in Supabase Storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_songs_created_at ON songs(created_at DESC);
CREATE INDEX idx_songs_title ON songs(title);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_songs_updated_at 
    BEFORE UPDATE ON songs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on songs table
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all songs
CREATE POLICY "Users can view all songs" ON songs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert songs
CREATE POLICY "Users can insert songs" ON songs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update their own songs
-- Note: For simplicity, allowing all authenticated users to update any song
-- In production, you might want to add user_id column and restrict to song owner
CREATE POLICY "Users can update songs" ON songs
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete songs
CREATE POLICY "Users can delete songs" ON songs
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- Storage Bucket Policies
-- =============================================

-- Note: These need to be set up in the Supabase dashboard or via SQL
-- The storage bucket 'audio-files' should have the following policies:

-- SELECT policy for authenticated users:
-- CREATE POLICY "Users can download audio files" ON storage.objects
--     FOR SELECT USING (bucket_id = 'audio-files' AND auth.role() = 'authenticated');

-- INSERT policy for authenticated users:
-- CREATE POLICY "Users can upload audio files" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'audio-files' AND auth.role() = 'authenticated');

-- DELETE policy for authenticated users:
-- CREATE POLICY "Users can delete audio files" ON storage.objects
--     FOR DELETE USING (bucket_id = 'audio-files' AND auth.role() = 'authenticated');

-- =============================================
-- Sample Data (Optional)
-- =============================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO songs (title, lyrics, music_description, album_art_url) VALUES 
(
    'Sample Song',
    '[Verse 1]\nThis is a sample song\nWith some sample lyrics\n\n[Chorus]\nOh what a day\nTo make some music',
    '{"genre": "Pop", "mood": "Happy", "arrangement": "Full Band", "vocals": "Female"}',
    'https://example.com/sample-album-art.jpg'
);
*/ 