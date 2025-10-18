# 🎵 BeatBloom

**Transform your voice into complete songs with AI-powered lyrics, music, and album art.**

BeatBloom is an innovative web application that lets you hum a melody or sing a few words, and it generates complete songs with:
- 🎤 AI-generated lyrics
- 🎼 Full instrumental music
- 🎨 Custom album artwork
- 💾 Cloud storage for your creations

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **Voice Recording**: Record your humming or singing with real-time waveform visualization
- **AI Lyrics Generation**: Powered by Google Gemini 2.5 Flash
- **Album Art Creation**: Automatic album art using Google Imagen-3
- **Multiple Music Models**:
  - **MiniMax Music 1.5**: High-quality, natural vocals (recommended)
  - **ACE-Step**: Fast generation with duration control
- **Cloud Storage**: Songs saved to Neon/Vercel Postgres database
- **Beautiful UI**: Modern, responsive design with smooth animations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- API keys for:
  - [Google Gemini](https://aistudio.google.com/apikey)
  - [Replicate](https://replicate.com/account/api-tokens)
  - [Neon Database](https://neon.tech) (or Vercel Postgres)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/varunv-ux/BeatBloom.git
   cd BeatBloom/App
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```bash
   # Required: AI Services
   VITE_GEMINI_API_KEY=your-gemini-api-key
   VITE_REPLICATE_API_TOKEN=your-replicate-token
   
   # Required: Database
   POSTGRES_URL=your-neon-or-vercel-postgres-url
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:5173
   ```

## 🎮 How to Use

1. **Record**: Click "Start recording" and hum or sing your melody
2. **Generate**: Click "Generate lyrics & song art" 
3. **Customize**: Edit lyrics and adjust musical style (genre, mood, arrangement, vocals)
4. **Create**: Click "Create song" to generate the full track
5. **Save**: Your song is automatically saved to the cloud!
6. **View**: Access all your songs in the "My songs" tab

## 🎼 Music Models

### MiniMax Music 1.5 (Default)
- **Quality**: ⭐⭐⭐⭐⭐
- **Best for**: Production-quality songs with natural vocals
- **Duration**: Auto-optimized (up to 5 minutes)
- **Strengths**: Superior audio quality, coherent structure

### ACE-Step
- **Quality**: ⭐⭐⭐⭐
- **Best for**: Fast prototyping and experimentation
- **Duration**: Manual control (30/60/120 seconds)
- **Strengths**: Speed, flexibility, precise duration control

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (inline)
- **AI Services**:
  - Google Gemini 2.5 Flash (lyrics & album art)
  - Replicate (music generation)
- **Database**: Neon Postgres / Vercel Postgres
- **Audio**: react-voice-visualizer

## 📁 Project Structure

```
App/
├── components/          # React components
│   ├── GeneratedSongDisplay.tsx
│   ├── MySongsView.tsx
│   └── RecorderControl.tsx
├── services/           # Backend integrations
│   ├── geminiService.ts      # Gemini AI
│   ├── replicateService.ts   # Music generation
│   ├── vercelDbService.ts    # Database
│   └── musicModels.ts        # Model configurations
├── assets/             # Images and static files
├── App.tsx            # Main application
└── types.ts           # TypeScript definitions
```

## 🔐 Environment Variables

See `.env.local.example` for a complete list of required variables.

### Required Variables

| Variable | Description | Get From |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key | [AI Studio](https://aistudio.google.com/apikey) |
| `VITE_REPLICATE_API_TOKEN` | Replicate API token | [Replicate](https://replicate.com/account/api-tokens) |
| `POSTGRES_URL` | Database connection string | [Neon](https://neon.tech) or Vercel |

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com/new)
3. Add environment variables in Vercel dashboard
4. Vercel automatically detects Vite configuration
5. Deploy! 🚀

### Environment Variables in Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:
- `VITE_GEMINI_API_KEY`
- `VITE_REPLICATE_API_TOKEN`
- `POSTGRES_URL` (auto-configured if using Vercel Postgres)

## 📚 Documentation

- [Vercel Setup Guide](VERCEL_SETUP.md)
- [Neon Local Setup](NEON_LOCAL_SETUP.md)
- [Music Models Guide](MUSIC_MODELS_GUIDE.md)
- [Migration Complete](MIGRATION_COMPLETE.md)

## 🐛 Troubleshooting

### "Cannot connect to database"
- Verify `POSTGRES_URL` in `.env.local`
- Check database is active in Neon/Vercel dashboard
- Restart dev server: `npm run dev`

### "Gemini API error"
- Verify API key is correct
- Check quota at [Google AI Studio](https://aistudio.google.com)

### "Music generation failed"
- Check Replicate API token
- Verify you have Replicate credits
- Try the alternative music model

### CORS errors
- This is expected with some public CORS proxies
- The app uses fallback proxies automatically
- For production, consider setting up your own proxy

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/gemini-api) for AI capabilities
- [Replicate](https://replicate.com) for music generation models
- [Neon](https://neon.tech) for serverless Postgres
- [Vercel](https://vercel.com) for deployment platform

## 📧 Contact

Varun Varshney - [@varunv-ux](https://github.com/varunv-ux)

Project Link: [https://github.com/varunv-ux/BeatBloom](https://github.com/varunv-ux/BeatBloom)

---

**Made with ❤️ and AI** | Star ⭐ this repo if you found it helpful!
