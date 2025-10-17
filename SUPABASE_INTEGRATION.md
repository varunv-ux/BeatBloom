# Supabase Integration for BeatBloom

## Overview

This document explains how audio recordings and songs are handled in the BeatBloom app, and how to set up Supabase integration for cloud storage and synchronization.

## Audio Format Summary

### Current Audio Format Handling

**Recording Format:**
- **Input recordings**: WebM format (browser default)
- **Generated songs**: MP3/WAV format (from Replicate API)
- **Storage**: Both stored as blobs in Supabase Storage
- **No format conversion**: Audio stored in original formats

### File Organization
```
Supabase Storage (audio-files bucket)
├── recordings/
│   └── timestamp-recording-title.webm    # Original user recordings
└── generated-songs/
    └── timestamp-song-title.mp3          # AI-generated music files
```

### Data Flow
1. **Recording** → Browser captures as WebM blob
2. **Lyrics Generation** → Gemini AI processes recording + generates lyrics/art
3. **Music Generation** → Replicate API creates MP3/WAV from lyrics
4. **Storage** → Both original recording and generated song stored in Supabase

## Supabase Setup

### 1. Prerequisites
- Create a Supabase account at [supabase.com](https://supabase.com)
- Create a new Supabase project

### 2. Database Setup
```sql
-- Run this in your Supabase SQL Editor
-- Copy the entire content from supabase-schema.sql
```

### 3. Storage Setup
1. Go to Storage in your Supabase dashboard
2. Create a bucket called `audio-files`
3. Set bucket to private (not public)
4. Configure storage policies (see supabase-schema.sql for policy SQL)

### 4. Environment Configuration

**Option A: Direct in code**
```typescript
// In services/supabaseService.ts
const SUPABASE_URL = 'YOUR_ACTUAL_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_ACTUAL_SUPABASE_ANON_KEY';
```

**Option B: Environment variables (recommended)**
1. Create `.env.local` in project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. The app will automatically use these environment variables

## Architecture Changes

### Before (IndexedDB)
```
Browser → IndexedDB (local storage only)
├── Songs table with audioBlob
└── Limited to single device
```

### After (Supabase)
```
Browser → Supabase Cloud
├── PostgreSQL database (metadata)
├── Storage bucket (audio files)
└── Cross-device synchronization
```

## Migration Strategy

### Gradual Migration
- Existing IndexedDB songs remain local
- New songs automatically save to Supabase
- Users can re-save old songs to migrate them

### Manual Migration (Future Enhancement)
```typescript
// Potential migration function
const migrateSongsToSupabase = async () => {
  const localSongs = await dbService.getAllSongs();
  for (const song of localSongs) {
    await supabaseService.addSong({
      title: song.title,
      lyrics: song.lyrics,
      musicDescription: song.musicDescription,
      albumArtUrl: song.albumArtUrl,
      generatedSongBlob: song.audioBlob,
    });
  }
};
```

## Benefits

### For Users
- **Cross-device access**: Songs available on any device
- **Cloud backup**: No data loss from browser clearing
- **Better performance**: Faster loading for large collections

### For Developers
- **Scalability**: Handle more users and songs
- **Real-time features**: Potential for collaboration
- **Analytics**: Track usage patterns
- **Cost efficiency**: Pay only for storage used

## API Functions

### Core Functions
```typescript
// Initialize Supabase
await supabaseService.initSupabase();

// Save a song
await supabaseService.addSong({
  title: 'My Song',
  lyrics: 'Verse 1...',
  musicDescription: { genre: 'Pop', mood: 'Happy', ... },
  albumArtUrl: 'data:image/jpeg;base64,...',
  recordingBlob: originalRecording,
  generatedSongBlob: generatedAudio,
});

// Get all songs
const songs = await supabaseService.getAllSongs();

// Delete a song
await supabaseService.deleteSong(songId);

// Get playback URL
const url = await supabaseService.getAudioUrlForPlayback(song);
```

### File Management
```typescript
// Upload audio file
const filePath = await supabaseService.uploadAudioFile(
  audioBlob, 
  'filename.mp3', 
  'generated-songs'
);

// Get signed URL for playback
const signedUrl = await supabaseService.getAudioFileUrl(filePath);

// Download audio file
const blob = await supabaseService.downloadAudioFile(filePath);
```

## Security

### Row Level Security (RLS)
- Enabled on all tables
- Authenticated users can CRUD their own data
- Anonymous users have no access

### Storage Policies
- Private bucket (not publicly accessible)
- Authenticated users can upload/download
- File type restrictions (audio only)
- Size limits (50MB per file)

## Performance Considerations

### Lazy Loading
- Audio blobs loaded only when needed
- Signed URLs cached for 1 hour
- Metadata loaded immediately

### Optimization Tips
```typescript
// Cache frequently accessed URLs
const urlCache = new Map<string, string>();

// Preload audio for better UX
const preloadAudio = async (song: SavedSong) => {
  const url = await supabaseService.getAudioUrlForPlayback(song);
  if (url) {
    const audio = new Audio(url);
    audio.preload = 'metadata';
  }
};
```

## Future Enhancements

### User Authentication
- Add user registration/login
- User-specific song collections
- Social features (sharing, collaboration)

### Format Conversion
- Server-side audio format standardization
- Compression for better performance
- Multiple quality options

### Advanced Features
- Real-time collaboration
- Song versioning
- Public sharing with unique links
- Integration with music platforms

## Troubleshooting

### Common Issues

**1. Environment variables not working**
- Ensure `.env.local` is in project root
- Restart dev server after adding env vars
- Check that variables start with `VITE_`

**2. Storage bucket errors**
- Verify bucket name matches `AUDIO_BUCKET` constant
- Check storage policies are configured
- Ensure file size is under 50MB limit

**3. CORS issues**
- Supabase handles CORS automatically
- Verify project URL is correct
- Check anon key permissions

### Debug Mode
```typescript
// Enable detailed logging
const DEBUG = true;
if (DEBUG) {
  console.log('Supabase config:', { SUPABASE_URL, SUPABASE_ANON_KEY });
}
```

## Support

For Supabase-specific issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

For BeatBloom integration issues:
- Check the setup guide: `supabase-setup-guide.md`
- Review the SQL schema: `supabase-schema.sql`
- Examine service implementation: `services/supabaseService.ts` 