const Parser = require('rss-parser');
const googleTTS = require('google-tts-api');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const parser = new Parser();

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
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

async function testGeneration() {
  const query = 'Artificial Intelligence';
  const tmpFiles = [];
  try {
    console.log(`[TEST] Starting generation for: ${query}`);
    
    // 1. Fetch News
    const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`);
    const topNews = feed.items.slice(0, 3);
    console.log(`[TEST] Fetched ${topNews.length} news items`);

    // 2. Setup
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
    const tmpDir = path.join(process.cwd(), 'tmp_test');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const outPath = path.join(publicDir, 'test-video-ffmpeg.mp4');
    const slideDuration = 5;
    const newsItems = [];

    // 3. Download TTS
    for (let i = 0; i < topNews.length; i++) {
        const item = topNews[i];
        let textToRead = item.title;
        if (textToRead.lastIndexOf(' - ') > 0) {
          textToRead = textToRead.substring(0, textToRead.lastIndexOf(' - '));
        }
        textToRead = textToRead.substring(0, 190);
        
        const audioUrl = googleTTS.getAudioUrl(textToRead, {
          lang: 'en-US',
          slow: false,
          host: 'https://translate.google.com',
        });
        
        const audioPath = path.join(tmpDir, `audio-${i}.mp3`);
        await downloadFile(audioUrl, audioPath);
        tmpFiles.push(audioPath);
        
        newsItems.push({
          title: item.title,
          audioPath
        });
      }

    // 4. Render Video via ffmpeg
    const fontPath = 'C\\\\:/Windows/Fonts/arial.ttf';
    const command = ffmpeg();
    command.input(`color=c=black:s=1080x1920:d=${newsItems.length * slideDuration}`).inputFormat('lavfi');
    
    let filterString = `drawtext=fontfile='${fontPath}':text='${query}':fontcolor=white:fontsize=80:x=(w-text_w)/2:y=150:enable='between(t,0,${newsItems.length * slideDuration})',`;
    newsItems.forEach((item, index) => {
      const start = index * slideDuration;
      const end = (index + 1) * slideDuration;
      const escapedText = item.title.replace(/[:']/g, '').substring(0, 80);
      filterString += `drawtext=fontfile='${fontPath}':text='${escapedText}':fontcolor=lightblue:fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,${start},${end})',`;
    });
    filterString = filterString.slice(0, -1);

    newsItems.forEach(item => command.input(item.audioPath));
    const audioFilter = newsItems.map((_, i) => `[${i + 1}:a]`).join('') + `concat=n=${newsItems.length}:v=0:a=1[outa]`;

    console.log(`[TEST] Running FFmpeg...`);
    command
      .complexFilter([
        { filter: 'format', options: 'yuv420p', inputs: '0:v', outputs: 'vformat' },
        { filter: filterString, inputs: 'vformat', outputs: 'vfinal' },
        audioFilter
      ])
      .outputOptions(['-map [vfinal]', '-map [outa]', '-c:v libx264', '-c:a aac', '-shortest', '-y'])
      .on('start', (cmd) => console.log('[TEST] Command:', cmd))
      .on('error', (err) => console.error('[TEST] Error:', err.message))
      .on('end', () => {
        console.log('[TEST] Video generated successfully at', outPath);
        tmpFiles.forEach(f => fs.unlinkSync(f));
      })
      .save(outPath);

  } catch(e) {
    console.error(`[TEST] Script Error:`, e);
  }
}

testGeneration();
