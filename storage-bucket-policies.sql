-- Additional Storage Policies for Bucket Management
-- Run these in your Supabase SQL Editor to allow bucket listing

-- Allow authenticated users to list buckets
-- This is needed for the app to see available buckets
CREATE POLICY "Allow authenticated users to list buckets"
ON storage.buckets FOR SELECT
USING (auth.role() = 'authenticated');

-- Alternative: Allow anyone to list buckets (if the above doesn't work)
-- Uncomment this if you still have issues:
-- CREATE POLICY "Allow public bucket listing"
-- ON storage.buckets FOR SELECT
-- USING (true); 