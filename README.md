# AI Market Video Engine (MVP)

A 100% free, automated engine built in 2 hours to generate visually rich, voiceover-enabled financial market update videos (60-90 seconds) from real-time data and news.

## 🚀 Features
- **Zero Human Editing Required**: Fully automated news-to-video pipeline.
- **High-Performance FFmpeg Engine**: Browser-free rendering for maximum stability.
- **Sleek Visuals**: Vertical (1080x1920) format with glassmorphism dashboard.
- **Dynamic Content**: Fetches latest news via Google News RSS and generates AI speech with `google-tts-api`.
- **Text Wrapping & Cleaning**: Logic to clean news metadata and wrap long headlines for professional layout.

## 🛠️ Technology Stack
- **Next.js 15 / React 19**: Modern web frontend.
- **FFmpeg-static**: Programmatic video rendering.
- **Google News RSS**: Real-time news scraping.
- **Google TTS**: Realistic voiceover audio.

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

1. **Open the Dashboard**:
   Go to [http://localhost:3000](http://localhost:3000) in your web browser.
   
2. **Choose Your Topic**:
   - **Method A**: Click the big blue **"1-Click Gen: Latest Market News"** button for a general financial wrap.
   - **Method B**: Type a custom topic (e.g., "Apple Results", "Crypto Crash", "Gold Prices") into the search bar and hit **Generate**.

3. **Rendering Phase**:
   - The app will fetch the latest 8-10 headlines, clean them, and generate the TTS audio.
   - FFmpeg will then stitch the video in the background (takes about 30-45 seconds).

4. **Watch & Download**:
   - Once finished, a **vertical video player** will automatically appear.
   - You can play the video directly or right-click to download the `.mp4` file from your `public/` folder.

## 📁 Project Structure
- `/src/app/api/generate`: The heart of the engine—handles the data/audio/video logic.
- `/src/app/page.js`: The glassmorphism web dashboard.
- `/public`: Where your final generated MP4 videos are saved.
- `/tmp_video`: Temporary scratch space for audio synthesis files.

## 📝 License
MIT
