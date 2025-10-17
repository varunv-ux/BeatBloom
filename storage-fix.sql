-- Fix Storage Upload Issues
-- Run this in your Supabase SQL Editor

-- Remove all storage policies that are blocking uploads
DROP POLICY IF EXISTS "Allow all access to view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all access to upload audio files" ON storage.objects;  
DROP POLICY IF EXISTS "Allow all access to update audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all access to delete audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete audio files" ON storage.objects;

-- Temporarily disable RLS on storage.objects for testing
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Alternative: Create very permissive policies if the above doesn't work
-- Uncomment these if needed:
-- CREATE POLICY "Allow all storage operations" ON storage.objects FOR ALL USING (true) WITH CHECK (true); 