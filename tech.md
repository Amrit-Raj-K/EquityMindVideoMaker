# AI Market Video Engine - Technical Documentation

## Core Technology Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 (React 19) | Web Dashboard, API Routes, Asset Serving |
| **Logic** | Node.js (Runtime) | Server-side execution of data & video pipelines |
| **AI (Optional)** | Google Gemini 2.5-Flash | News curation, summary generation, sentiment analysis |
| **Voiceover** | Google TTS API | AI speech synthesis (realistic financial narration) |
| **Video Engine** | FFmpeg (via fluent-ffmpeg) | Programmatic rendering, text overlays, audio merging |
| **Data Source** | Google News RSS | Real-time financial news scraping |
| **Styling** | Vanilla CSS / Tailored HSL | Glassmorphism dashboard aesthetics |

---

## 🏗️ High-Level Architecture Diagram
This diagram shows the relationship between the user interface, the Next.js API layer, and internal/external services.

```mermaid
graph TD
    User([User]) -->|Inputs Topic| UI[Next.js Dashboard UI]
    UI -->|POST /api/generate| API[Next.js API Route Handler]
    
    subgraph "External Cloud Services"
        API -->|Scrapes| RSS[Google News RSS]
        API -->|Curation| Gemini[Google Gemini AI]
        API -->|Synthesis| TTS[Google TTS API]
    end
    
    subgraph "Local Processing Engine"
        API -->|Orchestrates| FFmpeg[FFmpeg Render Engine]
        FFmpeg -->|Cleans & Overlays| VideoStream[Video Processing Stream]
        FFmpeg -->|Concatenates| AudioStream[Audio Processing Stream]
        VideoStream & AudioStream -->|Encodes| MP4[Final .mp4 Video]
    end
    
    MP4 -->|Return URL| API
    API -->|Display| UI
```

---

## 🔄 Video Generation Pipeline
The step-by-step sequence of how the engine processes data to create a synchronized video.

```mermaid
sequenceDiagram
    participant U as User (UI)
    participant A as Next.js API
    participant S as Scraper (RSS)
    participant AI as Gemini AI
    participant T as TTS Audio
    participant F as FFmpeg Engine
    
    U->>A: Trigger Generation (Topic)
    A->>S: Fetch Latest Headlines (Enriched Search)
    S-->>A: XML Data (raw)
    A->>AI: Harmonize & Analyze Sentiment (JSON)
    AI-->>A: Curated Script & Badges
    A->>T: Generate Voiceover MP3s
    T-->>A: Audio Buffers
    A->>F: Start Rendering Pipeline
    F->>F: Blur/Tint BG + Map Text Overlays
    F->>F: Sync Audio with Visual Slides
    F->>F: Encode libx264 (MP4)
    F-->>A: Render Completion (Success)
    A->>U: Final Video URL
```

---

## 🛠️ Internal Data Transformation Logic
A look at how we convert "raw" news headlines into "clean" mobile-friendly visuals.

```mermaid
graph LR
    Raw["Raw RSS Title (e.g., 'TCS Marathon Success - Yahoo!')"] --> Cleaner["Metadata Stripping"]
    Cleaner --> AI["Gemini Scripting (Narrative Style)"]
    AI --> Wrap["WordWrap Logic (18 Chars Max/Line)"]
    Wrap --> Render["FFmpeg drawtext Layer"]
    Render --> Output["Final Clean Visual Badge"]
```

---

## Optimization Details

*   **Font Management**: Manually resolves `C:\\Windows/Fonts/arial.ttf` to ensure stability across Windows deployments.
*   **Storage**: Automatically cleans up temporary `.mp3` files after the `.mp4` is rendered to the `public/` directory.
*   **Concurrency**: Uses `await new Promise` to strictly synchronize the asynchronous FFmpeg process with the Next.js response cycle.
*   **Search Enrichment**: Prepends financial keywords to short queries to avoid unrelated news topics (e.g., marathons vs. stocks).
