-- Storage Policies for audio-files bucket
-- Run these in your Supabase SQL Editor after creating the audio-files bucket

-- 1. Policy to allow authenticated users to SELECT (view/download) audio files
CREATE POLICY "Allow authenticated users to view audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-files' AND auth.role() = 'authenticated');

-- 2. Policy to allow authenticated users to INSERT (upload) audio files
CREATE POLICY "Allow authenticated users to upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-files' AND auth.role() = 'authenticated');

-- 3. Policy to allow authenticated users to UPDATE audio files
CREATE POLICY "Allow authenticated users to update audio files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'audio-files' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'audio-files' AND auth.role() = 'authenticated');

-- 4. Policy to allow authenticated users to DELETE audio files
CREATE POLICY "Allow authenticated users to delete audio files"
ON storage.objects FOR DELETE
USING (bucket_id = 'audio-files' AND auth.role() = 'authenticated'); 