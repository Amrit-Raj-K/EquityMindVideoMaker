# AI Market Video Engine (Pro Version)

A 100% free, automated engine built to generate visually rich, voiceover-enabled financial market update videos (60-90 seconds) using cutting-edge AI curation.

## 🚀 Features
- **AI-Hybrid Generation**: Uses **Google Gemini 1.5/2.0** for smart news narration and sentiment analysis (supports optional API keys).
- **Smart Failover**: If the AI key is missing or fails, the engine automatically falls back to a robust keyword-based sentiment logic.
- **Premium Visuals**: 
    - Vertical (1080x1920) "Shorts" format.
    - Animated, blurred color-gradient backgrounds.
    - Glassmorphism UI dashboard.
    - Anti-overflow text wrapping (max 3 lines per slide).
- **Sentiment badges**: Automatically color-codes stories as **BULLISH** (Green), **BEARISH** (Red), or **NEUTRAL** (White).
- **Zero Human Editing**: One click to fetch, clean, narrate, and render.

## 🛠️ Technology Stack
- **Google Gemini SDK**: AI news curation & sentiment analysis.
- **Next.js 15 / React 19**: Modern dashboard with glassmorphism aesthetics.
- **FFmpeg-static**: High-performance backend video rendering.
- **Google News RSS**: Real-time market data.
- **Google TTS**: Realistic AI-generated voiceovers.

## 🔧 Installation

1. **Navigate to the directory**:
   ```bash
   cd d:\afinvideomaker
   ```
2. **Install all dependencies**:
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```

## 🎥 How to Use

1. **Open Dashboard**: Go to [http://localhost:3000](http://localhost:3000).
2. **AI Boost (Optional)**: Paste your **Google Gemini API Key** into the text field at the top. This allows the AI to rewrite headlines into a professional news script.
3. **Select Topic**:
   - Use the blue **"1-Click Gen"** button for the latest general market news.
   - Or type a specific topic (e.g., "Tata Power", "Nvidia Earnings") into the search box.
4. **Render & Watch**:
   - The engine will fetch 8-10 headlines, clean metadata, and start rendering.
   - After ~45 seconds, a vertical video player will automatically appear with the final result!

## 📁 Project Structure
- `/src/app/api/generate`: The engine logic (RSS -> Gemini -> TTS -> FFmpeg).
- `/src/app/page.js`: Dashboard UI with LocalStorage API key persistence.
- `/public`: Final `.mp4` video output folder.
- `/tmp_video`: Scratchpad for audio synthesis.

## 📝 License
MIT
