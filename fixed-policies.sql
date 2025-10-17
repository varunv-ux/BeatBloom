-- Fixed Policies for Development (Anonymous Users)
-- Run these in your Supabase SQL Editor to replace the existing policies

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all songs" ON songs;
DROP POLICY IF EXISTS "Users can insert songs" ON songs;
DROP POLICY IF EXISTS "Users can update songs" ON songs;
DROP POLICY IF EXISTS "Users can delete songs" ON songs;

DROP POLICY IF EXISTS "Allow authenticated users to view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete audio files" ON storage.objects;

-- Create new policies that allow anonymous access for development
-- Database policies for songs table
CREATE POLICY "Allow all access to songs" ON songs FOR ALL USING (true);

-- Storage policies for audio files (allow anonymous access)
CREATE POLICY "Allow all access to view audio files" ON storage.objects 
FOR SELECT USING (bucket_id = 'audio-files');

CREATE POLICY "Allow all access to upload audio files" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'audio-files');

CREATE POLICY "Allow all access to update audio files" ON storage.objects 
FOR UPDATE USING (bucket_id = 'audio-files');

CREATE POLICY "Allow all access to delete audio files" ON storage.objects 
FOR DELETE USING (bucket_id = 'audio-files');

-- Allow bucket listing for all users
DROP POLICY IF EXISTS "Allow authenticated users to list buckets" ON storage.buckets;
CREATE POLICY "Allow all users to list buckets" ON storage.buckets FOR SELECT USING (true); 