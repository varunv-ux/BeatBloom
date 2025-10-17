-- Permissive Storage Policies (Alternative to disabling RLS)
-- Run this in your Supabase SQL Editor

-- First, remove any existing conflicting policies
DROP POLICY IF EXISTS "Allow all access to view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all access to upload audio files" ON storage.objects;  
DROP POLICY IF EXISTS "Allow all access to update audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all access to delete audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete audio files" ON storage.objects;

-- Create very permissive policies that allow all operations
CREATE POLICY "Public read access" ON storage.objects 
FOR SELECT USING (bucket_id = 'audio-files');

CREATE POLICY "Public upload access" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'audio-files');

CREATE POLICY "Public update access" ON storage.objects 
FOR UPDATE USING (bucket_id = 'audio-files');

CREATE POLICY "Public delete access" ON storage.objects 
FOR DELETE USING (bucket_id = 'audio-files'); 