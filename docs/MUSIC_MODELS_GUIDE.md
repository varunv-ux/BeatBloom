# 🎵 Music Model Selection Guide

## ✨ New Feature: Multiple Music Generation Models

Your BeatBloom app now supports **multiple music generation models**! You can switch between different AI models to find the perfect sound for your songs.

## 🎚️ How to Use

1. **Open Settings**: Click the ⚙️ (gear icon) in the top navigation bar
2. **Select Model**: Choose from available music generation models
3. **Click Done**: Settings are saved instantly
4. **Create Songs**: Your selected model will be used for all new songs

## 🎼 Available Models

### 🌟 MiniMax Music 1.5 (Recommended)

**Best for**: High-quality music with natural-sounding vocals

**Features:**
- ✅ Superior audio quality
- ✅ More natural and coherent vocals
- ✅ Better lyric-to-music alignment
- ✅ Up to 5 minutes duration (auto-determined)
- ✅ Excellent genre/mood interpretation

**Limitations:**
- ⏱️ No manual duration control (AI decides optimal length)
- 🕐 May take slightly longer to generate

**When to use:**
- Final production-ready songs
- Songs with complex lyrics
- When quality matters most
- Jazz, Classical, or sophisticated genres

---

### ⚡ ACE-Step

**Best for**: Fast generation with full control

**Features:**
- ✅ Fast generation speed
- ✅ Manual duration control (30/60/120 seconds)
- ✅ Strong tag adherence
- ✅ Good for experimentation
- ✅ Customizable generation parameters

**Limitations:**
- 🎵 Audio quality slightly lower than MiniMax
- 👄 Vocals may sound less natural
- ⏱️ Maximum 2 minutes duration

**When to use:**
- Quick prototypes and experiments
- When you need specific duration control
- Testing different styles rapidly
- Electronic or synthetic genres

## 📊 Comparison

| Feature | MiniMax Music 1.5 | ACE-Step |
|---------|------------------|----------|
| **Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Speed** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Vocal Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Duration Control** | Auto | Manual |
| **Max Duration** | 5 minutes | 2 minutes |
| **Best For** | Production | Prototyping |

## 🎯 Model Selection Tips

### Use MiniMax Music 1.5 when:
- 🎤 You want the most natural-sounding vocals
- 🎼 Your lyrics are complex or emotional
- 🏆 You need production-quality output
- 🎺 Working with Jazz, Soul, Classical genres
- 💿 Creating final versions for sharing

### Use ACE-Step when:
- ⚡ You need fast iterations
- ⏱️ You require specific duration (30/60/120s)
- 🎮 Creating electronic/synthetic music
- 🧪 Experimenting with different styles
- 📝 Testing lyrics before final generation

## 🔧 Technical Details

### MiniMax Music 1.5
- **Model ID**: `minimax/music-1.5`
- **Input**: Lyrics + Prompt (tags)
- **Output**: Auto-optimized duration
- **API**: Uses Replicate's latest model version

### ACE-Step
- **Model ID**: Custom version `280fc4f...`
- **Input**: Lyrics + Tags + Duration
- **Output**: Exact duration specified
- **Parameters**:
  - Tag guidance: 7/10
  - Lyric guidance: 5/10
  - Generation steps: 60

## 💡 Pro Tips

1. **Try Both Models**: Generate the same song with both models and compare!
2. **Genre Matters**: MiniMax excels at organic genres, ACE-Step at electronic
3. **Save Preferences**: The app remembers your last selected model
4. **Experiment**: Different models may interpret your lyrics differently

## 🚀 Future Models

More music generation models will be added as they become available:
- Suno AI integration (coming soon)
- Stable Audio models
- Custom fine-tuned models

## 🐛 Troubleshooting

### Model not working?
- Check your internet connection
- Verify Replicate API token in `.env.local`
- Try the other model as a fallback

### Generated music sounds wrong?
- Try adjusting your tags/prompt
- Switch to the other model
- Experiment with different genre combinations

### Settings not saving?
- Make sure you clicked "Done" in the settings modal
- Check browser console for errors

## 📚 Learn More

- [MiniMax Music 1.5 on Replicate](https://replicate.com/minimax/music-1.5)
- [ACE-Step Documentation](https://replicate.com/meta/musicgen)
- [BeatBloom Settings](MIGRATION_COMPLETE.md)

---

**Happy music making! 🎵** Try both models and find your perfect sound!
