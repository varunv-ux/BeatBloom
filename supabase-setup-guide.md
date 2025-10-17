# Supabase Setup Guide for BeatBloom

This guide will help you set up Supabase integration for the BeatBloom app.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new Supabase project

## Step 1: Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL commands from `supabase-schema.sql` to create the required tables and policies

## Step 2: Storage Setup

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `audio-files`
3. Set the bucket to be private (not public)
4. Configure the following storage policies:

### Storage Policies for audio-files bucket:

```sql
-- Allow authenticated users to view audio files
CREATE POLICY "Users can view audio files" ON storage.objects
FOR SELECT USING (bucket_id = 'audio-files' AND auth.role() = 'authenticated');

-- Allow authenticated users to upload audio files
CREATE POLICY "Users can upload audio files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'audio-files' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete audio files
CREATE POLICY "Users can delete audio files" ON storage.objects
FOR DELETE USING (bucket_id = 'audio-files' AND auth.role() = 'authenticated');
```

## Step 3: Environment Configuration

1. Copy your Supabase project URL and anon key from the project settings
2. Update the `services/supabaseService.ts` file:

```typescript
const SUPABASE_URL = 'YOUR_ACTUAL_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_ACTUAL_SUPABASE_ANON_KEY';
```

Or create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Then update the service to use environment variables:

```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## Step 4: Authentication (Optional)

For this version, we're using basic authentication. All authenticated users can access all songs. 

In production, you might want to:
1. Add user authentication
2. Add a `user_id` column to the songs table
3. Update RLS policies to restrict access to user's own songs

## Current Audio Format Handling

### Recording Format:
- **Input recordings**: WebM format (browser default)
- **Generated songs**: MP3/WAV format (from Replicate API)
- **Storage**: Both stored as blobs in Supabase Storage
- **No format conversion**: Audio stored in original formats

### File Organization:
- `recordings/` folder: Original user recordings (WebM)
- `generated-songs/` folder: AI-generated music files (MP3/WAV)

## Migration from IndexedDB

The app currently uses IndexedDB for local storage. After setting up Supabase:

1. Users will gradually migrate to cloud storage
2. New songs will be saved to Supabase
3. Existing IndexedDB songs will remain local until manually re-saved

## Benefits of Supabase Integration

- **Cross-device sync**: Access songs from any device
- **Cloud backup**: No data loss from browser clearing
- **Better performance**: Faster than IndexedDB for large datasets
- **Scalability**: Handle more users and songs
- **Real-time features**: Potential for collaboration features 