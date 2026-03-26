import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import * as googleTTS from 'google-tts-api';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import https from 'https';

// Manually resolve FFmpeg path
const getFFmpegPath = () => {
  if (ffmpegStatic && fs.existsSync(ffmpegStatic)) return ffmpegStatic;
  const localPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
  if (fs.existsSync(localPath)) return localPath;
  return 'ffmpeg';
};

ffmpeg.setFfmpegPath(getFFmpegPath());

const parser = new Parser();

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download audio: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

// Helper to clean headlines
function cleanHeadline(title) {
  if (!title) return '';
  // 1. Remove source name at the end (common in Google News RSS title - "Headline - Source")
  let cleaned = title.split(' - ')[0];
  // 2. Remove typical unwanted suffixes
  cleaned = cleaned.replace(/\|.*$/, '');
  cleaned = cleaned.trim();
  // 3. Remove non-printable characters and extra spaces
  cleaned = cleaned.replace(/[^\x20-\x7E]/g, '');
  return cleaned;
}

export async function POST(request) {
  const tmpFiles = [];
  const tmpDir = path.join(process.cwd(), 'tmp_video');
  
  try {
    const body = await request.json();
    const query = body.topic || 'Latest Market News';
    console.log(`[API] Starting 60-90s generation for: ${query}`);
    
    // 1. Fetch more news for a longer video
    const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`);
    // Fetch top 8-10 items
    const topNews = feed.items.slice(0, 10);
    
    if (topNews.length === 0) {
      return NextResponse.json({ error: "No news found for this topic." }, { status: 404 });
    }

    // 2. Setup Directories
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const outputVideoName = `video-${Date.now()}.mp4`;
    const outputPath = path.join(publicDir, outputVideoName);
    
    // Increase slide duration to 8s. 8 items * 8s = 64 seconds.
    const slideDuration = 8;
    const newsItems = [];
    
    // 3. Download TTS with cleaned headlines
    console.log(`[API] Processing news and generating audio...`);
    for (let i = 0; i < topNews.length; i++) {
        const item = topNews[i];
        let headline = cleanHeadline(item.title);
        // Only keep headlines that are long enough to be interesting
        if (headline.length < 20) continue;

        let textToRead = headline.substring(0, 190);
        
        const audioUrl = googleTTS.getAudioUrl(textToRead, {
          lang: 'en-US',
          slow: false,
          host: 'https://translate.google.com',
        });
        
        const audioPath = path.join(tmpDir, `audio-${Date.now()}-${i}.mp3`);
        await downloadFile(audioUrl, audioPath);
        tmpFiles.push(audioPath);
        
        newsItems.push({
          title: headline,
          audioPath,
          duration: slideDuration
        });

        // Limit to desired video length
        if (newsItems.length >= 10) break;
    }

    const totalDuration = newsItems.length * slideDuration;
    console.log(`[API] Final video will be ${totalDuration} seconds long.`);

    // 4. Render Video
    const fontOption = process.platform === 'win32' ? "fontfile='C\\\\:/Windows/Fonts/arial.ttf'" : "";
    
    const result = await new Promise((resolve, reject) => {
      const command = ffmpeg();
      
      command.input(`color=c=black:s=1080x1920:d=${totalDuration}`)
        .inputFormat('lavfi');

      newsItems.forEach(item => command.input(item.audioPath));

      let drawTextFilters = [];
      const safeTitle = query.replace(/[^ \w]/g, '');
      drawTextFilters.push(`drawtext=${fontOption}:text='${safeTitle}':fontcolor=white:fontsize=80:x=(w-text_w)/2:y=150:enable='between(t,0,${totalDuration})'`);
      
      newsItems.forEach((item, index) => {
        const start = index * slideDuration;
        const end = (index + 1) * slideDuration;
        // Further clean for display (remove characters that break ffmpeg filters)
        const safeText = item.title.replace(/[^ \w?%,.!]/g, '');
        // Split text into two lines if too long
        const mid = Math.floor(safeText.length / 2);
        const splitIndex = safeText.indexOf(' ', mid - 10) === -1 ? mid : safeText.indexOf(' ', mid - 10);
        const line1 = safeText.substring(0, splitIndex).trim();
        const line2 = safeText.substring(splitIndex).trim();

        drawTextFilters.push(`drawtext=${fontOption}:text='${line1}':fontcolor=lightblue:fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2-40:enable='between(t,${start},${end})'`);
        if (line2) {
          drawTextFilters.push(`drawtext=${fontOption}:text='${line2}':fontcolor=white:fontsize=50:x=(w-text_w)/2:y=(h-text_h)/2+60:enable='between(t,${start},${end})'`);
        }
      });

      const audioConcatFilter = newsItems.map((_, i) => `[${i + 1}:a]`).join('') + `concat=n=${newsItems.length}:v=0:a=1[outa]`;

      command
        .complexFilter([
          { filter: 'format', options: 'yuv420p', inputs: '0:v', outputs: 'vformat' },
          { filter: drawTextFilters.join(','), inputs: 'vformat', outputs: 'vfinal' },
          audioConcatFilter
        ])
        .outputOptions([
          '-map [vfinal]',
          '-map [outa]',
          '-c:v libx264',
          '-c:a aac',
          '-pix_fmt yuv420p',
          '-shortest',
          '-y'
        ])
        .on('start', (cmd) => console.log('[FFMPEG CMD]', cmd))
        .on('error', (err) => {
          console.error('[FFMPEG ERROR]', err.message);
          reject(err);
        })
        .on('end', () => {
          console.log('[API] Rendering finished.');
          resolve({ success: true, url: `/${outputVideoName}`, duration: totalDuration });
        })
        .save(outputPath);
    });

    tmpFiles.forEach(f => {
      try { fs.unlinkSync(f); } catch(e) {}
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API ERROR]', error);
    tmpFiles.forEach(f => {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch(e) {}
    });
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
